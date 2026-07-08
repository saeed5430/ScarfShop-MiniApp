export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

export interface TelegramBotToken {
  token: string;
}

const TELEGRAM_API = 'https://api.telegram.org';

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: object
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
}

export async function setWebhook(
  token: string,
  url: string
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      allowed_updates: ['message'],
    }),
  });
}

export async function getMe(token: string): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/getMe`);
}
