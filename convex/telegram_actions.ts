/// <reference types="node" />
"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessageInternal(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }

  return await response.json();
}

export const sendTelegramMessage = action({
  args: {
    chatId: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendTelegramMessageInternal(args.chatId, args.text);
  },
});

export const notifyFarmerOfOrderInternal = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order: any = await ctx.runQuery(api.orders.getById, {
      id: args.orderId,
    });
    if (!order) return;

    const farmer = order.farmer;
    const buyer = order.buyer;
    if (!farmer) return;

    const user: any = await ctx.runQuery(api.users.getById, {
      id: farmer._id,
    });
    if (!user?.telegramId) return;

    const itemsSummary = (order.items || [])
      .map(
        (item: any) =>
          `  • ${item.lot?.title || "Товар"} — ${item.quantity} × ${item.pricePerUnit}₸`
      )
      .join("\n");

    const message = [
      `🔔 <b>Новый заказ!</b>`,
      ``,
      `👤 Покупатель: ${buyer?.name || "Неизвестно"}`,
      `📞 Телефон: ${buyer?.phone || "Не указан"}`,
      ``,
      `📦 Заказ:`,
      itemsSummary,
      ``,
      `💰 Сумма: ${order.totalAmount}₸`,
      order.pickupTime
        ? `🕐 Время получения: ${new Date(order.pickupTime).toLocaleString("ru-RU")}`
        : "",
      order.pickupAddress
        ? `📍 Адрес самовывоза: ${order.pickupAddress}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return await sendTelegramMessageInternal(user.telegramId, message);
  },
});

export const sendReminder = action({
  args: {
    farmerTelegramId: v.number(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendTelegramMessageInternal(args.farmerTelegramId, args.message);
  },
});

export const sendDailyStats = action({
  args: {
    farmerTelegramId: v.number(),
    stats: v.object({
      todayOrders: v.number(),
      todayRevenue: v.number(),
      weekOrders: v.number(),
      weekRevenue: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const message = [
      `📊 <b>Ваша статистика за сегодня</b>`,
      ``,
      `📅 Сегодня:`,
      `   Заказов: ${args.stats.todayOrders}`,
      `   Выручка: ${args.stats.todayRevenue}₸`,
      ``,
      `📆 За неделю:`,
      `   Заказов: ${args.stats.weekOrders}`,
      `   Выручка: ${args.stats.weekRevenue}₸`,
    ].join("\n");

    return await sendTelegramMessageInternal(args.farmerTelegramId, message);
  },
});
