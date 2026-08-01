export type ReservationStatus = 'borrador' | 'pendiente' | 'confirmada' | 'en_curso' | 'finalizada' | 'cancelada';

export type ReservationAction = {
  label: string;
  nextStatus: ReservationStatus;
  kind: 'normal' | 'danger';
};

const transitions: Record<ReservationStatus, ReservationAction[]> = {
  borrador: [
    { label: 'Confirmar', nextStatus: 'confirmada', kind: 'normal' },
    { label: 'Cancelar', nextStatus: 'cancelada', kind: 'danger' },
  ],
  pendiente: [
    { label: 'Confirmar', nextStatus: 'confirmada', kind: 'normal' },
    { label: 'Cancelar', nextStatus: 'cancelada', kind: 'danger' },
  ],
  confirmada: [
    { label: 'Registrar check-in', nextStatus: 'en_curso', kind: 'normal' },
    { label: 'Cancelar', nextStatus: 'cancelada', kind: 'danger' },
  ],
  en_curso: [
    { label: 'Finalizar / check-out', nextStatus: 'finalizada', kind: 'normal' },
  ],
  finalizada: [],
  cancelada: [],
};

export function getReservationActions(status: string): ReservationAction[] {
  return transitions[status as ReservationStatus] || [];
}

export function getReservationTimestampUpdate(nextStatus: ReservationStatus, now: string) {
  if (nextStatus === 'en_curso') return { checkin_real_at: now };
  if (nextStatus === 'finalizada') return { checkout_real_at: now };
  return {};
}
