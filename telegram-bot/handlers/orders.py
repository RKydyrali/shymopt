from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from convex_client import ConvexClient

router = Router()


@router.message(Command("orders"))
async def cmd_orders(message: Message):
    await message.answer("📦 Ваши заказы:\n\nЗагружаю данные...")

    try:
        convex = ConvexClient()

        farmer = await convex.get_farmer_by_telegram(message.from_user.id)
        if not farmer:
            await message.answer("Вы не зарегистрированы как фермер.")
            return

        orders = await convex.get_farmer_orders(farmer["_id"])

        if not orders:
            await message.answer("У вас пока нет заказов.")
            return

        for order in orders[:10]:
            status_emoji = {
                "pending": "⏳",
                "confirmed": "✅",
                "ready": "📦",
                "completed": "✅",
                "cancelled": "❌",
            }.get(order["status"], "❓")

            buyer = order.get("buyer", {})
            items = order.get("items", [])

            items_text = "\n".join(
                [
                    f"  - {item.get('lot', {}).get('title', 'Товар')}: "
                    f"{item['quantity']} шт × {item['pricePerUnit']}₸ = {item['totalPrice']}₸"
                    for item in items
                ]
            )

            text = (
                f"{status_emoji} Заказ #{order['_id'][:8]}\n"
                f"👤 Покупатель: {buyer.get('name', 'Неизвестно')}\n"
                f"📞 Телефон: {buyer.get('phone', 'Неизвестно')}\n"
                f"📦 Товары:\n{items_text}\n"
                f"💰 Сумма: {order['totalAmount']}₸\n"
                f"📊 Статус: {order['status']}\n"
                f"📅 Дата: {order['createdAt']}"
            )

            await message.answer(text)

    except Exception as e:
        await message.answer(f"Ошибка загрузки заказов: {str(e)}")


@router.message(Command("confirm"))
async def cmd_confirm_order(message: Message):
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /confirm <id_заказа>")
        return

    order_id = args[1]
    try:
        convex = ConvexClient()
        await convex.update_order_status(order_id, "confirmed")
        await message.answer(f"✅ Заказ {order_id} подтверждён!")
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")


@router.message(Command("ready"))
async def cmd_ready_order(message: Message):
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /ready <id_заказа>")
        return

    order_id = args[1]
    try:
        convex = ConvexClient()
        await convex.update_order_status(order_id, "ready")
        await message.answer(f"📦 Заказ {order_id} готов к выдаче!")
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")
