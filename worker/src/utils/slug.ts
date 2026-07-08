// Persian to English transliteration for slug generation

const PERSIAN_MAP: Record<string, string> = {
  'а': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd',
  'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
  'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k',
  'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v',
  'ه': 'h', 'ی': 'y', 'ئ': 'y', 'أ': 'a', 'إ': 'i',
  'آ': 'a', 'ء': 'a', 'ة': 'h',
  // Numbers
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function persianToEnglish(text: string): string {
  return text
    .split('')
    .map((char) => PERSIAN_MAP[char] || char)
    .join('');
}

export function slugify(text: string): string {
  return persianToEnglish(text)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getFirstNChars(text: string, n: number): string {
  const transliterated = persianToEnglish(text);
  return transliterated.slice(0, n);
}
