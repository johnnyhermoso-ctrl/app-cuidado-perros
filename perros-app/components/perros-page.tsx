'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cliente, Perro } from '@/lib/types';
import { Card, EmptyState } from '@/components/ui';

const initialForm = {
  cliente_id: '',
  nombre: '',
  raza: '',
  sexo: '',
  tamano: '',
  numero_chip: '',
  alergias: '',
  medicacion: '',
  alimentacion: '',
  observaciones: ''
};

export function PerrosPageClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perros, setPerros] = useState<(Perro & { cliente_nombre?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [{ data: clientesData, error: clientesError }, { data: perrosData, error: perrosError }] = await Promise.all([
        supabase.from('clientes').select('id,nombre,apellidos,telefono,email,direccion,notas,created_at').order('nombre'),
        supabase.from('perros').select('*, clientes(nombre)').order('created_at', { ascending: false })
      ]);

      if (clientesError || perrosError) {
        setError(clientesError?.message || perrosError?.message || 'Error cargando datos.');
      } else {
        setClientes((clientesData ?? []) as Cliente[]);
        const mapped = (perrosData ?? []).map((item: any) => ({
          ...item,
          cliente_nombre: item.clientes?.nombre ?? null
        }));
        setPerros(mapped as any);
        setError(null);
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const clientOptions = useMemo(() => clientes.map((c) => ({ value: c.id, label: `${c.nombre}${c.apellidos ? ` ${c.apellidos}` : ''}` })), [clientes]);

  async function refreshDogs() {
    const { data, error } = await supabase.from('perros').select('*, clientes(nombre)').order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      return;
    }
    const mapped = (data ?? []).map((item: any) => ({ ...item, cliente_nombre: item.clientes?.nombre ?? null }));
    setPerros(mapped as any);
  }

  async function uploadPhoto(perroNombre: string) {
    if (!file) return null;
    setUploading(true);
    const extension = file.name.split('.').pop() || 'jpg';
    const safeName = perroNombre.toLowerCase().replace(/\s+/g, '-');
    const path = `${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage.from('dog-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    });

    setUploading(false);
    if (error) throw error;

    const { data } = supabase.storage.from('dog-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const fotoUrl = await uploadPhoto(form.nombre.trim());
      const { error } = await supabase.from('perros').insert({
        cliente_id: form.cliente_id,
        nombre: form.nombre.trim(),
        raza: form.raza.trim() || null,
        sexo: form.sexo || null,
        tamano: form.tamano || null,
        numero_chip: form.numero_chip.trim() || null,
        alergias: form.alergias.trim() || null,
        medicacion: form.medicacion.trim() || null,
        alimentacion: form.alimentacion.trim() || null,
        observaciones: form.observaciones.trim() || null,
        foto_url: fotoUrl
      });

      if (error) throw error;

      setMessage('Perro guardado correctamente.');
      setForm(initialForm);
      setFile(null);
      setPreview(null);
      await refreshDogs();
    } catch (err: any) {
      setError(err.message || 'Error guardando el perro.');
    }

    setSaving(false);
  }

  return (
    <div className="grid grid-2">
      <Card title="Nuevo perro">
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Cliente *
            <select required value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Selecciona un cliente</option>
              {clientOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre *
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </label>
          <div className="grid grid-2">
            <label>
              Raza
              <input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} />
            </label>
            <label>
              Sexo
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="">Selecciona</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </label>
          </div>
          <div className="grid grid-2">
            <label>
              Tamaño
              <select value={form.tamano} onChange={(e) => setForm({ ...form, tamano: e.target.value })}>
                <option value="">Selecciona</option>
                <option value="pequeño">Pequeño</option>
                <option value="mediano">Mediano</option>
                <option value="grande">Grande</option>
              </select>
            </label>
            <label>
              Nº chip
              <input value={form.numero_chip} onChange={(e) => setForm({ ...form, numero_chip: e.target.value })} />
            </label>
          </div>
          <label>
            Alimentación
            <input value={form.alimentacion} onChange={(e) => setForm({ ...form, alimentacion: e.target.value })} />
          </label>
          <div className="grid grid-2">
            <label>
              Alergias
              <input value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
            </label>
            <label>
              Medicación
              <input value={form.medicacion} onChange={(e) => setForm({ ...form, medicacion: e.target.value })} />
            </label>
          </div>
          <label>
            Foto del perro
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="inline">
            {preview ? <img className="photo-preview" src={preview} alt="Vista previa" /> : <div className="photo-placeholder">🐶</div>}
            <p className="muted small">Vista previa antes de guardar. Para que la subida funcione, crea el bucket público <strong>dog-photos</strong> en Supabase Storage.</p>
          </div>
          <label>
            Observaciones
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </label>
          {message ? <div className="notice success">{message}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}
          <button className="button" disabled={saving || uploading} type="submit">
            {saving || uploading ? 'Guardando...' : 'Guardar perro'}
          </button>
        </form>
      </Card>

      <Card title="Perros registrados" actions={<button className="button secondary" onClick={refreshDogs}>Actualizar</button>}>
        {loading ? (
          <p>Cargando perros...</p>
        ) : perros.length === 0 ? (
          <EmptyState title="Todavía no hay perros" text="Primero crea clientes y después da de alta el primer perro." />
        ) : (
          <div className="list">
            {perros.map((perro) => (
              <div key={perro.id} className="list-item">
                <div className="inline" style={{ alignItems: 'flex-start' }}>
                  {perro.foto_url ? <img className="photo-preview" src={perro.foto_url} alt={perro.nombre} /> : <div className="photo-placeholder">🐶</div>}
                  <div>
                    <strong>{perro.nombre}</strong>
                    <div className="small muted">Cliente: {perro.cliente_nombre || '—'}</div>
                    <div className="small muted">{perro.raza || 'Sin raza'} · {perro.tamano || 'Tamaño sin indicar'}</div>
                    {perro.alergias ? <div className="small">Alergias: {perro.alergias}</div> : null}
                    {perro.medicacion ? <div className="small">Medicación: {perro.medicacion}</div> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
