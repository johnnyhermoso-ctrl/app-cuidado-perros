'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { calculateNights, formatDate } from '@/lib/utils';
import { Cliente, Perro, Reserva, Servicio } from '@/lib/types';
import { StatusMessage } from './StatusMessage';

type ReservaJoin = Reserva & {
  clientes?: Cliente;
  servicios?: Servicio;
  reserva_perros?: Array<{ perro_id: string; perros?: Perro }>;
};

const emptyForm = {
  cliente_id: '',
  servicio_id: '',
  estado: 'pendiente',
  fecha_llegada: '',
  hora_estimada_llegada: '',
  fecha_salida: '',
  hora_estimada_salida: '',
  observaciones: '',
};

export function ReservasManager() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [perrosCliente, setPerrosCliente] = useState<Perro[]>([]);
  const [reservas, setReservas] = useState<ReservaJoin[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadStaticData() {
    const [{ data: clientesData, error: clientesError }, { data: serviciosData, error: serviciosError }] = await Promise.all([
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('servicios').select('id,codigo,nombre').eq('activo', true).order('nombre'),
    ]);

    if (clientesError || serviciosError) {
      setMessage({ type: 'error', text: clientesError?.message || serviciosError?.message || 'Error cargando datos base.' });
    } else {
      setClientes((clientesData || []) as Cliente[]);
      setServicios((serviciosData || []) as Servicio[]);
    }
  }

  async function loadReservas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('*, clientes(*), servicios(*), reserva_perros(perro_id, perros(*))')
      .order('created_at', { ascending: false });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setReservas((data || []) as any);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStaticData();
    loadReservas();
  }, []);

  useEffect(() => {
    async function loadPerrosByCliente() {
      if (!form.cliente_id) {
        setPerrosCliente([]);
        setSelectedDogIds([]);
        return;
      }
      const { data, error } = await supabase.from('perros').select('*').eq('cliente_id', form.cliente_id).order('nombre');
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setPerrosCliente((data || []) as Perro[]);
        setSelectedDogIds([]);
      }
    }
    loadPerrosByCliente();
  }, [form.cliente_id]);

  const nights = useMemo(() => calculateNights(form.fecha_llegada, form.fecha_salida), [form.fecha_llegada, form.fecha_salida]);

  function toggleDog(id: string) {
    setSelectedDogIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form.cliente_id || !form.servicio_id || selectedDogIds.length === 0) {
      setMessage({ type: 'error', text: 'Debes seleccionar cliente, servicio y al menos un perro.' });
      return;
    }
    if (!form.fecha_llegada || !form.hora_estimada_llegada) {
      setMessage({ type: 'error', text: 'La fecha y hora estimada de llegada son obligatorias.' });
      return;
    }
    setSaving(true);
    try {
      const servicio = servicios.find((item) => item.id === form.servicio_id);
      const numero_noches = servicio?.codigo === 'alojamiento' ? nights : 0;
      const { data: reservaData, error: reservaError } = await supabase
        .from('reservas')
        .insert({
          cliente_id: form.cliente_id,
          servicio_id: form.servicio_id,
          estado: form.estado,
          fecha_llegada: form.fecha_llegada,
          hora_estimada_llegada: form.hora_estimada_llegada,
          fecha_salida: form.fecha_salida || null,
          hora_estimada_salida: form.hora_estimada_salida || null,
          observaciones: form.observaciones.trim() || null,
          numero_noches,
          sugerir_descuento_larga_estancia: numero_noches >= 15,
          sugerir_descuento_segundo_perro: selectedDogIds.length > 1,
        })
        .select('id')
        .single();

      if (reservaError) throw reservaError;

      const links = selectedDogIds.map((perroId, index) => ({
        reserva_id: reservaData.id,
        perro_id: perroId,
        orden_en_reserva: index + 1,
      }));

      const { error: dogsError } = await supabase.from('reserva_perros').insert(links);
      if (dogsError) throw dogsError;

      setForm(emptyForm);
      setSelectedDogIds([]);
      setPerrosCliente([]);
      setMessage({ type: 'success', text: 'Reserva creada correctamente.' });
      await loadReservas();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error guardando reserva.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <h2>Nueva reserva</h2>
        <form onSubmit={handleSubmit} className="formGrid">
          <label>
            Cliente *
            <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellidos || ''}</option>
              ))}
            </select>
          </label>
          <label>
            Servicio *
            <select value={form.servicio_id} onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}>
              <option value="">Selecciona un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En curso</option>
            </select>
          </label>
          <div className="full">
            <label>Perros *</label>
            <div className="checkboxList">
              {perrosCliente.length === 0 ? <p className="muted">Selecciona un cliente para ver sus perros.</p> : null}
              {perrosCliente.map((perro) => (
                <label key={perro.id} className="checkboxItem">
                  <input type="checkbox" checked={selectedDogIds.includes(perro.id)} onChange={() => toggleDog(perro.id)} />
                  <span>{perro.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <label>
            Fecha llegada *
            <input type="date" value={form.fecha_llegada} onChange={(e) => setForm({ ...form, fecha_llegada: e.target.value })} />
          </label>
          <label>
            Hora estimada llegada *
            <input type="time" value={form.hora_estimada_llegada} onChange={(e) => setForm({ ...form, hora_estimada_llegada: e.target.value })} />
          </label>
          <label>
            Fecha salida
            <input type="date" value={form.fecha_salida} onChange={(e) => setForm({ ...form, fecha_salida: e.target.value })} />
          </label>
          <label>
            Hora estimada salida
            <input type="time" value={form.hora_estimada_salida} onChange={(e) => setForm({ ...form, hora_estimada_salida: e.target.value })} />
          </label>
          <label className="full">
            Observaciones
            <textarea rows={4} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </label>
          <div className="full summaryBox">
            <strong>Resumen automático</strong>
            <p>Noches calculadas: {nights}</p>
            <p>Sugerencia larga estancia: {nights >= 15 ? 'Sí' : 'No'}</p>
            <p>Sugerencia segundo perro: {selectedDogIds.length > 1 ? 'Sí' : 'No'}</p>
          </div>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar reserva'}</button>
          </div>
          {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </form>
      </section>

      <section className="card">
        <h2>Reservas</h2>
        {loading ? <p>Cargando reservas...</p> : null}
        {!loading && reservas.length === 0 ? <p>No hay reservas todavía.</p> : null}
        <div className="listStack">
          {reservas.map((reserva) => (
            <article key={reserva.id} className="listItem">
              <div>
                <strong>{reserva.clientes?.nombre || 'Cliente'} · {reserva.servicios?.nombre || 'Servicio'}</strong>
                <p>
                  {formatDate(reserva.fecha_llegada)} {reserva.hora_estimada_llegada || ''}
                  {reserva.fecha_salida ? ` → ${formatDate(reserva.fecha_salida)} ${reserva.hora_estimada_salida || ''}` : ''}
                </p>
                <small>
                  Perros: {reserva.reserva_perros?.map((item) => item.perros?.nombre).filter(Boolean).join(', ') || '—'}
                </small>
              </div>
              <div className="listItemMeta">
                <span className="pill">{reserva.estado}</span>
                <small>{reserva.numero_noches || 0} noches</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
