export function calculateStats(walks: any[]) {
  const allWalks = walks ?? [];

  /* -------- TOTAL -------- */
  const totalMinutes = allWalks.reduce((sum, w) => sum + (w.duration || 0), 0);

  const totalWalks = allWalks.length;

  /* -------- AVG PER DAY -------- */
  const uniqueDays = new Set(
    allWalks.map((w) => {
      const d = w.createdAt?.toDate?.();
      return d ? d.toDateString() : null;
    }),
  );

  const avgPerDay =
    uniqueDays.size > 0 ? Math.round(totalMinutes / uniqueDays.size) : 0;

  /* -------- STREAK -------- */
  const daysSet = new Set(
    allWalks.map((w) => {
      const d = w.createdAt?.toDate?.();
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

  /* -------- WEEKLY -------- */
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

  allWalks.forEach((w) => {
    const d = w.createdAt?.toDate?.();
    if (!d) return;

    if (d >= startOfThisWeek && d <= now) {
      thisWeek += w.duration || 0;
    } else if (d >= startOfLastWeek && d < startOfThisWeek) {
      lastWeek += w.duration || 0;
    }
  });

  return {
    totalMinutes,
    avgPerDay,
    totalWalks,
    streak,
    thisWeek,
    lastWeek,
  };
}
