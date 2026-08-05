'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Cliente } from '@/lib/types';
import { StatusMessage } from './StatusMessage';

const emptyForm = {
  nombre: '',
  apellidos: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
};

export function ClientesManager() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadClientes() {
    setLoading(true);
    const { data, error } = await supabase.from('clientes').select('*').eq('activo', true).order('created_at', { ascending: false });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setClientes((data || []) as Cliente[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.apellidos || '', c.telefono || '', c.email || ''].join(' ').toLowerCase().includes(term)
    );
  }, [clientes, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form.nombre.trim()) {
      setMessage({ type: 'error', text: 'El nombre es obligatorio.' });
      return;
    }
    if (form.telefono && !/^[+\d][\d\s()-]{6,}$/.test(form.telefono.trim())) {
      setMessage({ type: 'error', text: 'El teléfono no tiene un formato válido.' });
      return;
    }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      notas: form.notas.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from('clientes').update(payload).eq('id', editingId)
      : await supabase.from('clientes').insert(payload);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      setMessage({ type: 'success', text: editingId ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.' });
      await loadClientes();
    }
    setSaving(false);
  }

  function editCliente(cliente: Cliente) {
    setEditingId(cliente.id);
    setFormOpen(true);
    setForm({ nombre: cliente.nombre, apellidos: cliente.apellidos || '', telefono: cliente.telefono || '', email: cliente.email || '', direccion: cliente.direccion || '', notas: cliente.notas || '' });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deactivateCliente(cliente: Cliente) {
    if (!window.confirm(`¿Desactivar a ${cliente.nombre}? Sus reservas conservarán el histórico.`)) return;
    const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', cliente.id);
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      if (editingId === cliente.id) { setEditingId(null); setForm(emptyForm); }
      setMessage({ type: 'success', text: 'Cliente desactivado.' });
      await loadClientes();
    }
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <div className="cardHeaderInline"><h2>{editingId ? 'Editar cliente' : 'Alta de cliente'}</h2><button type="button" className="button secondary" onClick={() => setFormOpen((open) => !open)}>{formOpen ? 'Cerrar' : '+ Nuevo cliente'}</button></div>
        {formOpen ? <form onSubmit={handleSubmit} className="formGrid collapsibleForm">
          <label>
            Nombre *
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </label>
          <label>
            Apellidos
            <input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="full">
            Dirección
            <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </label>
          <label className="full">
            Notas
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={4} />
          </label>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar cliente'}</button>
            {editingId ? <button type="button" className="button secondary" onClick={() => { setEditingId(null); setForm(emptyForm); setFormOpen(false); }}>Cancelar edición</button> : null}
          </div>
          {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </form> : null}
        {!formOpen && message ? <StatusMessage type={message.type} message={message.text} /> : null}
      </section>

      <section className="card">
        <div className="cardHeaderInline">
          <h2>Clientes</h2>
          <input placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? <p>Cargando clientes...</p> : null}
        {!loading && filtered.length === 0 ? <p>No hay clientes todavía.</p> : null}
        <div className="listStack">
          {filtered.map((cliente) => (
            <article key={cliente.id} className="listItem clickableItem" onClick={() => editCliente(cliente)}>
              <div>
                <strong>{cliente.nombre} {cliente.apellidos ?? ''}</strong>
                <p>{cliente.telefono || 'Sin teléfono'} · {cliente.email || 'Sin email'}</p>
              </div>
              <div className="itemActions"><small>{cliente.direccion || 'Sin dirección'}</small><div className="detailActions"><button type="button" className="textButton" onClick={(event) => { event.stopPropagation(); editCliente(cliente); }}>Editar</button><button type="button" className="textButton dangerTextButton" onClick={(event) => { event.stopPropagation(); deactivateCliente(cliente); }}>Desactivar</button></div></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
