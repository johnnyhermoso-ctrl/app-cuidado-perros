import { describe, expect, it } from 'vitest';
import { capacityExceededDates, occupiedDates } from './capacity';

describe('occupiedDates', () => {
  it('considera noches y excluye el día de salida', () => {
    expect(occupiedDates('2026-08-10', '2026-08-13')).toEqual(['2026-08-10', '2026-08-11', '2026-08-12']);
  });
});

describe('capacityExceededDates', () => {
  const reservations = [{
    id: 'existing', estado: 'confirmada', fecha_llegada: '2026-08-10', fecha_salida: '2026-08-13',
    reserva_perros: [{}, {}, {}], servicios: { tipo_unidad_cobro: 'por_noche' },
  }];

  it('detalla únicamente los días que superarían el máximo', () => {
    expect(capacityExceededDates(reservations, '2026-08-09', '2026-08-12', 2, 4)).toEqual(['2026-08-10', '2026-08-11']);
  });

  it('excluye la propia reserva al editar', () => {
    expect(capacityExceededDates(reservations, '2026-08-10', '2026-08-13', 3, 4, 'existing')).toEqual([]);
  });

  it('ignora reservas canceladas', () => {
    expect(capacityExceededDates([{ ...reservations[0], estado: 'cancelada' }], '2026-08-10', '2026-08-11', 4, 4)).toEqual([]);
  });
});
