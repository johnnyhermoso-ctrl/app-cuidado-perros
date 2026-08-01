'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Cliente, Servicio } from '@/lib/types';
import { formatCurrency, formatDate, isValidDateRange } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type SpecialRate = {
  id: string; cliente_id: string; servicio_id: string; precio_especial: number; moneda: string;
  vigencia_desde: string | null; vigencia_hasta: string | null; motivo: string | null; activa: boolean;
  clientes?: Cliente | null; servicios?: Servicio | null;
};

const emptyForm = { cliente_id: '', servicio_id: '', precio_especial: '', vigencia_desde: '', vigencia_hasta: '', motivo: '' };

export function TarifasEspecialesManager() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [services, setServices] = useState<Servicio[]>([]);
  const [rates, setRates] = useState<SpecialRate[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    const [clientResult, serviceResult, rateResult] = await Promise.all([
      supabase.from('clientes').select('*').eq('activo', true).order('nombre'),
      supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
      supabase.from('tarifas_especiales_cliente').select('*, clientes(*), servicios(*)').order('activa', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    const error = clientResult.error || serviceResult.error || rateResult.error;
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setClients((clientResult.data ?? []) as Cliente[]);
      setServices((serviceResult.data ?? []) as Servicio[]);
      setRates((rateResult.data ?? []) as unknown as SpecialRate[]);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const price = Number(form.precio_especial.replace(',', '.'));
    if (!form.cliente_id || !form.servicio_id || !Number.isFinite(price) || price < 0) {
      setMessage({ type: 'error', text: 'Selecciona cliente y servicio e introduce un precio válido.' });
      return;
    }
    if (!isValidDateRange(form.vigencia_desde, form.vigencia_hasta)) {
      setMessage({ type: 'error', text: 'La fecha final no puede ser anterior a la inicial.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('tarifas_especiales_cliente').insert({
      cliente_id: form.cliente_id,
      servicio_id: form.servicio_id,
      precio_especial: price,
      moneda: 'EUR',
      vigencia_desde: form.vigencia_desde || null,
      vigencia_hasta: form.vigencia_hasta || null,
      motivo: form.motivo.trim() || null,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'Tarifa especial creada.' });
      await loadData();
    }
    setSaving(false);
  }

  async function toggleActive(rate: SpecialRate) {
    if (!window.confirm(`¿Quieres ${rate.activa ? 'desactivar' : 'reactivar'} esta tarifa especial?`)) return;
    const { error } = await supabase.from('tarifas_especiales_cliente').update({ activa: !rate.activa }).eq('id', rate.id);
    if (error) setMessage({ type: 'error', text: error.message });
    else await loadData();
  }

  return (
    <section className="card sectionSpacing">
      <h2>Tarifas especiales por cliente</h2>
      <p className="muted">Tienen prioridad sobre la tarifa general. Para conservar el histórico, desactiva una tarifa y crea otra en lugar de sobrescribirla.</p>
      <form className="formGrid" onSubmit={handleSubmit}>
        <label>Cliente *<select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}><option value="">Selecciona</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nombre} {client.apellidos ?? ''}</option>)}</select></label>
        <label>Servicio *<select value={form.servicio_id} onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}><option value="">Selecciona</option>{services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}</select></label>
        <label>Precio especial (€) *<input type="number" min="0" step="0.01" value={form.precio_especial} onChange={(e) => setForm({ ...form, precio_especial: e.target.value })} /></label>
        <label>Vigente desde<input type="date" value={form.vigencia_desde} onChange={(e) => setForm({ ...form, vigencia_desde: e.target.value })} /></label>
        <label>Vigente hasta<input type="date" value={form.vigencia_hasta} onChange={(e) => setForm({ ...form, vigencia_hasta: e.target.value })} /></label>
        <label className="full">Motivo<input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="ej. Cliente habitual" /></label>
        <div className="full actionsRow"><button className="button primary" disabled={saving}>{saving ? 'Guardando…' : 'Crear tarifa especial'}</button></div>
        {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
      </form>
      <div className="listStack sectionSpacing">
        {rates.map((rate) => (
          <article className={`listItem ${rate.activa ? '' : 'inactiveItem'}`} key={rate.id}>
            <div><strong>{rate.clientes?.nombre} · {rate.servicios?.nombre}</strong><p>{formatCurrency(rate.precio_especial, rate.moneda)} · {rate.motivo || 'Sin motivo'}</p><small>{rate.vigencia_desde ? formatDate(rate.vigencia_desde) : 'Sin inicio'} → {rate.vigencia_hasta ? formatDate(rate.vigencia_hasta) : 'Sin fin'}</small></div>
            <div className="itemActions"><span className="pill">{rate.activa ? 'Activa' : 'Inactiva'}</span><button className="textButton" onClick={() => toggleActive(rate)}>{rate.activa ? 'Desactivar' : 'Reactivar'}</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
