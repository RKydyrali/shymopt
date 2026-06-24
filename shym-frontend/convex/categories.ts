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

export const resetAndSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    for (const cat of existing) {
      await ctx.db.delete(cat._id);
    }

    const categories = [
      { name: "Огурцы", nameKz: "Қияр", icon: "🥒", order: 1 },
      { name: "Помидоры", nameKz: "Қызанақ", icon: "🍅", order: 2 },
      { name: "Картофель", nameKz: "Картоп", icon: "🥔", order: 3 },
      { name: "Морковь", nameKz: "Сәбіз", icon: "🥕", order: 4 },
      { name: "Лук", nameKz: "Пияз", icon: "🧅", order: 5 },
      { name: "Капуста", nameKz: "Қырыққабат", icon: "🥬", order: 6 },
      { name: "Перец", nameKz: "Бұрыш", icon: "🫑", order: 7 },
      { name: "Кабачки", nameKz: "Асқабақ", icon: "🥒", order: 8 },
      { name: "Яблоки", nameKz: "Алма", icon: "🍎", order: 9 },
      { name: "Виноград", nameKz: "Жүзім", icon: "🍇", order: 10 },
      { name: "Груши", nameKz: "Алмұрт", icon: "🍐", order: 11 },
      { name: "Арбузы", nameKz: "Қарбыз", icon: "🍉", order: 12 },
      { name: "Дыни", nameKz: "Қауын", icon: "🍈", order: 13 },
      { name: "Абрикосы", nameKz: "Шие", icon: "🍑", order: 14 },
      { name: "Сливы", nameKz: "Өрік", icon: "🍑", order: 15 },
      { name: "Зелень", nameKz: "Жасылша", icon: "🌿", order: 16 },
      { name: "Клубника", nameKz: "Құлпырай", icon: "🍓", order: 17 },
      { name: "Свёкла", nameKz: "Қызылша", icon: "🫒", order: 18 },
    ];

    for (const cat of categories) {
      await ctx.db.insert("categories", {
        ...cat,
        isActive: true,
      });
    }

    return "Категории пересозданы: " + categories.length;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "Категории уже созданы";

    const categories = [
      { name: "Огурцы", nameKz: "Қияр", icon: "🥒", order: 1 },
      { name: "Помидоры", nameKz: "Қызанақ", icon: "🍅", order: 2 },
      { name: "Картофель", nameKz: "Картоп", icon: "🥔", order: 3 },
      { name: "Морковь", nameKz: "Сәбіз", icon: "🥕", order: 4 },
      { name: "Лук", nameKz: "Пияз", icon: "🧅", order: 5 },
      { name: "Капуста", nameKz: "Қырыққабат", icon: "🥬", order: 6 },
      { name: "Перец", nameKz: "Бұрыш", icon: "🫑", order: 7 },
      { name: "Кабачки", nameKz: "Асқабақ", icon: "🥒", order: 8 },
      { name: "Яблоки", nameKz: "Алма", icon: "🍎", order: 9 },
      { name: "Виноград", nameKz: "Жүзім", icon: "🍇", order: 10 },
      { name: "Груши", nameKz: "Алмұрт", icon: "🍐", order: 11 },
      { name: "Арбузы", nameKz: "Қарбыз", icon: "🍉", order: 12 },
      { name: "Дыни", nameKz: "Қауын", icon: "🍈", order: 13 },
      { name: "Абрикосы", nameKz: "Шие", icon: " apricot", order: 14 },
      { name: "Сливы", nameKz: "Өрік", icon: "🍑", order: 15 },
      { name: "Зелень", nameKz: "Жасылша", icon: "🌿", order: 16 },
      { name: "Клубника", nameKz: "Құлпырай", icon: "🍓", order: 17 },
      { name: "Свёкла", nameKz: "Қызылша", icon: "🫒", order: 18 },
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
