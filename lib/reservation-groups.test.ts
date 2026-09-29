import { describe, expect, it } from 'vitest';
import { compareReservationsNewestFirst, groupReservations } from './reservation-groups';

describe('agrupación de reservas', () => {
  it('agrupa por serie y conserva las reservas puntuales independientes', () => {
    const groups = groupReservations([
      { id: 'uno', ocurrencias_recurrentes: { serie_id: 'serie-a' } },
      { id: 'puntual' },
      { id: 'dos', ocurrencias_recurrentes: { serie_id: 'serie-a' } },
      { id: 'tres', ocurrencias_recurrentes: { serie_id: 'serie-b' } },
    ]);
    expect(groups.map((group) => group.reservations.map((item) => item.id))).toEqual([['uno', 'dos'], ['puntual'], ['tres']]);
  });

  it('ordena los paseos por fecha y hora, del más reciente al más viejo', () => {
    const reservations = [
      { id: 'mañana', fecha_llegada: '2026-09-29', hora_estimada_llegada: '09:00' },
      { id: 'ayer', fecha_llegada: '2026-09-28', hora_estimada_llegada: '18:00' },
      { id: 'tarde', fecha_llegada: '2026-09-29', hora_estimada_llegada: '18:00' },
      { id: 'sin-fecha', fecha_llegada: null, hora_estimada_llegada: null },
    ];
    expect([...reservations].sort(compareReservationsNewestFirst).map((item) => item.id)).toEqual(['tarde', 'mañana', 'ayer', 'sin-fecha']);
  });
});
