import { describe, expect, it } from 'vitest';
import { groupReservations } from './reservation-groups';

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
});
