'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { buildMonthlyForecast, buildOperationalMetrics, reservationBalance, type DashboardReservation } from '@/lib/dashboard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { reservationDogNames, reservationOwnerName } from '@/lib/reservation-labels';
import { StatusMessage } from './StatusMessage';

type Booking = Omit<DashboardReservation, 'reserva_perros'> & {
  hora_estimada_llegada: string | null;
  clientes?: { nombre: string; apellidos?: string | null } | null;
  servicios?: { nombre: string } | null;
  reserva_perros?: { perro_id: string; perros?: { nombre: string } | null }[] | null;
};

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function monthBounds(today: string) {
  const [year, month] = today.split('-').map(Number);
  return { start: `${year}-${String(month).padStart(2, '0')}-01`, next: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10) };
}

function forecastMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function DashboardManager() {
  const [counts, setCounts] = useState({ clientes: 0, perros: 0 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incomeThisMonth, setIncomeThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(localDate, []);
  const currentMonth = today.slice(0, 7);
  const [forecastStart, setForecastStart] = useState(currentMonth);

  useEffect(() => {
    async function loadDashboard() {
      const { start, next } = monthBounds(today);
      const [clientes, perros, reservas, pagos] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('perros').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('reservas').select('id,estado,fecha_llegada,hora_estimada_llegada,fecha_salida,total_final,clientes(nombre,apellidos),servicios(nombre),reserva_perros(perro_id,perros(nombre)),pagos(importe,estado)').neq('estado', 'cancelada').order('fecha_llegada').order('hora_estimada_llegada'),
        supabase.from('pagos').select('importe').eq('estado', 'confirmado').gte('fecha_pago', start).lt('fecha_pago', next),
      ]);
      const firstError = clientes.error || perros.error || reservas.error || pagos.error;
      if (firstError) setError(firstError.message);
      else {
        setCounts({ clientes: clientes.count ?? 0, perros: perros.count ?? 0 });
        setBookings((reservas.data ?? []) as unknown as Booking[]);
        setIncomeThisMonth((pagos.data ?? []).reduce((total, payment) => total + Number(payment.importe), 0));
      }
      setLoading(false);
    }
    loadDashboard();
  }, [today]);

  const metrics = useMemo(() => buildOperationalMetrics(bookings, today), [bookings, today]);
  const upcoming = useMemo(() => bookings.filter((booking) => booking.fecha_llegada && booking.fecha_llegada >= today && ['pendiente', 'confirmada'].includes(booking.estado)).slice(0, 6), [bookings, today]);
  const pendingPayments = useMemo(() => bookings.filter((booking) => reservationBalance(booking) > 0).sort((a, b) => reservationBalance(b) - reservationBalance(a)).slice(0, 5), [bookings]);
  const monthlyForecast = useMemo(() => buildMonthlyForecast(bookings, forecastStart), [bookings, forecastStart]);

  function updateForecastStart(value: string) {
    setForecastStart(value || currentMonth);
  }

  if (loading) return <p>Cargando resumen…</p>;
  if (error) return <StatusMessage type="error" message={`No se pudo cargar el resumen: ${error}`} />;

  return (
    <>
      <div className="dashboardActions">
        <Link className="button primary" href="/reservas/">Nueva reserva</Link>
        <Link className="button secondary" href="/cobros/">Registrar cobro</Link>
        <Link className="button secondary" href="/calendario/">Ver calendario</Link>
      </div>
      <div className="grid stats dashboardStats">
        <Metric label="Perros alojados hoy" value={String(metrics.occupancy)} note="Reservas actualmente en curso" />
        <Metric label="Entradas de hoy" value={String(metrics.arrivals)} note="Llegadas pendientes o en curso" accent="accentGreen" />
        <Metric label="Salidas de hoy" value={String(metrics.departures)} note="Check-outs previstos" accent="accentOrange" />
        <Metric label="Ingresos del mes" value={formatCurrency(incomeThisMonth)} note="Pagos confirmados" accent="accentPurple" small />
      </div>
      <div className="grid stats dashboardStats secondaryStats">
        <MiniMetric label="Saldo pendiente" value={formatCurrency(metrics.outstanding)} />
        <MiniMetric label="Reservas abiertas" value={String(metrics.openReservations)} />
        <MiniMetric label="Clientes activos" value={String(counts.clientes)} />
        <MiniMetric label="Perros activos" value={String(counts.perros)} />
      </div>
      <section className="card monthlyForecast">
        <div className="forecastHeader">
          <div>
            <h2>Previsión mensual</h2>
            <p className="muted">Importes de las reservas agrupados por mes de entrada.</p>
          </div>
          <div className="forecastFilter">
            <label>Consultar desde
              <input type="month" min={currentMonth} value={forecastStart} onInput={(event) => updateForecastStart(event.currentTarget.value)} onChange={(event) => updateForecastStart(event.target.value)} />
            </label>
            {forecastStart !== currentMonth ? <button type="button" className="button secondary" onClick={() => setForecastStart(currentMonth)}>Próximos 3 meses</button> : null}
          </div>
        </div>
        <div className="forecastGrid">
          {monthlyForecast.map((month) => (
            <article className="forecastMonth" key={month.month}>
              <span className="forecastMonthLabel">{forecastMonthLabel(month.month)}</span>
              <strong className="forecastTotal">{formatCurrency(month.projected)}</strong>
              <small>{month.reservations} reserva{month.reservations === 1 ? '' : 's'} · {month.dogs} perro{month.dogs === 1 ? '' : 's'}</small>
              <div className="forecastBreakdown"><span>Cobrado</span><strong>{formatCurrency(month.paid)}</strong></div>
              <div className="forecastBreakdown"><span>Pendiente</span><strong>{formatCurrency(month.outstanding)}</strong></div>
            </article>
          ))}
        </div>
      </section>
      <div className="grid twoCols dashboardColumns">
        <section className="card">
          <div className="cardHeaderInline"><h2>Próximas reservas</h2><Link className="textButton" href="/calendario/">Calendario</Link></div>
          {upcoming.length === 0 ? <p className="muted">No hay próximas reservas registradas.</p> : null}
          <div className="listStack">{upcoming.map((booking) => <article className="listItem" key={booking.id}><div><strong>{reservationDogNames(booking)}</strong><p>{formatDate(booking.fecha_llegada)} {booking.hora_estimada_llegada?.slice(0, 5) ?? ''} · {booking.servicios?.nombre ?? 'Servicio'}</p><small>Dueño: {reservationOwnerName(booking)}</small></div><span className={`pill state-${booking.estado}`}>{booking.estado.replace('_', ' ')}</span></article>)}</div>
        </section>
        <section className="card">
          <div className="cardHeaderInline"><h2>Cobros pendientes</h2><Link className="textButton" href="/cobros/">Gestionar</Link></div>
          {pendingPayments.length === 0 ? <p className="muted">No hay saldos pendientes.</p> : null}
          <div className="listStack">{pendingPayments.map((booking) => <article className="listItem" key={booking.id}><div><strong>{reservationDogNames(booking)}</strong><p>Dueño: {reservationOwnerName(booking)} · {booking.servicios?.nombre ?? 'Servicio'}</p><small>{formatDate(booking.fecha_llegada)} · Total {formatCurrency(Number(booking.total_final ?? 0))}</small></div><strong className="balanceDue">{formatCurrency(reservationBalance(booking))}</strong></article>)}</div>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, note, accent = '', small = false }: { label: string; value: string; note: string; accent?: string; small?: boolean }) {
  return <section className={`card metricCard ${accent}`}><div className="metricLabel">{label}</div><div className={`metricValue ${small ? 'smallMetric' : ''}`}>{value}</div><small>{note}</small></section>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <section className="card"><div className="metricLabel">{label}</div><div className="metricValue smallMetric">{value}</div></section>;
}
