export type CapacityReservation = {
  id: string;
  estado: string;
  fecha_llegada: string | null;
  fecha_salida: string | null;
  reserva_perros?: Array<unknown> | null;
  servicios?: { tipo_unidad_cobro?: string | null } | null;
};

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function occupiedDates(start: string, end: string) {
  if (!start || !end || end <= start) return [];
  const dates: string[] = [];
  for (let date = start; date < end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export function capacityExceededDates(
  reservations: CapacityReservation[],
  start: string,
  end: string,
  newDogCount: number,
  maximum: number,
  editingId?: string | null,
) {
  if (!start || !end || newDogCount <= 0 || maximum <= 0) return [];
  return occupiedDates(start, end).filter((date) => {
    const existingDogs = reservations
      .filter((reservation) => reservation.id !== editingId)
      .filter((reservation) => ['pendiente', 'confirmada', 'en_curso'].includes(reservation.estado))
      .filter((reservation) => reservation.servicios?.tipo_unidad_cobro === 'por_noche')
      .filter((reservation) => Boolean(reservation.fecha_llegada && reservation.fecha_salida && reservation.fecha_llegada <= date && reservation.fecha_salida > date))
      .reduce((total, reservation) => total + (reservation.reserva_perros?.length ?? 0), 0);
    return existingDogs + newDogCount > maximum;
  });
}
