/**
 * Phân tích câu gõ nhanh thành giao dịch, VD:
 *   "cà phê 35k, xăng 50k"     -> 2 khoản chi (Ăn uống 35.000, Đi lại 50.000)
 *   "lương 18tr"               -> khoản thu (Lương 18.000.000)
 *   "hôm qua ăn tối 1tr2"      -> khoản chi 1.200.000 ghi cho hôm qua
 * Chạy hoàn toàn ở trình duyệt, không gọi dịch vụ bên ngoài.
 */

export interface QuickCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export interface QuickEntry {
  raw: string;
  type: "INCOME" | "EXPENSE";
  amount: number | null;
  categoryId: string | null;
  note: string;
  date: Date;
}

/** Bỏ dấu tiếng Việt + chữ thường để so khớp từ khóa */
export function normalizeVN(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const MULTIPLIERS: Record<string, number> = {
  k: 1e3, nghin: 1e3, ngan: 1e3, ng: 1e3,
  tr: 1e6, trieu: 1e6, m: 1e6, cu: 1e6,
  ty: 1e9,
};

// số [đơn vị] [phần lẻ kiểu 1tr2]; đơn vị viết có/không dấu
const AMOUNT_RE =
  /(^|[\s+\-(])(\d+(?:[.,]\d+)*)\s*(k|nghìn|nghin|ngàn|ngan|ng|tr|triệu|trieu|m|củ|cu|tỷ|ty|đ|d|vnđ|vnd)?(\d{1,3})?(?![\p{L}\d])/giu;

interface AmountMatch {
  value: number;
  hasUnit: boolean;
  index: number;
  length: number;
}

function parseAmounts(text: string): AmountMatch[] {
  const found: AmountMatch[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const [whole, lead, num, unitRaw, tail] = m;
    const unit = unitRaw ? normalizeVN(unitRaw) : "";
    const mult = MULTIPLIERS[unit];
    let value: number;
    if (mult) {
      // Có đơn vị: dấu . hoặc , là phần thập phân ("1,5tr"); "1tr2" = 1,2tr
      value = parseFloat(num.replace(",", "."));
      if (tail) value += Number(tail) / 10 ** tail.length;
      value *= mult;
    } else {
      if (tail) continue;
      // Không đơn vị: dấu . , là phân cách hàng nghìn ("50.000")
      value = Number(num.replace(/[.,]/g, ""));
      // Số nhỏ không đơn vị được hiểu là nghìn đồng ("phở 45" = 45.000)
      if (!unit && value > 0 && value < 1000) value *= 1000;
    }
    if (!Number.isFinite(value) || value <= 0) continue;
    found.push({
      value: Math.round(value),
      hasUnit: !!unitRaw,
      index: (m.index ?? 0) + lead.length,
      length: whole.length - lead.length,
    });
  }
  return found;
}

/** Từ khóa -> tên danh mục hệ thống. Thứ tự quan trọng: luật đứng trước được ưu tiên. */
const EXPENSE_RULES: [string, string[]][] = [
  ["nha cua & hoa don", ["tien dien", "dien nuoc", "tien nuoc", "internet", "wifi", "tien nha", "thue nha", "tien phong", "gas", "hoa don", "cuoc dien thoai", "nap the", "4g", "chung cu", "phi quan ly"]],
  ["an uong", ["an", "com", "pho", "bun", "mi", "banh", "ca phe", "cafe", "coffee", "cf", "tra sua", "tra da", "nuoc ngot", "nuoc mia", "nuoc", "sinh to", "lau", "nuong", "highlands", "starbucks", "phuc long", "do an", "an vat", "nhau", "bia", "che", "kem", "di cho", "sieu thi", "grabfood", "shopeefood", "xoi", "chao", "hu tieu", "banh mi"]],
  ["di lai", ["xang", "do xang", "grab", "xanh sm", "taxi", "gui xe", "ve xe", "bus", "xe bus", "sua xe", "rua xe", "thay nhot", "phi duong", "ve tau", "gojek"]],
  ["suc khoe", ["thuoc", "kham", "benh vien", "nha khoa", "rang", "gym", "yoga", "vitamin", "xet nghiem", "bao hiem"]],
  ["giai tri", ["phim", "cgv", "game", "netflix", "spotify", "youtube", "karaoke", "du lich", "choi", "concert", "ve xem", "cau long", "da bong", "boi"]],
  ["mua sam", ["mua", "ao", "quan", "giay", "dep", "tui", "shopee", "lazada", "tiki", "my pham", "son", "do dung", "dien thoai", "tai nghe"]],
];

const INCOME_RULES: [string, string[]][] = [
  ["luong", ["luong", "salary"]],
  ["thuong", ["thuong", "bonus", "li xi", "lixi"]],
  ["dau tu", ["co tuc", "lai", "dau tu", "chung khoan", "crypto"]],
];

const INCOME_HINTS = ["luong", "thuong", "bonus", "nhan tien", "nhan luong", "thu nhap", "duoc cho", "duoc chuyen", "hoan tien", "co tuc", "li xi", "lai tiet kiem"];

function hasWord(normText: string, keyword: string) {
  return new RegExp(`(^|[^a-z0-9])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(normText);
}

function pickCategory(normText: string, type: "INCOME" | "EXPENSE", categories: QuickCategory[]): string | null {
  const pool = categories.filter((c) => c.type === type);
  if (pool.length === 0) return null;
  const byName = new Map(pool.map((c) => [normalizeVN(c.name), c.id]));

  // 1. Tên danh mục xuất hiện nguyên văn trong câu (kể cả danh mục tự tạo), ưu tiên tên dài hơn
  const direct = [...byName.entries()]
    .filter(([name]) => name.length >= 2 && hasWord(normText, name))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (direct) return direct[1];

  // 2. Từ khóa thông dụng
  for (const [name, keywords] of type === "EXPENSE" ? EXPENSE_RULES : INCOME_RULES) {
    const id = byName.get(name);
    if (id && keywords.some((k) => hasWord(normText, k))) return id;
  }

  // 3. Mặc định: "Khác" / "Thu nhập khác", hoặc danh mục đầu tiên
  return byName.get(type === "EXPENSE" ? "khac" : "thu nhap khac") ?? pool[0].id;
}

const DATE_WORDS: [RegExp, number][] = [
  [/\bhôm kia\b|\bhom kia\b/giu, -2],
  [/\bhôm qua\b|\bhom qua\b/giu, -1],
  [/\bhôm nay\b|\bhom nay\b/giu, 0],
];

function parseOne(raw: string, categories: QuickCategory[], baseDate: Date): QuickEntry | null {
  let text = raw.trim();
  if (!text) return null;

  // Dấu + / - ở đầu câu ép loại giao dịch
  let forced: "INCOME" | "EXPENSE" | null = null;
  if (/^\+/.test(text)) forced = "INCOME";
  else if (/^-/.test(text)) forced = "EXPENSE";
  text = text.replace(/^[+-]\s*/, "");

  // Ngày tương đối
  let date = baseDate;
  for (const [re, offset] of DATE_WORDS) {
    if (re.test(text)) {
      const now = new Date();
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, now.getHours(), now.getMinutes());
      text = text.replace(re, " ");
    }
    re.lastIndex = 0;
  }

  // Số tiền: ưu tiên số có đơn vị, không thì lấy số cuối cùng
  const amounts = parseAmounts(text);
  const chosen = [...amounts].reverse().find((a) => a.hasUnit) ?? amounts[amounts.length - 1];
  let noteText = text;
  if (chosen) noteText = text.slice(0, chosen.index) + " " + text.slice(chosen.index + chosen.length);
  noteText = noteText.replace(/\s+/g, " ").replace(/^[\s,:\-–]+|[\s,:\-–]+$/g, "").trim();

  const norm = normalizeVN(noteText);
  const type = forced ?? (INCOME_HINTS.some((k) => hasWord(norm, k)) ? "INCOME" : "EXPENSE");

  return {
    raw: raw.trim(),
    type,
    amount: chosen?.value ?? null,
    categoryId: pickCategory(norm, type, categories),
    note: noteText ? noteText.charAt(0).toUpperCase() + noteText.slice(1) : "",
    date,
  };
}

/** Tách nhiều khoản bằng xuống dòng, dấu ; hoặc dấu phẩy có khoảng trắng sau ("cà phê 35k, xăng 50k") */
export function parseQuickEntries(input: string, categories: QuickCategory[], baseDate: Date = new Date()): QuickEntry[] {
  return input
    .split(/\s*[;\n]\s*|,\s+/)
    .map((part) => parseOne(part, categories, baseDate))
    .filter((e): e is QuickEntry => e !== null);
}
