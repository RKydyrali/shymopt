import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getAllWithOrder = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_order", (q) => q.gte("order", 0))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    nameKz: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      name: args.name,
      nameKz: args.nameKz,
      icon: args.icon,
      order: args.order,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    nameKz: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    await ctx.db.patch(id, filteredUpdates);
    return await ctx.db.get(id);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "Категории уже созданы";

    const categories = [
      { name: "Овощи", nameKz: "Көкөністер", icon: "🥬", order: 1 },
      { name: "Фрукты", nameKz: "Жемістер", icon: "🍎", order: 2 },
      { name: "Ягоды", nameKz: "Жидектер", icon: "🍓", order: 3 },
      { name: "Зелень", nameKz: "Жасылша", icon: "🌿", order: 4 },
      { name: "Грибы", nameKz: "Саңырауқұлақтар", icon: "🍄", order: 5 },
      { name: "Молочные", nameKz: "Сүт өнімдері", icon: "🥛", order: 6 },
      { name: "Мясо", nameKz: "Ет", icon: "🥩", order: 7 },
      { name: "Выпечка", nameKz: "Тағамдар", icon: "🍞", order: 8 },
      { name: "Мёд", nameKz: "Бал", icon: "🍯", order: 9 },
      { name: "Орехи", nameKz: "Жаңғақтар", icon: "🥜", order: 10 },
    ];

    for (const cat of categories) {
      await ctx.db.insert("categories", {
        ...cat,
        isActive: true,
      });
    }

    return "Категории созданы: " + categories.length;
  },
});
