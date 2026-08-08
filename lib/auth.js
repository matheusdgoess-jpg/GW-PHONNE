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
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  if (!validUser || !validPass) return false;
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  return safeEqual(username, validUser) && safeEqual(password, validPass);
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
