import { describe, expect, it } from 'vitest';
import { getReservationActions, getReservationTimestampUpdate } from './reservation-state';

describe('reservation state workflow', () => {
  it('permite confirmar o cancelar una reserva pendiente', () => {
    expect(getReservationActions('pendiente').map((action) => action.nextStatus)).toEqual(['confirmada', 'cancelada']);
  });

  it('permite check-in únicamente desde confirmada', () => {
    expect(getReservationActions('confirmada').map((action) => action.nextStatus)).toContain('en_curso');
    expect(getReservationActions('pendiente').map((action) => action.nextStatus)).not.toContain('en_curso');
  });

  it('permite finalizar únicamente una reserva en curso', () => {
    expect(getReservationActions('en_curso').map((action) => action.nextStatus)).toEqual(['finalizada']);
    expect(getReservationActions('finalizada')).toEqual([]);
    expect(getReservationActions('cancelada')).toEqual([]);
  });

  it('registra las marcas de tiempo de check-in y check-out', () => {
    const now = '2026-08-01T12:00:00.000Z';
    expect(getReservationTimestampUpdate('en_curso', now)).toEqual({ checkin_real_at: now });
    expect(getReservationTimestampUpdate('finalizada', now)).toEqual({ checkout_real_at: now });
    expect(getReservationTimestampUpdate('cancelada', now)).toEqual({});
  });
});
