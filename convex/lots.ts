import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    farmerId: v.optional(v.id("users")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let lots;

    if (args.categoryId) {
      lots = await ctx.db
        .query("lots")
        .withIndex("by_categoryId", (q) =>
          q.eq("categoryId", args.categoryId!)
        )
        .collect();
    } else if (args.farmerId) {
      lots = await ctx.db
        .query("lots")
        .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId!))
        .collect();
    } else {
      lots = await ctx.db
        .query("lots")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect();
    }

    lots = lots.filter((l) => l.status === "active" && l.isActive);

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      lots = lots.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.description?.toLowerCase().includes(searchLower)
      );
    }

    const lotsWithDetails = await Promise.all(
      lots.map(async (lot) => {
        const farmer = await ctx.db.get(lot.farmerId) as any;
        const category = await ctx.db.get(lot.categoryId) as any;

        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_farmerId", (q) => q.eq("farmerId", lot.farmerId))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        let photoUrl = lot.photoUrl || null;
        if (lot.photo) {
          photoUrl = await ctx.storage.getUrl(lot.photo);
        }

        return {
          ...lot,
          farmer: farmer
            ? { _id: farmer._id, name: farmer.name, address: farmer.address }
            : null,
          category: category
            ? { _id: category._id, name: category.name, icon: category.icon }
            : null,
          farmerRating: Math.round(avgRating * 10) / 10,
          farmerReviewCount: reviews.length,
          photoUrl,
        };
      })
    );

    return lotsWithDetails;
  },
});

export const getById = query({
  args: { id: v.id("lots") },
  handler: async (ctx, args) => {
    const lot = await ctx.db.get(args.id);
    if (!lot) return null;

    const farmer = await ctx.db.get(lot.farmerId) as any;
    const category = await ctx.db.get(lot.categoryId) as any;

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", lot.farmerId))
      .collect();

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    let photoUrl = lot.photoUrl || null;
    if (lot.photo) {
      photoUrl = await ctx.storage.getUrl(lot.photo);
    }

    const farmerReviews = await Promise.all(
      reviews.slice(0, 10).map(async (review) => {
        const buyer = await ctx.db.get(review.buyerId) as any;
        return {
          ...review,
          buyerName: buyer?.name ?? "Аноним",
        };
      })
    );

    return {
      ...lot,
      farmer: farmer
        ? {
            _id: farmer._id,
            name: farmer.name,
            address: farmer.address,
            phone: farmer.phone,
          }
        : null,
      category: category
        ? { _id: category._id, name: category.name, icon: category.icon }
        : null,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      reviews: farmerReviews,
      photoUrl,
    };
  },
});

export const getByFarmer = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const lots = await ctx.db
      .query("lots")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    return await Promise.all(
      lots.map(async (lot) => {
        const category = await ctx.db.get(lot.categoryId);
        let photoUrl = lot.photoUrl || null;
        if (lot.photo) {
          photoUrl = await ctx.storage.getUrl(lot.photo);
        }
        return {
          ...lot,
          category: category
            ? { _id: category._id, name: category.name, icon: category.icon }
            : null,
          photoUrl,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    farmerId: v.id("users"),
    categoryId: v.id("categories"),
    title: v.string(),
    description: v.optional(v.string()),
    photo: v.optional(v.id("_storage")),
    photoUrl: v.optional(v.string()),
    pricePerUnit: v.number(),
    unitType: v.string(),
    unitWeight: v.number(),
    minOrder: v.number(),
    availableQuantity: v.number(),
    harvestDate: v.optional(v.number()),
    shelfLifeDays: v.optional(v.number()),
    expirationDate: v.optional(v.string()),
    address: v.optional(v.string()),
    storageInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.address) {
      await ctx.db.patch(args.farmerId, { address: args.address });
    }
    return await ctx.db.insert("lots", {
      ...args,
      status: "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createFromTelegram = mutation({
  args: {
    farmerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    photo: v.optional(v.id("_storage")),
    pricePerUnit: v.number(),
    unitType: v.string(),
    unitWeight: v.number(),
    availableQuantity: v.number(),
    harvestDate: v.optional(v.number()),
    shelfLifeDays: v.optional(v.number()),
    storageInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    let category = await ctx.db.query("categories").first();
    let categoryId = category?._id;
    if (!categoryId) {
        categoryId = await ctx.db.insert("categories", {
            name: "Разное",
            order: 99,
            isActive: true
        });
    }

    return await ctx.db.insert("lots", {
      ...args,
      categoryId,
      minOrder: 1,
      status: "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("lots"),
    categoryId: v.optional(v.id("categories")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    photo: v.optional(v.id("_storage")),
    photoUrl: v.optional(v.string()),
    pricePerUnit: v.optional(v.number()),
    unitType: v.optional(v.string()),
    unitWeight: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    availableQuantity: v.optional(v.number()),
    harvestDate: v.optional(v.number()),
    shelfLifeDays: v.optional(v.number()),
    expirationDate: v.optional(v.string()),
    address: v.optional(v.string()),
    storageInstructions: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("sold_out"),
        v.literal("expired"),
        v.literal("draft")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    if (updates.address !== undefined) {
      const lot = await ctx.db.get(id);
      if (lot) {
        await ctx.db.patch(lot.farmerId, { address: updates.address });
      }
    }

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

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const remove = mutation({
  args: { id: v.id("lots") },
  handler: async (ctx, args) => {
    // Soft delete to maintain order history
    await ctx.db.patch(args.id, {
      isActive: false,
      status: "draft",
      updatedAt: Date.now(),
    });
  },
});
