import { put, list, del } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { DEFAULT_POSTS } from './posts-default';

const CONTENT_PATH = 'data/content.json';
const CATALOG_PATH = 'data/catalog.json';
const POSTS_PATH = 'data/posts.json';

// Conteúdo padrão — usado até o admin salvar algo pelo painel.
export const DEFAULT_CONTENT = {
  address: {
    street: 'Rua Brás de Assis, 58',
    complement: 'Sala C',
    city: 'Botucatu, SP',
  },
  hours: [
    { day: 'Segunda a sexta', time: '09h às 18h', closed: false },
    { day: 'Sábado', time: '09h às 14h', closed: false },
    { day: 'Domingo', time: 'Fechado', closed: true },
  ],
  contacts: {
    tecnico: '5514981328577',
    loja: '5514981397115',
  },
  instagram: 'https://www.instagram.com/gwphonne',
  faq: [
    {
      q: 'Vocês dão garantia nos reparos?',
      a: 'Sim. Todo serviço sai com ordem de serviço detalhando o que foi feito e o prazo de garantia da peça e da mão de obra.',
    },
    {
      q: 'Preciso agendar ou posso passar direto na loja?',
      a: 'Pode passar direto no horário de funcionamento. Se preferir garantir prioridade, chama antes no WhatsApp.',
    },
    {
      q: 'O orçamento tem custo?',
      a: 'Não. Fazemos o diagnóstico e passamos o valor antes de qualquer serviço — você decide se aprova.',
    },
    {
      q: 'Vocês compram meu iPhone usado?',
      a: 'Sim, avaliamos o aparelho na hora e damos o valor de compra ou troca por outro modelo.',
    },
    {
      q: 'Quais formas de pagamento vocês aceitam?',
      a: 'Pix, cartão e dinheiro. Consulte condições de parcelamento direto na loja.',
    },
  ],
};

async function readJSON(pathname, fallback) {
  try {
    const { blobs } = await list({ prefix: pathname, limit: 10 });
    const match = blobs.find((b) => b.pathname === pathname);
    if (!match) return fallback;
    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch (err) {
    console.error(`Falha ao ler ${pathname} do Blob:`, err);
    return fallback;
  }
}

async function writeJSON(pathname, data) {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export async function getContent() {
  const stored = await readJSON(CONTENT_PATH, null);
  if (!stored) return DEFAULT_CONTENT;
  return {
    ...DEFAULT_CONTENT,
    ...stored,
    address: { ...DEFAULT_CONTENT.address, ...(stored.address || {}) },
    contacts: { ...DEFAULT_CONTENT.contacts, ...(stored.contacts || {}) },
    hours: Array.isArray(stored.hours) ? stored.hours : DEFAULT_CONTENT.hours,
    faq: Array.isArray(stored.faq) ? stored.faq : DEFAULT_CONTENT.faq,
  };
}

export async function saveContent(content) {
  await writeJSON(CONTENT_PATH, content);
  return content;
}

// Linha completa iPhone 11 → 17 Pro Max, já cadastrada pro cliente ver a vitrine
// completa assim que o site abre. Preço fica "Consulte" (sem valor inventado)
// até o lojista definir o valor real de cada aparelho pelo painel /admin.
const IPHONE_LINEUP = [
  ['iPhone 17 Pro Max', 'novo'],
  ['iPhone 17 Pro', 'novo'],
  ['iPhone 17', 'novo'],
  ['iPhone 16e', 'novo'],
  ['iPhone 16 Pro Max', 'novo'],
  ['iPhone 16 Pro', 'novo'],
  ['iPhone 16 Plus', 'novo'],
  ['iPhone 16', 'novo'],
  ['iPhone 15 Pro Max', 'seminovo'],
  ['iPhone 15 Pro', 'seminovo'],
  ['iPhone 15 Plus', 'seminovo'],
  ['iPhone 15', 'seminovo'],
  ['iPhone 14 Pro Max', 'seminovo'],
  ['iPhone 14 Pro', 'seminovo'],
  ['iPhone 14 Plus', 'seminovo'],
  ['iPhone 14', 'seminovo'],
  ['iPhone 13 Pro Max', 'seminovo'],
  ['iPhone 13 Pro', 'seminovo'],
  ['iPhone 13', 'seminovo'],
  ['iPhone 13 Mini', 'seminovo'],
  ['iPhone 12 Pro Max', 'seminovo'],
  ['iPhone 12 Pro', 'seminovo'],
  ['iPhone 12', 'seminovo'],
  ['iPhone 12 Mini', 'seminovo'],
  ['iPhone 11 Pro Max', 'seminovo'],
  ['iPhone 11 Pro', 'seminovo'],
  ['iPhone 11', 'seminovo'],
];

export function buildDefaultCatalog() {
  const now = Date.now();
  return IPHONE_LINEUP.map(([model, condition], i) => ({
    id: `seed-${model.toLowerCase().replace(/\s+/g, '-')}`,
    model,
    storage: '',
    condition,
    price: 0,
    description: '',
    imageUrl: '',
    available: true,
    createdAt: new Date(now - i * 1000).toISOString(),
  }));
}

export async function getCatalog() {
  const stored = await readJSON(CATALOG_PATH, null);
  return stored || buildDefaultCatalog();
}

async function saveCatalogList(items) {
  await writeJSON(CATALOG_PATH, items);
  return items;
}

function sanitizeItem(input, existing = {}) {
  const item = { ...existing };
  if (input.model !== undefined) item.model = String(input.model).trim();
  if (input.storage !== undefined) item.storage = String(input.storage).trim();
  if (input.condition !== undefined) {
    item.condition = input.condition === 'novo' ? 'novo' : 'seminovo';
  }
  if (input.price !== undefined) {
    const n = Number(input.price);
    item.price = Number.isFinite(n) ? n : 0;
  }
  if (input.description !== undefined) item.description = String(input.description).trim();
  if (input.imageUrl !== undefined) item.imageUrl = String(input.imageUrl);
  if (input.available !== undefined) item.available = Boolean(input.available);
  return item;
}

export async function addCatalogItem(input) {
  const items = await getCatalog();
  const newItem = {
    id: randomUUID(),
    model: '',
    storage: '',
    condition: 'seminovo',
    price: 0,
    description: '',
    imageUrl: '',
    available: true,
    createdAt: new Date().toISOString(),
    ...sanitizeItem(input),
  };
  items.unshift(newItem);
  await saveCatalogList(items);
  return newItem;
}

export async function updateCatalogItem(id, input) {
  const items = await getCatalog();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Item não encontrado');
  items[idx] = sanitizeItem(input, items[idx]);
  await saveCatalogList(items);
  return items[idx];
}

export async function deleteCatalogItem(id) {
  const items = await getCatalog();
  const target = items.find((i) => i.id === id);
  const filtered = items.filter((i) => i.id !== id);
  await saveCatalogList(filtered);
  if (target?.imageUrl?.includes('.public.blob.vercel-storage.com')) {
    try {
      await del(target.imageUrl);
    } catch (err) {
      console.error('Falha ao apagar imagem do Blob (ignorado):', err);
    }
  }
  return true;
}

export async function uploadImage(file) {
  const rawExt = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : 'jpg';
  const pathname = `catalog/${randomUUID()}.${ext}`;
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type || 'image/jpeg',
  });
  return blob.url;
}

