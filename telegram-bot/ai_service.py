import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

SPEECH_TO_TEXT_KEY = "sk-XKPw6Bbs2tIL9wZ6DCcGSQ"
SPEECH_TO_TEXT_URL = "https://llm.alem.ai/v1/audio/transcriptions"

KAZAKH_LLM_KEY = "sk-QTgxbgcCPHNz_dimhHiFHg"
KAZAKH_LLM_URL = "https://llm.alem.ai/v1/chat/completions"

RUSSIAN_LLM_KEY = "sk-G2Bn87T-POf7BmLKAASzyw"
RUSSIAN_LLM_URL = "https://llm.alem.ai/v1/chat/completions"


async def transcribe_audio(audio_bytes: bytes, filename: str = "voice.ogg") -> str:
    """Speech-to-text for Kazakh language"""
    content_type = "audio/wav"
    filename = "audio.wav"

    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field("model", "speech-to-text-kk")
        data.add_field(
            "file",
            audio_bytes,
            filename=filename,
            content_type=content_type,
        )

        async with session.post(
            SPEECH_TO_TEXT_URL,
            data=data,
            headers={"Authorization": f"Bearer {SPEECH_TO_TEXT_KEY}"},
        ) as resp:
            if resp.status != 200:
                error_body = await resp.text()
                raise Exception(f"Speech-to-text error: {resp.status} - {error_body}")
            result = await resp.json()
            return result.get("text", "")


async def chat_kazakh(messages: list[dict]) -> str:
    """Chat with Kazakh LLM"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            KAZAKH_LLM_URL,
            json={
                "model": "kazllm",
                "messages": [
                    {"role": m["role"], "content": m["content"]} for m in messages
                ],
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {KAZAKH_LLM_KEY}",
            },
        ) as resp:
            if resp.status != 200:
                raise Exception(f"Kazakh LLM error: {resp.status}")
            result = await resp.json()
            return result["choices"][0]["message"]["content"]


async def chat_russian(messages: list[dict]) -> str:
    """Chat with Russian LLM (Qwen)"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            RUSSIAN_LLM_URL,
            json={
                "model": "qwen3-6",
                "messages": [
                    {"role": m["role"], "content": m["content"]} for m in messages
                ],
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {RUSSIAN_LLM_KEY}",
            },
        ) as resp:
            if resp.status != 200:
                raise Exception(f"Russian LLM error: {resp.status}")
            result = await resp.json()
            return result["choices"][0]["message"]["content"]


async def parse_lot_from_text(text: str) -> dict:
    """Parse lot information from text"""
    system_prompt = """Ты помощник фермера. Извлеки из текста информацию о товаре для продажи.
Внимание: текст получен через распознавание голоса (Speech-to-Text). В нём могут быть опечатки, фонетические ошибки или нелогичные слова (например, "округцы" вместо "огурцы", "футбурцы" вместо "огурцы", "километров" вместо "килограмм" и т.д.). Твоя задача — АВТОМАТИЧЕСКИ ИСПРАВЛЯТЬ такие опечатки по смыслу агро-тематики.

Важно: маркетплейс предназначен только для сельскохозяйственной продукции (овощи, фрукты, мясо, зерно, молоко и т.п.). Готовая еда, услуги и не-сельхоз товары не подходят. Сначала исправь опечатки, а потом проверяй, подходит ли товар.

Верни JSON с полями:
- isValidProduct: boolean (false если пользователь явно назвал не-сельхоз товар, иначе true)
- invalidReason: строка (если isValidProduct=false, коротко объясни причину. Иначе null)
- title: название товара (например "Клубника", "Морковь", "Картошка")
- unitType: тип тары (ящик, коробка, мешок, пакет и т.д.)
- unitWeight: вес единицы тары в кг (число)
- pricePerUnit: цена за единицу тары в тенге (число)
- description: краткое описание (если есть)
- shelfLifeDays: срок годности в днях (если упомянуто)
- storageInstructions: инструкции по хранению (если есть)

Если каких-то данных не хватает, поставь null.
Отвечай ТОЛЬКО валидным JSON без дополнительного текста."""

    response = await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ]
    )

    import json
    import re

    try:
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return {}


