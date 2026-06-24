from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command

from ai_service import get_farm_advice, chat_kazakh, chat_russian

router = Router()


@router.message(Command("advice"))
@router.message(F.text.lower().contains("совет"))
async def cmd_advice(message: Message):
    question = message.text.replace("/advice", "").replace("совет", "").strip()

    if not question:
        await message.answer(
            "🤔 Задайте вопрос по уходу за фермой или продажам.\n\n"
            "Примеры:\n"
            "- Как хранить морковь?\n"
            "- Как увеличить продажи?\n"
            "- Когда сажать клубнику?\n"
        )
        return

    await message.answer("🤔 Думаю над ответом...")

    try:
        advice = await get_farm_advice(question)
        await message.answer(advice)
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")


@router.message(Command("chat_kz"))
async def cmd_chat_kazakh(message: Message):
    text = message.text.replace("/chat_kz", "").strip()
    if not text:
        await message.answer("Жазыңыз, сізге қалай көмектесе аламын?")
        return

    try:
        response = await chat_kazakh(
            [
                {"role": "user", "content": text},
            ]
        )
        await message.answer(response)
    except Exception as e:
        await message.answer(f"Қате: {str(e)}")


@router.message(Command("help_ai"))
async def cmd_help_ai(message: Message):
    text = (
        "🤖 <b>ИИ-помощник фермера</b>\n\n"
        "Доступные команды:\n\n"
        "💡 /advice &lt;вопрос&gt; — Советы по ферме\n"
        "💬 /chat_kz &lt;текст&gt; — Чат на казахском\n"
        "❓ /help_ai — Эта справка\n\n"
        "Примеры вопросов:\n"
        "- Как лучше хранить картошку?\n"
        "- Как привлечь больше клиентов?\n"
        "- Сколько поливать томаты?\n"
    )
    await message.answer(text, parse_mode="HTML")
