export function dateShift(dateUtc: Date | null, minutesAdd: number): Date {
  if (dateUtc === null) {
    return new Date();
  }

  if (minutesAdd === 0) {
    return dateUtc;
  }

  const utcMillis = dateUtc.getTime();
  const localMillis = utcMillis + minutesAdd * 60 * 1000;
  return new Date(localMillis);
}
