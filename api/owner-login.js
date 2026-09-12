const SUPABASE_URL = 'https://nzxbhsibanwpcezupuiy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tpyDa20cPpevcSosyVBoew_kZd0EawF';
const OWNER_LOGIN = 'ceoimgtech';

module.exports = async function ownerLogin(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const login = String(request.body?.login || '').trim().toLowerCase();
  const password = String(request.body?.password || '');
  const ownerEmail = process.env.OWNER_AUTH_EMAIL;

  if (!ownerEmail || login !== OWNER_LOGIN || password.length < 6) {
    return response.status(401).json({ error: 'Acesso não autorizado.' });
  }

  try {
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: ownerEmail, password })
    });
    const auth = await authResponse.json();

    if (!authResponse.ok || !auth.access_token || !auth.refresh_token) {
      return response.status(401).json({ error: 'Acesso não autorizado.' });
    }

    return response.status(200).json({
      access_token: auth.access_token,
      refresh_token: auth.refresh_token
    });
  } catch {
    return response.status(503).json({ error: 'Serviço temporariamente indisponível.' });
  }
};
