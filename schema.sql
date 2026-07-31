'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type UpcomingBooking = {
  id: string;
  fecha_llegada: string | null;
  hora_estimada_llegada: string | null;
  estado: string;
  clientes?: { nombre: string } | null;
  servicios?: { nombre: string } | null;
};

export function DashboardManager() {
  const [counts, setCounts] = useState({ clientes: 0, perros: 0, reservas: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const today = new Date().toISOString().slice(0, 10);
      const [clientes, perros, reservas, proximas] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('perros').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('reservas').select('*', { count: 'exact', head: true }).in('estado', ['pendiente', 'confirmada', 'en_curso']),
        supabase
          .from('reservas')
          .select('id,fecha_llegada,hora_estimada_llegada,estado,clientes(nombre),servicios(nombre)')
          .gte('fecha_llegada', today)
          .in('estado', ['pendiente', 'confirmada', 'en_curso'])
          .order('fecha_llegada')
          .order('hora_estimada_llegada')
          .limit(5),
      ]);

      const firstError = clientes.error || perros.error || reservas.error || proximas.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setCounts({
          clientes: clientes.count ?? 0,
          perros: perros.count ?? 0,
          reservas: reservas.count ?? 0,
        });
        setUpcoming((proximas.data ?? []) as unknown as UpcomingBooking[]);
      }
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) return <p>Cargando resumen…</p>;
  if (error) return <StatusMessage type="error" message={`No se pudo cargar el resumen: ${error}`} />;

  return (
    <>
      <div className="grid stats">
        <section className="card"><div className="metricLabel">Clientes activos</div><div className="metricValue">{counts.clientes}</div></section>
        <section className="card"><div className="metricLabel">Perros activos</div><div className="metricValue">{counts.perros}</div></section>
        <section className="card"><div className="metricLabel">Reservas abiertas</div><div className="metricValue">{counts.reservas}</div></section>
        <section className="card"><div className="metricLabel">Próximas llegadas</div><div className="metricValue">{upcoming.length}</div></section>
      </div>
      <section className="card">
        <h2>Próximas reservas</h2>
        {upcoming.length === 0 ? <p className="muted">No hay próximas reservas registradas.</p> : null}
        <div className="listStack">
          {upcoming.map((booking) => (
            <article className="listItem" key={booking.id}>
              <div>
                <strong>{booking.clientes?.nombre ?? 'Cliente'} · {booking.servicios?.nombre ?? 'Servicio'}</strong>
                <p>{formatDate(booking.fecha_llegada)} {booking.hora_estimada_llegada?.slice(0, 5) ?? ''}</p>
              </div>
              <span className="pill">{booking.estado}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
