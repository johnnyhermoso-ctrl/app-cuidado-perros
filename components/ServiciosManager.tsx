'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Servicio } from '@/lib/types';
import { StatusMessage } from './StatusMessage';

const emptyForm = { codigo: '', nombre: '', descripcion: '', tipo_unidad_cobro: 'por_servicio' };
const unitLabels: Record<string, string> = {
  por_noche: 'Por noche',
  por_dia: 'Por día',
  por_servicio: 'Por servicio',
  por_trayecto: 'Por trayecto',
};

export function ServiciosManager() {
  const [services, setServices] = useState<Servicio[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadServices() {
    setLoading(true);
    const { data, error } = await supabase.from('servicios').select('*').order('activo', { ascending: false }).order('nombre');
    if (error) setMessage({ type: 'error', text: error.message });
    else setServices((data ?? []) as Servicio[]);
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, []);

  function startEdit(service: Servicio) {
    setEditingId(service.id);
    setFormOpen(true);
    setForm({
      codigo: service.codigo,
      nombre: service.nombre,
      descripcion: service.descripcion ?? '',
      tipo_unidad_cobro: service.tipo_unidad_cobro ?? 'por_servicio',
    });
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const codigo = form.codigo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!codigo || !form.nombre.trim()) {
      setMessage({ type: 'error', text: 'El código y el nombre son obligatorios.' });
      return;
    }

    setSaving(true);
    const payload = {
      codigo,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo_unidad_cobro: form.tipo_unidad_cobro,
    };
    const result = editingId
      ? await supabase.from('servicios').update(payload).eq('id', editingId)
      : await supabase.from('servicios').insert(payload);

    if (result.error) {
      setMessage({ type: 'error', text: result.error.code === '23505' ? 'Ya existe un servicio con ese código.' : result.error.message });
    } else {
      setMessage({ type: 'success', text: editingId ? 'Servicio actualizado.' : 'Servicio creado.' });
      cancelEdit();
      await loadServices();
    }
    setSaving(false);
  }

  async function toggleActive(service: Servicio) {
    const action = service.activo ? 'desactivar' : 'reactivar';
    if (!window.confirm(`¿Quieres ${action} el servicio “${service.nombre}”?`)) return;
    const { error } = await supabase.from('servicios').update({ activo: !service.activo }).eq('id', service.id);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: `Servicio ${service.activo ? 'desactivado' : 'reactivado'}.` });
      await loadServices();
    }
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <div className="cardHeaderInline"><h2>{editingId ? 'Editar servicio' : 'Alta de servicio'}</h2><button type="button" className="button secondary" onClick={() => setFormOpen((open) => !open)}>{formOpen ? 'Cerrar' : '+ Nuevo servicio'}</button></div>
        {formOpen ? <form className="formGrid collapsibleForm" onSubmit={handleSubmit}>
          <label>Código *<input value={form.codigo} disabled={Boolean(editingId)} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="ej. alojamiento" /></label>
          <label>Nombre *<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
          <label>Unidad de cobro *
            <select value={form.tipo_unidad_cobro} onChange={(e) => setForm({ ...form, tipo_unidad_cobro: e.target.value })}>
              {Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="full">Descripción<textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear servicio'}</button>
            {editingId ? <button type="button" className="button secondary" onClick={cancelEdit}>Cancelar</button> : null}
          </div>
          {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </form> : null}
        {!formOpen && message ? <StatusMessage type={message.type} message={message.text} /> : null}
      </section>

      <section className="card">
        <h2>Catálogo</h2>
        {loading ? <p>Cargando servicios…</p> : null}
        <div className="listStack">
          {services.map((service) => (
            <article className={`listItem ${service.activo ? '' : 'inactiveItem'}`} key={service.id}>
              <div>
                <strong>{service.nombre}</strong>
                <p>{unitLabels[service.tipo_unidad_cobro ?? ''] ?? service.tipo_unidad_cobro}</p>
                <small>{service.descripcion || service.codigo}</small>
              </div>
              <div className="itemActions">
                <span className="pill">{service.activo ? 'Activo' : 'Inactivo'}</span>
                <button className="textButton" onClick={() => startEdit(service)}>Editar</button>
                <button className="textButton" onClick={() => toggleActive(service)}>{service.activo ? 'Desactivar' : 'Reactivar'}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
