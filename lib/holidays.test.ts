import { describe, expect, it } from 'vitest';
import { holidayDatesInStay, holidaySurcharge } from './holidays';

const holidays = [{ fecha: '2026-08-15', activo: true }, { fecha: '2026-08-16', activo: false }, { fecha: '2026-08-17', activo: true }];

describe('recargo de festivos', () => {
  it('cuenta la llegada pero no el día de salida', () => {
    expect(holidayDatesInStay('2026-08-15', '2026-08-17', holidays)).toEqual(['2026-08-15']);
  });

  it('calcula un importe por noche festiva y por reserva', () => {
    expect(holidaySurcharge('2026-08-14', '2026-08-18', holidays, 2)).toEqual({ dates: ['2026-08-15', '2026-08-17'], count: 2, total: 4 });
  });
});
