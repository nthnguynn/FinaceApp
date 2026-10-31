# 📌 Danh Sách Chức Năng Ứng Dụng Quản Lý Chi Tiêu Cá Nhân (moniii)

Tài liệu này ghi nhận toàn bộ định hướng tính năng của ứng dụng **Quản lý chi tiêu cá nhân**, được chia theo lộ trình phát triển từ MVP đến Nâng cao và Tích hợp AI.

---

## 🚀 Giai Đoạn 1: Chức Năng Cốt Lõi (MVP)
> *Mục tiêu: Đảm bảo luồng quản lý tài chính cơ bản cho người dùng.*

### 1.1 Quản Lý Tài Khoản & Xác Thực (User & Auth)
- [x] Đăng nhập bằng Tên đăng nhập / Email + Mật khẩu (không có đăng ký công khai — tài khoản tạo bằng `bun scripts/create-user.mjs`).
- [x] Quản lý thông tin cá nhân & đổi mật khẩu.

### 1.2 Quản Lý Ví & Tài Khoản Thanh Toán (Wallets / Accounts)
- [x] Quản lý 1 Ví cá nhân duy nhất (Ví chính) cố định đơn vị tiền tệ **VND**.
- [x] Thiết lập số dư ban đầu, chỉnh sửa tên ví, biểu tượng và màu sắc nhận diện.

### 1.3 Quản Lý Giao Dịch Thu - Chi (Transactions)
- [x] Thêm / Sửa / Xóa giao dịch Thu nhập và Chi tiêu (Tự động cập nhật số dư Ví chính).
- [x] Thông tin giao dịch chi tiết: Số tiền (VND), Ngày giờ, Danh mục, Ghi chú.
- [x] Bộ lọc & Tìm kiếm giao dịch nâng cao (theo từ khóa, loại thu/chi và danh mục).

### 1.4 Quản Lý Danh Mục Thu / Chi (Categories)
- [x] Tùy chỉnh danh mục Thu/Chi cá nhân: Thêm mới, chỉnh sửa và xóa tùy ý.
- [x] Bộ danh mục gợi ý hệ thống khởi tạo sẵn (Ăn uống, Đi lại, Mua sắm, Lương, Thưởng...).
- [x] Tùy biến Biểu tượng (Icon) và Màu sắc nhận diện cho từng danh mục.

### 1.5 Báo Cáo & Thống Kê Cơ Bản (Analytics & Reports)
- [x] Trang Tổng quan (Dashboard): Tổng thu, Tổng chi, Số dư tổng hợp.
- [x] Biểu đồ cơ cấu chi tiêu (Pie Chart / Donut Chart) theo danh mục.
- [x] Lịch chi tiêu theo ngày (tô màu theo mức chi, mốc màu tùy chỉnh) và Hạn mức chi an toàn mỗi ngày.
- [x] Nhập nhanh giao dịch bằng bàn phím số (chạm đúp vào ngày trên lịch để ghi cho ngày đó).
- [x] Ghi nhanh bằng chữ: gõ "cà phê 35k, xăng 50k" (hiểu 35k, 1tr2, 1,5 triệu, "hôm qua", "+"/"lương" cho khoản thu) là ghi sổ luôn, tự đoán danh mục.
- [x] Hóa đơn định kỳ (tab Hóa đơn): hàng tuần/tháng/năm/một lần, có thể đặt tháng kết thúc (Kỳ x/y); lịch trả theo tháng; "Xác nhận đã trả" ghi 1 khoản chi và trừ ví, "Bỏ trả" hoàn tác. Không ghi thành khoản nợ.
- [x] Biểu đồ biến động Thu - Chi theo Tuần / Tháng / Năm.

---

## ⚡ Giai Đoạn 2: Tự Động Hóa Biến Động Số Dư & Nhập Liệu 1-Chạm (Bank Sync & Quick Entry)
> *Mục tiêu: Khi có biến động tài khoản ngân hàng (chuyển tiền đi / nhận tiền đến), hệ thống lập tức bắt tín hiệu, gửi thông báo thời gian thực và tự động điền sẵn thông tin để người dùng tạo hóa đơn/khoản thu - chi chỉ với 1-2 thao tác.*

### 2.1 Cổng Tiếp Nhận Biến Động Số Dư (Bank Webhook & Integration)
- [x] Xây dựng Webhook API tiếp nhận biến động số dư tức thời từ ngân hàng / bên thứ 3 (Open Banking / SePay / Casso / SMS Parser).
- [x] Bảo mật Webhook qua API Key, Secret Token và xác thực chữ ký (Signature verification).
- [x] Tích hợp công cụ **Giả lập biến động số dư (Bank Transaction Simulator)** ngay trong ứng dụng để test nhanh các kịch bản chuyển/nhận tiền.

