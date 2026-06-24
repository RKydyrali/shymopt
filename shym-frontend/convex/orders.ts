import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const getByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    orders.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      orders.map(async (order) => {
        const farmer = await ctx.db.get(order.farmerId);
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithLots = await Promise.all(
          items.map(async (item) => {
            const lot = await ctx.db.get(item.lotId);
            let photoUrl = null;
            if (lot?.photo) {
              photoUrl = await ctx.storage.getUrl(lot.photo);
            }
            return {
              ...item,
              lot: lot ? { ...lot, photoUrl } : null,
            };
          })
        );

        return {
          ...order,
          farmer: farmer ? { _id: farmer._id, name: farmer.name } : null,
          items: itemsWithLots,
        };
      })
    );
  },
});

export const getByFarmer = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    orders.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      orders.map(async (order) => {
        const buyer = await ctx.db.get(order.buyerId);
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
          .collect();

        const itemsWithLots = await Promise.all(
          items.map(async (item) => {
            const lot = await ctx.db.get(item.lotId);
            let photoUrl = null;
            if (lot?.photo) {
              photoUrl = await ctx.storage.getUrl(lot.photo);
            }
            return {
              ...item,
              lot: lot ? { ...lot, photoUrl } : null,
            };
          })
        );

        return {
          ...order,
          buyer: buyer
            ? {
                _id: buyer._id,
                name: buyer.name,
                phone: buyer.phone,
              }
            : null,
          items: itemsWithLots,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    const buyer = await ctx.db.get(order.buyerId);
    const farmer = await ctx.db.get(order.farmerId);

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .collect();

    const itemsWithLots = await Promise.all(
      items.map(async (item) => {
        const lot = await ctx.db.get(item.lotId);
        let photoUrl = null;
        if (lot?.photo) {
          photoUrl = await ctx.storage.getUrl(lot.photo);
        }
        return {
          ...item,
          lot: lot ? { ...lot, photoUrl } : null,
        };
      })
    );

    return {
      ...order,
      buyer: buyer
        ? {
            _id: buyer._id,
            name: buyer.name,
            phone: buyer.phone,
            email: buyer.email,
          }
        : null,
      farmer: farmer
        ? {
            _id: farmer._id,
            name: farmer.name,
            phone: farmer.phone,
            address: farmer.address,
          }
        : null,
      items: itemsWithLots,
    };
  },
});

export const create = mutation({
  args: {
    buyerId: v.id("users"),
    farmerId: v.id("users"),
    items: v.array(
      v.object({
        lotId: v.id("lots"),
        quantity: v.number(),
        pricePerUnit: v.number(),
      })
    ),
    pickupTime: v.optional(v.number()),
    notes: v.optional(v.string()),
    paymentMethod: v.union(v.literal("cash"), v.literal("transfer")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let totalAmount = 0;
    for (const item of args.items) {
      totalAmount += item.pricePerUnit * item.quantity;
    }

    const farmer = await ctx.db.get(args.farmerId);

    const orderId = await ctx.db.insert("orders", {
      buyerId: args.buyerId,
      farmerId: args.farmerId,
      status: "pending",
      totalAmount,
      pickupTime: args.pickupTime,
      pickupAddress: farmer?.address,
      notes: args.notes,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    for (const item of args.items) {
      await ctx.db.insert("orderItems", {
        orderId,
        lotId: item.lotId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.pricePerUnit * item.quantity,
        createdAt: now,
      });

      const lot = await ctx.db.get(item.lotId);
      if (lot) {
        const newQty = lot.availableQuantity - item.quantity;
        await ctx.db.patch(item.lotId, {
          availableQuantity: Math.max(0, newQty),
          status: newQty <= 0 ? "sold_out" : lot.status,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("notifications", {
      userId: args.farmerId,
      type: "order",
      title: "Новый заказ!",
      message: `Новый заказ от покупателя. Сумма: ${totalAmount}₸`,
      isRead: false,
      relatedOrderId: orderId,
      createdAt: now,
    });

    if (farmer?.telegramId) {
      await ctx.scheduler.runAfter(
        0,
        internal.telegram_actions.notifyFarmerOfOrderInternal,
        { orderId }
      );
    }

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Заказ не найден");

    const allowedTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["ready", "cancelled"],
      ready: ["completed", "cancelled"],
    };

    if (!allowedTransitions[order.status]?.includes(args.status)) {
      throw new Error(
        `Невозможно перевести заказ из статуса «${order.status}» в «${args.status}»`
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: now,
    });

    const statusMessages: Record<string, string> = {
      confirmed: "Ваш заказ подтверждён!",
      ready: "Ваш заказ готов к получению!",
      completed: "Заказ завершён. Спасибо за покупку!",
      cancelled: "Заказ отменён.",
    };

    if (statusMessages[args.status]) {
      await ctx.db.insert("notifications", {
        userId: order.buyerId,
        type: "order",
        title: "Обновление заказа",
        message: statusMessages[args.status],
        isRead: false,
        relatedOrderId: args.orderId,
        createdAt: now,
      });
    }

    return await ctx.db.get(args.orderId);
  },
});

export const cancel = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Заказ не найден");

    if (order.status === "completed") {
      throw new Error("Нельзя отменить завершённый заказ");
    }

    if (order.status === "cancelled") {
      throw new Error("Заказ уже отменён");
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      updatedAt: now,
    });

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const item of items) {
      const lot = await ctx.db.get(item.lotId);
      if (lot) {
        await ctx.db.patch(item.lotId, {
          availableQuantity: lot.availableQuantity + item.quantity,
          status: "active",
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("notifications", {
      userId: order.farmerId,
      type: "order",
      title: "Заказ отменён",
      message: `Заказ #${args.orderId} был отменён покупателем`,
      isRead: false,
      relatedOrderId: args.orderId,
      createdAt: now,
    });

    return await ctx.db.get(args.orderId);
  },
});

export const getFarmerStats = query({
  args: { farmerId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .collect();

    const todayOrders = allOrders.filter((o) => o.createdAt >= dayAgo);
    const weekOrders = allOrders.filter((o) => o.createdAt >= weekAgo);
    const monthOrders = allOrders.filter((o) => o.createdAt >= monthAgo);

    return {
      today: {
        count: todayOrders.length,
        total: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      },
      week: {
        count: weekOrders.length,
        total: weekOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      },
      month: {
        count: monthOrders.length,
        total: monthOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      },
    };
  },
});
