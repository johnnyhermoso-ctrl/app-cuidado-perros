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
