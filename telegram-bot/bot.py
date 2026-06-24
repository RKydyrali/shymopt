import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.fsm.context import FSMContext
from aiogram.enums import ParseMode
from aiogram.types import Message
from aiogram.filters import StateFilter
from dotenv import load_dotenv
import os

from convex_client import ConvexClient
from ai_service import get_farm_advice, chat_russian, parse_lot_from_text
from handlers import create_lot, orders, stats, ai_chat

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not set in .env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(
        token=TELEGRAM_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    dp.include_router(create_lot.router)
    dp.include_router(orders.router)
    dp.include_router(stats.router)
    dp.include_router(ai_chat.router)

    @dp.message(lambda m: m.text and m.text.startswith("/start"))
    async def cmd_start(message):
        parts = message.text.split()
        start_param = parts[1] if len(parts) > 1 else None

        if start_param:
            try:
                convex = ConvexClient()
                await convex.link_telegram_account(start_param, message.from_user.id)
                await message.answer(
                    "✅ Telegram-аккаунт успешно привязан!\n\n"
                    "Теперь вы будете получать уведомления о заказах здесь.\n\n"
                    "Введите /help, чтобы посмотреть доступные команды.",
                    parse_mode="HTML",
                )
            except Exception:
                await message.answer(
                    "❌ Не удалось привязать аккаунт.\n\n"
                    "Этот Telegram-аккаунт уже привязан к другому профилю, "
                    "или профиль фермера не найден на сайте.",
                    parse_mode="HTML",
                )
            return

        text = (
            "👋 Добро пожаловать в <b>ShymOpt</b>!\n\n"
            "Я бот для фермеров. Вот что я умею:\n\n"
            "📦 <b>/create_lot</b> — Создать лот для продажи\n"
            "📋 <b>/orders</b> — Посмотреть заказы\n"
            "📊 <b>/stats</b> — Статистика продаж\n"
            "🌱 <b>/advice</b> — Советы по ферме\n"
            "❓ <b>/help_ai</b> — ИИ-помощник\n\n"
            "Или просто напишите текстом, что хотите продавать!"
        )
        await message.answer(text, parse_mode="HTML")

    @dp.message(lambda m: m.text and m.text.startswith("/help"))
    async def cmd_help(message):
        text = (
            "📖 <b>Команды бота</b>\n\n"
            "📦 /create_lot — Создать лот\n"
            "📋 /orders — Мои заказы\n"
            "📊 /stats — Статистика\n"
            "✅ /confirm &lt;id&gt; — Подтвердить заказ\n"
            "📦 /ready &lt;id&gt; — Заказ готов\n"
            "🌱 /advice &lt;вопрос&gt; — Советы ИИ\n"
            "💬 /chat_kz &lt;текст&gt; — Чат на казахском\n"
            "❓ /help_ai — Справка ИИ\n"
        )
        await message.answer(text, parse_mode="HTML")

    async def process_free_text(message: Message, text: str, state: FSMContext):
        text = text.strip()
        if not text:
            return

        convex = ConvexClient()
        farmer = await convex.get_farmer_by_telegram(message.from_user.id)

        if not farmer:
            await message.answer(
                "👋 Вы не зарегистрированы как фермер.\n\n"
                "Зарегистрируйтесь на сайте <b>ShymOpt</b>, чтобы пользоваться ботом.\n"
                "После регистрации вернитесь сюда и нажмите /start для привязки аккаунта.",
                parse_mode="HTML",
            )
            return

        lower = text.lower()

        if any(kw in lower for kw in ["заказ", "order", "покупк"]):
            from handlers.orders import cmd_orders
            await cmd_orders(message)
            return

        if any(kw in lower for kw in ["статистик", "стат", "stats"]):
            from handlers.stats import cmd_stats
            await cmd_stats(message)
            return

        if any(kw in lower for kw in ["мои лот", "мои товар", "мой лот", "мои объявлени"]):
            from handlers.stats import cmd_my_lots
            await cmd_my_lots(message)
            return

        # Check for advice / questions first
        if any(kw in lower for kw in ["совет", "как", "что", "почему", "когда", "какая", "какой", "?"]):
            await message.answer("🤔 Думаю над ответом...")
            try:
                from ai_service import get_farm_advice
                advice = await get_farm_advice(text)
                await message.answer(advice)
            except Exception as e:
                await message.answer(f"Ошибка: {str(e)}")
            return

        # Broad keywords for lot creation
        sell_keywords = ["прод", "лот", "товар", "selling", "продаж", "хочу", "тенге", "тг", "цена", "килограмм", "кг", "тонн"]
        if any(kw in lower for kw in sell_keywords):
            from handlers.create_lot import CreateLotState, handle_product_info_logic
            await state.set_state(CreateLotState.waiting_for_product_info)
            await message.answer("📦 Начинаю создание лота...")
            await handle_product_info_logic(message, state, text)
            return

        await message.answer(
            "🤔 Я не совсем понял запрос.\n\n"
            "Вот что я могу:\n"
            "📦 /create_lot — Создать лот для продажи\n"
            "📋 /orders — Посмотреть заказы\n"
            "📊 /stats — Статистика продаж\n"
            "🌱 /advice &lt;вопрос&gt; — Советы по ферме\n\n"
            "Или просто спросите что-нибудь — отвечу на основе ИИ!",
            parse_mode="HTML",
        )

    @dp.message(StateFilter(None), F.text & ~F.text.startswith("/"))
    async def handle_free_text(message: Message, state: FSMContext):
        await process_free_text(message, message.text, state)

    @dp.message(StateFilter(None), F.voice | F.audio)
    async def handle_free_voice(message: Message, state: FSMContext):
        await message.answer("Распознаю голосовое сообщение...")

        voice = message.voice or message.audio
        file = await message.bot.get_file(voice.file_id)
        file_bytes = await message.bot.download_file(file.file_path)

        from ai_service import transcribe_audio
        try:
            text = await transcribe_audio(file_bytes.read(), getattr(voice, "file_name", None) or "voice.ogg")
            await message.answer(f'Вы сказали:\n"{text}"')
            await process_free_text(message, text, state)
        except Exception as e:
            logger.error(f"Voice recognition error: {e}")
            await message.answer("❌ Ошибка распознавания голоса.")

    logger.info("Bot starting...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
