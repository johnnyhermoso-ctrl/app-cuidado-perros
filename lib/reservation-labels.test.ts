import { describe, expect, it } from 'vitest';
import { reservationDogNames, reservationOwnerName } from './reservation-labels';

describe('reservation labels', () => {
  it('uses dogs as the primary reservation identity', () => {
    const reservation = {
      clientes: { nombre: 'José', apellidos: 'García' },
      reserva_perros: [{ perros: { nombre: 'Luna' } }, { perros: { nombre: 'Toby' } }],
    };

    expect(reservationDogNames(reservation)).toBe('Luna, Toby');
    expect(reservationOwnerName(reservation)).toBe('José García');
  });

  it('provides clear fallbacks for incomplete historical data', () => {
    expect(reservationDogNames({ reserva_perros: [] })).toBe('Sin perro asignado');
    expect(reservationOwnerName({ clientes: null })).toBe('Cliente sin nombre');
  });
});
