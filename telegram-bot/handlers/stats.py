from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from convex_client import ConvexClient

router = Router()


@router.message(Command("stats"))
@router.message(F.text.lower().contains("статистика"))
async def cmd_stats(message: Message):
    await message.answer("📊 Загружаю статистику...")

    try:
        convex = ConvexClient()

        farmer = await convex.get_farmer_by_telegram(message.from_user.id)
        if not farmer:
            await message.answer("Вы не зарегистрированы как фермер.")
            return

        stats = await convex.get_farmer_stats(farmer["_id"])

        text = (
            f"📊 <b>Статистика продаж</b>\n\n"
            f"📅 <b>Сегодня:</b>\n"
            f"   Заказов: {stats['today']['count']}\n"
            f"   Выручка: {stats['today']['total']}₸\n\n"
            f"📆 <b>За неделю:</b>\n"
            f"   Заказов: {stats['week']['count']}\n"
            f"   Выручка: {stats['week']['total']}₸\n\n"
            f"📈 <b>За месяц:</b>\n"
            f"   Заказов: {stats['month']['count']}\n"
            f"   Выручка: {stats['month']['total']}₸"
        )

        await message.answer(text, parse_mode="HTML")

    except Exception as e:
        await message.answer(f"Ошибка загрузки статистики: {str(e)}")


@router.message(Command("mylots"))
async def cmd_my_lots(message: Message):
    await message.answer("📦 Ваши лоты:\n\nЗагружаю данные...")

    try:
        convex = ConvexClient()

        farmer = await convex.get_farmer_by_telegram(message.from_user.id)
        if not farmer:
            await message.answer("Вы не зарегистрированы как фермер.")
            return

        lots = await convex.get_farmer_lots(farmer["_id"])

        if not lots:
            await message.answer("У вас пока нет лотов. Создайте первый /create_lot")
            return

        for lot in lots:
            status_emoji = "✅" if lot["status"] == "active" else "⏸️"
            text = (
                f"{status_emoji} {lot['title']}\n"
                f"📦 {lot['unitType']} ({lot['unitWeight']} кг)\n"
                f"💰 {lot['pricePerUnit']}₸ за {lot['unitType']}\n"
                f"📊 Остаток: {lot['availableQuantity']} шт\n"
                f"📊 Статус: {lot['status']}"
            )
            await message.answer(text)

    except Exception as e:
        await message.answer(f"Ошибка загрузки лотов: {str(e)}")