### 2.2 Hệ Thống Thông Báo Biến Động Thời Gian Thực (Real-Time Notifications)
- [x] Bắn thông báo ngay tức thì (In-app Notification, Banner / Toast / Push Notification) khi phát hiện phát sinh giao dịch mới.
- [x] Hiển thị huy hiệu (Badge count) thông báo số lượng giao dịch ngân hàng mới đang chờ xử lý trên giao diện.

### 2.3 Luồng Tự Động Điền & Thêm Hóa Đơn Chi Tiêu (Tiền Chuyển Đi - EXPENSE)
- [x] **Tự động trích xuất**: Số tiền chuyển đi, thời gian giao dịch, số tài khoản nhận và nội dung chuyển khoản.
- [x] **Tự động hiển thị & điền sẵn form hóa đơn**: Mở modal/drawer "Phát hiện chi tiêu mới" với số tiền và mô tả được điền sẵn 100%.
- [x] **Thao tác tối giản**: Người dùng chỉ cần chọn nhanh Danh mục chi tiêu (hoặc dùng gợi ý sẵn), chỉnh sửa thêm ghi chú (nếu muốn) và 1-click bấm "Lưu hóa đơn" vào Ví.

### 2.4 Luồng Tự Động Tạo Giao Diện & Ghi Nhận Thu Nhập (Tiền Nhận Đến - INCOME)
- [x] **Tự động phát hiện biến động cộng tiền**: Trích xuất số tiền nhận, người chuyển, nội dung và thời gian.
- [x] **Tự động hiển thị giao diện xác nhận thu nhập**: Bật cửa sổ thông báo ghi nhận nguồn thu mới.
- [x] **Thao tác tối giản**: Form đã điền sẵn số tiền, người dùng chỉ cần phân loại Danh mục thu nhập (Lương, Thưởng, Chuyển khoản, Hoàn tiền...) và bấm "Xác nhận thu nhập" để cộng số dư vào Ví.

### 2.5 Hộp Thư Giao Dịch Chờ Xử Lý (Pending Transactions Inbox)
- [x] Quản lý danh sách các biến động số dư chưa được chuyển thành hóa đơn/giao dịch chính thức.
- [x] Tính năng thao tác nhanh: "Xác nhận nhanh", "Chỉnh sửa chi tiết", "Bỏ qua / Ẩn (Ignore)".
- [x] Hỗ trợ xử lý và phân loại hàng loạt (Batch approval).

---

## 🤖 Giai Đoạn 3: Trí Tuệ Nhân Tạo & Tự Động Hóa Nâng Cao (Smart AI & Automation)
> *Mục tiêu: Tự động phân loại danh mục theo ngữ cảnh, quét hóa đơn bằng AI và đối soát tài chính thông minh.*

### 3.1 Tự Động Phân Loại Bằng Quy Tắc & Học Máy (Smart Auto-Categorization)
- [ ] **Bộ quy tắc nhận diện từ khóa (Rule-based matching)**: Tự động phát hiện từ khóa trong nội dung CK (VD: *"Grab"*, *"Shopee"*, *"Highlands"*, *"Tien nha"*, *"Luong thang 8"*...) để tự gán sẵn Danh mục mà người dùng không cần chọn tay.
- [ ] **Học thói quen người dùng**: Ghi nhớ lịch sử phân loại của từng số tài khoản thụ hưởng/người gửi để tự động áp dụng cho các lần sau.

### 3.2 Nhận Diện Giao Dịch Từ Ảnh Chụp Biên Lai / App Ngân Hàng (OCR Receipt Scanning)
- [ ] Tải lên ảnh chụp màn hình chuyển khoản thành công từ app ngân hàng hoặc hóa đơn mua sắm.
- [ ] AI OCR tự động quét trích xuất: Số tiền, thời gian, người nhận/gửi, nội dung -> Tự tạo giao diện giao dịch chờ xác nhận.

### 3.3 Đối Soát Dòng Tiền & Cảnh Báo Tài Chính (Reconciliation & Insights)
- [ ] Đối soát số dư thực tế tại ngân hàng so với số dư quản lý trên ứng dụng.
- [ ] Cảnh báo chi tiêu bất thường hoặc dòng tiền sụt giảm mạnh sau các giao dịch chuyển tiền lớn.
- [ ] Báo cáo phân tích chuyên sâu các nguồn tiền vào - ra tự động.

---

## 🗄️ Mô Hình Dữ Liệu Tham Chiếu (Database Entities)
- **User**: Người dùng hệ thống
- **Wallet**: Ví tiền / Tài khoản cá nhân
- **Category**: Danh mục Thu / Chi
- **Transaction**: Giao dịch thu chi chính thức
- **PendingTransaction**: Biến động số dư ngân hàng chờ người dùng xác nhận
- **BankWebhookLog**: Lịch sử webhook / log biến động số dư từ ngân hàng
- **CategorizationRule**: Quy tắc tự động gán danh mục theo từ khóa nội dung CK

