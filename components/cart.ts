export type CartItem = { productId: number; qty: number };
export type Cart = { items: CartItem[] };

const KEY = "jamaa_cart_v1";

export function getCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed?.items) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

export function saveCart(cart: Cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("jamaa-cart-changed"));
}

export function addToCart(productId: number, qty = 1) {
  const cart = getCart();
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) existing.qty += qty;
  else cart.items.push({ productId, qty });
  saveCart(cart);
}

export function setQty(productId: number, qty: number) {
  const cart = getCart();
  cart.items = cart.items
    .map((i) => (i.productId === productId ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  saveCart(cart);
}

export function removeFromCart(productId: number) {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.productId !== productId);
  saveCart(cart);
}

/**
 * Replace old product with new product.
 * If new product already exists in cart, merges quantities.
 */
export function replaceProduct(oldProductId: number, newProductId: number) {
  const cart = getCart();
  const oldItem = cart.items.find((i) => i.productId === oldProductId);
  if (!oldItem) return;

  const qtyToMove = oldItem.qty;

  // remove old
  cart.items = cart.items.filter((i) => i.productId !== oldProductId);

  // merge into new
  const newItem = cart.items.find((i) => i.productId === newProductId);
  if (newItem) newItem.qty += qtyToMove;
  else cart.items.push({ productId: newProductId, qty: qtyToMove });

  saveCart(cart);
}

export function clearCart() {
  saveCart({ items: [] });
}