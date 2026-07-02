const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export interface DateRangeInput {
  fromDate?: Date;
  toDate?: Date;
}

export interface DateRange {
  startDate: Date;
  endDateExclusive: Date;
}

export const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );

export const addUtcDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MILLISECONDS_PER_DAY);

export const getServerCalendarDate = (date = new Date()): Date =>
  new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ),
  );

export const getRollingDateRange = (
  input: DateRangeInput,
  defaultDays: number,
  now = new Date(),
): DateRange => {
  const defaultEnd = addUtcDays(startOfUtcDay(now), 1);
  const requestedStart = input.fromDate
    ? startOfUtcDay(input.fromDate)
    : undefined;
  const endDateExclusive = input.toDate
    ? addUtcDays(startOfUtcDay(input.toDate), 1)
    : requestedStart && requestedStart >= defaultEnd
      ? addUtcDays(requestedStart, 1)
      : defaultEnd;
  const startDate =
    requestedStart ??
    addUtcDays(endDateExclusive, -(defaultDays - 1) - 1);

  return {
    startDate,
    endDateExclusive,
  };
};

export const getCalendarMonthRange = (
  input: DateRangeInput,
  defaultMonthCount = 6,
  now = new Date(),
): DateRange => {
  const referenceDate =
    input.toDate ??
    (input.fromDate && input.fromDate > now ? input.fromDate : now);
  const defaultStart = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() - (defaultMonthCount - 1),
      1,
    ),
  );
  const defaultEnd = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() + 1,
      1,
    ),
  );

  return {
    startDate: input.fromDate
      ? startOfUtcDay(input.fromDate)
      : defaultStart,
    endDateExclusive: input.toDate
      ? addUtcDays(startOfUtcDay(input.toDate), 1)
      : defaultEnd,
  };
};

export const toUtcMonthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export const enumerateUtcMonthKeys = (
  range: DateRange,
): string[] => {
  const keys: string[] = [];
  let cursor = new Date(
    Date.UTC(
      range.startDate.getUTCFullYear(),
      range.startDate.getUTCMonth(),
      1,
    ),
  );

  while (cursor < range.endDateExclusive) {
    keys.push(toUtcMonthKey(cursor));
    cursor = new Date(
      Date.UTC(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() + 1,
        1,
      ),
    );
  }

  return keys;
};
