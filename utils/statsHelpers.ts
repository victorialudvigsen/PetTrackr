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

/* -------- FOOD -------- */
export function calculateFoodStats(entries: any[]) {
  const all = entries ?? [];

  let totalGrams = 0;
  let totalMeals = 0;
  let totalTreats = 0;
  let totalBones = 0;

  /* -------- TOTAL -------- */
  all.forEach((e) => {
    if (e.type === "meal") {
      totalMeals++;
      totalGrams += e.grams ?? 0;
    } else if (e.type === "treat") {
      totalTreats += e.count ?? 0;
    } else if (e.type === "bone") {
      totalBones += e.count ?? 0;
    }
  });

  /* -------- UNIQUE DAYS -------- */
  const uniqueDays = new Set(
    all.map((e) => {
      const d = e.createdAt?.toDate?.();
      return d ? d.toDateString() : null;
    }),
  );

  const daysCount = uniqueDays.size || 1;

  /* -------- AVERAGE -------- */
  const avgGramsPerDay = Math.round(totalGrams / daysCount);
  const avgTreatsPerDay = Math.round(totalTreats / daysCount);
  const avgBonesPerDay = Math.round(totalBones / daysCount);

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
  const startOfWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  let thisWeekGrams = 0;
  let thisWeekTreats = 0;
  let thisWeekBones = 0;

  let lastWeekGrams = 0;
  let lastWeekTreats = 0;
  let lastWeekBones = 0;

  all.forEach((e) => {
    const d = e.createdAt?.toDate?.();
    if (!d) return;

    // THIS WEEK
    if (d >= startOfWeek && d <= now) {
      if (e.type === "meal") {
        thisWeekGrams += e.grams ?? 0;
      } else if (e.type === "treat") {
        thisWeekTreats += e.count ?? 0;
      } else if (e.type === "bone") {
        thisWeekBones += e.count ?? 0;
      }
    }

    // LAST WEEK
    else if (d >= startOfLastWeek && d < startOfWeek) {
      if (e.type === "meal") {
        lastWeekGrams += e.grams ?? 0;
      } else if (e.type === "treat") {
        lastWeekTreats += e.count ?? 0;
      } else if (e.type === "bone") {
        lastWeekBones += e.count ?? 0;
      }
    }
  });

  return {
    totalGrams,
    totalMeals,
    totalTreats,
    totalBones,

    thisWeekGrams,
    thisWeekTreats,
    thisWeekBones,

    avgGramsPerDay,
    avgTreatsPerDay,
    avgBonesPerDay,

    lastWeekGrams,
    lastWeekTreats,
    lastWeekBones,
  };
}

/* -------- WEEK -------- */
export function getFoodWeekData(entries: any[]) {
  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const start = getStartOfWeek(new Date());

  const days: {
    label: string;
    date: Date;
    grams: number;
    treats: number;
    bones: number;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d,
      grams: 0,
      treats: 0,
      bones: 0,
    });
  }

  entries.forEach((e) => {
    const d = e.createdAt?.toDate?.();
    if (!d) return;

    days.forEach((day) => {
      if (d.toDateString() === day.date.toDateString()) {
        if (e.type === "meal") {
          day.grams += e.grams || 0;
        } else if (e.type === "treat") {
          day.treats += e.count || 0;
        } else if (e.type === "bone") {
          day.bones += e.count || 0;
        }
      }
    });
  });

  return days;
}
