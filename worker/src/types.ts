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
    photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>;
    voice?: { file_id: string; duration: number; mime_type?: string; file_size?: number };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
    };
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

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

export async function sendPhoto(
  token: string,
  chatId: number,
  photo: string,
  caption: string
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML' }),
  });
}

export async function sendVoice(
  token: string,
  chatId: number,
  voice: string,
  caption: string
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/sendVoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, voice, caption, parse_mode: 'HTML' }),
  });
}

export async function editMessageReplyMarkup(
  token: string,
  chatId: number,
  messageId: number,
  replyMarkup: object
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
  });
}

export async function editMessageText(
  token: string,
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup: object
): Promise<Response> {
  return fetch(`${TELEGRAM_API}/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
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
