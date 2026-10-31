---
version: alpha
name: moniii Pink
description: Hệ thống thiết kế cho moniii — ứng dụng quản lý thu chi cá nhân, tông hồng, bố cục kiểu "lịch tiền" (lấy cảm hứng từ app Monii), giao diện sáng/tối.
colors:
  primary: "oklch(0.58 0.22 354)"
  primary-foreground: "oklch(0.985 0.01 350)"
  primary-dark: "oklch(0.74 0.16 354)"
  primary-foreground-dark: "oklch(0.2 0.05 354)"
  background: "oklch(0.978 0.006 350)"
  hero: "oklch(0.34 0.075 356)"
  hero-dark: "oklch(0.3 0.07 356)"
  hero-foreground: "oklch(0.985 0.008 350)"
  background-dark: "oklch(0.165 0.016 350)"
  foreground: "oklch(0.21 0.025 350)"
  foreground-dark: "oklch(0.97 0.008 350)"
  card: "oklch(1 0 0)"
  card-dark: "oklch(0.21 0.02 350)"
  muted-foreground: "oklch(0.5 0.03 350)"
  muted-foreground-dark: "oklch(0.72 0.025 350)"
  border: "oklch(0.915 0.016 350)"
  income: "#059669"
  expense: "#E11D48"
  warning: "#D97706"
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: -0.025em
  heading-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.875rem
    fontWeight: 800
    letterSpacing: -0.025em
  heading-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 700
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 600
  amount:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: 800
    fontFeature: '"tnum"'
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
  3xl: 22px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.xl}"
    height: 44px
    padding: 0 24px
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    height: 44px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: 28px
    padding: 20px
  hero-card:
    backgroundColor: "{colors.hero}"
    textColor: "{colors.hero-foreground}"
    rounded: 28px
    padding: 20px
  tab-bar:
    backgroundColor: "{colors.card}"
    rounded: 28px
    height: 64px
  keypad-key:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    height: 48px
  stat-amount:
    typography: "{typography.amount}"
  badge-pending:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
---

## Overview

moniii là công cụ dùng hằng ngày, nên giao diện phải **yên tĩnh và dễ đọc số**. Màu hồng là bản sắc
thương hiệu (nút chính, liên kết, trạng thái đang chọn, icon điểm nhấn), còn dữ liệu tài chính giữ màu ngữ nghĩa
riêng. Không có số liệu, logo đối tác hay lời chứng thực bịa đặt ở bất kỳ đâu — khung xem trước sản phẩm phải ghi
rõ là dữ liệu minh họa.

## Bố cục kiểu Monii

Lấy cảm hứng bố cục và cách tương tác từ app Monii (Money Calendar), **không** dùng logo, linh vật hay hình minh
họa của Monii. Màu chủ đạo vẫn là hồng. Tên "moniii" do chủ dự án chọn — gần giống tên app Monii, cần cân nhắc
trước khi phát hành công khai.

**Logo / linh vật**: heo đất hồng má đỏ, trên đầu có đồng xu trái tim đang rơi vào khe, nền squircle gradient
`#F472B6 → #DB2777`. Nguồn duy nhất: `scripts/generate-favicons.ts` (sinh icon.svg, favicon.ico 16/32/48,
apple-icon.png 180, icon-192/512, icon-maskable-512). Wordmark viết thường `moniii`, chữ `iii` màu primary.

- **Thanh tab** 6 mục: Lịch · Giao dịch · Hóa đơn · Thống kê · Ngân hàng · Tôi. Di động: viên thuốc nổi ở đáy, cách mép 12px,
  tôn trọng `safe-area-inset-bottom`; máy tính: nhóm tab viên thuốc trên header. Ví/Danh mục là trang con của "Tôi".
- **Thẻ hero** (nền `hero` mận đậm, chữ trắng): số dư khả dụng + dòng gợi ý nhịp chi tiêu. Hình trang trí chỉ nằm ở
  góc phải, không đè lên chữ.
- **Lịch chi tiêu**: lưới 7 cột T2→CN, ô bo 12–16px, số tiền rút gọn (`85k`, `1,25tr`). Màu theo mức chi:
  emerald (ít) / orange (vừa) / rose (nhiều), mốc tùy chỉnh lưu ở trình duyệt. Hôm nay = vòng hồng, ngày đang chọn =
  vòng màu chữ. Chạm = xem chi tiết ngày, chạm đúp = thêm giao dịch cho ngày đó.
- **Bảng nhập nhanh**: trượt lên từ đáy (di động) / hộp giữa màn hình (máy tính); ô số tiền lớn viền đậm, lưới danh mục
  4 cột, bàn phím số `1–9, 000, 0, ⌫`, nút Lưu nền `hero` cao 56px.
- **Nhãn khu vực** in hoa giãn chữ nhỏ (`tracking-[0.12em]`, 12px, màu muted) kèm icon hồng — chỉ dùng cho nhãn
  khu vực/trường nhập, không dùng cho tiêu đề trang hay nội dung.
