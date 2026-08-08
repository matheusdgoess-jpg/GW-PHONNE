'use client';
import { useState } from 'react';

function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const national = digits.startsWith('55') ? digits.slice(2) : digits;
  if (national.length === 11) {
    return `${national.slice(0, 2)} ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  return raw;
}

export default function ContactTabs({ tecnico, loja }) {
  const [active, setActive] = useState('tecnico');

  return (
    <div className="contact-tabs reveal">
      <div className="tabs-nav" role="tablist">
        <button
          className={`tab-btn ${active === 'tecnico' ? 'active' : ''}`}
          onClick={() => setActive('tecnico')}
          role="tab"
          aria-selected={active === 'tecnico'}
          type="button"
        >
          Técnico
        </button>
        <button
          className={`tab-btn ${active === 'loja' ? 'active' : ''}`}
          onClick={() => setActive('loja')}
          role="tab"
          aria-selected={active === 'loja'}
          type="button"
        >
          Loja
        </button>
      </div>

      <div className={`tab-panel ${active === 'tecnico' ? 'active' : ''}`} role="tabpanel">
        <h3>Falar com o técnico</h3>
        <p>Dúvidas sobre reparo, diagnóstico ou andamento de um serviço já aberto.</p>
        <div className="contact-number mono">{formatPhone(tecnico)}</div>
        <div className="contact-actions">
          <a className="btn btn-primary" href={`https://wa.me/${tecnico}`} target="_blank" rel="noopener">
            Chamar no WhatsApp
          </a>
          <a className="btn btn-ghost" href={`tel:+${tecnico}`}>
            Ligar agora
          </a>
        </div>
      </div>

      <div className={`tab-panel ${active === 'loja' ? 'active' : ''}`} role="tabpanel">
        <h3>Falar com a loja</h3>
        <p>Compra de iPhones, avaliação de aparelho usado ou informações gerais.</p>
        <div className="contact-number mono">{formatPhone(loja)}</div>
        <div className="contact-actions">
          <a className="btn btn-primary" href={`https://wa.me/${loja}`} target="_blank" rel="noopener">
            Chamar no WhatsApp
          </a>
          <a className="btn btn-ghost" href={`tel:+${loja}`}>
            Ligar agora
          </a>
        </div>
      </div>
    </div>
  );
}
