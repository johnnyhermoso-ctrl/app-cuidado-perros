export type GroupableReservation = {
  id: string;
  ocurrencia_recurrente_id?: string | null;
  ocurrencias_recurrentes?: { serie_id: string } | null;
};

export type ReservationGroup<T extends GroupableReservation> = {
  key: string;
  seriesId: string | null;
  reservations: T[];
};

export function groupReservations<T extends GroupableReservation>(reservations: T[]): ReservationGroup<T>[] {
  const groups = new Map<string, ReservationGroup<T>>();
  for (const reservation of reservations) {
    const seriesId = reservation.ocurrencias_recurrentes?.serie_id ?? null;
    const key = seriesId ? `series:${seriesId}` : `reservation:${reservation.id}`;
    const group = groups.get(key) ?? { key, seriesId, reservations: [] };
    group.reservations.push(reservation);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function compareReservationsNewestFirst(
  a: { fecha_llegada: string | null; hora_estimada_llegada?: string | null },
  b: { fecha_llegada: string | null; hora_estimada_llegada?: string | null }
) {
  const aDateTime = a.fecha_llegada ? `${a.fecha_llegada}T${a.hora_estimada_llegada ?? ''}` : '';
  const bDateTime = b.fecha_llegada ? `${b.fecha_llegada}T${b.hora_estimada_llegada ?? ''}` : '';
  return bDateTime.localeCompare(aDateTime);
}
