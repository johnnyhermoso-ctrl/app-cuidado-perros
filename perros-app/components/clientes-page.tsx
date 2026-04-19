'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/lib/types';
import { Card, EmptyState } from '@/components/ui';

const initialForm = {
  nombre: '',
  apellidos: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: ''
};

export function ClientesPageClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  async function loadClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setClientes((data ?? []) as Cliente[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase.from('clientes').insert({
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      notas: form.notas.trim() || null
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Cliente guardado correctamente.');
      setForm(initialForm);
      await loadClientes();
    }
    setSaving(false);
  }

  return (
    <div className="grid grid-2">
      <Card title="Nuevo cliente">
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Nombre *
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </label>
          <label>
            Apellidos
            <input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </label>
          <div className="grid grid-2">
            <label>
              Teléfono
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <label>
            Dirección
            <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </label>
          <label>
            Notas
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </label>
          {message ? <div className="notice success">{message}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}
          <button className="button" disabled={saving} type="submit">
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </form>
      </Card>

      <Card title="Clientes registrados" actions={<button className="button secondary" onClick={loadClientes}>Actualizar</button>}>
        {loading ? (
          <p>Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <EmptyState title="Todavía no hay clientes" text="Crea tu primer cliente con el formulario de la izquierda." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre}</strong>
                      {cliente.apellidos ? <div className="small muted">{cliente.apellidos}</div> : null}
                    </td>
                    <td>{cliente.telefono || '—'}</td>
                    <td>{cliente.email || '—'}</td>
                    <td>{cliente.notas || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
