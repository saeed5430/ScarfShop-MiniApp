const TEHRAN_OFFSET = 3 * 60 * 60 + 30 * 60; // UTC+3:30

export function unixToJalali(unix: number): string {
  const tehranUnix = unix + TEHRAN_OFFSET;
  const date = new Date(tehranUnix * 1000);
  const jDate = g2j(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');

  return `${jDate[0]}/${String(jDate[1]).padStart(2, '0')}/${String(jDate[2]).padStart(2, '0')} ${h}:${m}:${s}`;
}

function g2j(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = 0;
  let jm = 0;
  let jd = 0;

  let gy2 = (gm > 2) ? gy + 1 : gy;
  let days = 355666 + (365 * gy2) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];

  jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return [jy, jm, jd];
}

export function nowJalali(): string {
  return unixToJalali(Math.floor(Date.now() / 1000));
}
