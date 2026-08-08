import { getContent, getCatalog } from '@/lib/data';
import ScrollReveal from '@/components/ScrollReveal';
import HeroGlow from '@/components/HeroGlow';
import ContactTabs from '@/components/ContactTabs';
import CatalogSection from '@/components/CatalogSection';
import CartProvider from '@/components/CartProvider';
import CartButton from '@/components/CartButton';

// Conteúdo e catálogo vêm do Blob e podem mudar a qualquer momento pelo
// painel /admin — sempre renderiza fresco, sem cache estático de build.
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://gw-phonne.vercel.app';

export default async function HomePage() {
  const [content, catalog] = await Promise.all([getContent(), getCatalog()]);
  const { address, hours, contacts, instagram, faq } = content;

  // Dados estruturados básicos (sem horário — o texto do horário é livre no
  // painel e não dá pra converter com segurança pro formato exigido pelo
  // schema.org sem risco de gerar algo incorreto).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: 'GW Phone',
    image: `${SITE_URL}/assets/logo.png`,
    url: SITE_URL,
    telephone: `+${contacts.loja}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${address.street} - ${address.complement}`,
      addressLocality: address.city.split(',')[0]?.trim() || address.city,
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  };

  return (
    <CartProvider whatsapp={contacts.loja}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollReveal />

      <header>
        <nav className="wrap">
          <div className="brand">
            <img src="/assets/logo.png" alt="Logo GW Phone" />
            GW PHONE
          </div>
          <div className="navlinks">
            <a href="#catalogo">Catálogo</a>
            <a href="#servicos">Serviços</a>
            <a href="#localizacao">Localização</a>
            <a href="#faq">FAQ</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="nav-actions">
            <CartButton />
            <a className="nav-cta" href={instagram} target="_blank" rel="noopener">
              Instagram
            </a>
          </div>
        </nav>
      </header>

      <section className="hero" id="hero-section">
        <HeroGlow />
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              Botucatu · SP
            </span>
            <h1>
              Loja e assistência técnica especializada <span className="serif-em">Apple</span>
            </h1>
            <p className="lede">
              Vendemos iPhones novos e seminovos e fazemos reparo especializado — tela, bateria,
              câmera e diagnóstico completo. Traz aqui que a gente analisa o seu celular.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#catalogo">
                Ver catálogo
              </a>
              <a className="btn btn-ghost" href="#servicos">
                Ver serviços
              </a>
              <a className="btn btn-ghost" href={`https://wa.me/${contacts.loja}`} target="_blank" rel="noopener">
                Chamar no WhatsApp
              </a>
            </div>
            <div className="trust-row">
              <span className="trust-badge">Diagnóstico antes do orçamento</span>
              <span className="trust-badge">Peças de qualidade</span>
              <span className="trust-badge">Ordem de serviço em todo atendimento</span>
            </div>
          </div>
          <div className="hero-mark">
            <div className="ring" />
            <div className="ring-2" />
            <img src="/assets/logo.png" alt="GW Phone" />
          </div>
        </div>
      </section>

      <section className="section" id="catalogo">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Vitrine</span>
              <h2>Catálogo de iPhones.</h2>
            </div>
            <p>
              Toque na seta para abrir. Monte seu carrinho e envie tudo de uma vez pelo WhatsApp.
            </p>
          </div>
          <CatalogSection items={catalog} whatsapp={contacts.loja} />
        </div>
      </section>

      <section className="section" id="servicos">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">O que fazemos</span>
              <h2>Duas frentes, um padrão de trabalho.</h2>
            </div>
            <p>Cada aparelho que entra aqui passa por diagnóstico antes de qualquer orçamento — sem achismo.</p>
          </div>

          <div className="accordion reveal">
            <details className="acc-item" name="services" open>
              <summary className="acc-header">
                <span className="acc-num mono">01</span>
                <span className="acc-title">Venda de iPhones</span>
                <span className="acc-icon" />
              </summary>
              <div className="acc-panel">
                <p>Aparelhos novos, lacrados, e seminovos revisados, com procedência verificada.</p>
                <ul>
                  <li>iPhones novos com garantia</li>
                  <li>Seminovos testados e revisados</li>
                  <li>Avaliação do seu aparelho usado</li>
                </ul>
              </div>
            </details>

            <details className="acc-item" name="services">
              <summary className="acc-header">
                <span className="acc-num mono">02</span>
                <span className="acc-title">Assistência técnica especializada</span>
                <span className="acc-icon" />
              </summary>
              <div className="acc-panel">
                <p>Reparo focado em Apple, com peças de qualidade e ordem de serviço para cada atendimento.</p>
                <ul>
                  <li>Troca de tela e vidro</li>
                  <li>Troca de bateria</li>
                  <li>Câmera, conector e placa</li>
                </ul>
              </div>
            </details>

            <details className="acc-item" name="services">
              <summary className="acc-header">
                <span className="acc-num mono">03</span>
                <span className="acc-title">Diagnóstico</span>
                <span className="acc-icon" />
              </summary>
              <div className="acc-panel">
                <p>Antes de fechar qualquer serviço, avaliamos o aparelho e explicamos o problema real.</p>
                <ul>
                  <li>Laudo técnico claro</li>
                  <li>Orçamento sem compromisso</li>
                  <li>Prazo definido na entrada</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="section" id="prazos">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Tempo de espera</span>
              <h2>Prazos médios de reparo.</h2>
            </div>
            <p>Prazo confirmado após o diagnóstico — esses são os tempos mais comuns.</p>
          </div>

          <div className="timeline reveal">
            <div className="timeline-item">
              <span className="mono time-tag">Mesmo dia</span>
              <h3>Troca de tela</h3>
              <p>Serviço mais comum — na maioria dos casos entregamos no mesmo dia.</p>
            </div>
            <div className="timeline-item">
              <span className="mono time-tag">Mesmo dia</span>
              <h3>Troca de bateria</h3>
              <p>Rápido, com aparelho testado antes da entrega.</p>
            </div>
            <div className="timeline-item">
              <span className="mono time-tag">1 a 2 dias</span>
              <h3>Câmera e conector</h3>
              <p>Depende da peça em estoque no momento do orçamento.</p>
            </div>
            <div className="timeline-item">
              <span className="mono time-tag">A combinar</span>
              <h3>Placa e reparos complexos</h3>
              <p>Prazo definido junto com você depois do diagnóstico completo.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="localizacao">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Onde estamos</span>
              <h2>Localização e horário de atendimento.</h2>
            </div>
            <p>Atendimento presencial, com hora marcada ou passando direto na loja.</p>
          </div>

          <div className="ticket-wrap reveal">
            <div className="ticket">
              <div className="ticket-head">
                <span className="label">Ordem de serviço · GWP</span>
                <span className="stamp">ABERTO</span>
              </div>
              <h3>Endereço</h3>
              <p className="addr">
                <strong>{address.street}</strong>
                <br />
                {address.complement} — {address.city}
              </p>

              <h3>Horário de funcionamento</h3>
              <div className="hours">
                {hours.map((h) => (
                  <div className="hours-row" key={h.day}>
                    <span className="day">{h.day}</span>
                    <span className={`time ${h.closed ? 'closed' : ''}`}>{h.time}</span>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 24 }}>Contato</h3>
              <div className="hours">
                <div className="hours-row">
                  <span className="day">Contato do técnico</span>
                  <a className="time" href={`tel:+${contacts.tecnico}`}>
                    {contacts.tecnico}
                  </a>
                </div>
                <div className="hours-row">
                  <span className="day">Contato da loja</span>
                  <a className="time" href={`tel:+${contacts.loja}`}>
                    {contacts.loja}
                  </a>
                </div>
              </div>
            </div>

            <div className="map-frame">
              <span className="map-tag">
                📍 {address.street} — {address.complement}
              </span>
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${address.street}, ${address.city}`)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa GW Phone"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contato">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Fale com a gente</span>
              <h2>Contato direto.</h2>
            </div>
            <p>Escolha quem você precisa chamar — técnico ou loja.</p>
          </div>

          <ContactTabs tecnico={contacts.tecnico} loja={contacts.loja} />
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="section-tag">Dúvidas comuns</span>
              <h2>Perguntas frequentes.</h2>
            </div>
            <p>Se não achar sua dúvida aqui, chama a gente no WhatsApp.</p>
          </div>

          <div className="accordion reveal">
            {faq.map((item, i) => (
              <details className="acc-item" name="faq" key={i}>
                <summary className="acc-header">
                  <span className="acc-num mono">Q{i + 1}</span>
                  <span className="acc-title">{item.q}</span>
                  <span className="acc-icon" />
                </summary>
                <div className="acc-panel">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-strip">
        <div className="wrap reveal">
          <h2>Cada detalhe importa.</h2>
          <p>
            Fala com a gente pelo Instagram ou passa na loja em horário comercial — traz aqui que a
            gente analisa o seu celular.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href={instagram} target="_blank" rel="noopener">
              @gwphonne no Instagram
            </a>
            <a className="btn btn-ghost" href="#localizacao">
              Como chegar
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-row">
          <div className="footer-brand">
            <img src="/assets/logo.png" alt="GW Phone" />
            GW Phone
          </div>
          <div className="footer-links">
            <a href="#catalogo">Catálogo</a>
            <a href="#servicos">Serviços</a>
            <a href="#localizacao">Localização</a>
            <a href={instagram} target="_blank" rel="noopener">
              Instagram
            </a>
          </div>
          <span className="slogan">GW Phone, cada detalhe importa.</span>
        </div>
      </footer>

      <a
        className="wa-float"
        href={`https://wa.me/${contacts.loja}`}
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
    </CartProvider>
  );
}
