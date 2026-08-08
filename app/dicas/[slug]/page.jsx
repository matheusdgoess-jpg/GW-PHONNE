import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPublishedPosts, getContent } from '@/lib/data';
import PostBody from '@/components/PostBody';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://gw-phonne.vercel.app';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Dica não encontrada — GW Phone' };

  return {
    title: `${post.title} — GW Phone`,
    description: post.excerpt || undefined,
    alternates: { canonical: `/dicas/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: `${SITE_URL}/dicas/${post.slug}`,
      type: 'article',
      publishedTime: post.createdAt,
    },
  };
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default async function DicaPage({ params }) {
  const { slug } = await params;
  const [post, content] = await Promise.all([getPostBySlug(slug), getContent()]);

  if (!post) notFound();

  const outras = (await getPublishedPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.createdAt,
    author: { '@type': 'Organization', name: 'GW Phone' },
    publisher: {
      '@type': 'Organization',
      name: 'GW Phone',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}/dicas/${post.slug}`,
  };

  const mensagem = encodeURIComponent(
    `Olá! Li a dica "${post.title}" no site e gostaria de tirar uma dúvida.`,
  );

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header>
        <nav className="wrap">
          <Link className="brand" href="/">
            <img src="/assets/logo.png" alt="Logo GW Phone" />
            GW PHONE
          </Link>
          <div className="navlinks">
            <Link href="/#catalogo">Catálogo</Link>
            <Link href="/dicas">Dicas</Link>
            <Link href="/#localizacao">Localização</Link>
            <Link href="/#contato">Contato</Link>
          </div>
          <Link className="nav-cta" href="/">
            Voltar ao site
          </Link>
        </nav>
      </header>

      <article className="section post-wrap">
        <div className="wrap post-inner">
          <Link className="post-back" href="/dicas">
            ← Todas as dicas
          </Link>
          <span className="post-date mono">{formatarData(post.createdAt)}</span>
          <h1 className="post-title">{post.title}</h1>
          {post.excerpt ? <p className="post-excerpt">{post.excerpt}</p> : null}

          <PostBody body={post.body} />

          <div className="post-cta">
            <h3>Ficou com dúvida no seu caso?</h3>
            <p>
              Cada aparelho é um caso. Manda mensagem que a gente te orienta — e o diagnóstico aqui
              na loja não custa nada.
            </p>
            <div className="btn-row">
              <a
                className="btn btn-wa"
                href={`https://wa.me/${content.contacts.loja}?text=${mensagem}`}
                target="_blank"
                rel="noopener"
              >
                Falar no WhatsApp
              </a>
              <Link className="btn btn-ghost" href="/#catalogo">
                Ver catálogo
              </Link>
            </div>
          </div>

          {outras.length > 0 ? (
            <div className="post-outras">
              <h3>Outras dicas</h3>
              <div className="posts-grid">
                {outras.map((p) => (
                  <Link className="post-card" href={`/dicas/${p.slug}`} key={p.id}>
                    <span className="post-card-date mono">{formatarData(p.createdAt)}</span>
                    <h2>{p.title}</h2>
                    {p.excerpt ? <p>{p.excerpt}</p> : null}
                    <span className="post-card-link">Ler dica →</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </article>

      <footer>
        <div className="wrap footer-row">
          <Link className="footer-brand" href="/">
            <img src="/assets/logo.png" alt="GW Phone" />
            GW Phone
          </Link>
          <div className="footer-links">
            <Link href="/#catalogo">Catálogo</Link>
            <Link href="/dicas">Dicas</Link>
            <Link href="/#localizacao">Localização</Link>
          </div>
          <span className="slogan">GW Phone, cada detalhe importa.</span>
        </div>
      </footer>
    </>
  );
}
