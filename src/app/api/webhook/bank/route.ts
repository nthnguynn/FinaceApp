import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Universal Bank Webhook Endpoint
 * Hỗ trợ SePay, Casso, và Generic Android Notification Forwarder
 * POST /api/webhook/bank?secret=wh_sec_...
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secretQuery =
      url.searchParams.get("secret") ||
      url.searchParams.get("token") ||
      url.searchParams.get("key") ||
      url.searchParams.get("api_key");

    const authHeader = req.headers.get("authorization");
    let authHeaderSecret: string | null = null;
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        authHeaderSecret = authHeader.substring(7).trim();
      } else if (authHeader.startsWith("Apikey ")) {
        authHeaderSecret = authHeader.substring(7).trim();
      } else {
        authHeaderSecret = authHeader.trim();
      }
    }

    const xSecretKey =
      req.headers.get("x-secret-key") ||
      req.headers.get("x-api-key") ||
      req.headers.get("secure-token") ||
      req.headers.get("api-key");

    // Đọc body payload
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Payload JSON không hợp lệ." }, { status: 400 });
    }

    const secretBody = body.secret || body.apiKey || body.api_key;
    const secret = secretQuery || authHeaderSecret || xSecretKey || secretBody;

    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã xác thực Webhook Secret (?secret=... hoặc Header Authorization)." },
        { status: 401 }
      );
    }

    // Tìm user sở hữu webhookSecret này
    const user = await prisma.user.findFirst({
      where: { webhookSecret: secret },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Mã Webhook Secret không hợp lệ hoặc không tồn tại." },
        { status: 401 }
      );
    }

    // 1. Phân tích định dạng Casso
    if (Array.isArray(body.data) && body.data.length > 0) {
      const rows = body.data
        .map((item: Record<string, unknown>) => ({
          userId: user.id,
          amount: Math.abs(Number(item.amount) || 0),
          type: Number(item.amount) >= 0 ? ("INCOME" as const) : ("EXPENSE" as const),
          bankName: String(item.bankName || "Ngân hàng"),
          bankAccount: item.bank_sub_acc_id || item.accountNumber ? String(item.bank_sub_acc_id || item.accountNumber) : null,
          transactionCode: item.tid ? String(item.tid) : null,
          content: String(item.description || item.corresponsiveName || "Biến động số dư Casso"),
          status: "PENDING" as const,
        }))
        .filter((row: { amount: number }) => row.amount > 0);

      // Ghi toàn bộ lô bằng 1 câu lệnh INSERT thay vì N lần tuần tự
      const created = rows.length
        ? await prisma.pendingTransaction.createManyAndReturn({ data: rows, select: { id: true } })
        : [];

      return NextResponse.json({
        success: true,
        message: `Đã ghi nhận ${created.length} giao dịch từ Casso.`,
        createdIds: created.map((r) => r.id),
      });
    }

    // 2. Phân tích định dạng SePay hoặc Generic Webhook
    let amount = 0;
    let type: "INCOME" | "EXPENSE" = "EXPENSE";
    const bankName = body.gateway || body.bankName || body.bank_name || body.bank || "Ngân hàng";
    const bankAccount = body.accountNumber || body.account_number || body.bankAccount || body.subAccount || null;
    const content = body.content || body.description || body.message || body.body || "";
    const transactionCode =
      body.referenceCode ||
      body.reference_number ||
      body.code ||
      body.transaction_id ||
      body.id ||
      `TX${Date.now().toString().slice(-6)}`;

    // Hàm helper chuẩn hóa số tiền
    const parseAmount = (val: unknown): number => {
      if (val === undefined || val === null || val === "") return 0;
      if (typeof val === "number") return Math.abs(val);
      const str = String(val).trim().replace(/,/g, "");
      const num = parseFloat(str);
      return isNaN(num) ? 0 : Math.abs(num);
    };

    // Kiểm tra loại giao dịch từ SePay (transferType, transfer_type, transactionType, type...)
    const rawTransferType = String(
      body.transferType ||
      body.transfer_type ||
      body.transactionType ||
      body.transaction_type ||
      body.type ||
      body.action ||
      ""
    ).toLowerCase().trim();

    const rawAmountIn = parseAmount(body.amountIn || body.amount_in || body.inAmount);
    const rawAmountOut = parseAmount(body.amountOut || body.amount_out || body.outAmount);
    const rawTransferAmount = parseAmount(body.transferAmount || body.transfer_amount || body.amount);

    if (rawTransferType === "in" || rawTransferType === "income" || rawTransferType === "receive" || rawTransferType === "credit" || rawTransferType === "+") {
      type = "INCOME";
      amount = rawTransferAmount || rawAmountIn;
    } else if (rawTransferType === "out" || rawTransferType === "expense" || rawTransferType === "debit" || rawTransferType === "send" || rawTransferType === "-") {
      type = "EXPENSE";
      amount = rawTransferAmount || rawAmountOut;
    } else if (rawAmountOut > 0) {
      type = "EXPENSE";
      amount = rawAmountOut;
    } else if (rawAmountIn > 0) {
      type = "INCOME";
      amount = rawAmountIn;
    } else if (body.amount !== undefined) {
      const num = Number(String(body.amount).replace(/,/g, ""));
      if (num < 0) {
        type = "EXPENSE";
        amount = Math.abs(num);
      } else {
        amount = num;
        // Nếu nội dung chứa từ khóa trừ tiền / chuyển khoản đi
        const lowerContent = content.toLowerCase();
        if (
          lowerContent.includes("chuyen tien") ||
          lowerContent.includes("thanh toan") ||
          lowerContent.includes("tru ") ||
          lowerContent.includes("rut tien") ||
          lowerContent.includes("-")
        ) {
          type = "EXPENSE";
        } else {
          type = "INCOME";
        }
      }
    } else if (rawTransferAmount > 0) {
      amount = rawTransferAmount;
    }

    // Nếu không có số tiền trực tiếp, thử trích xuất từ nội dung thông báo (SMS / Push Notification text)
    if (amount <= 0 && content) {
      // Regex trích xuất số tiền từ text dạng: "TK ... -50,000VND" hoặc "+1,200,000 đ" hoặc "tang 50.000VND"
      const match = content.match(/([+-]?\s*[\d\.,]+)\s*(?:VND|đ|d|dong|k)/i);
      if (match && match[1]) {
        const cleanNumber = match[1].replace(/[^\d]/g, "");
        amount = Number(cleanNumber) || 0;
        const lower = content.toLowerCase();
        if (content.includes("-") || lower.includes("giam") || lower.includes("tru") || lower.includes("chuyen")) {
          type = "EXPENSE";
        } else if (content.includes("+") || lower.includes("tang") || lower.includes("cong") || lower.includes("nhan")) {
          type = "INCOME";
        }
      }
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Không xác định được số tiền hợp lệ trong payload." },
        { status: 422 }
      );
    }

    // Lưu vào PendingTransaction
    const pendingTx = await prisma.pendingTransaction.create({
      data: {
        userId: user.id,
        amount,
        type,
        bankName,
        bankAccount,
        transactionCode: String(transactionCode),
        content: content || (type === "INCOME" ? "Nhận tiền ngân hàng" : "Chuyển tiền ngân hàng"),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ghi nhận biến động số dư thành công.",
      pendingTransaction: {
        id: pendingTx.id,
        amount: pendingTx.amount,
        type: pendingTx.type,
        bankName: pendingTx.bankName,
        content: pendingTx.content,
      },
    });
  } catch (error) {
    console.error("Bank Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Lỗi nội bộ máy chủ khi xử lý Webhook." }, { status: 500 });
  }
}
