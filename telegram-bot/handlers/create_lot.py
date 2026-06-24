import json
import re
from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.filters import Command

from ai_service import (
    parse_lot_from_text,
    get_clarifying_questions,
    get_storage_advice,
    extract_specific_parameter,
    validate_confirmation,
)

router = Router()

class CreateLotState(StatesGroup):
    waiting_for_product_info = State()
    waiting_for_unit_type = State()
    waiting_for_unit_weight = State()
    waiting_for_unit_weight = State()
    waiting_for_price = State()
    waiting_for_harvest_info = State()
    confirmation = State()


@router.message(Command("create_lot"))
@router.message(F.text.lower().contains("создать лот"))
@router.message(F.text.lower().contains("я хочу создать лот"))
async def cmd_create_lot(message: Message, state: FSMContext):
    await state.set_state(CreateLotState.waiting_for_product_info)
    await message.answer(
        "Отлично! Давайте создадим лот для продажи.\n\n"
        "Расскажите о вашем товаре:\n"
        "- Что хотите продавать?\n"
        "- В какой таре будете продавать?\n"
        "- Сколько кг в одной единице тары?\n"
        "- Какая цена?\n\n"
        "Можете написать текстом или отправить голосовое сообщение!"
    )

async def _transcribe_voice(message: Message) -> str:
    await message.answer("Распознаю голосовое сообщение...")
    voice = message.voice or message.audio
    file = await message.bot.get_file(voice.file_id)
    file_bytes = await message.bot.download_file(file.file_path)

    from ai_service import transcribe_audio
    text = await transcribe_audio(file_bytes.read(), getattr(voice, "file_name", None) or "voice.ogg")
    await message.answer(f'Вы сказали:\n"{text}"\n\nОбрабатываю...')
    return text

async def check_and_transition(message: Message, state: FSMContext):
    data = await state.get_data()
    
    if data.get("title") and data.get("unitType") and data.get("pricePerUnit"):
        summary = await format_lot_summary(data)
        await message.answer(f"Распознал информацию:\n\n{summary}\n\nВсё верно? (да/нет)")
        await state.set_state(CreateLotState.confirmation)
    else:
        next_state = None
        if not data.get("title"):
            next_state = CreateLotState.waiting_for_product_info
        elif not data.get("unitType"):
            next_state = CreateLotState.waiting_for_unit_type
        elif not data.get("pricePerUnit"):
            next_state = CreateLotState.waiting_for_price
            
        questions = await get_clarifying_questions(data.get("accumulated_text", ""), data)
        await state.set_state(next_state)
        await message.answer(questions)

async def handle_product_info_logic(message: Message, state: FSMContext, text: str):
    current_data = await state.get_data()
    accumulated_text = current_data.get("accumulated_text", "")
    accumulated_text = accumulated_text + "\n" + text if accumulated_text else text
    await state.update_data(accumulated_text=accumulated_text)

    parsed = await parse_lot_from_text(accumulated_text)

    if parsed.get("isValidProduct") is False:
        await state.clear()
        reason = parsed.get("invalidReason", "Извините, этот товар не подходит для нашего маркетплейса.")
        await message.answer(f"❌ {reason}\n\nПожалуйста, начните заново командой /create_lot, если хотите продать сельхозпродукцию.")
        return

    for k, v in parsed.items():
        if v is not None and k not in ["isValidProduct", "invalidReason"]:
            current_data[k] = v
            
    await state.update_data(**current_data)
    await check_and_transition(message, state)

async def handle_specific_parameter(message: Message, state: FSMContext, text: str, param_name: str, param_key: str):
    data = await state.get_data()
    context = await format_lot_summary(data)
    
    result = await extract_specific_parameter(param_name, context, text)
    
    if result.get("extracted") and result.get("value") is not None:
        data[param_key] = result.get("value")
        await state.update_data(**data)
        await check_and_transition(message, state)
    elif result.get("raw_text_was_clear"):
        lower = text.lower()
        if any(kw in lower for kw in ["отмена", "отменить", "стоп", "cancel", "не хочу"]):
            await state.clear()
            await message.answer("Создание лота отменено.")
        else:
            await message.answer(f"Я не нашел {param_name.lower()} в вашем ответе. Пожалуйста, укажите это значение или напишите 'отмена'.")
    else:
        # Fallback to monolithic extraction if targeted extraction failed
        await handle_product_info_logic(message, state, text)

# ---- HANDLERS FOR WAITING_FOR_PRODUCT_INFO ----
@router.message(CreateLotState.waiting_for_product_info, F.text & ~F.text.startswith("/"))
async def process_product_text(message: Message, state: FSMContext):
    await handle_product_info_logic(message, state, message.text)

