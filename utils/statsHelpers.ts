export function calculateStats<T>(
  items: T[],
  getValue: (item: T) => number,
  getDate: (item: T) => Date | null,
) {
  const allItems = items ?? [];

  /* -------- TOTAL -------- */
  const total = allItems.reduce((sum, item) => sum + (getValue(item) || 0), 0);

  const totalCount = allItems.length;

  /* -------- UNIQUE DAYS -------- */
  const uniqueDays = new Set(
    allItems.map((item) => {
      const d = getDate(item);
      return d ? d.toDateString() : null;
    }),
  );

  const avgPerDay =
    uniqueDays.size > 0 ? Math.round(total / uniqueDays.size) : 0;

  /* -------- STREAK -------- */
  const daysSet = new Set(
    allItems.map((item) => {
      const d = getDate(item);
      return d ? d.toDateString() : null;
    }),
  );

  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const key = currentDate.toDateString();

    if (daysSet.has(key)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  /* -------- WEEK -------- */
  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();

    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);

    d.setHours(0, 0, 0, 0);
    return d;
  }

  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  let thisWeek = 0;
  let lastWeek = 0;

  allItems.forEach((item) => {
    const d = getDate(item);
    if (!d) return;

    if (d >= startOfThisWeek && d <= now) {
      thisWeek += getValue(item) || 0;
    } else if (d >= startOfLastWeek && d < startOfThisWeek) {
      lastWeek += getValue(item) || 0;
    }
  });

  return {
    total,
    avgPerDay,
    totalCount,
    streak,
    thisWeek,
    lastWeek,
  };
}
