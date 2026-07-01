const CASE_CODE_PREFIX = "CASE";
const CASE_CODE_SEQUENCE_WIDTH = 4;

const assertValidDate = (date: Date): void => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Case code date must be valid.");
  }
};

export const formatCaseCode = (
  sequence: number,
  date: Date = new Date(),
): string => {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError("Case code sequence must be a positive integer.");
  }

  assertValidDate(date);

  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const paddedSequence = sequence
    .toString()
    .padStart(CASE_CODE_SEQUENCE_WIDTH, "0");

  return `${CASE_CODE_PREFIX}-${year}${month}${day}-${paddedSequence}`;
};

export const getCaseCodeDayRange = (
  date: Date = new Date(),
): { start: Date; end: Date } => {
  assertValidDate(date);

  const start = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};
