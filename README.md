# 💄 LuaCosmetics

> Cửa hàng mỹ phẩm trên mạng (website bán hàng), làm cho một môn học.
> Bạn chỉ cần làm theo từng bước bên dưới là sẽ chạy được trên máy của mình, kể cả khi chưa từng làm lập trình.

---

## 📖 Mục lục

1. [Dự án này là gì?](#-dự-án-này-là-gì)
2. [Website làm được gì?](#-website-làm-được-gì)
3. [Chuẩn bị đồ nghề (cài một lần)](#-chuẩn-bị-đồ-nghề-cài-một-lần)
4. [Cài đặt và chạy: 6 bước](#-cài-đặt-và-chạy-6-bước)
5. [Tài khoản dùng thử](#-tài-khoản-dùng-thử)
6. [Gặp lỗi? Đọc ở đây](#-gặp-lỗi-đọc-ở-đây)
7. [Từ điển nhỏ](#-từ-điển-nhỏ)
8. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
9. [Tác giả](#-tác-giả)

---

## 🤔 Dự án này là gì?

Hãy tưởng tượng một **cửa hàng mỹ phẩm** nhưng nằm trong máy tính:

| Phần | Giống như... | Tên trong dự án | Công nghệ |
|---|---|---|---|
| **Giao diện** (phần bạn nhìn thấy và bấm) | Quầy hàng, kệ trưng bày | thư mục `FE` (Frontend) | React, TypeScript, Vite |
| **Máy chủ** (phần xử lý phía sau) | Nhân viên bán hàng và thu ngân | thư mục `BE` (Backend) | Python, FastAPI |
| **Cơ sở dữ liệu** (nơi cất thông tin) | Cuốn sổ ghi sản phẩm, đơn hàng, khách hàng | MySQL | MySQL |

Ba phần này phải **chạy cùng lúc** thì cửa hàng mới mở cửa được. Đừng lo, các bước bên dưới sẽ chỉ bạn cách làm.

---

## ✨ Website làm được gì?

- 🛍️ Xem, tìm kiếm và lọc sản phẩm theo danh mục, thương hiệu, giá
- 🛒 Đặt hàng và thanh toán bằng COD (trả tiền khi nhận hàng), VNPay hoặc MoMo (chỉ là chế độ thử nghiệm, **không tốn tiền thật**)
- 🔐 Đăng nhập an toàn bằng JWT, có phân quyền cho admin (người quản lý)
- 🧑‍💼 Trang quản trị: quản lý sản phẩm, danh mục, thương hiệu, đơn hàng
- 📄 Nhập nhiều sản phẩm cùng lúc bằng file CSV

---

## 🧰 Chuẩn bị đồ nghề (cài một lần)

Bạn cần cài 4 phần mềm. Nếu máy đã có rồi thì bỏ qua.

| Phần mềm | Dùng để làm gì | Phiên bản cần | Tải ở đâu |
|---|---|---|---|
| **Git** | Tải dự án về máy | Bản nào cũng được | https://git-scm.com/downloads |
| **Python** | Chạy máy chủ (BE) | từ 3.10 trở lên | https://www.python.org/downloads |
| **Node.js** | Chạy giao diện (FE) | từ 18 trở lên | https://nodejs.org |
| **MySQL** | Lưu dữ liệu | từ 8.0 trở lên | https://dev.mysql.com/downloads/installer |

> 💡 Khi cài **Python** trên Windows, nhớ tích vào ô **"Add Python to PATH"** ở màn hình đầu tiên. Nếu quên, lệnh `python` sẽ không chạy được.
>
> 💡 Khi cài **MySQL**, bạn sẽ được hỏi đặt mật khẩu cho tài khoản `root`. **Hãy đặt mật khẩu là `root`** (tên tài khoản `root`, mật khẩu cũng là `root`) để làm theo hướng dẫn này cho dễ. Nếu bạn đã cài MySQL từ trước với mật khẩu khác thì dùng mật khẩu cũ của bạn, nhưng nhớ thay `root` bằng mật khẩu đó ở những bước sau.
>
> ⚠️ Mật khẩu `root` quá dễ đoán, chỉ nên dùng trên máy cá nhân để học và làm bài. Không dùng cho website thật.

### Kiểm tra đã cài xong chưa

Mở **Terminal** (xem hướng dẫn bên dưới), gõ từng dòng và nhấn Enter:

```bash
git --version
python --version
node --version
mysql --version
```

Mỗi dòng sẽ hiện ra một số phiên bản (ví dụ `Python 3.11.4`). Nếu hiện chữ "not recognized" hoặc "command not found" nghĩa là chưa cài xong, hãy xem phần [Gặp lỗi?](#-gặp-lỗi-đọc-ở-đây).

> 💡 Trên macOS hoặc Linux, nếu `python` không chạy, thử `python3`.

### Terminal là gì? Mở ở đâu?

**Terminal** là cửa sổ đen (hoặc trắng) để bạn **gõ lệnh** cho máy tính thay vì bấm chuột.

- **Windows:** nhấn phím `Windows`, gõ `cmd`, nhấn Enter. Cửa sổ **Command Prompt** sẽ hiện ra.
- **macOS:** nhấn `Cmd + Space`, gõ `Terminal`, nhấn Enter.
### ⌨️ Cách gõ lệnh (đọc kỹ phần này, rất quan trọng)

Trong README này, mỗi **lệnh** nằm trong một khung xám như thế này:

```bash
python --version
```

Để chạy một lệnh, bạn làm đúng 5 việc sau:

1. **Nhìn vào cửa sổ terminal.** Dòng cuối cùng thường trông như `C:\Users\TenBan>` (Windows) hoặc `tenban@may-tinh ~ %` (macOS). Ngay sau đó có một **vạch nhỏ nhấp nháy**. Đó chính là chỗ bạn sẽ gõ chữ vào.
2. **Dùng chuột bấm một lần vào cửa sổ terminal**, để máy biết bạn muốn gõ vào đó.
3. **Đưa lệnh vào terminal** theo một trong hai cách:
   - **Cách A: tự gõ.** Gõ lại đúng từng chữ, từng dấu cách, từng dấu gạch ngang của lệnh.
   - **Cách B: sao chép rồi dán (dễ hơn, ít sai hơn).** Bôi đen lệnh trong khung xám rồi nhấn `Ctrl + C` (macOS: `Cmd + C`). Quay lại cửa sổ terminal, rồi nhấn `Ctrl + V` (macOS: `Cmd + V`). Nếu `Ctrl + V` không dán được trên Command Prompt cũ, hãy **bấm chuột phải** vào cửa sổ terminal.
4. **Nhấn phím `Enter`** để máy chạy lệnh. Chưa nhấn Enter thì máy chưa làm gì cả.
5. **Chờ máy chạy xong.** Máy chạy xong khi dòng cuối cùng lại có vạch nhấp nháy ở sau dấu `>` hoặc `%`. Lúc đó mới được gõ lệnh tiếp theo.

**Những lỗi người mới hay mắc:**

- ❌ Chỉ gõ **nội dung** của lệnh. Đừng gõ chữ `bash` ở góc khung, và đừng gõ dấu ` ``` `.
- ❌ Khung nào có nhiều dòng thì gõ **từng dòng một**, nhấn Enter sau mỗi dòng.
- ❌ Đừng tự thêm hoặc bớt dấu cách. `-u` và `- u` là hai thứ khác nhau.
- ❌ Đừng bấm vào chỗ khác rồi mới gõ. Chữ sẽ không vào terminal.

### 📍 "Đứng trong thư mục" nghĩa là gì?

Terminal lúc nào cũng "đang đứng" trong một thư mục, giống như bạn luôn đang đứng trong một căn phòng nào đó. Lệnh chỉ chạy đúng khi bạn **đứng đúng phòng**.

**Cách biết mình đang đứng ở đâu:** nhìn vào dòng cuối của terminal.

- `C:\Users\TenBan\Desktop\lua_cosmetics>` nghĩa là bạn đang đứng trong thư mục `lua_cosmetics`. ✅
- `C:\Users\TenBan>` nghĩa là bạn đang đứng ở thư mục chung của người dùng, **chưa** vào `lua_cosmetics`. ❌

**Cách xem trong phòng có gì:**

- Windows: gõ `dir` rồi Enter.
- macOS / Linux: gõ `ls` rồi Enter.

**Cách mở terminal đã đứng sẵn trong đúng thư mục** (cách dễ nhất, nên dùng):

- 🪟 **Windows:**
  1. Mở **File Explorer** (thư mục màu vàng ở thanh taskbar), vào thư mục bạn cần (ví dụ `lua_cosmetics`).
  2. Bấm chuột vào **thanh địa chỉ** ở phía trên cùng (ô dài hiện đường dẫn thư mục).
  3. Xóa chữ trong ô đó, gõ `cmd`, rồi nhấn `Enter`.
  4. Một cửa sổ đen hiện ra và **đã đứng sẵn trong thư mục đó**.
- 🍎 **macOS:**
  1. Mở **Terminal**.
  2. Gõ chữ `cd` rồi nhấn phím cách một lần (nhớ có dấu cách sau `cd`). **Chưa nhấn Enter.**
  3. Dùng chuột **kéo thư mục** cần vào (từ Finder) thả vào cửa sổ Terminal. Đường dẫn sẽ tự hiện ra.
  4. Nhấn `Enter`.

---

## 🚀 Cài đặt và chạy: 6 bước

> ⚠️ Làm **lần lượt từ bước 1 đến bước 6**, không bỏ bước nào.
> ⚠️ Từ bước 4 trở đi, bạn sẽ dùng **nhiều cửa sổ terminal cùng lúc**. Mình sẽ nhắc cụ thể.

### Bước 1: Tải dự án về máy

Mình sẽ tải dự án về **màn hình Desktop** để bạn dễ tìm.

**1.1. Mở terminal** (xem lại mục [Terminal là gì? Mở ở đâu?](#terminal-là-gì-mở-ở-đâu) ở trên). Bạn sẽ thấy một cửa sổ đen có vạch nhấp nháy.

**1.2. Bấm chuột vào cửa sổ terminal, gõ lệnh sau rồi nhấn `Enter`:**

```bash
cd Desktop
```

Lệnh này nghĩa là "đi tới thư mục Desktop". Nhìn dòng cuối của terminal, bạn sẽ thấy nó có thêm chữ `Desktop`, ví dụ `C:\Users\TenBan\Desktop>`.

> 💡 Nếu hiện lỗi kiểu `The system cannot find the path specified` (không tìm thấy đường dẫn) thì **bỏ qua lệnh này**, dự án sẽ được tải về thư mục người dùng của bạn. Không sao cả.

**1.3. Gõ lệnh sau rồi nhấn `Enter`** (lệnh này tải dự án về, mất vài giây):

```bash
git clone https://github.com/helenaadams1259-cmyk/lua_cosmetics.git
```

Máy sẽ in ra vài dòng chữ như `Cloning into 'lua_cosmetics'...`. Đợi đến khi dòng cuối lại có vạch nhấp nháy.

**1.4. Gõ lệnh sau rồi nhấn `Enter`** (đi vào bên trong thư mục vừa tải về):

```bash
cd lua_cosmetics
```

`cd` nghĩa là "change directory", tức là "đổi thư mục".

✅ **Thành công khi:** dòng cuối của terminal có chữ `lua_cosmetics`, ví dụ `C:\Users\TenBan\Desktop\lua_cosmetics>`. Gõ `dir` (Windows) hoặc `ls` (macOS) rồi Enter, bạn sẽ thấy các tên `BE`, `FE`, `README.md`.

---

### Bước 2: Đưa dữ liệu vào MySQL

Bước này giống như **mở cuốn sổ ghi chép** và điền sẵn các sản phẩm mẫu vào đó. Bạn sẽ dùng chương trình `mysql` (đã cài ở phần chuẩn bị) để "đọc" file `BE/sql/lua_cosmetics.sql` và chép dữ liệu vào MySQL.

**2.1. Mở terminal ngay trong thư mục `lua_cosmetics`**

- Nếu bạn **vừa làm xong bước 1 và chưa tắt terminal**: bạn đang đứng đúng chỗ rồi, nhảy sang 2.2.
- Nếu bạn đã tắt terminal: mở lại theo cách dễ nhất ở mục [Đứng trong thư mục nghĩa là gì?](#-đứng-trong-thư-mục-nghĩa-là-gì) (trên Windows: mở thư mục `lua_cosmetics` bằng File Explorer, bấm vào thanh địa chỉ, gõ `cmd`, nhấn Enter).

**2.2. Kiểm tra mình đứng đúng chỗ**

Bấm chuột vào cửa sổ terminal, gõ lệnh sau rồi nhấn `Enter`:

- Windows:
  ```bash
  dir
  ```
- macOS / Linux:
  ```bash
  ls
  ```

Danh sách hiện ra **phải có** các tên `BE`, `FE`. Nếu không thấy, bạn đang đứng sai thư mục, hãy quay lại 2.1.

**2.3. Gõ lệnh nhập dữ liệu**

Bấm chuột vào cửa sổ terminal, gõ (hoặc dán) **đúng nguyên dòng này** rồi nhấn `Enter`:

```bash
mysql -u root -p < BE/sql/lua_cosmetics.sql
```

Ý nghĩa từng phần, để bạn không phải đoán:

| Phần của lệnh | Nghĩa là |
|---|---|
| `mysql` | Gọi chương trình MySQL |
| `-u root` | Đăng nhập bằng tài khoản tên `root` |
| `-p` | Hãy hỏi mật khẩu |
| `< BE/sql/lua_cosmetics.sql` | Đọc dữ liệu từ file này |

**2.4. Nhập mật khẩu MySQL**

Sau khi nhấn Enter, terminal sẽ hiện dòng:

```
Enter password:
```

Lúc này bạn **gõ mật khẩu MySQL**, tức là gõ 4 chữ cái `root` (mật khẩu bạn đã đặt lúc cài MySQL), rồi nhấn `Enter`.

> 💡 Khi gõ mật khẩu, màn hình **sẽ không hiện gì cả**: không có chữ, không có dấu chấm, không có dấu sao. Bạn tưởng máy bị đơ nhưng không phải, đây là cách máy giữ bí mật mật khẩu. Cứ gõ đúng mật khẩu rồi nhấn Enter.

**2.5. Chờ và kiểm tra kết quả**

- Nếu máy **im lặng và dòng cuối lại có vạch nhấp nháy** thì bước này đã thành công. Với MySQL, "không báo gì" chính là tin tốt.
- Nếu hiện chữ `ERROR`, xem bảng [Gặp lỗi?](#-gặp-lỗi-đọc-ở-đây).

Để chắc chắn dữ liệu đã vào, gõ lệnh sau rồi Enter (cũng sẽ hỏi mật khẩu, gõ lại như trên):

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

✅ **Thành công khi:** trong danh sách hiện ra có dòng `lua_cosmetics`. File SQL đã tự tạo database này, bạn không cần tạo thủ công.

**Nếu bạn dùng PowerShell và lệnh ở 2.3 báo lỗi về dấu `<`:** PowerShell không hiểu dấu này. Có 2 cách:

- Dùng **Command Prompt (cmd)** thay cho PowerShell (mở bằng cách gõ `cmd` vào thanh địa chỉ của File Explorer như ở trên), rồi làm lại 2.3.
- Hoặc dùng lệnh thay thế này (gõ rồi Enter, nhập mật khẩu như bình thường):
  ```bash
  mysql -u root -p -e "source BE/sql/lua_cosmetics.sql"
  ```

**Nếu máy báo `'mysql' is not recognized` (Windows):** máy chưa biết chương trình `mysql` nằm ở đâu. Cách khác không cần lệnh dài:

1. Nhấn phím `Windows`, gõ `MySQL Command Line Client`, nhấn Enter.
2. Nhập mật khẩu MySQL rồi nhấn Enter. Bạn sẽ thấy dấu nhắc `mysql>`.
3. Gõ lệnh sau (thay phần đường dẫn bằng nơi bạn lưu dự án; **dùng dấu `/`, không dùng dấu `\`**, và **nhớ dấu `;` ở cuối**), rồi nhấn Enter:
   ```
   source C:/Users/TenBan/Desktop/lua_cosmetics/BE/sql/lua_cosmetics.sql;
   ```

---

### Bước 3: Tạo file cấu hình `.env`

File `.env` giống như **tờ giấy ghi các mật khẩu bí mật** của cửa hàng (mật khẩu database, khóa thanh toán...). Vì là bí mật nên nó **không được đưa lên GitHub**. Dự án có sẵn **bản mẫu** tên `BE/.env.example`, bạn chỉ cần sao chép nó ra rồi điền thông tin của mình.

**3.1. Sao chép file mẫu**

Dùng **terminal đang đứng trong thư mục `lua_cosmetics`** (giống bước 2; nếu đã tắt thì mở lại theo hướng dẫn ở trên). Bấm chuột vào cửa sổ terminal, gõ lệnh phù hợp với máy của bạn rồi nhấn `Enter`:

- macOS / Linux:
  ```bash
  cp BE/.env.example BE/.env
  ```
- Windows (Command Prompt):
  ```bash
  copy BE\.env.example BE\.env
  ```

**3.2. Mở file `BE/.env` bằng Notepad (hoặc VS Code) và điền thông tin**

> 💡 File bắt đầu bằng dấu chấm nên có thể bị ẩn khi bạn mở thư mục bằng File Explorer hoặc Finder. Cách dễ nhất: tải **VS Code** (https://code.visualstudio.com), mở nó, chọn **File → Open Folder**, chọn thư mục `lua_cosmetics`. File `BE/.env` sẽ hiện ngay ở cột bên trái, bấm đúp vào là mở được.
>
> Cách khác (Windows): ở terminal đang đứng trong `lua_cosmetics`, gõ `notepad BE\.env` rồi nhấn `Enter`, Notepad sẽ mở file này.

Bảng dưới cho biết điền gì và lấy ở đâu:

| Nhóm | Các biến | Điền gì? | Lấy ở đâu? |
|---|---|---|---|
| 🗄️ Database | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Xem khung bên dưới bảng này | Chính là thông tin bạn đã đặt khi cài MySQL |
| 🔑 JWT | `JWT_SECRET` | Một chuỗi bất kỳ, càng dài và khó đoán càng tốt (ví dụ `hay-dat-chuoi-nay-that-dai-123`) | Tự nghĩ ra |
| 💳 VNPay | các biến bắt đầu bằng `VNPAY_` | Thông tin tài khoản thử nghiệm | Đăng ký tại https://sandbox.vnpayment.vn |
| 💳 MoMo | các biến bắt đầu bằng `MOMO_` | Khóa thử nghiệm | https://developers.momo.vn |
| ✉️ Email | `RESEND_API_KEY`, các biến bắt đầu bằng `MAIL_FROM_` | Khóa gửi email | Đăng ký tại https://resend.com |

**Nhóm Database: 5 dòng này phải giống hệt như sau.** Mở file `BE/.env`, tìm 5 dòng bắt đầu bằng `MYSQL_` và sửa cho khớp:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=lua_cosmetics
```

- `127.0.0.1` là địa chỉ chính máy tính của bạn (giống `localhost`).
- `3306` là "số cửa" mặc định của MySQL.
- `root` / `root` là tài khoản và mật khẩu MySQL mà bạn đã đặt lúc cài.
- `lua_cosmetics` là tên database, được tạo tự động ở bước 2.

> 💡 Phần mềm đã **tự dùng sẵn đúng các giá trị này** nếu trong `.env` bạn không ghi gì. Nhưng nếu dòng đó **có trong file mà để trống** (ví dụ `MYSQL_PASSWORD=`) thì máy sẽ hiểu là "mật khẩu rỗng" và báo lỗi. Vì vậy hãy kiểm tra kỹ 5 dòng trên, đừng để trống.

> ✅ **Chỉ muốn xem thử giao diện và sản phẩm?** Bạn **chỉ cần điền 2 nhóm: Database và JWT**. Các nhóm còn lại (VNPay, MoMo, Email) chỉ cần khi bạn muốn thử thanh toán hoặc gửi email. Cứ để trống cũng được, phần còn lại của web vẫn chạy bình thường.

**3.3. Lưu file lại** (`Ctrl + S`).

---

### Bước 4: Bật máy chủ (Backend)

> 🪟 **Mở một cửa sổ terminal mới** cho bước này và **giữ nó mở** cho đến khi bạn dùng xong.

**4.1. Mở terminal đứng sẵn trong thư mục `BE`**

Cách dễ nhất (Windows): mở thư mục `lua_cosmetics` bằng File Explorer, bấm đúp vào thư mục `BE` để đi vào trong, bấm vào **thanh địa chỉ** ở trên cùng, gõ `cmd` rồi nhấn `Enter`. Cửa sổ đen hiện ra là đã đứng sẵn trong `BE`. (macOS: dùng cách kéo thư mục `BE` thả vào Terminal như hướng dẫn ở trên.)

Hoặc nếu bạn mở terminal mới và nó đang đứng trong `lua_cosmetics`, gõ lệnh này rồi nhấn `Enter`:

```bash
cd BE
```

✅ **Đúng chỗ khi:** dòng cuối của terminal kết thúc bằng `...\lua_cosmetics\BE>`.

**4.2. (Nên làm) Tạo "hộp riêng" cho dự án**

Việc này giúp các thư viện của dự án không lẫn lộn với dự án khác trên máy. Hộp này gọi là *môi trường ảo*.

- macOS / Linux:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- Windows (Command Prompt):
  ```bash
  python -m venv venv
  venv\Scripts\activate
  ```

✅ **Thành công khi:** đầu dòng lệnh xuất hiện chữ `(venv)`.

**4.3. Cài các thư viện cần thiết**

```bash
pip install -r requirements.txt
```

Máy sẽ tự tải và cài rất nhiều thứ, mất vài phút. Cứ để máy chạy.

**4.4. Bật máy chủ**

```bash
python -m uvicorn app.main:app --reload
```

✅ **Thành công khi:** terminal hiện dòng giống như `Uvicorn running on http://127.0.0.1:8000`.

Bây giờ máy chủ đã chạy. Bạn có thể kiểm tra bằng cách mở trình duyệt:

- 🌐 API: http://localhost:8000
- 📚 Tài liệu API (Swagger, liệt kê mọi chức năng của máy chủ để bạn bấm thử): http://localhost:8000/docs

> ⚠️ **Đừng đóng** cửa sổ terminal này. Đóng là máy chủ tắt.

---

### Bước 5: Bật giao diện (Frontend)

> 🪟 **Mở thêm một cửa sổ terminal mới** (cửa sổ ở bước 4 vẫn để nguyên).

**5.1. Mở terminal đứng sẵn trong thư mục `FE`**

Làm giống bước 4.1 nhưng chọn thư mục **`FE`** (Windows: File Explorer → `lua_cosmetics` → bấm đúp `FE` → bấm thanh địa chỉ → gõ `cmd` → Enter). Hoặc nếu terminal mới đang đứng trong `lua_cosmetics`, gõ `cd FE` rồi Enter.

✅ **Đúng chỗ khi:** dòng cuối của terminal kết thúc bằng `...\lua_cosmetics\FE>`.

**5.2. Tải thư viện cho giao diện** (chỉ cần làm lần đầu, mất vài phút)

Bấm chuột vào cửa sổ terminal, gõ lệnh sau rồi nhấn `Enter`:

```bash
npm install
```

Đợi đến khi dòng cuối lại có vạch nhấp nháy. Có thể sẽ có vài dòng chữ vàng (cảnh báo), không sao.

**5.3. Bật giao diện**

Gõ lệnh sau rồi nhấn `Enter`:

```bash
npm run dev
```

✅ **Thành công khi:** terminal hiện dòng giống như `Local: http://localhost:5173/`.

---

### Bước 6: Mở cửa hàng! 🎉

Mở trình duyệt (Chrome, Edge, Firefox...) và vào:

### 👉 http://localhost:5173

Nếu bạn thấy trang web bán mỹ phẩm hiện ra, **chúc mừng, bạn đã chạy thành công!** 🎊

### Tắt khi dùng xong

Ở mỗi cửa sổ terminal đang chạy, nhấn **`Ctrl + C`** để tắt. Lần sau muốn chạy lại, bạn **không cần làm lại từ đầu**, chỉ cần:

1. Bật MySQL (thường nó tự chạy cùng máy).
2. Làm lại bước 4 (nhớ kích hoạt `venv` và chạy lệnh ở mục 4.4, không cần cài lại thư viện).
3. Làm lại bước 5 (chỉ cần `npm run dev`).

---

## 🔑 Tài khoản dùng thử

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên (Admin) | `admin` | admin123 |

> Dùng tài khoản này để vào trang quản trị và quản lý sản phẩm, danh mục, thương hiệu, đơn hàng.

---

## 🆘 Gặp lỗi? Đọc ở đây

| Bạn thấy | Nghĩa là | Cách sửa |
|---|---|---|
| `'git' is not recognized` / `command not found` | Máy chưa có phần mềm đó, hoặc chưa nhận ra | Cài phần mềm ở mục [Chuẩn bị đồ nghề](#-chuẩn-bị-đồ-nghề-cài-một-lần), rồi **đóng terminal và mở lại** |
| `'python' is not recognized` | Python chưa được thêm vào PATH | Cài lại Python và tích ô **Add Python to PATH**. Trên macOS/Linux thử `python3` |
| `Access denied for user 'root'` | Sai mật khẩu MySQL | Mật khẩu theo hướng dẫn này là `root`. Nếu bạn đã đặt mật khẩu khác lúc cài MySQL thì dùng mật khẩu đó, và kiểm tra lại ở bước 2 cũng như ở file `BE/.env` |
| `Can't connect to MySQL server` | MySQL chưa bật | Bật MySQL (trên Windows: mở **Services**, tìm **MySQL**, bấm **Start**) |
| `No module named ...` | Chưa cài thư viện, hoặc chưa kích hoạt `venv` | Kích hoạt lại `venv` (mục 4.2) rồi chạy lại `pip install -r requirements.txt` |
| `Address already in use` / cổng 8000 hoặc 5173 đã bị dùng | Có chương trình khác (hoặc bản cũ của dự án) đang chiếm cổng | Tắt chương trình đó (hoặc nhấn `Ctrl + C` ở cửa sổ cũ) rồi chạy lại |
| Web mở lên nhưng **không có sản phẩm** | Máy chủ chưa chạy, hoặc chưa import database | Kiểm tra cửa sổ terminal ở bước 4 còn chạy không; làm lại bước 2 |
| Bấm thanh toán VNPay/MoMo bị lỗi | Chưa điền khóa thanh toán trong `.env` | Điền nhóm VNPay/MoMo ở bước 3 rồi **khởi động lại máy chủ** (`Ctrl + C`, chạy lại lệnh ở 4.4) |
| Sửa file `.env` nhưng không thấy thay đổi | Máy chủ chỉ đọc `.env` lúc bật | Tắt rồi bật lại máy chủ |

> Vẫn chưa được? Hãy chụp màn hình dòng chữ báo lỗi (chữ đỏ) và gửi cho người hướng dẫn. Dòng lỗi chính là gợi ý quý nhất để tìm ra nguyên nhân.

---

## 📚 Từ điển nhỏ

| Từ | Giải thích đơn giản |
|---|---|
| **Terminal** | Cửa sổ để gõ lệnh cho máy tính |
| **Repo / Repository** | Thư mục chứa toàn bộ dự án trên GitHub |
| **Clone** | Tải cả dự án từ GitHub về máy |
| **Frontend (FE)** | Phần giao diện, thứ bạn nhìn thấy và bấm |
| **Backend (BE)** | Phần xử lý phía sau, thứ bạn không nhìn thấy |
| **Database (cơ sở dữ liệu)** | Nơi cất giữ thông tin: sản phẩm, đơn hàng, tài khoản |
| **API** | "Cầu nối" để giao diện nói chuyện với máy chủ |
| **`.env`** | File chứa các thông tin bí mật (mật khẩu, khóa) |
| **JWT** | "Thẻ ra vào" điện tử, giúp web nhớ bạn đã đăng nhập |
| **COD** | Trả tiền mặt khi nhận hàng |
| **Sandbox** | Chế độ chạy thử, tiền giả, không tốn tiền thật |
| **Cổng (port)** | "Số cửa" của máy tính. Máy chủ ở cửa 8000, giao diện ở cửa 5173 |
| **`localhost`** | Nghĩa là "chính máy tính của bạn" |
| **Môi trường ảo (`venv`)** | Hộp riêng chứa thư viện cho một dự án |

---

## 📁 Cấu trúc thư mục

```
lua_cosmetics/
├── BE/                 # Máy chủ (Backend, FastAPI)
│   ├── app/            # Code chính: controllers, services, repositories, schemas
│   ├── .env.example    # File mẫu cấu hình (sao chép thành .env)
│   ├── sql/            # File SQL: init_db.sql, lua_cosmetics.sql
│   └── tests/          # Các bài kiểm tra tự động
├── FE/                 # Giao diện (Frontend, React + TypeScript)
└── README.md           # File bạn đang đọc
```

Máy chủ được tổ chức theo kiến trúc **Controller → Service → Repository**: Controller nhận yêu cầu, Service xử lý logic, Repository làm việc với database (xem thêm file `BE/guide.html`).

---

## 👤 Tác giả

**Tên của bạn** · [GitHub](https://github.com/helenaadams1259-cmyk)
