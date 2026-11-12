import os

os.environ["MYSQL_DATABASE"] = os.getenv("MYSQL_TEST_DATABASE", "lua_cosmetics_test")
os.environ["RESEND_API_KEY"] = ""

import pymysql
import pytest

from app import db


@pytest.fixture(scope="session", autouse=True)
def fresh_test_database():
    server = pymysql.connect(
        host=db.MYSQL_HOST,
        port=db.MYSQL_PORT,
        user=db.MYSQL_USER,
        password=db.MYSQL_PASSWORD,
        autocommit=True,
    )
    with server.cursor() as cursor:
        cursor.execute(f"DROP DATABASE IF EXISTS `{db.MYSQL_DATABASE}`")
    server.close()
    db.init_db()
    yield
