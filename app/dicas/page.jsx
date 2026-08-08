import Link from 'next/link';
import { getPublishedPosts, getContent } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dicas sobre iPhone — GW Phone Botucatu',
  description:
    'Dicas práticas sobre bateria, tela quebrada, aparelho molhado e compra de seminovos, escritas pela assistência técnica GW Phone em Botucatu-SP.',
  alternates: { canonical: '/dicas' },
  openGraph: {
    title: 'Dicas sobre iPhone — GW Phone',
    description:
      'Bateria, tela quebrada, aparelho molhado e compra de seminovos: o que a assistência recomenda.',
    url: 'https://gw-phonne.vercel.app/dicas',
    type: 'website',
  },
};

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

export default async function DicasPage() {
  const [posts, content] = await Promise.all([getPublishedPosts(), getContent()]);

  return (
    <>
      <header>
        <nav className="wrap">
          <Link className="brand" href="/">
            <img src="/assets/logo.png" alt="Logo GW Phone" />
            GW PHONE
          </Link>
          <div className="navlinks">
            <Link href="/#catalogo">Catálogo</Link>
            <Link href="/#servicos">Serviços</Link>
            <Link href="/#localizacao">Localização</Link>
            <Link href="/#contato">Contato</Link>
          </div>
          <Link className="nav-cta" href="/">
            Voltar ao site
          </Link>
        </nav>
      </header>

      <section className="section dicas-hero">
        <div className="wrap">
          <span className="section-tag">Dicas</span>
          <h1 className="dicas-title">
            O que a gente aprende <span className="serif-em">consertando</span> todo dia.
          </h1>
          <p className="dicas-lede">
            Conteúdo escrito pela nossa bancada, sem enrolação. Se a sua dúvida não estiver aqui,
            chama a gente no WhatsApp.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {posts.length === 0 ? (
            <p className="catalog-empty">Nenhuma dica publicada ainda.</p>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <Link className="post-card" href={`/dicas/${post.slug}`} key={post.id}>
                  <span className="post-card-date mono">{formatarData(post.createdAt)}</span>
                  <h2>{post.title}</h2>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                  <span className="post-card-link">Ler dica →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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

      <a
        className="wa-float"
        href={`https://wa.me/${content.contacts.loja}`}
        target="_blank"
        rel="noopener"
        aria-label="Chamar no WhatsApp"
      >
        <span className="wa-pulse" />
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.26-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.83 2 .9 2.15.07.15.11.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.37-.41.5-.14.15-.28.3-.12.6.16.29.71 1.18 1.53 1.91 1.05.94 1.94 1.24 2.23 1.38.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.15.26.1 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
        </svg>
        <span className="wa-label">Chamar no WhatsApp</span>
      </a>
    </>
  );
}
