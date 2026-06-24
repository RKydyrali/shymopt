import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const lot = await ctx.db.get(item.lotId);
        if (!lot) return null;

        const farmer = await ctx.db.get(lot.farmerId);
        const category = await ctx.db.get(lot.categoryId);

        let photoUrl = null;
        if (lot.photo) {
          photoUrl = await ctx.storage.getUrl(lot.photo);
        }

        return {
          ...item,
          lot: {
            ...lot,
            farmer: farmer
              ? { _id: farmer._id, name: farmer.name }
              : null,
            category: category
              ? { _id: category._id, name: category.name, icon: category.icon }
              : null,
            photoUrl,
          },
        };
      })
    );

    return itemsWithDetails.filter(Boolean);
  },
});

export const add = mutation({
  args: {
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const lot = await ctx.db.get(args.lotId);
    if (!lot) throw new Error("Лот не найден");
    if (lot.availableQuantity < args.quantity) {
      throw new Error("Недостаточно товара");
    }

    const existing = await ctx.db
      .query("cart")
      .withIndex("by_buyerId_and_lotId", (q) =>
        q.eq("buyerId", args.buyerId).eq("lotId", args.lotId)
      )
      .unique();

    if (existing) {
      const newQty = existing.quantity + args.quantity;
      if (newQty > lot.availableQuantity) {
        throw new Error("Недостаточно товара");
      }
      await ctx.db.patch(existing._id, { quantity: newQty });
      return existing._id;
    }

    return await ctx.db.insert("cart", {
      buyerId: args.buyerId,
      lotId: args.lotId,
      quantity: args.quantity,
      addedAt: Date.now(),
    });
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cart"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Элемент корзины не найден");

    const lot = await ctx.db.get(cartItem.lotId);
    if (!lot) throw new Error("Лот не найден");

    if (args.quantity > lot.availableQuantity) {
      throw new Error("Недостаточно товара");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
      return null;
    }

    await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
    return args.cartItemId;
  },
});

export const remove = mutation({
  args: { cartItemId: v.id("cart") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cartItemId);
  },
});

export const clear = mutation({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("cart")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return items.length;
  },
});

export const getTotal = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("cart")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    let total = 0;
    let totalItems = 0;

    for (const item of items) {
      const lot = await ctx.db.get(item.lotId);
      if (lot) {
        total += lot.pricePerUnit * item.quantity;
        totalItems += item.quantity;
      }
    }

    return { total, totalItems };
  },
});
