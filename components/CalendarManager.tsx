'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { buildReservationHueMap, CalendarReservation, getDaySummary, getMonthGrid } from '@/lib/calendar';
import { reservationDogNames, reservationOwnerName } from '@/lib/reservation-labels';
import { groupReservations } from '@/lib/reservation-groups';
import { StatusMessage } from './StatusMessage';

type ReservationJoin = CalendarReservation & {
  ocurrencia_recurrente_id?: string | null;
  ocurrencias_recurrentes?: { serie_id: string } | null;
  hora_estimada_llegada: string | null;
  hora_estimada_salida: string | null;
  clientes?: { nombre: string; apellidos: string | null } | null;
  servicios?: { nombre: string } | null;
  reserva_perros?: Array<{ perros?: { id: string; nombre: string } | null }>;
};

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function monthLabel(date: Date) {
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CalendarManager() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reservations, setReservations] = useState<ReservationJoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(
    () => getMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );
  const reservationHues = useMemo(
    () => buildReservationHueMap(reservations.map((reservation) => reservation.id)),
    [reservations]
  );

  useEffect(() => {
    async function loadReservations() {
      setLoading(true);
      setError(null);
      const from = days[0].date;
      const to = days[days.length - 1].date;
      const { data, error: queryError } = await supabase
        .from('reservas')
        .select('id,fecha_llegada,fecha_salida,hora_estimada_llegada,hora_estimada_salida,estado,ocurrencia_recurrente_id,ocurrencias_recurrentes(serie_id),clientes(nombre,apellidos),servicios(nombre),reserva_perros(perros(id,nombre))')
        .neq('estado', 'cancelada')
        .lte('fecha_llegada', to)
        .or(`fecha_salida.is.null,fecha_salida.gte.${from}`)
        .order('fecha_llegada')
        .order('hora_estimada_llegada');

      if (queryError) setError(queryError.message);
      else setReservations((data || []) as unknown as ReservationJoin[]);
      setLoading(false);
    }

    loadReservations();
  }, [days]);

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <section className="card calendarCard">
      <div className="calendarToolbar">
        <div>
          <h2>{monthLabel(visibleMonth)}</h2>
          <p className="muted">Las reservas canceladas no cuentan como ocupación.</p>
        </div>
        <div className="calendarActions">
          <button type="button" className="button secondary" onClick={() => changeMonth(-1)} aria-label="Mes anterior">←</button>
          <button type="button" className="button secondary" onClick={goToToday}>Hoy</button>
          <button type="button" className="button secondary" onClick={() => changeMonth(1)} aria-label="Mes siguiente">→</button>
        </div>
      </div>

      {error ? <StatusMessage type="error" message={`No se pudo cargar el calendario: ${error}`} /> : null}
      {loading ? <p>Cargando calendario...</p> : null}

      {!loading && !error ? (
        <div className="calendarViewport">
          <div className="calendarGrid calendarWeekHeader">
            {weekDays.map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="calendarGrid calendarDays">
            {days.map((day) => {
              const summary = getDaySummary(reservations, day.date);
              const dogCount = (items: CalendarReservation[]) => new Set(items.flatMap((reservation) =>
                ((reservation as ReservationJoin).reserva_perros ?? []).map((link) => link.perros?.id).filter(Boolean)
              )).size;
              const occupiedDogs = dogCount(summary.reservations);
              const arrivingDogs = dogCount(summary.reservations.filter((reservation) => reservation.fecha_llegada === day.date));
              const departingDogs = dogCount(summary.reservations.filter((reservation) => reservation.fecha_salida === day.date));
              const groups = groupReservations(summary.reservations as ReservationJoin[]);
              const singleBookings = groups.filter((group) => !group.seriesId);
              const recurringBookings = groups.filter((group) => group.seriesId);
              return (
                <article key={day.date} className={`calendarDay ${day.inCurrentMonth ? '' : 'calendarDayOutside'}`}>
                  <div className="calendarDayHeader">
                    <strong>{day.dayNumber}</strong>
                    {occupiedDogs > 0 ? <span className="calendarOccupancy" aria-label={`${occupiedDogs} perro${occupiedDogs === 1 ? '' : 's'}`}><span>{occupiedDogs}</span><span className="calendarOccupancyLabel"> perro{occupiedDogs === 1 ? '' : 's'}</span></span> : null}
                  </div>
                  {(arrivingDogs > 0 || departingDogs > 0) ? (
                    <div className="calendarMovement">
                      {arrivingDogs > 0 ? <span>↓ {arrivingDogs} entrada{arrivingDogs === 1 ? '' : 's'}</span> : null}
                      {departingDogs > 0 ? <span>↑ {departingDogs} salida{departingDogs === 1 ? '' : 's'}</span> : null}
                    </div>
                  ) : null}
                  <div className="calendarBookings">
                    {singleBookings.slice(0, 3).map((group) => {
                      const joined = group.reservations[0];
                      const reservation = joined;
                      const dogs = reservationDogNames(joined);
                      const owner = reservationOwnerName(joined);
                      const hue = reservationHues.get(reservation.id) ?? 220;
                      return (
                        <Link
                          href={`/reservas/?reserva=${reservation.id}`}
                          className="calendarBooking"
                          key={reservation.id}
                          title={`Abrir reserva de ${dogs} · Dueño: ${owner} · ${joined.servicios?.nombre || 'Servicio'}`}
                          style={{ backgroundColor: `hsl(${hue} 78% 95%)`, borderLeftColor: `hsl(${hue} 68% 42%)`, color: `hsl(${hue} 62% 30%)` }}
                        >
                          <strong>{dogs}</strong>
                          <span>Dueño: {owner}</span>
                          <span>{joined.servicios?.nombre || 'Servicio'} · {joined.estado}</span>
                        </Link>
                      );
                    })}
                    {recurringBookings.map((group) => {
                      const first = group.reservations[0];
                      const dogs = reservationDogNames(first);
                      const times = group.reservations.map((item) => item.hora_estimada_llegada?.slice(0, 5)).filter(Boolean).join(', ');
                      return <Link key={group.key} className="calendarBooking calendarSeriesBooking" href={`/reservas/?serie=${group.seriesId}`} title={`${dogs} · ${group.reservations.length} paseos · ${times}`}>
                        <strong>🔁 {dogs} ×{group.reservations.length}</strong><span>{times || first.servicios?.nombre || 'Paseos'}</span>
                      </Link>;
                    })}
                    {singleBookings.length > 3 ? <small>+{singleBookings.length - 3} reservas más</small> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
