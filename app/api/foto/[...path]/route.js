import { get } from '@vercel/blob';

// Entrega as fotos do catálogo para o público. O armazenamento é privado, então
// a imagem não pode ser acessada direto: passa por aqui.
//
// Só servimos o que está dentro de "catalog/" — assim esta rota nunca vira uma
// porta para o resto do armazenamento, mesmo que algo sensível vá parar lá.
const PASTA_PERMITIDA = 'catalog/';

export async function GET(_req, { params }) {
  const { path } = await params;
  const pathname = (Array.isArray(path) ? path : [path]).join('/');

  if (!pathname.startsWith(PASTA_PERMITIDA) || pathname.includes('..')) {
    return new Response('Não encontrado', { status: 404 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return new Response('Não encontrado', { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'image/jpeg',
        // O nome do arquivo é único e nunca é reaproveitado, então pode ficar
        // em cache para sempre — o cliente baixa a foto uma vez só.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    if (err?.name !== 'BlobNotFoundError') {
      console.error('Falha ao entregar foto:', err);
    }
    return new Response('Não encontrado', { status: 404 });
  }
}
