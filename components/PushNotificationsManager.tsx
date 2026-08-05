'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatusMessage } from './StatusMessage';

type PushState = 'checking' | 'unsupported' | 'inactive' | 'active' | 'denied';

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PushNotificationsManager() {
  const [state, setState] = useState<PushState>('checking');
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  }, []);

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
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.valor),
      });
      const serialized = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userData.user.id,
        endpoint: subscription.endpoint,
        p256dh: serialized.keys?.p256dh,
        auth_key: serialized.keys?.auth,
        device_name: `${navigator.platform || 'Dispositivo'} · ${navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('iPad') ? 'iPad' : 'Navegador'}`,
        active: true,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' });
      if (error) throw error;
      setState('active');
      setMessage({ type: 'success', text: 'Notificaciones activadas en este dispositivo.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'No se pudieron activar las notificaciones.' });
    } finally {
      setBusy(false);
    }
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
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke('push-test', {
      body: { title: 'Perros App', body: 'Las notificaciones funcionan correctamente.', url: '/notificaciones/' },
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: `Notificación enviada a ${data?.sent ?? 0} dispositivo(s).` });
    setBusy(false);
  }

  const labels: Record<PushState, string> = {
    checking: 'Comprobando…', unsupported: 'No compatible', inactive: 'Desactivadas', active: 'Activas', denied: 'Permiso bloqueado',
  };

  return (
    <div className="grid twoCols">
      <section className="card">
        <div className="cardHeaderInline"><h2>Este dispositivo</h2><span className="pill">{labels[state]}</span></div>
        <p>Activa los avisos en cada iPhone o iPad donde quieras recibirlos.</p>
        {!standalone ? <div className="installNotice"><strong>Instala primero la aplicación</strong><span>Abre el menú Compartir y elige “Añadir a pantalla de inicio”. Después abre Perros App desde su icono.</span></div> : null}
        {state === 'denied' ? <StatusMessage type="error" message="El permiso está bloqueado. Actívalo en Ajustes → Notificaciones → Perros App." /> : null}
        {state === 'unsupported' ? <StatusMessage type="error" message="Este navegador no admite Web Push. En iPhone/iPad usa iOS 16.4 o posterior y abre la aplicación desde la pantalla de inicio." /> : null}
        <div className="actionsRow sectionSpacing">
          {state !== 'active' ? <button className="button primary" disabled={busy || state === 'unsupported' || state === 'denied'} onClick={activate}>{busy ? 'Activando…' : 'Activar notificaciones'}</button> : null}
          {state === 'active' ? <button className="button primary" disabled={busy} onClick={sendTest}>{busy ? 'Enviando…' : 'Enviar notificación de prueba'}</button> : null}
          {state === 'active' ? <button className="button secondary" disabled={busy} onClick={deactivate}>Desactivar</button> : null}
        </div>
        {message ? <StatusMessage type={message.type} message={message.text} /> : null}
      </section>
      <section className="card">
        <h2>Próximos avisos</h2>
        <p className="muted">En este primer hito validaremos la recepción en iPhone y iPad.</p>
        <ul className="featureList">
          <li>Nuevas reservas y modificaciones</li>
          <li>Cancelaciones</li>
          <li>Entradas y salidas próximas</li>
          <li>Cuidados o medicación especial</li>
        </ul>
      </section>
    </div>
  );
}
