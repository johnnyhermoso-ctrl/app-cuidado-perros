'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { StatusMessage } from './StatusMessage';
import { formatDate } from '@/lib/utils';
import { reservationDogNames, reservationOwnerName } from '@/lib/reservation-labels';
import { groupReservations } from '@/lib/reservation-groups';

type PushState = 'checking' | 'unsupported' | 'inactive' | 'active' | 'denied';
type NotificationItem = {
  id: string;
  reserva_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string;
  scheduled_for: string;
  estado: string;
};
type CareReminder = {
  id: string;
  reserva_id: string;
  perro_id: string;
  tipo: 'medicacion' | 'alimentacion';
  descripcion: string;
  hora: string;
  activo: boolean;
  perros?: { nombre: string } | null;
  reservas?: { clientes?: { nombre: string; apellidos?: string | null } | null } | null;
};
type CareDog = { id: string; nombre: string; medicacion: string | null; alimentacion: string | null };
type CareReservation = {
  id: string;
  ocurrencia_recurrente_id?: string | null;
  ocurrencias_recurrentes?: { serie_id: string } | null;
  fecha_llegada: string | null;
  fecha_salida: string | null;
  clientes?: { nombre: string; apellidos?: string | null } | null;
  reserva_perros?: Array<{ perros?: CareDog | null }>;
};

const configKeys = {
  quietStart: 'notificaciones_hora_inicio_descanso',
  quietEnd: 'notificaciones_hora_fin_descanso',
  dayTime: 'notificaciones_hora_aviso_dia',
  reviewTime: 'notificaciones_hora_revision_estado',
};

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function notificationActionOptions(type: string) {
  if (type === 'cuidado') return [{ id: 'posponer', label: 'Posponer 30 min' }, { id: 'descartar', label: 'Descartar' }];
  if (type === 'cobro_pendiente') return [{ id: 'marcar_cobrado', label: 'Marcar cobrado' }, { id: 'posponer', label: 'Posponer 24 h' }, { id: 'descartar', label: 'Descartar' }];
  if (type === 'checkin_atrasado') return [{ id: 'confirmar_checkin', label: 'Confirmar check-in' }, { id: 'posponer', label: 'Posponer 24 h' }, { id: 'descartar', label: 'Descartar' }];
  if (type === 'checkout_atrasado') return [{ id: 'confirmar_checkout', label: 'Confirmar check-out' }, { id: 'posponer', label: 'Posponer 24 h' }, { id: 'descartar', label: 'Descartar' }];
  return [{ id: 'descartar', label: 'Descartar' }];
}

