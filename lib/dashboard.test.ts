import { describe, expect, it } from 'vitest';
import { buildOperationalMetrics, confirmedPaid, reservationBalance, type DashboardReservation } from './dashboard';

const reservations: DashboardReservation[] = [
  { id: '1', estado: 'en_curso', fecha_llegada: '2026-08-01', fecha_salida: '2026-08-02', total_final: 100, reserva_perros: [{ perro_id: 'a' }, { perro_id: 'b' }], pagos: [{ importe: 40, estado: 'confirmado' }] },
  { id: '2', estado: 'confirmada', fecha_llegada: '2026-08-01', fecha_salida: '2026-08-01', total_final: 50, reserva_perros: [{ perro_id: 'c' }], pagos: [{ importe: 50, estado: 'anulado' }] },
  { id: '3', estado: 'cancelada', fecha_llegada: '2026-08-01', fecha_salida: '2026-08-01', total_final: 500, reserva_perros: [{ perro_id: 'd' }], pagos: [] },
];

describe('dashboard operativo', () => {
  it('solo suma pagos confirmados y nunca devuelve saldo negativo', () => {
    expect(confirmedPaid(reservations[0])).toBe(40);
    expect(reservationBalance(reservations[0])).toBe(60);
    expect(reservationBalance({ ...reservations[0], total_final: 20 })).toBe(0);
  });

  it('calcula ocupación, movimientos y saldos sin incluir cancelaciones', () => {
    expect(buildOperationalMetrics(reservations, '2026-08-01')).toEqual({ occupancy: 2, arrivals: 2, departures: 1, openReservations: 2, outstanding: 110 });
  });
});
