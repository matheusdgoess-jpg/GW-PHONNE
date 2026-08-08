'use client';
import { useMemo, useState } from 'react';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'novo', label: 'Novos' },
  { key: 'seminovo', label: 'Seminovos' },
];

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

  const visible = useMemo(() => {
    const list = (items || []).filter((i) => i.available !== false);
    if (filter === 'todos') return list;
    return list.filter((i) => i.condition === filter);
  }, [items, filter]);

  return (
    <>
      <div className="catalog-toolbar reveal">
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
        <div className="catalog-empty reveal">Nenhum aparelho nessa categoria no momento.</div>
      ) : (
        <div className="catalog-grid reveal">
          {visible.map((item) => {
            const conditionLabel = item.condition === 'novo' ? 'novo' : 'seminovo';
            const message = encodeURIComponent(
              `Olá! Tenho interesse no ${item.model}${item.storage ? ' ' + item.storage : ''} (${conditionLabel}). Ainda está disponível?`,
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
                  {item.storage ? <div className="product-storage mono">{item.storage}</div> : null}
                  {item.description ? <div className="product-desc">{item.description}</div> : null}
                  {item.price > 0 ? (
                    <div className="product-price">{formatPrice(item.price)}</div>
                  ) : (
                    <div className="product-price ask">Consulte disponibilidade</div>
                  )}
                  <a
                    className="btn btn-primary btn-sm"
                    href={`https://wa.me/${whatsapp}?text=${message}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Chamar no WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
