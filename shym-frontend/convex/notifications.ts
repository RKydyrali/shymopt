import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByUser = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_userId_and_isRead", (q) =>
          q.eq("userId", args.userId).eq("isRead", false)
        )
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
    }

    notifications.sort((a, b) => b.createdAt - a.createdAt);

    return notifications;
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return notifications.length;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("order"),
      v.literal("review"),
      v.literal("system"),
      v.literal("reminder")
    ),
    title: v.string(),
    message: v.string(),
    relatedOrderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return notifications.length;
  },
});
