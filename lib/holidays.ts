export type Holiday = { fecha: string; activo?: boolean };

export function holidayDatesInStay(startDate: string, endDate: string, holidays: Holiday[]) {
  if (!startDate || !endDate || endDate <= startDate) return [];
  return holidays
    .filter((holiday) => holiday.activo !== false && holiday.fecha >= startDate && holiday.fecha < endDate)
    .map((holiday) => holiday.fecha)
    .sort();
}

export function holidaySurcharge(startDate: string, endDate: string, holidays: Holiday[], amountPerNight: number) {
  const dates = holidayDatesInStay(startDate, endDate, holidays);
  return { dates, count: dates.length, total: Math.round(dates.length * Math.max(0, amountPerNight) * 100) / 100 };
}
