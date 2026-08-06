import webpush from 'web-push';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      noticeId = '',
      titulo, 
      contenido, 
      destinatarioTipo = 'todos', 
      destinatarioValor = 'Todos', 
      filtroEstadoCuenta = 'todos',
      urgente = false 
    } = req.body || {};

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || 'BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'FzDtsnzyMNipx43BpLeKY5pq5YeG66HtMzo_6SFrv_I';
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@haedofutsal.com';

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jmfxxqbtmyzslkrslpvk.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    // Query subscriptions from Supabase REST API
    const subRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!subRes.ok) {
      const errText = await subRes.text();
      return res.status(500).json({ error: 'Error fetching subscriptions from Supabase', details: errText });
    }

    const subscriptions = await subRes.json();

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No push subscriptions found', sent: 0 });
    }

    // Filter target subscriptions
    const targetSubs = subscriptions.filter(sub => {
      // 1. Estado de cuenta filter
      if (filtroEstadoCuenta === 'al_dia' && sub.estado_cuota !== 'al_dia') return false;
      if (filtroEstadoCuenta === 'pendiente' && sub.estado_cuota === 'al_dia') return false;

      const userCat = (sub.categoria || '').toLowerCase();
      const targetVal = (destinatarioValor || '').toLowerCase();

      if (destinatarioTipo === 'disciplina' || destinatarioTipo === 'categoria' || destinatarioTipo === 'subcategoria') {
        const normCat = userCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normDest = targetVal.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (normCat.includes(normDest) || normDest.includes(normCat)) return true;

        const destTokens = normDest.split(/\s+/).filter(t => t.length > 3 && !['futsal', 'futbol', 'bafi', 'edefi'].includes(t));
        return destTokens.some(token => normCat.includes(token));
      }

      return true;
    });

    const pushPayload = JSON.stringify({
      title: `${urgente ? '🚨 URGENTE: ' : ''}${titulo || 'Haedo Futsal App'}`,
      body: contenido || 'Tienes una nueva novedad importante del club.',
      icon: '/logo_192.png',
      badge: '/logo_192.png',
      tag: `notice-${noticeId || Date.now()}`,
      data: {
        url: `/?tab=notices#notices:${noticeId || ''}`,
        noticeId: noticeId || '',
        urgente
      }
    });

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubIds = [];

    await Promise.all(
      targetSubs.map(async (sub) => {
        try {
          const pushConfig = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
          await webpush.sendNotification(pushConfig, pushPayload, {
            TTL: 86400,
            urgency: 'high',
            topic: 'haedo-notice'
          });
          sentCount++;
        } catch (err) {
          failedCount++;
          // If subscription has expired or is invalid (404/410), mark for deletion
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredSubIds.push(sub.id);
          }
        }
      })
    );

    // Delete expired subscriptions silently
    if (expiredSubIds.length > 0) {
      fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=in.(${expiredSubIds.join(',')})`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      totalSubscriptions: subscriptions.length,
      targetedSubscriptions: targetSubs.length,
      sentCount,
      failedCount
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
