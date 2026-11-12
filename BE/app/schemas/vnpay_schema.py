from typing import Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class VnpayPaymentRequest(BaseModel):
    amount: int = Field(
        ...,
        gt=0,
        description="Payment amount in VND",
    )
    callback_url: Optional[HttpUrl] = Field(
        default=None,
        description="URL where VNPay redirects the user after payment",
    )

    @field_validator("callback_url")
    @classmethod
    def validate_callback_url(cls, value):
        if value is None:
            return value
        if value.scheme not in {"http", "https"}:
            raise ValueError("callback_url must be an HTTP or HTTPS URL")
        return value

    class Config:
        extra = "forbid"
