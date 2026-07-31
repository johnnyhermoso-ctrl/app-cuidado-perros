import { describe, expect, it } from 'vitest';
import { calculateNights, formatDate } from './utils';

describe('calculateNights', () => {
  it('calcula noches sin verse afectado por el cambio horario', () => {
    expect(calculateNights('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('rechaza periodos invertidos o iguales', () => {
    expect(calculateNights('2026-08-10', '2026-08-10')).toBe(0);
    expect(calculateNights('2026-08-11', '2026-08-10')).toBe(0);
  });
});

describe('formatDate', () => {
  it('formatea una fecha SQL sin conversión de zona horaria', () => {
    expect(formatDate('2026-07-31')).toBe('31/07/2026');
  });
});
