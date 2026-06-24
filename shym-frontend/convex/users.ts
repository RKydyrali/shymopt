import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
  },
});

export const getByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAllFarmers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "farmer"))
      .collect();
  },
});

export const getAllFarmersWithStats = query({
  args: {},
  handler: async (ctx) => {
    const farmers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "farmer"))
      .collect();

    const result = await Promise.all(
      farmers.map(async (farmer) => {
        const lots = await ctx.db
          .query("lots")
          .withIndex("by_farmerId", (q) => q.eq("farmerId", farmer._id))
          .collect();

        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_farmerId", (q) => q.eq("farmerId", farmer._id))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          ...farmer,
          totalLots: lots.length,
          activeLots: lots.filter((l) => l.status === "active").length,
          totalReviews: reviews.length,
          avgRating: Math.round(avgRating * 10) / 10,
        };
      })
    );
    return result;
  },
});

export const getFarmerWithStats = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.role !== "farmer") return null;

    const lots = await ctx.db
      .query("lots")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...farmer,
      totalLots: lots.length,
      activeLots: lots.filter((l) => l.status === "active").length,
      totalReviews: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === "completed").length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.union(v.literal("farmer"), v.literal("buyer")),
    address: v.optional(v.string()),
    telegramId: v.optional(v.number()),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existingEmail) {
      throw new Error("Пользователь с такой почтой уже существует");
    }

    const existingPhone = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
    if (existingPhone) {
      throw new Error("Пользователь с таким номером уже существует");
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      role: args.role,
      address: args.address,
      telegramId: args.telegramId,
      telegramUsername: args.telegramUsername,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    telegramId: v.optional(v.number()),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    filteredUpdates.updatedAt = now;

    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

export const linkTelegramAccount = mutation({
  args: {
    userId: v.id("users"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing && existing._id !== args.userId) {
      throw new Error("Этот Telegram-аккаунт уже привязан к другому профилю");
    }

    await ctx.db.patch(args.userId, {
      telegramId: args.telegramId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.userId);
  },
});

export const login = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    return user;
  },
});

export const getBuyerStats = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      completedOrders: orders.filter((o) => o.status === "completed").length,
      totalSpent: orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };
  },
});
