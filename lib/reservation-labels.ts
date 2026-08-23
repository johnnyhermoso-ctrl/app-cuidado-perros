type ReservationIdentity = {
  clientes?: { nombre?: string | null; apellidos?: string | null } | null;
  reserva_perros?: Array<{ perros?: { nombre?: string | null } | null }> | null;
};

export function reservationDogNames(reservation: ReservationIdentity) {
  const names = reservation.reserva_perros
    ?.map((item) => item.perros?.nombre?.trim())
    .filter((name): name is string => Boolean(name));

  return names?.length ? names.join(', ') : 'Sin perro asignado';
}

export function reservationOwnerName(reservation: ReservationIdentity) {
  const name = [reservation.clientes?.nombre, reservation.clientes?.apellidos]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return name || 'Cliente sin nombre';
}
