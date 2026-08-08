import { SignJWT, jwtVerify } from 'jose';

// Nada de import de 'crypto' aqui — este módulo roda tanto no middleware
// (Edge Runtime, sem módulos nativos do Node) quanto nas rotas de API.

export const SESSION_COOKIE = 'gwp_session';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET não configurado nas variáveis de ambiente da Vercel.');
  }
  return new TextEncoder().encode(secret);
}

// Comparação em tempo constante, portátil (funciona em Edge e Node).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function checkCredentials(username, password) {
  // .trim() nos valores de ambiente: colar no painel da Vercel costuma deixar
  // um espaço ou quebra de linha invisível grudado no fim, e isso não faz
  // parte da senha que o lojista quis definir.
  const validUser = (process.env.ADMIN_USERNAME || '').trim();
  const validPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (!validUser || !validPass) return false;
  if (typeof username !== 'string' || typeof password !== 'string') return false;

  const userOk = safeEqual(username.trim(), validUser);
  const passOk = safeEqual(password.trim(), validPass);

  // DIAGNÓSTICO TEMPORÁRIO — remover assim que o login for confirmado.
  // Só registra se conferiu e o tamanho, nunca os valores em si.
  if (!userOk || !passOk) {
    console.warn('[login] tentativa recusada', {
      usuarioConfere: userOk,
      senhaConfere: passOk,
      tamanhoUsuarioDigitado: username.trim().length,
      tamanhoUsuarioConfigurado: validUser.length,
      tamanhoSenhaDigitada: password.trim().length,
      tamanhoSenhaConfigurada: validPass.length,
    });
  }

  return userOk && passOk;
}

export async function createSessionToken(username) {
  return await new SignJWT({ role: 'admin', username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload?.role === 'admin';
  } catch {
    return false;
  }
}
