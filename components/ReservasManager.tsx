'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { calculateBillableUnits, calculateNights, calculateSubtotal, formatCurrency, formatDate } from '@/lib/utils';
import { Cliente, Perro, Reserva, Servicio } from '@/lib/types';
import { getReservationActions, getReservationTimestampUpdate, ReservationStatus } from '@/lib/reservation-state';
import { StatusMessage } from './StatusMessage';
import { holidaySurcharge, type Holiday } from '@/lib/holidays';

type ReservaJoin = Reserva & {
  clientes?: Cliente;
  servicios?: Servicio;
  reserva_perros?: Array<{ perro_id: string; perros?: Perro }>;
};

type ApplicableRate = { price: number; origin: 'especial_cliente' | 'general' };

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
  const [applicableRate, setApplicableRate] = useState<ApplicableRate | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayAmount, setHolidayAmount] = useState(2);

  async function loadStaticData() {
    const [{ data: clientesData, error: clientesError }, { data: serviciosData, error: serviciosError }, holidayData, holidayConfig] = await Promise.all([
      supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
      supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
      supabase.from('festivos').select('fecha,activo').eq('activo', true),
      supabase.from('configuracion').select('valor').eq('clave', 'recargo_festivo_alojamiento').maybeSingle(),
    ]);

    if (clientesError || serviciosError) {
      setMessage({ type: 'error', text: clientesError?.message || serviciosError?.message || 'Error cargando datos base.' });
    } else {
      setClientes((clientesData || []) as Cliente[]);
      setServicios((serviciosData || []) as Servicio[]);
      setHolidays((holidayData.data ?? []) as Holiday[]);
      setHolidayAmount(Number(holidayConfig.data?.valor ?? 2));
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
        if (editingId) {
          const current = reservas.find((item) => item.id === editingId);
          setSelectedDogIds(current?.reserva_perros?.map((item) => item.perro_id) ?? []);
        } else setSelectedDogIds([]);
        return;
      }
      const { data, error } = await supabase.from('perros').select('*').eq('cliente_id', form.cliente_id).eq('activo', true).order('nombre');
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setPerrosCliente((data || []) as Perro[]);
        setSelectedDogIds([]);
      }
    }
    loadPerrosByCliente();
  }, [form.cliente_id, editingId, reservas]);

  useEffect(() => {
    let cancelled = false;
    async function loadApplicableRate() {
      if (!form.cliente_id || !form.servicio_id || !form.fecha_llegada) {
        setApplicableRate(null);
        return;
      }
      setRateLoading(true);
      const date = form.fecha_llegada;
      const special = await supabase
        .from('tarifas_especiales_cliente')
        .select('precio_especial')
        .eq('cliente_id', form.cliente_id)
        .eq('servicio_id', form.servicio_id)
        .eq('activa', true)
        .or(`vigencia_desde.is.null,vigencia_desde.lte.${date}`)
        .or(`vigencia_hasta.is.null,vigencia_hasta.gte.${date}`)
        .order('vigencia_desde', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && special.data) {
        setApplicableRate({ price: Number(special.data.precio_especial), origin: 'especial_cliente' });
        setRateLoading(false);
        return;
      }

      const general = await supabase
        .from('tarifas_generales')
        .select('precio_base')
        .eq('servicio_id', form.servicio_id)
        .eq('activa', true)
        .or(`vigencia_desde.is.null,vigencia_desde.lte.${date}`)
        .or(`vigencia_hasta.is.null,vigencia_hasta.gte.${date}`)
        .order('vigencia_desde', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setApplicableRate(general.data ? { price: Number(general.data.precio_base), origin: 'general' } : null);
        setRateLoading(false);
      }
    }
    loadApplicableRate();
    return () => { cancelled = true; };
  }, [form.cliente_id, form.servicio_id, form.fecha_llegada]);

  const nights = useMemo(() => calculateNights(form.fecha_llegada, form.fecha_salida), [form.fecha_llegada, form.fecha_salida]);
  const selectedService = useMemo(() => servicios.find((item) => item.id === form.servicio_id), [servicios, form.servicio_id]);
  const billableUnits = useMemo(
    () => calculateBillableUnits(selectedService?.tipo_unidad_cobro, form.fecha_llegada, form.fecha_salida),
    [selectedService, form.fecha_llegada, form.fecha_salida]
  );
  const provisionalSubtotal = applicableRate ? calculateSubtotal(applicableRate.price, billableUnits, selectedDogIds.length) : 0;
  const holidayPreview = useMemo(() => selectedService?.tipo_unidad_cobro === 'por_noche' ? holidaySurcharge(form.fecha_llegada, form.fecha_salida, holidays, holidayAmount) : { dates: [], count: 0, total: 0 }, [selectedService, form.fecha_llegada, form.fecha_salida, holidays, holidayAmount]);

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
    if (form.fecha_salida && form.fecha_salida < form.fecha_llegada) {
      setMessage({ type: 'error', text: 'La fecha de salida no puede ser anterior a la fecha de llegada.' });
      return;
    }
    if (selectedService?.tipo_unidad_cobro === 'por_noche' && (!form.fecha_salida || form.fecha_salida <= form.fecha_llegada)) {
      setMessage({ type: 'error', text: 'El alojamiento requiere una salida posterior a la llegada.' });
      return;
    }
    if (!applicableRate) {
      setMessage({ type: 'error', text: 'No existe una tarifa activa para el servicio y la fecha seleccionados.' });
      return;
    }
    setSaving(true);
    try {
      const numero_noches = selectedService?.tipo_unidad_cobro === 'por_noche' ? nights : 0;
      const rpc = editingId ? 'actualizar_reserva' : 'crear_reserva';
      const parameters = editingId ? {
        p_reserva_id: editingId, p_cliente_id: form.cliente_id, p_servicio_id: form.servicio_id, p_perro_ids: selectedDogIds,
        p_fecha_llegada: form.fecha_llegada, p_hora_estimada_llegada: form.hora_estimada_llegada,
        p_fecha_salida: form.fecha_salida || null, p_hora_estimada_salida: form.hora_estimada_salida || null, p_observaciones: form.observaciones.trim() || null,
      } : {
        p_cliente_id: form.cliente_id, p_servicio_id: form.servicio_id, p_perro_ids: selectedDogIds, p_estado: form.estado,
        p_fecha_llegada: form.fecha_llegada, p_hora_estimada_llegada: form.hora_estimada_llegada,
        p_fecha_salida: form.fecha_salida || null, p_hora_estimada_salida: form.hora_estimada_salida || null,
        p_observaciones: form.observaciones.trim() || null, p_numero_noches: numero_noches,
      };
      const { error: reservaError } = await supabase.rpc(rpc, parameters);
      if (reservaError) throw reservaError;

      setForm(emptyForm);
      setEditingId(null);
      setSelectedDogIds([]);
      setPerrosCliente([]);
      setMessage({ type: 'success', text: editingId ? 'Reserva actualizada y recalculada correctamente.' : 'Reserva creada correctamente.' });
      await loadReservas();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error guardando reserva.' });
    } finally {
      setSaving(false);
    }
  }

  function editReservation(reservation: ReservaJoin) {
    setEditingId(reservation.id);
    setForm({ cliente_id: reservation.cliente_id, servicio_id: reservation.servicio_id, estado: reservation.estado, fecha_llegada: reservation.fecha_llegada || '', hora_estimada_llegada: reservation.hora_estimada_llegada?.slice(0, 5) || '', fecha_salida: reservation.fecha_salida || '', hora_estimada_salida: reservation.hora_estimada_salida?.slice(0, 5) || '', observaciones: reservation.observaciones || '' });
    setSelectedDogIds(reservation.reserva_perros?.map((item) => item.perro_id) ?? []);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function updateReservationStatus(reservation: ReservaJoin, nextStatus: ReservationStatus) {
    if (nextStatus === 'cancelada' && !window.confirm('¿Confirmas la cancelación? La reserva seguirá visible en el histórico.')) return;
    setUpdatingId(reservation.id);
    setMessage(null);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('reservas')
      .update({ estado: nextStatus, ...getReservationTimestampUpdate(nextStatus, now) })
      .eq('id', reservation.id);

    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: `Reserva actualizada a ${nextStatus.replace('_', ' ')}.` });
      await loadReservas();
    }
    setUpdatingId(null);
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <h2>{editingId ? 'Editar reserva' : 'Nueva reserva'}</h2>
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
            <input type="date" required={selectedService?.tipo_unidad_cobro === 'por_noche'} value={form.fecha_salida} onChange={(e) => setForm({ ...form, fecha_salida: e.target.value })} />
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
            <strong>Resumen económico provisional</strong>
            <p>Tarifa: {rateLoading ? 'Buscando…' : applicableRate ? `${formatCurrency(applicableRate.price)} (${applicableRate.origin === 'especial_cliente' ? 'especial del cliente' : 'general'})` : 'No disponible'}</p>
            <p>Unidades: {billableUnits} · Perros: {selectedDogIds.length}</p>
            <p>Subtotal: <strong>{formatCurrency(provisionalSubtotal)}</strong></p>
            <p>Festivos: {holidayPreview.count} noche(s) · <strong>{formatCurrency(holidayPreview.total)}</strong></p>
            <p>Total previsto: <strong>{formatCurrency(provisionalSubtotal + holidayPreview.total)}</strong></p>
            <p>Sugerencia larga estancia: {nights >= 15 ? 'Sí' : 'No'}</p>
            <p>Sugerencia segundo perro: {selectedDogIds.length > 1 ? 'Sí' : 'No'}</p>
          </div>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar y recalcular' : 'Guardar reserva'}</button>
            {editingId ? <button type="button" className="button secondary" onClick={() => { setEditingId(null); setForm(emptyForm); setSelectedDogIds([]); }}>Cancelar edición</button> : null}
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
                <p>{reserva.tarifa_aplicada != null ? `${formatCurrency(reserva.tarifa_aplicada)} × ${reserva.numero_noches || 1} unidad(es)` : 'Sin tarifa registrada'}</p>
              </div>
              <div className="listItemMeta">
                <span className="pill">{reserva.estado}</span>
                <small>{reserva.numero_noches || 0} noches</small>
                <strong>{formatCurrency(reserva.total_final)}</strong>
                <div className="reservationActions">
                  {['borrador', 'pendiente', 'confirmada', 'en_curso'].includes(reserva.estado) ? <button type="button" className="textButton" onClick={() => editReservation(reserva)}>Editar reserva</button> : null}
                  {getReservationActions(reserva.estado).map((action) => (
                    <button
                      type="button"
                      key={action.nextStatus}
                      className={`textButton ${action.kind === 'danger' ? 'dangerTextButton' : ''}`}
                      disabled={updatingId === reserva.id}
                      onClick={() => updateReservationStatus(reserva, action.nextStatus)}
                    >
                      {updatingId === reserva.id ? 'Actualizando...' : action.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
