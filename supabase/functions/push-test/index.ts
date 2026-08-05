import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Falta la sesión de usuario.');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return Response.json({ error: 'No autorizado.' }, { status: 401, headers: corsHeaders });

    const admin = createClient(url, serviceKey);
    const { data: subscriptions, error } = await admin.from('push_subscriptions').select('*').eq('user_id', userData.user.id).eq('active', true);
    if (error) throw error;
    const payload = await request.json().catch(() => ({}));
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) throw new Error('Las claves VAPID no están configuradas.');
    webpush.setVapidDetails('mailto:admin@app-cuidado-perros.pages.dev', publicKey, privateKey);

    let sent = 0;
    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
        }, JSON.stringify({
          title: payload.title || 'Perros App',
          body: payload.body || 'Las notificaciones funcionan correctamente.',
          url: payload.url || '/notificaciones/',
          tag: 'push-test',
        }));
        sent += 1;
      } catch (sendError: any) {
        if ([404, 410].includes(sendError?.statusCode)) {
          await admin.from('push_subscriptions').update({ active: false, updated_at: new Date().toISOString() }).eq('id', subscription.id);
        } else throw sendError;
      }
    }
    return Response.json({ sent }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Error enviando la notificación.' }, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export default {
  fetch: handleRequest,
};
