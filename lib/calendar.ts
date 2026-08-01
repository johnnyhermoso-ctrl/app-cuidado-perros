export type CalendarReservation = {
  id: string;
  fecha_llegada: string | null;
  fecha_salida: string | null;
  estado: string;
};

export type CalendarDay = {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};

export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    return {
      date: toDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

export function reservationOccupiesDay(reservation: CalendarReservation, date: string) {
  if (!reservation.fecha_llegada || reservation.estado === 'cancelada') return false;
  const departure = reservation.fecha_salida || reservation.fecha_llegada;
  return reservation.fecha_llegada <= date && departure >= date;
}

export function getDaySummary(reservations: CalendarReservation[], date: string) {
  const active = reservations.filter((reservation) => reservationOccupiesDay(reservation, date));
  return {
    reservations: active,
    arrivals: active.filter((reservation) => reservation.fecha_llegada === date).length,
    departures: active.filter((reservation) => reservation.fecha_salida === date).length,
    occupied: active.length,
  };
}
