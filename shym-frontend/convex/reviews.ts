import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByFarmer = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      reviews.map(async (review) => {
        const buyer = await ctx.db.get(review.buyerId);
        const lot = review.lotId ? await ctx.db.get(review.lotId) : null;

        return {
          ...review,
          buyerName: buyer?.name ?? "Аноним",
          buyerAvatar: buyer?.avatar,
          lotTitle: lot?.title,
        };
      })
    );
  },
});

export const getByLot = query({
  args: { lotId: v.id("lots") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_lotId", (q) => q.eq("lotId", args.lotId))
      .collect();

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      reviews.map(async (review) => {
        const buyer = await ctx.db.get(review.buyerId);
        return {
          ...review,
          buyerName: buyer?.name ?? "Аноним",
          buyerAvatar: buyer?.avatar,
        };
      })
    );
  },
});

export const getByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      reviews.map(async (review) => {
        const farmer = await ctx.db.get(review.farmerId);
        const lot = review.lotId ? await ctx.db.get(review.lotId) : null;

        return {
          ...review,
          farmerName: farmer?.name ?? "Неизвестный фермер",
          lotTitle: lot?.title,
        };
      })
    );
  },
});

export const getRating = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    if (reviews.length === 0) {
      return { avg: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / reviews.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      distribution[review.rating as keyof typeof distribution]++;
    }

    return {
      avg: Math.round(avg * 10) / 10,
      count: reviews.length,
      distribution,
    };
  },
});

export const create = mutation({
  args: {
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    orderId: v.id("orders"),
    lotId: v.optional(v.id("lots")),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Рейтинг должен быть от 1 до 5");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();

    if (existing) {
      throw new Error("Вы уже оставили отзыв на этот заказ");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Заказ не найден");
    if (order.status !== "completed") {
      throw new Error("Можно оставить отзыв только на завершённый заказ");
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      buyerId: args.buyerId,
      farmerId: args.farmerId,
      orderId: args.orderId,
      lotId: args.lotId,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: args.farmerId,
      type: "review",
      title: "Новый отзыв!",
      message: `Покупатель оставил отзыв с оценкой ${args.rating}/5`,
      isRead: false,
      createdAt: now,
    });

    return reviewId;
  },
});
