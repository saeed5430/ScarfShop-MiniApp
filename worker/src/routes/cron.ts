import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  ORDER_NOTIFY_BOT_TOKEN: string;
};

export const cronRoutes = new Hono<{ Bindings: Bindings }>();

async function deleteTelegramMessage(botToken: string, chatId: string, messageId: number): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/deleteMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Failed to delete Telegram message:', error);
    return false;
  }
}

cronRoutes.get('/cleanup-telegram-messages', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.TELEGRAM_BOT_TOKEN;
  const orderBotToken = c.env.ORDER_NOTIFY_BOT_TOKEN;

  if (!db || !botToken || !orderBotToken) {
    return c.json({ error: 'Missing configuration' }, 500);
  }

  const { Database } = await import('../db');
  const database = new Database(db);

  const pendingMessages = await database.telegramDeletionQueue.getPending(50);

  let deleted = 0;
  let failed = 0;

  for (const msg of pendingMessages) {
    // Use the appropriate bot token based on message type
    const token = msg.message_type === 'order_notification' ? botToken : orderBotToken;
    const success = await deleteTelegramMessage(token, msg.telegram_chat_id, msg.telegram_message_id);
    
    if (success) {
      await database.telegramDeletionQueue.markDeleted(msg.id);
      deleted++;
    } else {
      failed++;
    }
  }

  // Cleanup old deleted records
  const cleaned = await database.telegramDeletionQueue.cleanupOld(30);

  return c.json({ deleted, failed, cleaned });
});

export default cronRoutes;