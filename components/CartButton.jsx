'use client';
import { useCart } from './CartProvider';

export default function CartButton() {
  const { count, ready, setOpen } = useCart();

  return (
    <button
      className="cart-btn"
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Abrir carrinho${ready && count ? ` com ${count} itens` : ''}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.78L20 8H6.2" />
        <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      <span className="cart-btn-label">Carrinho</span>
      {ready && count > 0 ? <span className="cart-badge">{count}</span> : null}
    </button>
  );
}
