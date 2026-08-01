'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CalendarReservation, getDaySummary, getMonthGrid } from '@/lib/calendar';
import { StatusMessage } from './StatusMessage';

type ReservationJoin = CalendarReservation & {
  hora_estimada_llegada: string | null;
  hora_estimada_salida: string | null;
  clientes?: { nombre: string; apellidos: string | null } | null;
  servicios?: { nombre: string } | null;
  reserva_perros?: Array<{ perros?: { nombre: string } | null }>;
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

  useEffect(() => {
    async function loadReservations() {
      setLoading(true);
      setError(null);
      const from = days[0].date;
      const to = days[days.length - 1].date;
      const { data, error: queryError } = await supabase
        .from('reservas')
        .select('id,fecha_llegada,fecha_salida,hora_estimada_llegada,hora_estimada_salida,estado,clientes(nombre,apellidos),servicios(nombre),reserva_perros(perros(nombre))')
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
              return (
                <article key={day.date} className={`calendarDay ${day.inCurrentMonth ? '' : 'calendarDayOutside'}`}>
                  <div className="calendarDayHeader">
                    <strong>{day.dayNumber}</strong>
                    {summary.occupied > 0 ? <span className="calendarOccupancy">{summary.occupied} reserva{summary.occupied === 1 ? '' : 's'}</span> : null}
                  </div>
                  {(summary.arrivals > 0 || summary.departures > 0) ? (
                    <div className="calendarMovement">
                      {summary.arrivals > 0 ? <span>↓ {summary.arrivals} entrada{summary.arrivals === 1 ? '' : 's'}</span> : null}
                      {summary.departures > 0 ? <span>↑ {summary.departures} salida{summary.departures === 1 ? '' : 's'}</span> : null}
                    </div>
                  ) : null}
                  <div className="calendarBookings">
                    {summary.reservations.slice(0, 3).map((reservation) => {
                      const joined = reservation as ReservationJoin;
                      const dogs = joined.reserva_perros?.map((item) => item.perros?.nombre).filter(Boolean).join(', ');
                      return (
                        <div className="calendarBooking" key={reservation.id} title={`${joined.clientes?.nombre || 'Cliente'} · ${joined.servicios?.nombre || 'Servicio'}`}>
                          <strong>{dogs || joined.clientes?.nombre || 'Reserva'}</strong>
                          <span>{joined.servicios?.nombre || 'Servicio'} · {joined.estado}</span>
                        </div>
                      );
                    })}
                    {summary.reservations.length > 3 ? <small>+{summary.reservations.length - 3} más</small> : null}
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
