'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import CartDrawer from './CartDrawer';

const CartContext = createContext(null);
const STORAGE_KEY = 'gwp_carrinho';

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}

export default function CartProvider({ whatsapp, children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  // Só liberamos a leitura do carrinho depois de montar no navegador: o
  // servidor não tem localStorage, e mostrar o contador antes disso causaria
  // uma piscada de "0" na tela.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // carrinho corrompido no navegador do cliente — começa vazio
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // sem espaço ou modo privativo — o carrinho segue valendo só nesta aba
    }
  }, [items, ready]);

  const value = useMemo(() => {
    function addItem(product) {
      setItems((list) => {
        const existing = list.find((i) => i.id === product.id);
        if (existing) {
          return list.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
        }
        return [
          ...list,
          {
            id: product.id,
            model: product.model,
            storage: product.storage || '',
            condition: product.condition,
            price: Number(product.price) || 0,
            imageUrl: product.imageUrl || '',
            qty: 1,
          },
        ];
      });
      setOpen(true);
    }

    function setQty(id, qty) {
      setItems((list) =>
        qty <= 0 ? list.filter((i) => i.id !== id) : list.map((i) => (i.id === id ? { ...i, qty } : i)),
      );
    }

    function removeItem(id) {
      setItems((list) => list.filter((i) => i.id !== id));
    }

    function clear() {
      setItems([]);
    }

    const count = items.reduce((sum, i) => sum + i.qty, 0);

    return { items, count, ready, open, setOpen, addItem, setQty, removeItem, clear, whatsapp };
  }, [items, ready, open, whatsapp]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
