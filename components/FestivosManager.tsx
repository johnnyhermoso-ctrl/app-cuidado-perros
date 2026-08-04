'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type Festivo = { id: string; fecha: string; nombre: string; ambito: string | null; municipio: string | null; activo: boolean };

export function FestivosManager() {
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [recargo, setRecargo] = useState('2.00');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    const [days, config] = await Promise.all([
      supabase.from('festivos').select('*').order('fecha'),
      supabase.from('configuracion').select('valor').eq('clave', 'recargo_festivo_alojamiento').maybeSingle(),
    ]);
    if (days.error || config.error) setMessage({ type: 'error', text: days.error?.message || config.error?.message || 'No se pudieron cargar los festivos.' });
    else {
      setFestivos((days.data ?? []) as Festivo[]);
      setRecargo(config.data?.valor ?? '2.00');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function addHoliday(event: FormEvent) {
    event.preventDefault();
    if (!fecha || !nombre.trim()) return setMessage({ type: 'error', text: 'La fecha y el nombre son obligatorios.' });
    setSaving(true);
    const { error } = await supabase.from('festivos').upsert({ fecha, nombre: nombre.trim(), ambito: 'local', municipio: 'Madrid', activo: true }, { onConflict: 'fecha' });
    setSaving(false);
    if (error) setMessage({ type: 'error', text: error.message });
    else { setFecha(''); setNombre(''); setMessage({ type: 'success', text: 'Festivo guardado.' }); await loadData(); }
  }

  async function toggleHoliday(item: Festivo) {
    const { error } = await supabase.from('festivos').update({ activo: !item.activo }).eq('id', item.id);
    if (error) setMessage({ type: 'error', text: error.message });
    else await loadData();
  }

  async function saveSurcharge() {
    const amount = Number(recargo);
    if (!Number.isFinite(amount) || amount < 0) return setMessage({ type: 'error', text: 'El recargo debe ser un importe válido.' });
    const { error } = await supabase.from('configuracion').upsert({ clave: 'recargo_festivo_alojamiento', valor: amount.toFixed(2), descripcion: 'Recargo por noche festiva y reserva' }, { onConflict: 'clave' });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Recargo actualizado. Se aplicará a nuevas reservas y a reservas editadas.' });
  }

  return <div className="grid twoCols">
    <section className="card">
      <h2>Configuración</h2>
      <div className="formGrid oneColumn">
        <label>Recargo por noche festiva (€)<input type="number" min="0" step="0.01" value={recargo} onChange={(event) => setRecargo(event.target.value)} /></label>
        <button type="button" className="button primary" onClick={saveSurcharge}>Guardar recargo</button>
        <p className="muted">Se aplica una vez por cada noche festiva de una reserva de alojamiento, independientemente del número de perros.</p>
      </div>
      <hr className="sectionDivider" />
      <h2>Añadir festivo</h2>
      <form className="formGrid oneColumn" onSubmit={addHoliday}>
        <label>Fecha<input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} /></label>
        <label>Nombre<input value={nombre} onChange={(event) => setNombre(event.target.value)} /></label>
        <button className="button primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar festivo'}</button>
      </form>
      {message ? <div className="sectionSpacing"><StatusMessage type={message.type} message={message.text} /></div> : null}
    </section>
    <section className="card">
      <h2>Calendario laboral de Madrid</h2>
      <div className="listStack">{festivos.map((item) => <article className={`listItem ${!item.activo ? 'inactiveItem' : ''}`} key={item.id}><div><strong>{item.nombre}</strong><p>{formatDate(item.fecha)} · {item.municipio || item.ambito || 'Madrid'}</p></div><button type="button" className={`textButton ${item.activo ? 'dangerTextButton' : ''}`} onClick={() => toggleHoliday(item)}>{item.activo ? 'Desactivar' : 'Activar'}</button></article>)}</div>
    </section>
  </div>;
}
