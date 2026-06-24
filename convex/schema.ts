import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.union(v.literal("farmer"), v.literal("buyer")),
    telegramId: v.optional(v.number()),
    telegramUsername: v.optional(v.string()),
    address: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_telegramId", ["telegramId"])
    .index("by_role", ["role"]),

  categories: defineTable({
    name: v.string(),
    nameKz: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  })
    .index("by_order", ["order"])
    .index("by_isActive", ["isActive"]),

  lots: defineTable({
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
    status: v.union(
      v.literal("active"),
      v.literal("sold_out"),
      v.literal("expired"),
      v.literal("draft")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_farmerId", ["farmerId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_isActive", ["isActive"])
    .index("by_farmerId_and_status", ["farmerId", "status"]),

  orders: defineTable({
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    pickupTime: v.optional(v.number()),
    pickupAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentMethod: v.union(v.literal("cash"), v.literal("transfer")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_farmerId", ["farmerId"])
    .index("by_status", ["status"])
    .index("by_buyerId_and_status", ["buyerId", "status"])
    .index("by_farmerId_and_status", ["farmerId", "status"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    lotId: v.id("lots"),
    quantity: v.number(),
    pricePerUnit: v.number(),
    totalPrice: v.number(),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_lotId", ["lotId"]),

  reviews: defineTable({
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    lotId: v.optional(v.id("lots")),
    orderId: v.id("orders"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_farmerId", ["farmerId"])
    .index("by_lotId", ["lotId"])
    .index("by_orderId", ["orderId"])
    .index("by_buyerId", ["buyerId"]),

  cart: defineTable({
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    quantity: v.number(),
    addedAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_buyerId_and_lotId", ["buyerId", "lotId"]),

  telegramSessions: defineTable({
    farmerId: v.id("users"),
    telegramId: v.number(),
    state: v.string(),
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
    lastActivity: v.number(),
    createdAt: v.number(),
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_farmerId", ["farmerId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("order"),
      v.literal("review"),
      v.literal("system"),
      v.literal("reminder")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    relatedOrderId: v.optional(v.id("orders")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isRead", ["userId", "isRead"]),
});
