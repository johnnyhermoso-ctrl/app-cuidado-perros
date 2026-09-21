'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { addMonthsIso, buildRecurrenceDates, frequencyLabel, RecurrenceFrequency } from '@/lib/recurrence';
import { Cliente, Perro, SerieRecurrente, Servicio, TurnoRecurrente } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type TurnForm = { key: string; nombre: string; hora_inicio: string; hora_fin: string };
type Occurrence = {
  id: string;
  fecha: string;
  estado: string;
  omitida: boolean;
  motivo_omision: string | null;
  modificada_individualmente: boolean;
  turno_id: string;
  turnos_recurrentes?: TurnoRecurrente | null;
  reservas?: Array<{ id: string; estado: string; total_final: number | null }> | { id: string; estado: string; total_final: number | null } | null;
};
type SeriesJoin = SerieRecurrente & {
  clientes?: Pick<Cliente, 'nombre' | 'apellidos'> | null;
  servicios?: Pick<Servicio, 'nombre'> | null;
  serie_recurrente_perros?: Array<{ perro_id: string; perros?: Pick<Perro, 'nombre'> | null }>;
  turnos_recurrentes?: TurnoRecurrente[];
  ocurrencias_recurrentes?: Occurrence[];
};

const weekDays = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' }, { value: 5, label: 'Vie' }, { value: 6, label: 'Sáb' }, { value: 7, label: 'Dom' },
];

function localToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function defaultTurns(): TurnForm[] {
  return [
    { key: crypto.randomUUID(), nombre: 'Mañana', hora_inicio: '09:00', hora_fin: '10:00' },
    { key: crypto.randomUUID(), nombre: 'Mediodía', hora_inicio: '14:00', hora_fin: '15:00' },
    { key: crypto.randomUUID(), nombre: 'Tarde', hora_inicio: '19:00', hora_fin: '20:00' },
  ];
}

function reservationFromOccurrence(occurrence: Occurrence) {
  if (Array.isArray(occurrence.reservas)) return occurrence.reservas[0] ?? null;
  return occurrence.reservas ?? null;
}