async def get_clarifying_questions(accumulated_text: str, parsed_data: dict) -> str:
    """Generate clarifying questions for lot creation"""
    import json
    system_prompt = """Ты дружелюбный ИИ-помощник фермера. Фермер хочет создать лот для продажи.
Тебе переданы текст фермера и уже извлеченные данные в формате JSON.

Для создания лота ОБЯЗАТЕЛЬНО нужны 3 параметра:
1. Название товара (title)
2. Тип тары (unitType)
3. Цена за единицу тары (pricePerUnit)

Твоя задача:
Посмотри на извлеченные данные. Напиши ОДНО короткое, живое и вежливое сообщение.
В сообщении:
- Скажи, что ты уже понял из того, что указано (например: "Отлично, продаем картошку в мешках!").
- Спроси ТОЛЬКО то, чего не хватает из этих 3 обязательных пунктов.
- Не задавай вопросы про другие поля (срок годности, фото и т.д.), только если не хватает обязательных.
- Не используй длинных списков (1. 2. 3. 4. 5. 6. 7.). Пиши естественно.
- Отвечай на русском языке."""

    return await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Текст фермера: {accumulated_text}\nИзвлеченные данные: {json.dumps(parsed_data, ensure_ascii=False)}"},
        ]
    )


async def get_storage_advice(product_title: str) -> str:
    """Generate storage advice for a product"""
    system_prompt = f"""Ты специалист по хранению сельскохозяйственных продуктов.
Дай краткие советы по хранению товара "{product_title}" до прибытия покупателя.
Включи:
1. Температуру хранения
2. Влажность
3. Срок годности
4. Особенности хранения

Отвечай кратко, 3-5 предложений на русском языке."""

    return await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Дай советы по хранению: {product_title}"},
        ]
    )


async def get_farm_advice(question: str) -> str:
    """Get farming advice from AI"""
    system_prompt = """Ты опытный агроном и бизнес-консультант для фермеров в Казахстане.
Отвечай на вопросы фермера о:
- Уходе за фермой и растениями
- Оптимизации продаж
- Маркетинге сельхозпродукции
- Хранении и транспортировке
Отвечай на казахском или русском языке, в зависимости от языка вопроса. Будь полезным и конкретным."""

    return await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]
    )

async def extract_specific_parameter(expected_param: str, context: str, user_message: str) -> dict:
    """Flexible Entity Extractor for intermediate dialogue steps"""
    import json
    import re
    system_prompt = f"""Ты — модуль извлечения данных для маркетплейса. Твоя задача — найти целевое значение в ответе пользователя.
Текущий ожидаемый параметр: {expected_param}
Контекст разговора: {context}
Сообщение пользователя: "{user_message}"

Инструкция: Извлеки значение для целевого параметра, игнорируя вежливые слова, лишние пояснения и контекст. Отдай результат строго в формате JSON:
{{
  "extracted": true/false,
  "value": "найденное_значение_в_нужном_формате" (или null, если не найдено),
  "raw_text_was_clear": true/false (true если текст явно отвечает на вопрос, false если текст о чем-то другом или непонятен)
}}
Обязательно соблюдай формат JSON без лишнего текста."""

    response = await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
    )
    
    try:
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return {"extracted": False, "value": None, "raw_text_was_clear": False}


async def validate_confirmation(current_data: dict, user_message: str) -> dict:
    """Smart Confirmation Validator"""
    import json
    import re
    
    system_prompt = f"""Пользователь проверяет заполненную карточку товара.
Текущие данные лота:
- Товар: {current_data.get('title', '')}
- Тара: {current_data.get('unitType', '')}
- Цена: {current_data.get('pricePerUnit', '')}
- Вес единицы: {current_data.get('unitWeight', '')}

Ответ пользователя: "{user_message}"

Проанализируй намерение пользователя. Он согласен ("да", "все верно"), хочет что-то исправить ("нет, цена 5000", "огурцы, а не помидоры") или полностью отменяет ("отмена", "не хочу")?
Верни строго JSON:
{{
  "intent": "confirm" (согласен), "update" (исправляет), "cancel" (отменяет),
  "updated_fields": {{
     "title": "новое значение если есть, иначе null",
     "unitType": "новое значение если есть, иначе null",
     "pricePerUnit": "новое значение если есть (число), иначе null",
     "unitWeight": "новое значение если есть (число), иначе null"
  }},
  "message_to_user": "Короткий вежливый ответ пользователю на его исправление (например, 'Понял, исправляю цену...')"
}}
Обязательно соблюдай формат JSON без лишнего текста."""

    response = await chat_russian(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
    )
    
    try:
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return {"intent": "confirm", "updated_fields": {}, "message_to_user": ""}