- **Ghi nhanh bằng chữ**: ô nhập viền 2px, gõ "cà phê 35k, xăng 50k" → xem trước dạng chip (icon danh mục + số tiền)
  ngay dưới ô, Enter là ghi sổ. Phân tích chạy hoàn toàn ở trình duyệt (`src/lib/quick-entry.ts`).
- **Hóa đơn** (cấu trúc theo trang Nợ của Monee nhưng **không ghi nợ**): 2 tab con "Theo tháng" (gom theo ngày, 3 thẻ
  Cần trả / Đã trả / Còn lại, nút "Xác nhận đã trả" ↔ "Bỏ trả") và "Danh sách" (kế hoạch, Kỳ x/y, thanh tiến độ).
  Trả hóa đơn = 1 khoản chi; hóa đơn chưa trả chỉ là lời nhắc.
- Lưới nhiều cột luôn dùng `minmax(0, …)` để nội dung không xuống dòng không làm tràn ngang trên di động.

## Colors

- **Primary (hồng, hue 354)** chỉ dùng cho hành động chính, liên kết, trạng thái active và icon nhấn. Chế độ tối
  dùng `primary-dark` (sáng hơn) với chữ tối bên trên.
- **Income = emerald, Expense = rose.** Hồng thương hiệu được đặt ở hue 354 để tách khỏi rose của khoản chi (hue ~17).
  Không dùng hồng để thể hiện số tiền.
- **Warning = amber** cho trạng thái "Chờ duyệt" và thâm hụt.
- Nền dùng trung tính ánh hồng rất nhẹ; nền trang có thể phủ `.bg-pink-wash` (radial-gradient tĩnh). Không dùng
  khối blur chuyển động làm nền.
- Mọi cặp chữ/nền phải đạt WCAG AA ≥ 4.5:1 (đã kiểm tra: primary trên nền sáng 4.5:1, chữ trên primary 4.6:1, chữ trắng trên hero 11.7:1).

## Typography

Một họ chữ duy nhất: **Plus Jakarta Sans** (400–800, có tiếng Việt). Tiêu đề dùng 800 với letter-spacing âm nhẹ và
`text-balance`. Toàn bộ trang bật `font-variant-numeric: tabular-nums` để số tiền thẳng cột. Chữ in hoa giãn cách chỉ
dành cho nhãn khu vực (xem "Bố cục kiểu Monii"); còn lại dùng chữ thường câu. Không bỏ cấp tiêu đề (h1 → h2 → h3).

## Layout

Khung tối đa `max-w-6xl`, lề 16px trên di động và 24px từ `sm`. Section trang giới thiệu cách nhau ~96px.
Dashboard ưu tiên lưới 1 → 2 → 4 cột cho thẻ thống kê. Trên di động, điều hướng chuyển xuống thanh dưới cùng có
padding `env(safe-area-inset-bottom)`.

## Elevation & Depth

Ưu tiên viền mảnh `border-border` + bóng mềm, bán trong suốt; tránh bóng đen đặc. Bóng nhấn mạnh có thể pha màu
primary: `color-mix(in oklch, var(--primary) 35%, transparent)`. Không lồng card trong card.

## Shapes

Bo góc lớn, mềm: phím số và input `xl` (14px), thẻ nhỏ `3xl` (22px), thẻ khu vực/hero/thanh tab 28px, bảng nhập 32px. Nút hành động chính, badge, avatar và bộ chọn tháng bo tròn hẳn.

## Components

- **Nút chính**: nền primary, cao 44px trên form/hero, 32px trong thanh công cụ.
- **Thẻ thống kê**: nhãn `label-sm` màu muted, số tiền `amount` màu theo ngữ nghĩa (thu/chi/ròng).
- **Thông báo biến động**: card nổi, có thể bấm và dùng bàn phím (`role="button"`, Enter/Space), nút đóng có
  `aria-label`.
- **Danh mục hệ thống**: chỉ đọc, hiển thị nhãn khóa "Hệ thống" thay cho nút sửa/xóa.

## Do's and Don'ts

- ✅ Chuyển động vào dùng ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`), 200–600ms, chạy một lần.
- ✅ Tôn trọng `prefers-reduced-motion` (đã tắt animation/transition toàn cục).
- ✅ Focus ring rõ ràng `outline: 2px solid var(--ring)` cho mọi phần tử tương tác.
- ❌ Không gradient tím → xanh, không chữ gradient cho tiêu đề.
- ❌ Không `animate-pulse` vô hạn cho thông tin tĩnh; không fade-in mọi section khi cuộn.
- ❌ Không số liệu tăng trưởng, chứng chỉ bảo mật hay lời khen người dùng không có thật.
- ❌ Không chặn phóng to (`user-scalable=no`); input ≥16px trên di động để tránh auto-zoom.
