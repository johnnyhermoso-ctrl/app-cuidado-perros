import { describe, expect, it } from 'vitest';
import { calculateBillableUnits, calculateNights, calculateSubtotal, formatCurrency, formatDate, isValidDateRange } from './utils';

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

describe('tarifas', () => {
  it('valida el periodo de vigencia', () => {
    expect(isValidDateRange('2026-01-01', '2026-12-31')).toBe(true);
    expect(isValidDateRange('2026-12-31', '2026-01-01')).toBe(false);
    expect(isValidDateRange('2026-01-01', null)).toBe(true);
  });

  it('formatea importes en euros', () => {
    expect(formatCurrency(25)).toContain('25,00');
  });

  it('calcula unidades según el servicio', () => {
    expect(calculateBillableUnits('por_noche', '2026-08-01', '2026-08-04')).toBe(3);
    expect(calculateBillableUnits('por_dia', '2026-08-01', '2026-08-01')).toBe(1);
    expect(calculateBillableUnits('por_dia', '2026-08-01', '2026-08-03')).toBe(3);
    expect(calculateBillableUnits('por_servicio', '2026-08-01')).toBe(1);
  });

  it('calcula subtotal por unidades y perros', () => {
    expect(calculateSubtotal(20, 3, 2)).toBe(120);
  });
});
