from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.controllers.account_controller import router as account_router
from app.controllers.admin_controller import router as admin_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.brand_controller import router as brand_router
from app.controllers.category_controller import router as category_router
from app.controllers.order_controller import router as order_router
from app.controllers.product_controller import router as product_router
from app.controllers.user_controller import router as user_router
from app.controllers.vnpay_controller import router as vnpay_router
from app.db import init_db

app = FastAPI(title="FastAPI MVC Example", version="0.1.0")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"success": False, "message": "Invalid request body"})

@app.on_event("startup")
def on_startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(category_router)
app.include_router(brand_router)
app.include_router(product_router)
app.include_router(admin_router)
app.include_router(order_router)
app.include_router(vnpay_router)
app.include_router(account_router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "FastAPI MVC application is running"}