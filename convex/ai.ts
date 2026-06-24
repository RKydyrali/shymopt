/// <reference types="node" />
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const SPEECH_TO_TEXT_KEY = "sk-XKPw6Bbs2tIL9wZ6DCcGSQ";
const SPEECH_TO_TEXT_URL = "https://llm.alem.ai/v1/audio/transcriptions";

const KAZAKH_LLM_KEY = "sk-QTgxbgcCPHNz_dimhHiFHg";
const KAZAKH_LLM_URL = "https://llm.alem.ai/v1/chat/completions";

const RUSSIAN_LLM_KEY = "sk-G2Bn87T-POf7BmLKAASzyw";
const RUSSIAN_LLM_URL = "https://llm.alem.ai/v1/chat/completions";

export const transcribeAudio = action({
  args: {
    audioBase64: v.string(),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const bytes = Buffer.from(args.audioBase64, "base64");

    const formData = new FormData();
    const blob = new Blob([bytes], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");
    formData.append("model", "speech-to-text-kk");

    const response = await fetch(SPEECH_TO_TEXT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SPEECH_TO_TEXT_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Speech-to-text error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const result = await response.json();
    return result.text || "";
  },
});

export const chatKazakh = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const response = await fetch(KAZAKH_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KAZAKH_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "kazllm",
        messages: args.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Kazakh LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  },
});

export const chatRussian = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const response = await fetch(RUSSIAN_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUSSIAN_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-6",
        messages: args.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Russian LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  },
});

export const parseLotFromText = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = `Ты помощник фермера. Извлеки из текста информацию о товаре для продажи.
Верни JSON с полями:
- title: название товара (например "Клубника", "Морковь", "Картошка")
- categoryName: к какой категории относится (Овощи, Фрукты, Ягоды, Зелень, Мясо, Молочные, и т.д.)
- unitType: тип тары (ящик, коробка, мешок, пакет и т.д.)
- unitWeight: вес единицы тары в кг (число)
- pricePerUnit: цена за единицу тары в тенге (число)
- availableQuantity: общее количество таких единиц в наличии (число)
- description: краткое описание (если есть)
- shelfLifeDays: срок годности в днях (если упомянуто)
- storageInstructions: инструкции по хранению (если есть)

Если каких-то данных не хватает, поставь null.
Отвечай ТОЛЬКО валидным JSON без дополнительного текста.`;

    const response = await fetch(RUSSIAN_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUSSIAN_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.text },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "{}";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // fallback
    }

    return {};
  },
});

export const generateStorageAdvice = action({
  args: {
    productTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = `Ты специалист по хранению сельскохозяйственных продуктов.
Дай краткие советы по хранению товара "${args.productTitle}" до прибытия покупателя.
Включи:
1. Температуру хранения
2. Влажность
3. Срок годности
4. Особенности хранения

Отвечай кратко, 3-5 предложений на русском языке.`;

    const response = await fetch(RUSSIAN_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUSSIAN_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Дай советы по хранению: ${args.productTitle}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  },
});

export const generateFarmAdvice = action({
  args: {
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = `Ты опытный агроном и бизнес-консультант для фермеров в Казахстане.
Отвечай на вопросы фермера о:
- Уходе за фермой и растениями
- Оптимизации продаж
- Маркетинге сельхозпродукции
- Хранении и транспортировке
Отвечай на казахском или русском языке, в зависимости от языка вопроса. Будь полезным и конкретным.`;

    const response = await fetch(RUSSIAN_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUSSIAN_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.question },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  },
});

export const generateLotClarifyingQuestions = action({
  args: {
    currentInfo: v.string(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = `Ты помощник фермера. Фермер хочет создать лот для продажи.
На основе имеющейся информации, сгенерируй уточняющие вопросы если не хватает данных.
Нужна минимум следующая информация:
1. Название товара
2. Тип тары (ящик/коробка/мешок/пакет)
3. Вес единицы тары (кг)
4. Цена за единицу тары (тенге)
5. Фото товара
6. Срок годности / когда собирает заказы
7. Инструкции по хранению

Если чего-то не хватает, задай конкретный вопрос.
Отвечай на русском языке, дружелюбно и по делу.`;

    const response = await fetch(RUSSIAN_LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUSSIAN_LLM_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-6",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Текущая информация о товаре: ${args.currentInfo}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "";
  },
});