@router.message(CreateLotState.waiting_for_product_info, F.voice | F.audio)
async def process_product_voice(message: Message, state: FSMContext):
    text = await _transcribe_voice(message)
    if text:
        await handle_product_info_logic(message, state, text)

# ---- HANDLERS FOR WAITING_FOR_UNIT_TYPE ----
@router.message(CreateLotState.waiting_for_unit_type, F.text & ~F.text.startswith("/"))
async def process_unit_text(message: Message, state: FSMContext):
    await handle_specific_parameter(message, state, message.text, "Тип тары (мешок, коробка, ящик и т.д.)", "unitType")

@router.message(CreateLotState.waiting_for_unit_type, F.voice | F.audio)
async def process_unit_voice(message: Message, state: FSMContext):
    text = await _transcribe_voice(message)
    if text:
        await handle_specific_parameter(message, state, text, "Тип тары (мешок, коробка, ящик и т.д.)", "unitType")

# ---- HANDLERS FOR WAITING_FOR_PRICE ----
@router.message(CreateLotState.waiting_for_price, F.text & ~F.text.startswith("/"))
async def process_price_text(message: Message, state: FSMContext):
    await handle_specific_parameter(message, state, message.text, "Цена за единицу тары в тенге", "pricePerUnit")

@router.message(CreateLotState.waiting_for_price, F.voice | F.audio)
async def process_price_voice(message: Message, state: FSMContext):
    text = await _transcribe_voice(message)
    if text:
        await handle_specific_parameter(message, state, text, "Цена за единицу тары в тенге", "pricePerUnit")

# ---- HANDLERS FOR CONFIRMATION ----
async def handle_confirmation_logic(message: Message, state: FSMContext, text: str):
    data = await state.get_data()
    validation_result = await validate_confirmation(data, text)
    intent = validation_result.get("intent", "confirm")

    if intent == "cancel":
        await state.clear()
        await message.answer("Создание лота отменено. Начните заново командой /create_lot")
    elif intent == "update":
        updated_fields = validation_result.get("updated_fields", {})
        for k, v in updated_fields.items():
            if v is not None:
                data[k] = v
        await state.update_data(**data)
        
        msg = validation_result.get("message_to_user", "Понял, исправляю...")
        summary = await format_lot_summary(data)
        await message.answer(f"{msg}\n\nОбновленная информация:\n\n{summary}\n\nВсё верно? (да/нет)")
    else:
        await message.answer("⏳ Создаю лот в системе...")
        try:
            from convex_client import ConvexClient
            convex = ConvexClient()
            farmer = await convex.get_farmer_by_telegram(message.from_user.id)
            if not farmer:
                await message.answer("❌ Вы не привязали аккаунт фермера.")
                return
            
            await convex.create_lot({
                "farmerId": farmer["_id"],
                "title": data.get("title"),
                "unitType": data.get("unitType"),
                "unitWeight": float(data.get("unitWeight", 0) or 0),
                "pricePerUnit": float(data.get("pricePerUnit", 0) or 0),
                "availableQuantity": 100,
                "description": data.get("description", ""),
            })
            await message.answer("✅ Лот успешно создан и опубликован на платформе!")
            await state.clear()
        except Exception as e:
            await message.answer(f"❌ Ошибка при создании лота: {e}")

@router.message(CreateLotState.confirmation, F.text & ~F.text.startswith("/"))
async def process_confirmation_text(message: Message, state: FSMContext):
    await handle_confirmation_logic(message, state, message.text)

@router.message(CreateLotState.confirmation, F.voice | F.audio)
async def process_confirmation_voice(message: Message, state: FSMContext):
    text = await _transcribe_voice(message)
    if text:
        await handle_confirmation_logic(message, state, text)




async def format_lot_summary(data: dict) -> str:
    lines = []
    if data.get("title"):
        lines.append(f"🍎 Товар: {data['title']}")
    if data.get("unitType"):
        lines.append(f"📦 Тара: {data['unitType']}")
    if data.get("unitWeight"):
        lines.append(f"⚖️ Вес: {data['unitWeight']} кг")
    if data.get("pricePerUnit"):
        lines.append(f"💰 Цена: {data['pricePerUnit']}₸")
    if data.get("shelfLifeDays"):
        lines.append(f"📅 Срок годности: {data['shelfLifeDays']} дней")
    if data.get("storageInstructions"):
        lines.append(f"💡 Хранение: {data['storageInstructions']}")
    return "\n".join(lines)