export function PushNotificationsManager() {
  const searchParams = useSearchParams();
  const actionHandled = useRef(false);
  const [state, setState] = useState<PushState>('checking');
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [careReminders, setCareReminders] = useState<CareReminder[]>([]);
  const [reservations, setReservations] = useState<CareReservation[]>([]);
  const [settings, setSettings] = useState({ quietStart: '22:00', quietEnd: '08:00', dayTime: '08:30', reviewTime: '09:00' });
  const [careForm, setCareForm] = useState({ reserva_id: '', perro_id: '', tipo: 'medicacion' as 'medicacion' | 'alimentacion', descripcion: '', hora: '09:00' });

  const loadOperationalData = useCallback(async () => {
    const [notificationResult, careResult, reservationResult, configResult] = await Promise.all([
      supabase.from('notificaciones_operativas').select('id,reserva_id,tipo,titulo,cuerpo,scheduled_for,estado').order('scheduled_for', { ascending: false }).limit(30),
      supabase.from('recordatorios_cuidado').select('*,perros(nombre),reservas(clientes(nombre,apellidos))').order('hora'),
      supabase.from('reservas').select('id,fecha_llegada,fecha_salida,ocurrencia_recurrente_id,ocurrencias_recurrentes(serie_id),clientes(nombre,apellidos),reserva_perros(perros(id,nombre,medicacion,alimentacion))').in('estado', ['confirmada', 'en_curso']).order('fecha_llegada'),
      supabase.from('configuracion').select('clave,valor').in('clave', Object.values(configKeys)),
    ]);
    const firstError = notificationResult.error || careResult.error || reservationResult.error || configResult.error;
    if (firstError) {
      setMessage({ type: 'error', text: firstError.message });
      return;
    }
    setNotifications((notificationResult.data ?? []) as NotificationItem[]);
    setCareReminders((careResult.data ?? []) as unknown as CareReminder[]);
    setReservations((reservationResult.data ?? []) as unknown as CareReservation[]);
    const values = Object.fromEntries((configResult.data ?? []).map((item) => [item.clave, item.valor]));
    setSettings({
      quietStart: values[configKeys.quietStart] ?? '22:00',
      quietEnd: values[configKeys.quietEnd] ?? '08:00',
      dayTime: values[configKeys.dayTime] ?? '08:30',
      reviewTime: values[configKeys.reviewTime] ?? '09:00',
    });
  }, []);

  useEffect(() => {
    async function checkState() {
      setStandalone(isStandalone());
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setState(subscription ? 'active' : 'inactive');
    }
    checkState().catch(() => setState('unsupported'));
    loadOperationalData();
  }, [loadOperationalData]);

  const runNotificationAction = useCallback(async (id: string, action: string) => {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc('actuar_notificacion', { p_notificacion_id: id, p_accion: action });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Acción aplicada correctamente.' });
      await loadOperationalData();
    }
    setBusy(false);
  }, [loadOperationalData]);

  useEffect(() => {
    const notificationId = searchParams.get('notificacion');
    const action = searchParams.get('accion');
    if (!notificationId || !action || actionHandled.current) return;
    actionHandled.current = true;
    runNotificationAction(notificationId, action);
  }, [searchParams, runNotificationAction]);

  async function activate() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'inactive');
        throw new Error('No se concedió permiso para mostrar notificaciones.');
      }
      const [{ data: config, error: configError }, { data: userData }] = await Promise.all([
        supabase.from('configuracion').select('valor').eq('clave', 'vapid_public_key').single(),
        supabase.auth.getUser(),
      ]);
      if (configError || !config?.valor) throw new Error('La clave pública de notificaciones no está configurada.');
      if (!userData.user) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.valor) });
      const serialized = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userData.user.id, endpoint: subscription.endpoint, p256dh: serialized.keys?.p256dh, auth_key: serialized.keys?.auth,
        device_name: `${navigator.platform || 'Dispositivo'} · ${navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('iPad') ? 'iPad' : 'Navegador'}`,
        active: true, last_seen_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });
      if (error) throw error;
      setState('active');
      setMessage({ type: 'success', text: 'Notificaciones activadas en este dispositivo.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'No se pudieron activar las notificaciones.' });
    } finally { setBusy(false); }
  }

  async function deactivate() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase.from('push_subscriptions').update({ active: false }).eq('endpoint', subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('inactive');
      setMessage({ type: 'success', text: 'Notificaciones desactivadas en este dispositivo.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'No se pudieron desactivar las notificaciones.' });
    } finally { setBusy(false); }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke('push-test', { body: { title: 'Perros App', body: 'Las notificaciones funcionan correctamente.', url: '/notificaciones/' } });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: `Notificación enviada a ${data?.sent ?? 0} dispositivo(s).` });
    setBusy(false);
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const rows = Object.entries(configKeys).map(([field, key]) => ({ clave: key, valor: settings[field as keyof typeof settings] }));
    const { error } = await supabase.from('configuracion').upsert(rows, { onConflict: 'clave' });
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Horario de notificaciones actualizado.' });
    setBusy(false);
  }

  const selectedReservation = useMemo(() => reservations.find((item) => item.id === careForm.reserva_id), [reservations, careForm.reserva_id]);
  const reservationGroups = useMemo(() => groupReservations(reservations), [reservations]);
  const selectedGroup = reservationGroups.find((group) => group.reservations.some((item) => item.id === careForm.reserva_id));
  const availableDogs = useMemo(() => selectedReservation?.reserva_perros?.map((item) => item.perros).filter(Boolean) as CareDog[] ?? [], [selectedReservation]);

  function selectCareDog(dogId: string, type = careForm.tipo) {
    const dog = availableDogs.find((item) => item.id === dogId);
    setCareForm((current) => ({ ...current, perro_id: dogId, tipo: type, descripcion: dog?.[type] || current.descripcion }));
  }

  async function saveCareReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!careForm.reserva_id || !careForm.perro_id || !careForm.descripcion.trim() || !careForm.hora) {
      setMessage({ type: 'error', text: 'Completa reserva, perro, cuidado y hora.' });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('recordatorios_cuidado').insert({ ...careForm, descripcion: careForm.descripcion.trim(), activo: true });
    if (error) setMessage({ type: 'error', text: error.message });
    else {
      setMessage({ type: 'success', text: 'Recordatorio de cuidado creado.' });
      setCareForm({ reserva_id: '', perro_id: '', tipo: 'medicacion', descripcion: '', hora: '09:00' });
      await loadOperationalData();
    }
    setBusy(false);
  }

  async function disableCareReminder(id: string) {
    setBusy(true);
    const { error } = await supabase.from('recordatorios_cuidado').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) setMessage({ type: 'error', text: error.message });
    else await loadOperationalData();
    setBusy(false);
  }

  const labels: Record<PushState, string> = { checking: 'Comprobando…', unsupported: 'No compatible', inactive: 'Desactivadas', active: 'Activas', denied: 'Permiso bloqueado' };

  return (
    <div className="grid notificationLayout">
      <div className="grid twoCols">
        <section className="card">
          <div className="cardHeaderInline"><h2>Este dispositivo</h2><span className="pill">{labels[state]}</span></div>
          <p>Activa los avisos en cada iPhone o iPad donde quieras recibirlos.</p>
          {!standalone ? <div className="installNotice"><strong>Instala primero la aplicación</strong><span>Abre el menú Compartir y elige “Añadir a pantalla de inicio”. Después abre Perros App desde su icono.</span></div> : null}
          {state === 'denied' ? <StatusMessage type="error" message="El permiso está bloqueado. Actívalo en Ajustes → Notificaciones → Perros App." /> : null}
          {state === 'unsupported' ? <StatusMessage type="error" message="Este navegador no admite Web Push. En iPhone/iPad usa iOS 16.4 o posterior y abre la aplicación desde la pantalla de inicio." /> : null}
          <div className="actionsRow sectionSpacing">
            {state !== 'active' ? <button className="button primary" disabled={busy || state === 'unsupported' || state === 'denied'} onClick={activate}>{busy ? 'Activando…' : 'Activar notificaciones'}</button> : null}
            {state === 'active' ? <button className="button primary" disabled={busy} onClick={sendTest}>{busy ? 'Enviando…' : 'Enviar prueba'}</button> : null}
            {state === 'active' ? <button className="button secondary" disabled={busy} onClick={deactivate}>Desactivar</button> : null}
          </div>
          {message ? <div className="sectionSpacing"><StatusMessage type={message.type} message={message.text} /></div> : null}
        </section>

        <section className="card">
          <h2>Horarios</h2>
          <form className="formGrid" onSubmit={saveSettings}>
            <label>Inicio del descanso<input type="time" value={settings.quietStart} onChange={(event) => setSettings({ ...settings, quietStart: event.target.value })} /></label>
            <label>Fin del descanso<input type="time" value={settings.quietEnd} onChange={(event) => setSettings({ ...settings, quietEnd: event.target.value })} /></label>
            <label>Aviso del mismo día<input type="time" value={settings.dayTime} onChange={(event) => setSettings({ ...settings, dayTime: event.target.value })} /></label>
            <label>Revisión check-in/out<input type="time" value={settings.reviewTime} onChange={(event) => setSettings({ ...settings, reviewTime: event.target.value })} /></label>
            <div className="full"><button className="button primary" disabled={busy}>Guardar horarios</button></div>
          </form>
        </section>
      </div>

      <div className="grid twoCols">
        <section className="card">
          <h2>Cuidados durante una reserva</h2>
          <p className="muted">El texto se propone desde la ficha del perro, pero el horario se configura para cada estancia.</p>
          <form className="formGrid oneColumn" onSubmit={saveCareReminder}>
            <label>Reserva o plan recurrente<select value={selectedGroup?.key ?? ''} onChange={(event) => { const group = reservationGroups.find((item) => item.key === event.target.value); setCareForm({ ...careForm, reserva_id: group?.reservations[0]?.id ?? '', perro_id: '', descripcion: '' }); }}><option value="">Selecciona una reserva</option>{reservationGroups.map((group) => { const item = group.reservations[0]; return <option key={group.key} value={group.key}>{group.seriesId ? '🔁 ' : ''}{reservationDogNames(item)} · Dueño: {reservationOwnerName(item)} · {group.seriesId ? `${group.reservations.length} paseos` : `${formatDate(item.fecha_llegada)}–${formatDate(item.fecha_salida)}`}</option>; })}</select></label>
            {selectedGroup?.seriesId ? <label>Paseo concreto<select value={careForm.reserva_id} onChange={(event) => setCareForm({ ...careForm, reserva_id: event.target.value, perro_id: '', descripcion: '' })}>{selectedGroup.reservations.map((item) => <option key={item.id} value={item.id}>{formatDate(item.fecha_llegada)} · {reservationDogNames(item)}</option>)}</select></label> : null}
            <label>Perro<select value={careForm.perro_id} onChange={(event) => selectCareDog(event.target.value)}><option value="">Selecciona un perro</option>{availableDogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.nombre}</option>)}</select></label>
            <label>Tipo<select value={careForm.tipo} onChange={(event) => selectCareDog(careForm.perro_id, event.target.value as 'medicacion' | 'alimentacion')}><option value="medicacion">Medicación</option><option value="alimentacion">Alimentación</option></select></label>
            <label>Hora<input type="time" value={careForm.hora} onChange={(event) => setCareForm({ ...careForm, hora: event.target.value })} /></label>
            <label>Indicaciones<textarea rows={3} value={careForm.descripcion} onChange={(event) => setCareForm({ ...careForm, descripcion: event.target.value })} /></label>
            <button className="button primary" disabled={busy}>Añadir recordatorio</button>
          </form>
          <div className="listStack sectionSpacing">{careReminders.map((item) => <article className={`listItem ${item.activo ? '' : 'inactiveItem'}`} key={item.id}><div><strong>{item.hora.slice(0, 5)} · {item.perros?.nombre || 'Perro'}</strong><p>{item.descripcion}</p><small>{item.tipo} · Dueño: {reservationOwnerName({ clientes: item.reservas?.clientes })}</small></div>{item.activo ? <button className="textButton dangerTextButton" disabled={busy} onClick={() => disableCareReminder(item.id)}>Desactivar</button> : null}</article>)}</div>
        </section>

        <section className="card">
          <div className="cardHeaderInline"><h2>Centro de avisos</h2><span className="pill">{notifications.filter((item) => item.estado === 'pendiente').length} pendientes</span></div>
          {notifications.length === 0 ? <p className="muted">Todavía no hay avisos programados.</p> : null}
          <div className="listStack">{notifications.map((item) => <article className={`listItem ${['descartada', 'cancelada', 'completada'].includes(item.estado) ? 'inactiveItem' : ''}`} key={item.id}><div><strong>{item.titulo}</strong><p>{item.cuerpo}</p><small>{new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.scheduled_for))} · {item.estado}</small><div className="detailActions">{!['descartada', 'cancelada', 'completada'].includes(item.estado) ? notificationActionOptions(item.tipo).map((action) => <button key={action.id} className="textButton" disabled={busy} onClick={() => runNotificationAction(item.id, action.id)}>{action.label}</button>) : null}</div></div></article>)}</div>
        </section>
      </div>
    </div>
  );
}
