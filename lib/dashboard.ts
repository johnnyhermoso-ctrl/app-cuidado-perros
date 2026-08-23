export type DashboardReservation = {
  id: string;
  estado: string;
  fecha_llegada: string | null;
  fecha_salida: string | null;
  total_final: number | null;
  reserva_perros?: { perro_id: string }[] | null;
  pagos?: { importe: number; estado: string }[] | null;
};

export function confirmedPaid(reservation: DashboardReservation) {
  return (reservation.pagos ?? [])
    .filter((payment) => payment.estado === 'confirmado')
    .reduce((total, payment) => total + Number(payment.importe), 0);
}

export function reservationBalance(reservation: DashboardReservation) {
  return Math.max(0, Math.round((Number(reservation.total_final ?? 0) - confirmedPaid(reservation)) * 100) / 100);
}

export function buildOperationalMetrics(reservations: DashboardReservation[], today: string) {
  const active = reservations.filter((reservation) => reservation.estado !== 'cancelada');
  return {
    occupancy: active.filter((reservation) => reservation.estado === 'en_curso').reduce((total, reservation) => total + (reservation.reserva_perros?.length ?? 0), 0),
    arrivals: active.filter((reservation) => reservation.fecha_llegada === today && reservation.estado !== 'finalizada').length,
    departures: active.filter((reservation) => reservation.fecha_salida === today && reservation.estado !== 'finalizada').length,
    openReservations: active.filter((reservation) => ['pendiente', 'confirmada', 'en_curso'].includes(reservation.estado)).length,
    outstanding: active.reduce((total, reservation) => total + reservationBalance(reservation), 0),
  };
}

function monthAtOffset(startMonth: string, offset: number) {
  const [year, month] = startMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildMonthlyForecast(reservations: DashboardReservation[], startMonth: string, count = 3) {
  return Array.from({ length: count }, (_, index) => {
    const month = monthAtOffset(startMonth, index);
    const monthReservations = reservations.filter((reservation) =>
      reservation.estado !== 'cancelada' && reservation.fecha_llegada?.startsWith(month)
    );

    const projected = monthReservations.reduce((total, reservation) => total + Number(reservation.total_final ?? 0), 0);
    const paid = monthReservations.reduce((total, reservation) => total + confirmedPaid(reservation), 0);

    return {
      month,
      projected: Math.round(projected * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      outstanding: Math.max(0, Math.round((projected - paid) * 100) / 100),
      reservations: monthReservations.length,
      dogs: monthReservations.reduce((total, reservation) => total + (reservation.reserva_perros?.length ?? 0), 0),
    };
  });
}
