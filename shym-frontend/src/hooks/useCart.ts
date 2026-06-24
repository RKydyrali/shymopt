import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAuth } from './useAuth';

export interface CartItem {
  lotId: Id<"lots">;
  farmerId: Id<"users">;
  name: string;
  type: string;
  price: number;
  qty: number;
  weight: number;
  photoUrl?: string | null;
}

export function useCart() {
  const { userId } = useAuth();
  
  const isValidId = userId && typeof userId === 'string' && userId.startsWith('k') && !userId.includes('_');
  const cartQuery = useQuery(api.cart.getByBuyer, isValidId ? { buyerId: userId as Id<"users"> } : "skip");
  
  const addMutation = useMutation(api.cart.add);
  const updateQuantityMutation = useMutation(api.cart.updateQuantity);
  const removeMutation = useMutation(api.cart.remove);
  const clearMutation = useMutation(api.cart.clear);

  const validCartItems = cartQuery ? cartQuery.filter(item => item !== null) : [];

  const items: CartItem[] = validCartItems.map(item => ({
    lotId: item!.lotId,
    farmerId: item!.lot?.farmerId as Id<"users">,
    name: item!.lot?.title || 'Товар',
    type: item!.lot?.unitType || 'шт',
    price: item!.lot?.pricePerUnit || 0,
    qty: item!.quantity,
    weight: item!.lot?.unitWeight || 0,
    photoUrl: item!.lot?.photoUrl,
  }));

  const addItem = async (item: CartItem) => {
    if (!userId) {
      alert("Войдите в аккаунт, чтобы добавить товар в корзину");
      return;
    }
    try {
      await addMutation({
        buyerId: userId as Id<"users">,
        lotId: item.lotId,
        quantity: item.qty
      });
    } catch (e: any) {
      alert(e.message || "Ошибка при добавлении в корзину");
    }
  };

  const removeItem = async (lotId: Id<"lots">) => {
    if (!userId) return;
    const cartItem = cartQuery?.find(i => i && i.lotId === lotId);
    if (cartItem) {
      await removeMutation({ cartItemId: cartItem._id });
    }
  };

  const updateQuantity = async (lotId: Id<"lots">, qty: number) => {
    if (!userId) return;
    const cartItem = cartQuery?.find(i => i && i.lotId === lotId);
    if (cartItem) {
      try {
        await updateQuantityMutation({ cartItemId: cartItem._id, quantity: Math.max(1, qty) });
      } catch (e: any) {
         alert(e.message || "Ошибка при обновлении количества");
      }
    }
  };

  const clearCart = async () => {
    if (!userId) return;
    await clearMutation({ buyerId: userId as Id<"users"> });
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}
