// Date helpers. A dateKey is a UTC day written as '2026-11-15'.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

export function addDays(dateKey: string, days: number): string {
  const d = toDate(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The Monday of the week this day is in.
export function weekStart(dateKey: string): string {
  const weekday = toDate(dateKey).getUTCDay(); // 0 = Sunday
  return addDays(dateKey, -((weekday + 6) % 7));
}

export function weekdayName(dateKey: string): string {
  return WEEKDAYS[toDate(dateKey).getUTCDay()];
}

// 'Nov 15, 2026', or 'Nov 15' with withYear = false.
export function formatDate(dateKey: string, withYear = true): string {
  const d = toDate(dateKey);
  const short = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${short}, ${d.getUTCFullYear()}` : short;
}
