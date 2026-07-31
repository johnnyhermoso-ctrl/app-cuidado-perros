'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { calculateBalance, formatCurrency, formatDate } from '@/lib/utils';
import { StatusMessage } from './StatusMessage';

type Adjustment = { id: string; tipo: 'descuento' | 'recargo'; concepto: string; importe: number; descripcion: string | null; estado: 'activo' | 'anulado'; created_at: string };
type Payment = { id: string; fecha_pago: string; importe: number; metodo_pago: string | null; estado: 'confirmado' | 'anulado'; referencia: string | null; observaciones: string | null; created_at: string };
type EconomicBooking = {
  id: string; fecha_llegada: string | null; estado: string; subtotal: number; total_descuentos: number; total_recargos: number; total_final: number;
  clientes?: { nombre: string } | null; servicios?: { nombre: string } | null; ajustes_reserva?: Adjustment[]; pagos?: Payment[];
};

type AdjustmentForm = { tipo: 'descuento' | 'recargo'; concepto: string; importe: string; descripcion: string };
const emptyAdjustment: AdjustmentForm = { tipo: 'descuento', concepto: '', importe: '', descripcion: '' };
const emptyPayment = { importe: '', metodo_pago: 'bizum', referencia: '', observaciones: '' };

export function CobrosManager() {
  const [bookings, setBookings] = useState<EconomicBooking[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [payment, setPayment] = useState(emptyPayment);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBookings = useCallback(async (preferredId?: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('id,fecha_llegada,estado,subtotal,total_descuentos,total_recargos,total_final,clientes(nombre),servicios(nombre),ajustes_reserva(*),pagos(*)')
      .neq('estado', 'cancelada')
      .order('fecha_llegada', { ascending: false });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      const next = (data ?? []) as unknown as EconomicBooking[];
      setBookings(next);
      setSelectedId((current) => {
        const candidate = preferredId || current;
        return next.some((item) => item.id === candidate) ? candidate : next[0]?.id ?? '';
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  const selected = useMemo(() => bookings.find((item) => item.id === selectedId), [bookings, selectedId]);
  const paid = useMemo(() => selected?.pagos?.filter((item) => item.estado === 'confirmado').reduce((sum, item) => sum + Number(item.importe), 0) ?? 0, [selected]);
  const balance = calculateBalance(Number(selected?.total_final ?? 0), [paid]);

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(adjustment.importe.replace(',', '.'));
    if (!adjustment.concepto.trim() || !Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Indica concepto e importe mayor que cero.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('registrar_ajuste', {
      p_reserva_id: selected.id, p_tipo: adjustment.tipo, p_concepto: adjustment.concepto.trim(), p_importe: amount, p_descripcion: adjustment.descripcion.trim() || null,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setAdjustment(emptyAdjustment);
      setMessage({ type: 'success', text: 'Ajuste registrado.' });
      await loadBookings(selected.id);
    }
    setSaving(false);
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(payment.importe.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'El importe debe ser mayor que cero.' });
      return;
    }
    if (amount > balance) {
      setMessage({ type: 'error', text: 'El pago no puede superar el saldo pendiente.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('registrar_pago', {
      p_reserva_id: selected.id, p_importe: amount, p_metodo_pago: payment.metodo_pago,
      p_referencia: payment.referencia.trim() || null, p_observaciones: payment.observaciones.trim() || null,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setPayment(emptyPayment);
      setMessage({ type: 'success', text: 'Pago registrado.' });
      await loadBookings(selected.id);
    }
    setSaving(false);
  }

  async function cancelMovement(kind: 'ajuste' | 'pago', id: string) {
    if (!selected || !window.confirm(`¿Confirmas la anulación del ${kind}? El movimiento seguirá visible.`)) return;
    const { error } = kind === 'ajuste'
      ? await supabase.rpc('anular_ajuste', { p_ajuste_id: id })
      : await supabase.rpc('anular_pago', { p_pago_id: id });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: `${kind === 'ajuste' ? 'Ajuste' : 'Pago'} anulado.` });
      await loadBookings(selected.id);
    }
  }

  if (loading) return <p>Cargando cobros…</p>;
  if (bookings.length === 0) return <section className="card"><p className="muted">No hay reservas disponibles.</p></section>;

  return (
    <>
      <section className="card">
        <label>Reserva
          <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setMessage(null); }}>
            {bookings.map((item) => <option key={item.id} value={item.id}>{formatDate(item.fecha_llegada)} · {item.clientes?.nombre} · {item.servicios?.nombre}</option>)}
          </select>
        </label>
      </section>
      {selected ? <>
        <div className="grid stats sectionSpacing">
          <section className="card"><div className="metricLabel">Subtotal</div><div className="metricValue smallMetric">{formatCurrency(selected.subtotal)}</div></section>
          <section className="card"><div className="metricLabel">Total</div><div className="metricValue smallMetric">{formatCurrency(selected.total_final)}</div><small>{formatCurrency(selected.total_recargos)} recargos · {formatCurrency(selected.total_descuentos)} descuentos</small></section>
          <section className="card"><div className="metricLabel">Pagado</div><div className="metricValue smallMetric">{formatCurrency(paid)}</div></section>
          <section className="card"><div className="metricLabel">{balance >= 0 ? 'Pendiente' : 'Saldo a favor'}</div><div className="metricValue smallMetric">{formatCurrency(Math.abs(balance))}</div></section>
        </div>
        {message ? <div className="sectionSpacing"><StatusMessage type={message.type} message={message.text} /></div> : null}
        <div className="grid twoCols sectionSpacing">
          <section className="card">
            <h2>Nuevo ajuste</h2>
            <form className="formGrid" onSubmit={submitAdjustment}>
              <label>Tipo<select value={adjustment.tipo} onChange={(e) => setAdjustment({ ...adjustment, tipo: e.target.value as 'descuento' | 'recargo' })}><option value="descuento">Descuento</option><option value="recargo">Recargo</option></select></label>
              <label>Importe (€)<input type="number" min="0.01" step="0.01" value={adjustment.importe} onChange={(e) => setAdjustment({ ...adjustment, importe: e.target.value })} /></label>
              <label className="full">Concepto<input value={adjustment.concepto} onChange={(e) => setAdjustment({ ...adjustment, concepto: e.target.value })} /></label>
              <label className="full">Descripción<textarea rows={2} value={adjustment.descripcion} onChange={(e) => setAdjustment({ ...adjustment, descripcion: e.target.value })} /></label>
              <button className="button primary" disabled={saving}>Registrar ajuste</button>
            </form>
          </section>
          <section className="card">
            <h2>Registrar pago</h2>
            <form className="formGrid" onSubmit={submitPayment}>
              <label>Importe (€)<input type="number" min="0.01" step="0.01" value={payment.importe} onChange={(e) => setPayment({ ...payment, importe: e.target.value })} /></label>
              <label>Método<select value={payment.metodo_pago} onChange={(e) => setPayment({ ...payment, metodo_pago: e.target.value })}><option value="efectivo">Efectivo</option><option value="bizum">Bizum</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></label>
              <label className="full">Referencia<input value={payment.referencia} onChange={(e) => setPayment({ ...payment, referencia: e.target.value })} /></label>
              <label className="full">Observaciones<textarea rows={2} value={payment.observaciones} onChange={(e) => setPayment({ ...payment, observaciones: e.target.value })} /></label>
              <button className="button primary" disabled={saving}>Registrar pago</button>
            </form>
          </section>
        </div>
        <div className="grid twoCols sectionSpacing">
          <section className="card"><h2>Ajustes</h2><div className="listStack">{selected.ajustes_reserva?.map((item) => <article className={`listItem ${item.estado === 'anulado' ? 'inactiveItem' : ''}`} key={item.id}><div><strong>{item.tipo === 'descuento' ? 'Descuento' : 'Recargo'} · {formatCurrency(item.importe)}</strong><p>{item.concepto}</p><small>{item.estado}</small></div>{item.estado === 'activo' ? <button className="textButton" onClick={() => cancelMovement('ajuste', item.id)}>Anular</button> : null}</article>)}</div></section>
          <section className="card"><h2>Pagos</h2><div className="listStack">{selected.pagos?.map((item) => <article className={`listItem ${item.estado === 'anulado' ? 'inactiveItem' : ''}`} key={item.id}><div><strong>{formatCurrency(item.importe)} · {item.metodo_pago}</strong><p>{item.referencia || formatDate(item.fecha_pago)}</p><small>{item.estado}</small></div>{item.estado === 'confirmado' ? <button className="textButton" onClick={() => cancelMovement('pago', item.id)}>Anular</button> : null}</article>)}</div></section>
        </div>
      </> : null}
    </>
  );
}