/* ---------------- DICAS (blog) ---------------- */

// ̀-ͯ é a faixa dos acentos separados pelo normalize('NFD').
const ACENTOS = /[̀-ͯ]/g;

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function getPosts() {
  const stored = await readJSON(POSTS_PATH, null);
  return stored || DEFAULT_POSTS;
}

export async function getPublishedPosts() {
  const posts = await getPosts();
  return posts
    .filter((p) => p.published !== false)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function getPostBySlug(slug) {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug && p.published !== false) || null;
}

async function savePostList(posts) {
  await writeJSON(POSTS_PATH, posts);
  return posts;
}

function sanitizePost(input, existing, todos, id) {
  const post = { ...existing };
  if (input.title !== undefined) post.title = String(input.title).trim();
  if (input.excerpt !== undefined) post.excerpt = String(input.excerpt).trim();
  if (input.body !== undefined) post.body = String(input.body);
  if (input.published !== undefined) post.published = Boolean(input.published);

  // O endereço da dica sai do título, mas não pode repetir: dois textos com o
  // mesmo endereço fariam um deles sumir do ar.
  const base = slugify(input.slug || post.slug || post.title || 'dica') || 'dica';
  if (base !== existing.slug) {
    let candidato = base;
    let n = 2;
    while (todos.some((p) => p.slug === candidato && p.id !== id)) {
      candidato = `${base}-${n++}`;
    }
    post.slug = candidato;
  }
  return post;
}

export async function addPost(input) {
  const posts = await getPosts();
  const id = randomUUID();
  const novo = {
    id,
    title: '',
    excerpt: '',
    body: '',
    published: true,
    createdAt: new Date().toISOString(),
    ...sanitizePost(input, {}, posts, id),
  };
  posts.unshift(novo);
  await savePostList(posts);
  return novo;
}

export async function updatePost(id, input) {
  const posts = await getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Dica não encontrada');
  posts[idx] = sanitizePost(input, posts[idx], posts, id);
  await savePostList(posts);
  return posts[idx];
}

export async function deletePost(id) {
  const posts = await getPosts();
  await savePostList(posts.filter((p) => p.id !== id));
  return true;
}
