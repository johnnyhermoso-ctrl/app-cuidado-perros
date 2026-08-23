import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type NotificationItem = {
  id: string;
  reserva_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string;
};

type NotificationAction = { action: string; title: string; url: string };

function actionUrl(notificationId: string, action: string) {
  return `/notificaciones/?notificacion=${notificationId}&accion=${action}`;
}

function notificationActions(item: NotificationItem): NotificationAction[] {
  if (item.tipo === 'cuidado') {
    return [
      { action: 'posponer', title: 'Posponer 30 min', url: actionUrl(item.id, 'posponer') },
      { action: 'descartar', title: 'Descartar', url: actionUrl(item.id, 'descartar') },
    ];
  }
  if (item.tipo === 'cobro_pendiente') {
    return [
      { action: 'marcar_cobrado', title: 'Marcar cobrado', url: actionUrl(item.id, 'marcar_cobrado') },
      { action: 'posponer', title: 'Posponer 24 h', url: actionUrl(item.id, 'posponer') },
      { action: 'descartar', title: 'Descartar', url: actionUrl(item.id, 'descartar') },
    ];
  }
  if (item.tipo === 'checkin_atrasado' || item.tipo === 'checkout_atrasado') {
    const action = item.tipo === 'checkin_atrasado' ? 'confirmar_checkin' : 'confirmar_checkout';
    return [
      { action, title: item.tipo === 'checkin_atrasado' ? 'Confirmar check-in' : 'Confirmar check-out', url: actionUrl(item.id, action) },
      { action: 'posponer', title: 'Posponer 24 h', url: actionUrl(item.id, 'posponer') },
      { action: 'descartar', title: 'Descartar', url: actionUrl(item.id, 'descartar') },
    ];
  }
  return [{ action: 'descartar', title: 'Descartar', url: actionUrl(item.id, 'descartar') }];
}

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok');
  const expectedSecret = Deno.env.get('NOTIFICATION_CRON_SECRET');
  if (!expectedSecret || request.headers.get('x-cron-secret') !== expectedSecret) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) throw new Error('Las claves VAPID no están configuradas.');

    const admin = createClient(url, serviceKey);
    const { error: scheduleError } = await admin.rpc('programar_notificaciones_operativas');
    if (scheduleError) throw scheduleError;

    const [{ data: notifications, error: notificationError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      admin.from('notificaciones_operativas').select('id,reserva_id,tipo,titulo,cuerpo').eq('estado', 'pendiente').lte('scheduled_for', new Date().toISOString()).order('scheduled_for').limit(50),
      admin.from('push_subscriptions').select('*').eq('active', true),
    ]);
    if (notificationError || subscriptionError) throw notificationError || subscriptionError;

    webpush.setVapidDetails('mailto:admin@app-cuidado-perros.pages.dev', publicKey, privateKey);
    let sentNotifications = 0;
    let sentDevices = 0;

    for (const notification of (notifications ?? []) as NotificationItem[]) {
      const actions = notificationActions(notification);
      const defaultUrl = notification.reserva_id
        ? `/reservas/?reserva=${notification.reserva_id}`
        : `/notificaciones/?notificacion=${notification.id}`;
      let delivered = false;

      for (const subscription of subscriptions ?? []) {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
          }, JSON.stringify({
            title: notification.titulo,
            body: notification.cuerpo,
            url: defaultUrl,
            tag: `operativa-${notification.id}`,
            renotify: true,
            actions,
          }));
          delivered = true;
          sentDevices += 1;
        } catch (sendError: any) {
          if ([404, 410].includes(sendError?.statusCode)) {
            await admin.from('push_subscriptions').update({ active: false, updated_at: new Date().toISOString() }).eq('id', subscription.id);
          } else {
            console.error('Error enviando push', notification.id, sendError?.message || sendError);
          }
        }
      }

      if (delivered) {
        await admin.from('notificaciones_operativas').update({ estado: 'enviada', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', notification.id);
        sentNotifications += 1;
      }
    }

    return Response.json({ queued: notifications?.length ?? 0, sentNotifications, sentDevices });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Error procesando notificaciones.' }, { status: 500 });
  }
}

export default { fetch: handleRequest };
