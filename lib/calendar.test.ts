import { describe, expect, it } from 'vitest';
import { getDaySummary, getMonthGrid, reservationOccupiesDay, toDateKey } from './calendar';

const reservation = {
  id: 'r1',
  fecha_llegada: '2026-08-10',
  fecha_salida: '2026-08-13',
  estado: 'confirmada',
};

describe('calendar helpers', () => {
  it('formats local date keys without timezone conversion', () => {
    expect(toDateKey(2026, 7, 3)).toBe('2026-08-03');
  });

  it('builds a six-week grid starting on Monday', () => {
    const grid = getMonthGrid(2026, 7);
    expect(grid).toHaveLength(42);
    expect(grid[0].date).toBe('2026-07-27');
    expect(grid[41].date).toBe('2026-09-06');
  });

  it('includes arrival, intermediate and departure days', () => {
    expect(reservationOccupiesDay(reservation, '2026-08-10')).toBe(true);
    expect(reservationOccupiesDay(reservation, '2026-08-12')).toBe(true);
    expect(reservationOccupiesDay(reservation, '2026-08-13')).toBe(true);
    expect(reservationOccupiesDay(reservation, '2026-08-14')).toBe(false);
  });

  it('excludes cancelled reservations', () => {
    expect(reservationOccupiesDay({ ...reservation, estado: 'cancelada' }, '2026-08-11')).toBe(false);
  });

  it('counts arrivals, departures and occupied reservations', () => {
    const second = { ...reservation, id: 'r2', fecha_llegada: '2026-08-08', fecha_salida: '2026-08-10' };
    expect(getDaySummary([reservation, second], '2026-08-10')).toMatchObject({ arrivals: 1, departures: 1, occupied: 2 });
  });
});
