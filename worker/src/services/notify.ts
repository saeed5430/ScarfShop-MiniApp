import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../db';

// Send message to Telegram user by chat_id
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data: { ok?: boolean; description?: string } = await response.json();
    if (!data.ok) {
      console.error('Telegram sendMessage failed:', data.description);
    }
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Get chat_id by username
async function getChatIdByUsername(
  botToken: string,
  username: string
): Promise<string | null> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${username}`;
    const response = await fetch(url);
    const data: { ok?: boolean; result?: { id?: number }; description?: string } = await response.json();

    if (data.ok && data.result?.id) {
      return String(data.result.id);
    }

    console.log(`getChat for @${username} failed:`, data.description);
    return null;
  } catch (error) {
    console.error(`Failed to get chat_id for @${username}:`, error);
    return null;
  }
}

// Known admin mappings: username -> known Telegram user ID (numeric)
// These work directly if the user has started THIS bot
const ADMIN_CHAT_IDS: Record<string, string> = {
  'saeed54300': '6451725218', // @saeed54300
  'abdollahisz': '6586804580', // @abdollahisz
};

// Fixed list of admin usernames to notify
const NOTIFY_ADMIN_USERNAMES = ['saeed54300', 'abdollahisz'];

// Format order notification message
function formatOrderMessage(
  orderId: number,
  customer: {
    id: string;
    first_name: string;
    last_name: string | null;
    username: string | null;
    phone: string | null;
    address: string | null;
  },
  items: Array<{
    product_name: string | null;
    category_name: string | null;
    color_name: string | null;
    color_hex: string | null;
    size_dimensions: string | null;
    quantity: number;
  }>
): string {
  let message = `🛍️ <b>سفارش جدید #${orderId}</b>\n\n`;

  // Customer info
  message += `👤 <b>اطلاعات مشتری:</b>\n`;
  message += `├ نام: ${customer.first_name} ${customer.last_name || ''}\n`;
  message += `├ یوزرنیم: ${customer.username ? `@${customer.username}` : 'ندارد'}\n`;
  message += `├ شناسه: ${customer.id}\n`;
  if (customer.phone) {
    message += `├ تلفن: ${customer.phone}\n`;
  }
  if (customer.address) {
    message += `├ آدرس: ${customer.address}\n`;
  }
  message += `\n`;

  // Order items
  message += `📦 <b>اقلام سفارش:</b>\n`;
  items.forEach((item, index) => {
    const productName = [item.category_name, item.product_name].filter(Boolean).join(' ');
    const colorText = item.color_name ? `🎨 ${item.color_name}` : '';
    const sizeText = item.size_dimensions ? `📏 ${item.size_dimensions}` : '';

    message += `${index + 1}. ${productName}\n`;
    if (colorText || sizeText) {
      message += `   ${colorText} ${sizeText}\n`;
    }
    message += `   تعداد: ${item.quantity}\n`;
  });

  message += `\n⏰ ${new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}`;

  return message;
}

// Main function to send order notification
export async function sendOrderNotification(
  db: D1Database,
  botToken: string,
  orderId: number,
  customerId: string,
  items: Array<{
    product_name: string | null;
    category_name: string | null;
    color_name: string | null;
    color_hex: string | null;
    size_dimensions: string | null;
    quantity: number;
  }>
): Promise<{ sent: number; failed: number }> {
  const database = new Database(db);

  // Get customer info
  const customer = await database.customers.findById(customerId);
  if (!customer) {
    console.error('Customer not found for notification:', customerId);
    return { sent: 0, failed: 0 };
  }

  // Format message
  const message = formatOrderMessage(orderId, customer, items);

  let sent = 0;
  let failed = 0;

  // Send to specific admin usernames
  for (const username of NOTIFY_ADMIN_USERNAMES) {
    // First try known numeric ID (works if user started this bot)
    const knownChatId = ADMIN_CHAT_IDS[username];
    let chatId = knownChatId || null;

    // If no known ID or sending failed, try username lookup
    if (!chatId) {
      chatId = await getChatIdByUsername(botToken, username);
    }

    if (chatId) {
      const success = await sendTelegramMessage(botToken, chatId, message);
      if (success) {
        sent++;
      } else {
        failed++;
        console.log(`Failed to send message to ${username} (chat_id: ${chatId})`);
      }
    } else {
      console.log(`Could not resolve chat_id for @${username} - user may not have started the bot`);
      failed++;
    }
  }

  return { sent, failed };
}
