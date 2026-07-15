import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

// Jalali calendar conversion
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = 0;
  let jm = 0;
  let jd = 0;

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];

  jy = -1595 + 33 * Math.floor(days / 12053);
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

function formatJalali(dateStr: string): string {
  if (!dateStr) return "-";

  // If already in Jalali format (YYYY/MM/DD), return as-is
  if (/^\d{4}\/\d{2}\/\d{2}/.test(dateStr)) {
    // Just extract the date part without time
    const datePart = dateStr.split(" ")[0];
    return datePart;
  }

  // Try to parse as Date
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const [jy, jm, jd] = gregorianToJalali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${jy}/${pad(jm)}/${pad(jd)}`;
  } catch {
    return dateStr;
  }
}

interface PersianDateProps {
  value?: string | null;
  style?: React.CSSProperties;
}

export const PersianDate: React.FC<PersianDateProps> = ({ value, style }) => {
  const formatted = formatJalali(value || "");

  return (
    <Text style={{ fontSize: 14, ...style }}>
      {formatted}
    </Text>
  );
};

export { formatJalali, gregorianToJalali };
