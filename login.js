const $ = selector => document.querySelector(selector);
const OWNER_LOGIN = 'ceoimgtech';
const client = window.supabase.createClient(
  window.GW_SUPABASE.url,
  window.GW_SUPABASE.publishableKey,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

async function redirectAuthenticatedUser() {
  const { data } = await client.auth.getSession();
  if (!data.session) return;
  const { data: member } = await client.from('team_members').select('active,roles').eq('user_id', data.session.user.id).maybeSingle();
  if (member?.active && member.roles?.includes('admin')) location.replace('admin.html');
  else await client.auth.signOut();
}

redirectAuthenticatedUser();

$('#show-password').addEventListener('click', () => {
  const input = $('#company-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

$('#company-login').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#access-submit');
  const errorBox = $('#access-error');
  const login = $('#company-id').value.trim().toLowerCase();
  const password = $('#company-password').value;

  errorBox.textContent = '';
  if (login !== OWNER_LOGIN) {
    errorBox.textContent = 'Este painel é exclusivo do proprietário da IMG TECH.';
    return;
  }
  button.disabled = true;
  button.querySelector('span').textContent = 'Verificando acesso...';

  let response;
  let payload;
  try {
    response = await fetch('/api/owner-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    payload = await response.json();
  } catch {
    payload = { error: 'Não foi possível conectar ao acesso seguro.' };
  }

  const error = !response?.ok ? payload?.error || 'Acesso não autorizado.' : null;
  if (error) {
    errorBox.textContent = response?.status === 401
      ? 'Identificador ou senha incorretos.'
      : 'Não foi possível entrar agora. Verifique a conexão e tente novamente.';
    button.disabled = false;
    button.querySelector('span').textContent = 'Entrar no painel';
    return;
  }

  const { data, error: sessionError } = await client.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  });
  if (sessionError || !data.user) {
    errorBox.textContent = 'Não foi possível iniciar a sessão segura.';
    button.disabled = false;
    button.querySelector('span').textContent = 'Entrar no painel';
    return;
  }

  const { data: member } = await client.from('team_members').select('active,roles').eq('user_id', data.user.id).maybeSingle();
  if (!member?.active || !member.roles?.includes('admin')) {
    await client.auth.signOut();
    errorBox.textContent = 'Acesso administrativo não autorizado.';
    button.disabled = false;
    button.querySelector('span').textContent = 'Entrar no painel';
    return;
  }

  location.replace('admin.html');
});
