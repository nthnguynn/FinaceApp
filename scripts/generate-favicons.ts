/**
 * Sinh bộ icon của moniii từ 1 bản vẽ SVG (heo đất hồng + đồng xu trái tim).
 *
 *   bun scripts/generate-favicons.ts
 *
 * Dùng `sharp` (đi kèm Next.js) để xuất PNG và gói favicon.ico (ICO chứa ảnh PNG 16/32/48).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * @param rounded bo góc nền (icon thường) hay tràn viền (apple-touch / maskable — hệ điều hành tự bo)
 * @param scale   thu nhỏ nhân vật để nằm trong vùng an toàn của icon maskable
 */
function mascotSvg({ rounded = true, scale = 1 } = {}): string {
  const t = scale === 1 ? "" : ` transform="translate(${256 * (1 - scale)} ${256 * (1 - scale)}) scale(${scale})"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F472B6"/>
      <stop offset="1" stop-color="#DB2777"/>
    </linearGradient>
    <radialGradient id="face" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#FFE0EE"/>
    </radialGradient>
    <linearGradient id="coin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FDE68A"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="${rounded ? 120 : 0}" fill="url(#bg)"/>

  <g${t}>
    <!-- Lấp lánh -->
    <path d="M96 84q0 30-30 30q30 0 30 30q0-30 30-30q-30 0-30-30z" fill="#FFF4C2"/>
    <circle cx="430" cy="128" r="10" fill="#FFFFFF" opacity="0.85"/>
    <circle cx="452" cy="176" r="6" fill="#FFFFFF" opacity="0.6"/>

    <!-- Đồng xu trái tim đang rơi vào khe -->
    <circle cx="256" cy="112" r="56" fill="url(#coin)" stroke="#FFFFFF" stroke-width="9"/>
    <path d="M256 140c-26-17-38-30-38-45c0-11 9-19 19-19c8 0 15 5 19 12c4-7 11-12 19-12c10 0 19 8 19 19c0 15-12 28-38 45z" fill="#FFFFFF" opacity="0.95"/>

    <!-- Tai -->
    <g id="ear">
      <path d="M110 232C92 168 116 120 168 136C196 146 206 178 196 206Z" fill="#FFD1E5"/>
      <path d="M128 214C120 176 134 152 162 160C176 166 182 184 176 200Z" fill="#FF8FBF"/>
    </g>
    <use xlink:href="#ear" transform="translate(512 0) scale(-1 1)"/>

    <!-- Đầu -->
    <ellipse cx="256" cy="304" rx="170" ry="150" fill="url(#face)"/>
    <!-- Khe bỏ tiền -->
    <rect x="212" y="158" width="88" height="18" rx="9" fill="#BE185D"/>

    <!-- Mắt -->
    <ellipse cx="194" cy="286" rx="18" ry="22" fill="#4A0E2B"/>
    <ellipse cx="318" cy="286" rx="18" ry="22" fill="#4A0E2B"/>
    <circle cx="201" cy="277" r="7" fill="#FFFFFF"/>
    <circle cx="325" cy="277" r="7" fill="#FFFFFF"/>

    <!-- Má hồng -->
    <ellipse cx="146" cy="336" rx="30" ry="18" fill="#FF5C9A" opacity="0.42"/>
    <ellipse cx="366" cy="336" rx="30" ry="18" fill="#FF5C9A" opacity="0.42"/>

    <!-- Mũi -->
    <ellipse cx="256" cy="344" rx="62" ry="43" fill="#FF9CC6"/>
    <ellipse cx="235" cy="344" rx="10" ry="14" fill="#C2185B"/>
    <ellipse cx="277" cy="344" rx="10" ry="14" fill="#C2185B"/>

    <!-- Miệng cười -->
    <path d="M234 404q22 18 44 0" fill="none" stroke="#4A0E2B" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>`;
}

/** Gói nhiều ảnh PNG vào 1 file .ico (định dạng ICO hỗ trợ PNG từ Windows Vista, mọi trình duyệt hiện đại đều đọc được) */
function packIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, png }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // color planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });

  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

async function main() {
  const root = process.cwd();
  const out = (...p: string[]) => path.join(root, ...p);

  const icon = mascotSvg();
  const fullBleed = mascotSvg({ rounded: false });
  const maskable = mascotSvg({ rounded: false, scale: 0.8 });

  fs.writeFileSync(out("src", "app", "icon.svg"), icon);
  fs.writeFileSync(out("public", "icon.svg"), icon);

  const ico = packIco(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await png(icon, size) })))
  );
  fs.writeFileSync(out("src", "app", "favicon.ico"), ico);
  fs.writeFileSync(out("public", "favicon.ico"), ico);

  // iOS tự bo góc nên dùng bản tràn viền
  fs.writeFileSync(out("src", "app", "apple-icon.png"), await png(fullBleed, 180));
  fs.writeFileSync(out("public", "icon-192.png"), await png(icon, 192));
  fs.writeFileSync(out("public", "icon-512.png"), await png(icon, 512));
  fs.writeFileSync(out("public", "icon-maskable-512.png"), await png(maskable, 512));

  // Bản SVG apple-icon cũ không hợp lệ (apple-touch-icon chỉ nhận PNG/JPG)
  fs.rmSync(out("src", "app", "apple-icon.svg"), { force: true });

  console.log("Đã tạo icon moniii: icon.svg, favicon.ico (16/32/48), apple-icon.png, icon-192/512, icon-maskable-512");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
