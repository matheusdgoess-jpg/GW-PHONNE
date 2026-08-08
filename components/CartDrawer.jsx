'use client';
import { useEffect } from 'react';
import { useCart } from './CartProvider';
import { formatPrice, conditionLabel } from '@/lib/format';

function buildWhatsAppMessage(items) {
  const linhas = items.map((i) => {
    const nome = [i.model, i.storage].filter(Boolean).join(' ');
    const partes = [`• ${nome} (${conditionLabel(i.condition)})`];
    if (i.qty > 1) partes.push(`${i.qty} unidades`);
    partes.push(i.price > 0 ? formatPrice(i.price) : 'a consultar');
    return partes.join(' — ');
  });

  const comPreco = items.filter((i) => i.price > 0);
  const total = comPreco.reduce((soma, i) => soma + i.price * i.qty, 0);
  const temSemPreco = comPreco.length !== items.length;

  let rodape = '';
  if (total > 0) {
    rodape = temSemPreco
      ? `\n\nParcial (itens com preço): ${formatPrice(total)}`
      : `\n\nTotal: ${formatPrice(total)}`;
  }

  return (
    'Olá! Vim pelo site e tenho interesse ' +
    (items.length === 1 ? 'neste aparelho:' : 'nestes aparelhos:') +
    `\n\n${linhas.join('\n')}` +
    rodape +
    '\n\nGostaria de mais informações, por favor.'
  );
}

function PhonePlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2.4" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

export default function CartDrawer() {
  const { items, count, open, setOpen, setQty, removeItem, clear, whatsapp } = useCart();

  // Fecha com Esc e trava o scroll do fundo enquanto o painel está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = anterior;
    };
  }, [open, setOpen]);

  const comPreco = items.filter((i) => i.price > 0);
  const total = comPreco.reduce((soma, i) => soma + i.price * i.qty, 0);
  const temSemPreco = comPreco.length !== items.length;

  const link = items.length
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`
    : `https://wa.me/${whatsapp}`;

  return (
    <>
      <div
        className={`cart-overlay ${open ? 'show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer ${open ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Meu carrinho"
      >
        <header className="cart-head">
          <div>
            <span className="cart-head-tag mono">Meu carrinho</span>
            <h3>
              {count === 0 ? 'Vazio' : `${count} ${count === 1 ? 'aparelho' : 'aparelhos'}`}
            </h3>
          </div>
          <button className="cart-close" onClick={() => setOpen(false)} type="button" aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p>Você ainda não escolheu nenhum aparelho.</p>
              <p className="hint">
                Navegue pelo catálogo e toque em <strong>Adicionar</strong> nos modelos que te
                interessarem. Depois é só enviar tudo de uma vez pro nosso WhatsApp.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-thumb">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.model} />
                  ) : (
                    <PhonePlaceholder />
                  )}
                </div>
                <div className="cart-info">
                  <div className="cart-item-title">{item.model}</div>
                  <div className="cart-item-meta mono">
                    {[item.storage, conditionLabel(item.condition)].filter(Boolean).join(' · ')}
                  </div>
                  <div className="cart-item-price">
                    {item.price > 0 ? formatPrice(item.price) : 'Consultar'}
                  </div>
                  <div className="cart-qty">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      aria-label={`Diminuir ${item.model}`}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      aria-label={`Aumentar ${item.model}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => removeItem(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <footer className="cart-foot">
            {total > 0 ? (
              <div className="cart-total">
                <span>{temSemPreco ? 'Parcial' : 'Total'}</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            ) : null}
            {temSemPreco ? (
              <p className="cart-note">
                Alguns itens estão sem preço no site — a gente confirma tudo no WhatsApp.
              </p>
            ) : null}
            <a className="btn btn-wa" href={link} target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.26-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.83 2 .9 2.15.07.15.11.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.37-.41.5-.14.15-.28.3-.12.6.16.29.71 1.18 1.53 1.91 1.05.94 1.94 1.24 2.23 1.38.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.15.26.1 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
              </svg>
              Enviar pedido no WhatsApp
            </a>
            <button className="cart-clear" type="button" onClick={clear}>
              Esvaziar carrinho
            </button>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
