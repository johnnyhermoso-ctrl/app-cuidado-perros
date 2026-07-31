'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Servicio, TarifaGeneral } from '@/lib/types';
import { formatCurrency, formatDate, isValidDateRange } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type RateWithService = TarifaGeneral & { servicios?: Servicio | null };
const emptyForm = {
  servicio_id: '', nombre_tarifa: '', precio_base: '', vigencia_desde: '', vigencia_hasta: '', observaciones: '',
};

export function TarifasManager() {
  const [services, setServices] = useState<Servicio[]>([]);
  const [rates, setRates] = useState<RateWithService[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    const [servicesResult, ratesResult] = await Promise.all([
      supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
      supabase.from('tarifas_generales').select('*, servicios(*)').order('activa', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    const error = servicesResult.error || ratesResult.error;
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setServices((servicesResult.data ?? []) as Servicio[]);
      setRates((ratesResult.data ?? []) as unknown as RateWithService[]);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(rate: RateWithService) {
    setEditingId(rate.id);
    setForm({
      servicio_id: rate.servicio_id,
      nombre_tarifa: rate.nombre_tarifa ?? '',
      precio_base: String(rate.precio_base),
      vigencia_desde: rate.vigencia_desde ?? '',
      vigencia_hasta: rate.vigencia_hasta ?? '',
      observaciones: rate.observaciones ?? '',
    });
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const price = Number(form.precio_base.replace(',', '.'));
    if (!form.servicio_id || !Number.isFinite(price) || price < 0) {
      setMessage({ type: 'error', text: 'Selecciona un servicio e introduce un precio válido.' });
      return;
    }
    if (!isValidDateRange(form.vigencia_desde, form.vigencia_hasta)) {
      setMessage({ type: 'error', text: 'La fecha final no puede ser anterior a la inicial.' });
      return;
    }

    setSaving(true);
    const payload = {
      servicio_id: form.servicio_id,
      nombre_tarifa: form.nombre_tarifa.trim() || null,
      precio_base: price,
      moneda: 'EUR',
      vigencia_desde: form.vigencia_desde || null,
      vigencia_hasta: form.vigencia_hasta || null,
      observaciones: form.observaciones.trim() || null,
    };
    const result = editingId
      ? await supabase.from('tarifas_generales').update(payload).eq('id', editingId)
      : await supabase.from('tarifas_generales').insert(payload);
    if (result.error) setMessage({ type: 'error', text: result.error.message });
    else {
      resetForm();
      setMessage({ type: 'success', text: editingId ? 'Tarifa actualizada.' : 'Tarifa creada.' });
      await loadData();
    }
    setSaving(false);
  }

  async function toggleActive(rate: RateWithService) {
    const action = rate.activa ? 'desactivar' : 'reactivar';
    if (!window.confirm(`¿Quieres ${action} esta tarifa?`)) return;
    const { error } = await supabase.from('tarifas_generales').update({ activa: !rate.activa }).eq('id', rate.id);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: `Tarifa ${rate.activa ? 'desactivada' : 'reactivada'}.` });
      await loadData();
    }
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <h2>{editingId ? 'Editar tarifa' : 'Nueva tarifa general'}</h2>
        <form className="formGrid" onSubmit={handleSubmit}>
          <label>Servicio *
            <select value={form.servicio_id} onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}>
              <option value="">Selecciona un servicio</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}
            </select>
          </label>
          <label>Nombre de tarifa<input value={form.nombre_tarifa} onChange={(e) => setForm({ ...form, nombre_tarifa: e.target.value })} placeholder="ej. Tarifa estándar" /></label>
          <label>Precio (€) *<input type="number" min="0" step="0.01" value={form.precio_base} onChange={(e) => setForm({ ...form, precio_base: e.target.value })} /></label>
          <label>Vigente desde<input type="date" value={form.vigencia_desde} onChange={(e) => setForm({ ...form, vigencia_desde: e.target.value })} /></label>
          <label>Vigente hasta<input type="date" value={form.vigencia_hasta} onChange={(e) => setForm({ ...form, vigencia_hasta: e.target.value })} /></label>
          <label className="full">Observaciones<textarea rows={3} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></label>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear tarifa'}</button>
            {editingId ? <button type="button" className="button secondary" onClick={resetForm}>Cancelar</button> : null}
          </div>
          {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </form>
      </section>

      <section className="card">
        <h2>Tarifas configuradas</h2>
        {loading ? <p>Cargando tarifas…</p> : null}
        {!loading && rates.length === 0 ? <p className="muted">Todavía no hay tarifas.</p> : null}
        <div className="listStack">
          {rates.map((rate) => (
            <article className={`listItem ${rate.activa ? '' : 'inactiveItem'}`} key={rate.id}>
              <div>
                <strong>{rate.servicios?.nombre ?? 'Servicio'} · {formatCurrency(rate.precio_base, rate.moneda)}</strong>
                <p>{rate.nombre_tarifa || 'Tarifa general'}</p>
                <small>{rate.vigencia_desde ? `Desde ${formatDate(rate.vigencia_desde)}` : 'Sin fecha inicial'} · {rate.vigencia_hasta ? `Hasta ${formatDate(rate.vigencia_hasta)}` : 'Sin fecha final'}</small>
              </div>
              <div className="itemActions">
                <span className="pill">{rate.activa ? 'Activa' : 'Inactiva'}</span>
                <button className="textButton" onClick={() => startEdit(rate)}>Editar</button>
                <button className="textButton" onClick={() => toggleActive(rate)}>{rate.activa ? 'Desactivar' : 'Reactivar'}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
