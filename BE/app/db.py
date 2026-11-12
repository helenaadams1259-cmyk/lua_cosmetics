import os
import sqlite3
import threading
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from pymysql.constants import FIELD_TYPE
from pymysql.converters import conversions
from pymysql.cursors import DictCursor

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
INIT_SQL_PATH = BASE_DIR / "sql" / "init_db.sql"
LEGACY_SQLITE_PATH = BASE_DIR / "database.db"

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "lua_cosmetics")

UNLIMITED_ROWS = 18446744073709551615

LEGACY_IMPORT_TABLES = [
    "categories",
    "brands",
    "products",
    "product_images",
    "product_features",
    "product_ingredients",
    "product_usages",
    "product_specifications",
    "reviews",
    "users",
    "orders",
    "order_items",
]

_text_conversions = conversions.copy()
for _field_type in (FIELD_TYPE.DATETIME, FIELD_TYPE.TIMESTAMP, FIELD_TYPE.DATE):
    _text_conversions.pop(_field_type, None)
_text_conversions[FIELD_TYPE.NEWDECIMAL] = int
_text_conversions[FIELD_TYPE.DECIMAL] = int


def _open_connection(database: str | None = MYSQL_DATABASE) -> pymysql.connections.Connection:
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=database,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
        conv=_text_conversions,
    )


class Database:
    def __init__(self):
        self._local = threading.local()

    def _connection(self, check_alive: bool) -> pymysql.connections.Connection:
        connection = getattr(self._local, "connection", None)
        if connection is None:
            connection = _open_connection()
            self._local.connection = connection
        elif check_alive:
            connection.ping(reconnect=True)
        return connection

    def cursor(self):
        return self._connection(check_alive=True).cursor()

    def begin(self):
        self._connection(check_alive=True).begin()

    def commit(self):
        self._connection(check_alive=False).commit()

    def rollback(self):
        self._connection(check_alive=False).rollback()

    def close(self):
        connection = getattr(self._local, "connection", None)
        if connection is not None:
            connection.close()
            self._local.connection = None


_database = Database()


def get_connection() -> Database:
    return _database


def _split_statements(script: str) -> list[str]:
    return [statement.strip() for statement in script.split(";") if statement.strip()]


def _column_names(cursor, table: str) -> list[str]:
    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
    return [row["Field"] for row in cursor.fetchall()]


def _legacy_payment_status(order: dict) -> str:
    if order.get("status") == "paid":
        return "paid"
    if order.get("payment_method") != "cod":
        return "pending"
    if order.get("status") == "completed":
        return "paid"
    return "cod"


def import_legacy_sqlite_data(sqlite_path: Path = LEGACY_SQLITE_PATH) -> dict:
    imported: dict = {}
    if not sqlite_path.exists():
        return imported

    source = sqlite3.connect(sqlite_path)
    source.row_factory = sqlite3.Row
    target = _open_connection()
    try:
        with target.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            for table in LEGACY_IMPORT_TABLES:
                exists = source.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
                    (table,),
                ).fetchone()
                if not exists:
                    continue
                rows = [dict(row) for row in source.execute(f"SELECT * FROM [{table}]").fetchall()]
                if not rows:
                    imported[table] = 0
                    continue
                target_columns = set(_column_names(cursor, table))
                cursor.execute(f"DELETE FROM `{table}`")
                for row in rows:
                    if table == "orders":
                        row["payment_status"] = _legacy_payment_status(row)
                        if row.get("status") == "paid":
                            row["status"] = "confirmed"
                    columns = [column for column in row.keys() if column in target_columns]
                    column_sql = ", ".join(f"`{column}`" for column in columns)
                    placeholders = ", ".join(["%s"] * len(columns))
                    cursor.execute(
                        f"INSERT INTO `{table}` ({column_sql}) VALUES ({placeholders})",
                        [row[column] for column in columns],
                    )
                imported[table] = len(rows)
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        target.commit()
    finally:
        target.close()
        source.close()
    return imported


def init_db() -> None:
    if not INIT_SQL_PATH.exists():
        raise FileNotFoundError(f"Database init file not found: {INIT_SQL_PATH}")

    server = _open_connection(database=None)
    try:
        with server.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
    finally:
        server.close()

    connection = _open_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = %s AND table_name = 'products'", (MYSQL_DATABASE,))
            is_first_run = int(cursor.fetchone()["total"]) == 0
            for statement in _split_statements(INIT_SQL_PATH.read_text(encoding="utf-8")):
                cursor.execute(statement)
        connection.commit()
    finally:
        connection.close()

    if is_first_run:
        import_legacy_sqlite_data()
