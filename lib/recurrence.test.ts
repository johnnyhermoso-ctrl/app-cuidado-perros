import { describe, expect, it } from 'vitest';
import { addMonthsIso, buildRecurrenceDates, recurrenceAppliesOn } from './recurrence';

describe('recurrencias', () => {
  it('genera de lunes a viernes sin fines de semana', () => {
    expect(buildRecurrenceDates('2026-09-21', '2026-09-27', 'diaria', [1, 2, 3, 4, 5])).toEqual([
      '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
    ]);
  });

  it('respeta el ciclo de cada dos semanas', () => {
    expect(recurrenceAppliesOn('2026-09-21', '2026-09-21', 'cada_2_semanas', [1])).toBe(true);
    expect(recurrenceAppliesOn('2026-09-28', '2026-09-21', 'cada_2_semanas', [1])).toBe(false);
    expect(recurrenceAppliesOn('2026-10-05', '2026-09-21', 'cada_2_semanas', [1])).toBe(true);
  });

  it('calcula horizontes mensuales sin desbordar el último día', () => {
    expect(addMonthsIso('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsIso('2026-09-21', 3)).toBe('2026-12-21');
  });
});
