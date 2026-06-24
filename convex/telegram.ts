import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const TELEGRAM_API = "https://api.telegram.org/bot";

export const getSessionByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telegramSessions")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();
  },
});

export const getFarmerByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (!user || user.role !== "farmer") return null;
    return user;
  },
});

export const createSession = mutation({
  args: {
    farmerId: v.id("users"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("telegramSessions")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        state: "idle",
        lotDraft: undefined,
        lastActivity: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("telegramSessions", {
      farmerId: args.farmerId,
      telegramId: args.telegramId,
      state: "idle",
      lastActivity: now,
      createdAt: now,
    });
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("telegramSessions"),
    state: v.optional(v.string()),
    lotDraft: v.optional(
      v.object({
        title: v.optional(v.string()),
        categoryId: v.optional(v.id("categories")),
        unitType: v.optional(v.string()),
        unitWeight: v.optional(v.number()),
        pricePerUnit: v.optional(v.number()),
        photo: v.optional(v.id("_storage")),
        harvestDate: v.optional(v.number()),
        shelfLifeDays: v.optional(v.number()),
        storageInstructions: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    filteredUpdates.lastActivity = Date.now();

    await ctx.db.patch(sessionId, filteredUpdates);
  },
});
