import { sendMessage } from './types';

export function getMiniAppUrl(baseUrl: string): string {
  return baseUrl;
}

export function buildStartMessage(firstName: string): string {
  return [
    `سلام ${firstName}! 👋`,
    '',
    'به فروشگاه آرمانا خوش آمدید.',
    '',
    'از دکمه زیر برای باز کردن اپ استفاده کن:',
  ].join('\n');
}

export function buildHelpMessage(): string {
  return [
    'راهنما:',
    '',
    '/start - شروع',
    '/help - راهنما',
    '',
    'از دکمه زیر برای باز کردن اپ استفاده کن.',
  ].join('\n');
}

export function buildMiniAppButton(url: string) {
  return {
    inline_keyboard: [
      [
        {
          text: '🛍️ ورود به فروشگاه آرمانا',
          web_app: { url },
        },
      ],
    ],
  };
}

export async function handleStart(
  token: string,
  chatId: number,
  firstName: string,
  baseUrl: string
): Promise<void> {
  const text = buildStartMessage(firstName);
  const url = getMiniAppUrl(baseUrl);
  const replyMarkup = buildMiniAppButton(url);

  await sendMessage(token, chatId, text, replyMarkup);
}

export async function handleHelp(
  token: string,
  chatId: number,
  baseUrl: string
): Promise<void> {
  const text = buildHelpMessage();
  const url = getMiniAppUrl(baseUrl);
  const replyMarkup = buildMiniAppButton(url);

  await sendMessage(token, chatId, text, replyMarkup);
}

export async function handleUnknown(
  token: string,
  chatId: number
): Promise<void> {
  await sendMessage(token, chatId, 'دستور نامعتبر. از /start یا /help استفاده کن.');
}
