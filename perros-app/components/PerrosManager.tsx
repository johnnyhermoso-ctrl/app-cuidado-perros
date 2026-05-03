'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Cliente, Perro } from '@/lib/types';
import { StatusMessage } from './StatusMessage';

const emptyForm = {
  cliente_id: '',
  nombre: '',
  raza: '',
  fecha_nacimiento: '',
  sexo: '',
  peso_kg: '',
  tamano: '',
  numero_chip: '',
  alergias: '',
  medicacion: '',
  alimentacion: '',
  observaciones: '',
};

export function PerrosManager() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perros, setPerros] = useState<(Perro & { cliente?: Cliente })[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: clientesData, error: clientesError }, { data: perrosData, error: perrosError }] = await Promise.all([
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('perros').select('*, clientes(*)').order('created_at', { ascending: false }),
    ]);

    if (clientesError || perrosError) {
      setMessage({ type: 'error', text: clientesError?.message || perrosError?.message || 'Error cargando datos.' });
    } else {
      setClientes((clientesData || []) as Cliente[]);
      const mapped = ((perrosData || []) as any[]).map((item) => ({ ...item, cliente: item.clientes }));
      setPerros(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return perros;
    return perros.filter((perro) =>
      [perro.nombre, perro.raza || '', perro.cliente?.nombre || '', perro.cliente?.apellidos || '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [perros, search]);

  async function uploadPhoto(file: File) {
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await supabase.storage.from('dog-photos').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('dog-photos').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form.cliente_id || !form.nombre.trim()) {
      setMessage({ type: 'error', text: 'Debes seleccionar cliente y nombre del perro.' });
      return;
    }
    setSaving(true);
    try {
      let foto_url: string | null = null;
      if (photoFile) {
        foto_url = await uploadPhoto(photoFile);
      }

      const { error } = await supabase.from('perros').insert({
        cliente_id: form.cliente_id,
        nombre: form.nombre.trim(),
        raza: form.raza.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        sexo: form.sexo || null,
        peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
        tamano: form.tamano || null,
        numero_chip: form.numero_chip.trim() || null,
        alergias: form.alergias.trim() || null,
        medicacion: form.medicacion.trim() || null,
        alimentacion: form.alimentacion.trim() || null,
        observaciones: form.observaciones.trim() || null,
        foto_url,
      });
      if (error) throw error;
      setForm(emptyForm);
      setPhotoFile(null);
      setPhotoPreview(null);
      setMessage({ type: 'success', text: 'Perro creado correctamente.' });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error guardando perro.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid twoCols">
      <section className="card">
        <h2>Nuevo perro</h2>
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
            Nombre *
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </label>
          <label>
            Raza
            <input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} />
          </label>
          <label>
            Fecha nacimiento
            <input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </label>
          <label>
            Sexo
            <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="">Selecciona</option>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </label>
          <label>
            Peso (kg)
            <input type="number" step="0.1" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} />
          </label>
          <label>
            Tamaño
            <select value={form.tamano} onChange={(e) => setForm({ ...form, tamano: e.target.value })}>
              <option value="">Selecciona</option>
              <option value="Pequeño">Pequeño</option>
              <option value="Mediano">Mediano</option>
              <option value="Grande">Grande</option>
            </select>
          </label>
          <label>
            Nº chip
            <input value={form.numero_chip} onChange={(e) => setForm({ ...form, numero_chip: e.target.value })} />
          </label>
          <label className="full">
            Foto
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          {photoPreview ? <div className="full photoPreviewWrap"><img src={photoPreview} alt="Vista previa" className="photoPreview" /></div> : null}
          <label className="full">
            Alergias
            <textarea value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} rows={2} />
          </label>
          <label className="full">
            Medicación
            <textarea value={form.medicacion} onChange={(e) => setForm({ ...form, medicacion: e.target.value })} rows={2} />
          </label>
          <label className="full">
            Alimentación
            <textarea value={form.alimentacion} onChange={(e) => setForm({ ...form, alimentacion: e.target.value })} rows={2} />
          </label>
          <label className="full">
            Observaciones
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={3} />
          </label>
          <div className="full actionsRow">
            <button className="button primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar perro'}</button>
          </div>
          {message ? <div className="full"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </form>
      </section>

      <section className="card">
        <div className="cardHeaderInline">
          <h2>Perros</h2>
          <input placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? <p>Cargando perros...</p> : null}
        {!loading && filtered.length === 0 ? <p>No hay perros todavía.</p> : null}
        <div className="listStack">
          {filtered.map((perro) => (
            <article key={perro.id} className="listItem withImage">
              <div className="thumb">
                {perro.foto_url ? <img src={perro.foto_url} alt={perro.nombre} /> : <span>🐶</span>}
              </div>
              <div>
                <strong>{perro.nombre}</strong>
                <p>{perro.raza || 'Sin raza'} · {perro.cliente?.nombre || 'Sin cliente'}</p>
                <small>{perro.alergias ? `Alergias: ${perro.alergias}` : 'Sin alertas registradas'}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
