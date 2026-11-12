import json
import os
import urllib.error
import urllib.request

RESEND_ENDPOINT = "https://api.resend.com/emails"


def _mail_settings() -> dict:
    return {
        "api_key": os.getenv("RESEND_API_KEY", "").strip(),
        "from_address": os.getenv("MAIL_FROM_ADDRESS", "noreply@axisdev.vn"),
        "from_name": os.getenv("MAIL_FROM_NAME", "Lụa Cosmetics"),
    }


def send_mail(to_address: str, subject: str, html: str) -> bool:
    settings = _mail_settings()
    if not settings["api_key"]:
        print(f"[MAIL] Chưa cấu hình RESEND_API_KEY, bỏ qua gửi email tới {to_address}: {subject}")
        return False

    body = json.dumps(
        {
            "from": f"{settings['from_name']} <{settings['from_address']}>",
            "to": [to_address],
            "subject": subject,
            "html": html,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        RESEND_ENDPOINT,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings['api_key']}",
            "Content-Type": "application/json",
            "User-Agent": "python-mail-client/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        print(f"[MAIL] Gửi email thất bại ({exc.code}): {exc.read().decode('utf-8', 'ignore')}")
        return False
    except Exception as exc:
        print(f"[MAIL] Gửi email thất bại: {exc}")
        return False


def send_password_reset_mail(to_address: str, customer_name: str, reset_link: str, minutes_valid: int) -> bool:
    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#3b2a2a">
      <h2 style="color:#d9667b">Lụa Cosmetics</h2>
      <p>Xin chào {customer_name},</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
      Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết có hiệu lực trong {minutes_valid} phút.</p>
      <p style="margin:28px 0">
        <a href="{reset_link}" style="background:#d9667b;color:#ffffff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Đặt lại mật khẩu</a>
      </p>
      <p style="font-size:13px;color:#7a6a6a">Nếu nút không hoạt động, hãy sao chép liên kết sau vào trình duyệt:<br>{reset_link}</p>
      <p style="font-size:13px;color:#7a6a6a">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    </div>
    """
    return send_mail(to_address, "Đặt lại mật khẩu tài khoản Lụa Cosmetics", html)