export function RecurrenciasManager() {
  const today = useMemo(localToday, []);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [services, setServices] = useState<Servicio[]>([]);
  const [dogs, setDogs] = useState<Perro[]>([]);
  const [series, setSeries] = useState<SeriesJoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    nombre: '', cliente_id: '', servicio_id: '', fecha_inicio: today, fecha_fin: '',
    frecuencia: 'diaria' as RecurrenceFrequency, dias_semana: [1, 2, 3, 4, 5] as number[],
    perro_ids: [] as string[], observaciones: '', turnos: defaultTurns(),
  });

  async function loadBaseData() {
    const [clientResult, serviceResult] = await Promise.all([
      supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
      supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
    ]);
    const error = clientResult.error || serviceResult.error;
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    const availableServices = (serviceResult.data ?? []) as Servicio[];
    setClients((clientResult.data ?? []) as Cliente[]);
    setServices(availableServices);
    const walk = availableServices.find((service) => service.codigo === 'paseo');
    if (walk) setForm((current) => ({ ...current, servicio_id: current.servicio_id || walk.id }));
  }

  async function loadSeries(extend = true) {
    setLoading(true);
    if (extend) {
      const extension = await supabase.rpc('materializar_series_activas');
      if (extension.error && !extension.error.message.includes('Could not find the function')) {
        setMessage({ type: 'error', text: `No se pudieron ampliar las recurrencias: ${extension.error.message}` });
      }
    }
    const { data, error } = await supabase
      .from('series_recurrentes')
      .select('*, clientes(nombre,apellidos), servicios(nombre), serie_recurrente_perros(perro_id,perros(nombre)), turnos_recurrentes(*), ocurrencias_recurrentes(*,turnos_recurrentes(*),reservas(id,estado,total_final))')
      .order('created_at', { ascending: false });
    if (error) setMessage({ type: 'error', text: error.message });
    else setSeries((data ?? []) as unknown as SeriesJoin[]);
    setLoading(false);
  }

  useEffect(() => {
    loadBaseData();
    loadSeries();
  }, []);

  useEffect(() => {
    async function loadDogs() {
      if (!form.cliente_id) {
        setDogs([]);
        setForm((current) => ({ ...current, perro_ids: [] }));
        return;
      }
      const { data, error } = await supabase.from('perros').select('*').eq('cliente_id', form.cliente_id).eq('activo', true).order('nombre');
      if (error) setMessage({ type: 'error', text: error.message });
      else setDogs((data ?? []) as Perro[]);
    }
    loadDogs();
  }, [form.cliente_id]);

  const preview = useMemo(() => {
    const horizon = form.fecha_fin && form.fecha_fin < addMonthsIso(form.fecha_inicio, 3)
      ? form.fecha_fin : addMonthsIso(form.fecha_inicio, 3);
    const dates = buildRecurrenceDates(form.fecha_inicio, horizon, form.frecuencia, form.dias_semana);
    return { until: horizon, events: dates.length * form.turnos.length, days: dates.length };
  }, [form]);

  function toggleWeekday(day: number) {
    setForm((current) => ({
      ...current,
      dias_semana: current.dias_semana.includes(day)
        ? current.dias_semana.filter((value) => value !== day)
        : [...current.dias_semana, day].sort(),
    }));
  }

  function updateTurn(key: string, field: keyof Omit<TurnForm, 'key'>, value: string) {
    setForm((current) => ({
      ...current,
      turnos: current.turnos.map((turn) => turn.key === key ? { ...turn, [field]: value } : turn),
    }));
  }

  function resetForm() {
    const walk = services.find((service) => service.codigo === 'paseo');
    setForm({
      nombre: '', cliente_id: '', servicio_id: walk?.id ?? '', fecha_inicio: today, fecha_fin: '',
      frecuencia: 'diaria', dias_semana: [1, 2, 3, 4, 5], perro_ids: [], observaciones: '', turnos: defaultTurns(),
    });
    setDogs([]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!form.cliente_id || !form.servicio_id || form.perro_ids.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona cliente, servicio y al menos un perro.' }); return;
    }
    if (form.dias_semana.length === 0 || form.turnos.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un día y añade al menos un turno.' }); return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setMessage({ type: 'error', text: 'La fecha final no puede ser anterior a la inicial.' }); return;
    }
    if (form.turnos.some((turn) => !turn.nombre.trim() || !turn.hora_inicio || (turn.hora_fin && turn.hora_fin <= turn.hora_inicio))) {
      setMessage({ type: 'error', text: 'Revisa los nombres y horarios. La hora final debe ser posterior a la inicial.' }); return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc('crear_serie_recurrente', {
      p_cliente_id: form.cliente_id,
      p_servicio_id: form.servicio_id,
      p_perro_ids: form.perro_ids,
      p_nombre: form.nombre.trim() || null,
      p_fecha_inicio: form.fecha_inicio,
      p_fecha_fin: form.fecha_fin || null,
      p_frecuencia: form.frecuencia,
      p_dias_semana: form.dias_semana,
      p_turnos: form.turnos.map((turn, index) => ({
        nombre: turn.nombre.trim(), hora_inicio: turn.hora_inicio, hora_fin: turn.hora_fin || null, orden: index + 1,
      })),
      p_observaciones: form.observaciones.trim() || null,
    });
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error.message }); return;
    }
    const result = data as { ocurrencias_creadas?: number } | null;
    setMessage({ type: 'success', text: `Recurrencia creada con ${result?.ocurrencias_creadas ?? preview.events} paseos programados.` });
    resetForm();
    setFormOpen(false);
    await loadSeries(false);
  }

  async function changeOccurrence(occurrence: Occurrence, action: 'omitir' | 'restaurar') {
    const prompt = action === 'omitir' ? '¿Omitir únicamente este paseo? No se cobrará.' : '¿Restaurar este paseo?';
    if (!window.confirm(prompt)) return;
    setUpdatingId(occurrence.id);
    const rpc = action === 'omitir' ? 'omitir_ocurrencia_recurrente' : 'restaurar_ocurrencia_recurrente';
    const { error } = await supabase.rpc(rpc, { p_ocurrencia_id: occurrence.id, ...(action === 'omitir' ? { p_motivo: 'Omitida manualmente' } : {}) });
    setUpdatingId(null);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: action === 'omitir' ? 'Paseo omitido. El resto de la serie no cambia.' : 'Paseo restaurado.' });
      await loadSeries(false);
    }
  }

  async function finishSeries(item: SeriesJoin) {
    if (!window.confirm('¿Finalizar esta recurrencia después de hoy? Los paseos futuros se omitirán y los anteriores conservarán su historial.')) return;
    setUpdatingId(item.id);
    const { error } = await supabase.rpc('finalizar_serie_recurrente', { p_serie_id: item.id, p_ultima_fecha: today });
    setUpdatingId(null);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Recurrencia finalizada.' });
      await loadSeries(false);
    }
  }

  return (
    <div className="grid recurrenceLayout">
      {message ? <StatusMessage type={message.type} message={message.text} /> : null}

      <section className="card">
        <div className="cardHeaderInline">
          <div><h2>Planes recurrentes</h2><p className="muted">Cada evento se guarda también como una reserva independiente.</p></div>
          <button type="button" className="button primary" onClick={() => setFormOpen((open) => !open)}>{formOpen ? 'Cerrar' : '+ Nueva recurrencia'}</button>
        </div>

        {formOpen ? (
          <form className="recurrenceForm" onSubmit={submit}>
            <div className="formGrid">
              <label>Nombre del plan<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Paseos diarios de Luna" /></label>
              <label>Cliente *<select value={form.cliente_id} onChange={(event) => setForm({ ...form, cliente_id: event.target.value })}><option value="">Selecciona</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nombre} {client.apellidos ?? ''}</option>)}</select></label>
              <label>Servicio *<select value={form.servicio_id} onChange={(event) => setForm({ ...form, servicio_id: event.target.value })}><option value="">Selecciona</option>{services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}</select></label>
              <label>Frecuencia *<select value={form.frecuencia} onChange={(event) => setForm({ ...form, frecuencia: event.target.value as RecurrenceFrequency })}><option value="diaria">Diaria</option><option value="semanal">Semanal</option><option value="cada_2_semanas">Cada 2 semanas</option></select></label>
              <label>Fecha inicial *<input type="date" value={form.fecha_inicio} onChange={(event) => setForm({ ...form, fecha_inicio: event.target.value })} required /></label>
              <label>Fecha final <input type="date" min={form.fecha_inicio} value={form.fecha_fin} onChange={(event) => setForm({ ...form, fecha_fin: event.target.value })} /><small className="muted">Déjala vacía si no tiene fin.</small></label>
              <div className="full"><strong>Perros *</strong><div className="checkboxList">{dogs.length === 0 ? <span className="muted">Selecciona primero un cliente.</span> : dogs.map((dog) => <label className="checkboxItem" key={dog.id}><input type="checkbox" checked={form.perro_ids.includes(dog.id)} onChange={(event) => setForm({ ...form, perro_ids: event.target.checked ? [...form.perro_ids, dog.id] : form.perro_ids.filter((id) => id !== dog.id) })} />{dog.nombre}</label>)}</div></div>
              <div className="full"><strong>Días *</strong><div className="weekdaySelector">{weekDays.map((day) => <label className={form.dias_semana.includes(day.value) ? 'weekday active' : 'weekday'} key={day.value}><input type="checkbox" checked={form.dias_semana.includes(day.value)} onChange={() => toggleWeekday(day.value)} />{day.label}</label>)}</div><small className="muted">De lunes a viernes aparecen seleccionados por defecto.</small></div>
              <label className="full">Observaciones<textarea rows={2} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
            </div>

            <div className="turnHeader"><div><h3>Turnos del día</h3><p className="muted">Cada turno generará un paseo independiente.</p></div><button type="button" className="button secondary" onClick={() => setForm((current) => ({ ...current, turnos: [...current.turnos, { key: crypto.randomUUID(), nombre: 'Nuevo turno', hora_inicio: '', hora_fin: '' }] }))}>+ Añadir turno</button></div>
            <div className="turnList">{form.turnos.map((turn) => <div className="turnRow" key={turn.key}><label>Nombre<input value={turn.nombre} onChange={(event) => updateTurn(turn.key, 'nombre', event.target.value)} /></label><label>Inicio<input type="time" value={turn.hora_inicio} onChange={(event) => updateTurn(turn.key, 'hora_inicio', event.target.value)} /></label><label>Fin<input type="time" value={turn.hora_fin} onChange={(event) => updateTurn(turn.key, 'hora_fin', event.target.value)} /></label><button type="button" className="textButton dangerTextButton" disabled={form.turnos.length === 1} onClick={() => setForm((current) => ({ ...current, turnos: current.turnos.filter((item) => item.key !== turn.key) }))}>Quitar</button></div>)}</div>

            <div className="recurrencePreview"><strong>Vista previa de los primeros 3 meses</strong><span>{preview.days} días · {form.turnos.length} turno(s) · <strong>{preview.events} paseos</strong></span><small>Se generarán hasta el {formatDate(preview.until)} y se ampliarán automáticamente al volver a esta sección.</small></div>
            <div className="actionsRow"><button className="button primary" disabled={saving}>{saving ? 'Creando…' : 'Crear recurrencia'}</button><button type="button" className="button secondary" onClick={resetForm}>Restablecer</button></div>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Recurrencias configuradas</h2>
        {loading ? <p>Cargando recurrencias…</p> : null}
        {!loading && series.length === 0 ? <p className="muted">Todavía no hay recurrencias.</p> : null}
        <div className="recurrenceSeriesList">{series.map((item) => {
          const dogNames = item.serie_recurrente_perros?.map((link) => link.perros?.nombre).filter(Boolean).join(', ') || 'Sin perro';
          const owner = `${item.clientes?.nombre ?? ''} ${item.clientes?.apellidos ?? ''}`.trim();
          const turns = [...(item.turnos_recurrentes ?? [])].sort((a, b) => a.orden - b.orden);
          const occurrences = [...(item.ocurrencias_recurrentes ?? [])]
            .filter((occurrence) => occurrence.fecha >= today)
            .sort((a, b) => `${a.fecha}${a.turnos_recurrentes?.hora_inicio ?? ''}`.localeCompare(`${b.fecha}${b.turnos_recurrentes?.hora_inicio ?? ''}`));
          return <article className={item.estado === 'finalizada' ? 'recurrenceSeries inactiveItem' : 'recurrenceSeries'} key={item.id}>
            <div className="recurrenceSeriesHeader"><div><div className="seriesTitle"><strong>{dogNames} · {item.nombre || item.servicios?.nombre || 'Recurrencia'}</strong><span className={item.estado === 'activa' ? 'pill state-confirmada' : 'pill'}>{item.estado}</span></div><p>Dueño: {owner} · {frequencyLabel(item.frecuencia)} · {item.dias_semana_iso.map((day) => weekDays.find((item) => item.value === day)?.label).join(', ')}</p><small>{formatDate(item.fecha_inicio)} → {item.fecha_fin ? formatDate(item.fecha_fin) : 'sin fecha final'} · generado hasta {item.materializada_hasta ? formatDate(item.materializada_hasta) : 'pendiente'}</small></div>{item.estado === 'activa' ? <button type="button" className="textButton dangerTextButton" disabled={updatingId === item.id} onClick={() => finishSeries(item)}>Finalizar serie</button> : null}</div>
            <div className="turnPills">{turns.map((turn) => <span className="pill" key={turn.id}>{turn.nombre} · {turn.hora_inicio.slice(0, 5)}{turn.hora_fin ? `–${turn.hora_fin.slice(0, 5)}` : ''}</span>)}</div>
            <details className="occurrenceDetails"><summary>Próximos paseos ({occurrences.length})</summary><div className="occurrenceList">{occurrences.slice(0, 15).map((occurrence) => {
              const reservation = reservationFromOccurrence(occurrence);
              return <div className={occurrence.omitida ? 'occurrenceRow omitted' : 'occurrenceRow'} key={occurrence.id}><div><strong>{formatDate(occurrence.fecha)} · {occurrence.turnos_recurrentes?.nombre ?? 'Turno'} · {occurrence.turnos_recurrentes?.hora_inicio?.slice(0, 5)}</strong><small>{occurrence.omitida ? `Omitido${occurrence.motivo_omision ? `: ${occurrence.motivo_omision}` : ''}` : `${reservation?.estado ?? 'programada'} · ${formatCurrency(reservation?.total_final ?? 0)}`}{occurrence.modificada_individualmente ? ' · modificado individualmente' : ''}</small></div><div className="occurrenceActions">{reservation ? <Link className="textButton" href={`/reservas/?reserva=${reservation.id}`}>Abrir</Link> : null}<button type="button" className={occurrence.omitida ? 'textButton' : 'textButton dangerTextButton'} disabled={updatingId === occurrence.id} onClick={() => changeOccurrence(occurrence, occurrence.omitida ? 'restaurar' : 'omitir')}>{occurrence.omitida ? 'Restaurar' : 'Omitir'}</button></div></div>;
            })}{occurrences.length > 15 ? <small className="muted">Se muestran los próximos 15 de {occurrences.length} eventos.</small> : null}</div></details>
          </article>;
        })}</div>
      </section>
    </div>
  );
}
