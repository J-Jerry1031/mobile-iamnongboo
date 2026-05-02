'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  setQty: (id: string, quantity: number) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const exists = state.items.find((x) => x.id === item.id);
          if (exists) {
            return { items: state.items.map((x) => x.id === item.id ? { ...x, quantity: x.quantity + quantity } : x) };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
      inc: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: x.quantity + 1 } : x) })),
      dec: (id) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x) })),
      setQty: (id, quantity) => set((state) => ({ items: state.items.map((x) => x.id === id ? { ...x, quantity: Math.max(1, quantity) } : x) })),
    }),
    { name: 'iamnongbu-cart' }
  )
);
