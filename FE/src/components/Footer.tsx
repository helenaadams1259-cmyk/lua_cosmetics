import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg">L</div>
            <span className="font-display text-xl font-bold">Lụa Cosmetics</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Mỹ phẩm chính hãng, an toàn và dịu nhẹ dành cho làn da của bạn.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Giới thiệu</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Về chúng tôi</li>
            <li>Câu chuyện thương hiệu</li>
            <li>Tuyển dụng</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Liên kết nhanh</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/san-pham" className="hover:text-primary">Sản phẩm</Link></li>
            <li><Link to="/gio-hang" className="hover:text-primary">Giỏ hàng</Link></li>
            <li>Chính sách bảo mật</li>
            <li>Điều khoản sử dụng</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> Hotline: 1900 6868</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@luacosmetics.vn</li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /> 123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lụa Cosmetics. Đồ án đại học — Bản quyền thuộc về nhóm phát triển.
      </div>
    </footer>
  );
}
