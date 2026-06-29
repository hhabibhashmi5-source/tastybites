// This file holds the shopping cart "brain" for the whole site.
// React Context lets ANY page read/update the cart without passing data manually.
"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Where the cart is saved in the browser.
const STORAGE_KEY = "tastybites-cart";

// 1. Create the context (an empty box that will hold cart data).
const CartContext = createContext(null);

// 2. The Provider wraps the app and supplies the cart + functions to change it.
export function CartProvider({ children }) {
  // cart is an array of items, each with a `quantity`.
  const [cart, setCart] = useState([]);
  // Tracks whether we've finished reading the saved cart, so we don't
  // overwrite it with an empty array on the very first render.
  const [loaded, setLoaded] = useState(false);

  // Load the saved cart from localStorage once, when the app starts.
  useEffect(() => {
    // Hydration-safe: localStorage only exists in the browser, so we read it
    // after mount rather than in useState's initializer (which also runs on the
    // server). Setting state here is the correct pattern for syncing from a
    // browser-only store, so we intentionally allow it.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setCart(JSON.parse(saved));
    } catch {
      // Ignore corrupted/unavailable storage.
    }
    setLoaded(true);
  }, []);

  // Save the cart to localStorage whenever it changes (after the initial load).
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  // Add an item (or +1 if it's already in the cart).
  function addToCart(item) {
    setCart((current) => {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }

  // Lower the quantity by 1, removing the item if it hits 0.
  function decreaseQty(id) {
    setCart((current) =>
      current
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  // Remove an item completely.
  function removeFromCart(id) {
    setCart((current) => current.filter((i) => i.id !== id));
  }

  // Empty the whole cart (after placing an order).
  function clearCart() {
    setCart([]);
  }

  // Handy totals.
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQty,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 3. A shortcut hook so pages can do: const { cart } = useCart();
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
