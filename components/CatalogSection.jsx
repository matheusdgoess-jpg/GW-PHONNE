'use client';
import { useMemo, useState } from 'react';
import { useCart } from './CartProvider';
import { conditionLabel } from '@/lib/format';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'novo', label: 'Novos' },
  { key: 'seminovo', label: 'Seminovos' },
];

function PhonePlaceholder() {
  return (
    <svg className="ph-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="6" y="2" width="12" height="20" rx="2.4" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

export default function CatalogSection({ items, whatsapp }) {
  const [filter, setFilter] = useState('todos');
  // Catálogo começa recolhido: quem quiser ver, abre pela seta.
  const [aberto, setAberto] = useState(false);
  const { addItem, items: noCarrinho } = useCart();

  const disponiveis = useMemo(() => (items || []).filter((i) => i.available !== false), [items]);

  const visible = useMemo(() => {
    if (filter === 'todos') return disponiveis;
    return disponiveis.filter((i) => i.condition === filter);
  }, [disponiveis, filter]);

  const idsNoCarrinho = useMemo(() => new Set(noCarrinho.map((i) => i.id)), [noCarrinho]);

  return (
    <div className={`catalog ${aberto ? 'aberto' : ''}`}>
      <button
        className="catalog-toggle"
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="catalog-conteudo"
      >
        <span className="catalog-toggle-text">
          <strong>{aberto ? 'Ocultar catálogo' : 'Ver catálogo de iPhones'}</strong>
          <span className="catalog-toggle-sub mono">
            {disponiveis.length} modelos · do iPhone 11 ao 17 Pro Max
          </span>
        </span>
        <span className="catalog-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Sempre no HTML (some só visualmente) para que o Google continue
          enxergando os modelos mesmo com o catálogo recolhido. */}
      <div className="catalog-conteudo" id="catalog-conteudo" hidden={!aberto}>
        <div className="catalog-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="catalog-empty">Nenhum aparelho nessa categoria no momento.</div>
        ) : (
          <div className="catalog-grid">
            {visible.map((item) => {
              const jaAdicionado = idsNoCarrinho.has(item.id);
              const nome = item.model;
              const mensagem = encodeURIComponent(
                `Olá! Tenho interesse no ${nome} (${conditionLabel(item.condition)}). Ainda está disponível?`,
              );

              return (
                <div className="product-card" key={item.id}>
                  <div className="product-media">
                    <span className={`condition-badge ${item.condition}`}>
                      {item.condition === 'novo' ? 'Novo' : 'Seminovo'}
                    </span>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.model} loading="lazy" />
                    ) : (
                      <PhonePlaceholder />
                    )}
                  </div>
                  <div className="product-body">
                    <div className="product-title">{item.model}</div>
                    {item.description ? <div className="product-desc">{item.description}</div> : null}
                    <div className="product-actions">
                      <button
                        type="button"
                        className={`btn btn-sm ${jaAdicionado ? 'btn-added' : 'btn-primary'}`}
                        onClick={() => addItem(item)}
                      >
                        {jaAdicionado ? '✓ No carrinho' : '+ Adicionar'}
                      </button>
                      <a
                        className="btn btn-ghost btn-sm product-wa"
                        href={`https://wa.me/${whatsapp}?text=${mensagem}`}
                        target="_blank"
                        rel="noopener"
                        aria-label={`Falar sobre ${nome} no WhatsApp`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.26-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.83 2 .9 2.15.07.15.11.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.37-.41.5-.14.15-.28.3-.12.6.16.29.71 1.18 1.53 1.91 1.05.94 1.94 1.24 2.23 1.38.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.15.26.1 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
