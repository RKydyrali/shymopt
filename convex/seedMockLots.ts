import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Fetch all existing categories to match IDs
    const categories = await ctx.db.query("categories").collect();
    const getCategoryId = (name: string) => {
      const cat = categories.find((c) => c.name === name);
      if (!cat) {
        throw new Error(`Category not found: ${name}`);
      }
      return cat._id;
    };

    // 2. Create mock farmers with Shymkent-area addresses
    const mockFarmers = [
      {
        name: "Марат Садыков",
        email: "marat.farmer@example.com",
        phone: "+7 (701) 123-45-67",
        address: "г. Шымкент, массив Кайнар-Булак",
        role: "farmer" as const,
      },
      {
        name: "Дмитрий Ковалев",
        email: "dmitry.farmer@example.com",
        phone: "+7 (702) 234-56-78",
        address: "Туркестанская обл., с. Аксукент (Сайрамский р-н)",
        role: "farmer" as const,
      },
      {
        name: "Айбек Ибрагимов",
        email: "aibek.farmer@example.com",
        phone: "+7 (705) 345-67-89",
        address: "г. Шымкент, жилой массив Сайрам",
        role: "farmer" as const,
      },
      {
        name: "Светлана Ким",
        email: "svetlana.farmer@example.com",
        phone: "+7 (707) 456-78-90",
        address: "г. Шымкент, микрорайон Нурсат, ул. Астана",
        role: "farmer" as const,
      },
      {
        name: "Бахытжан Алиев",
        email: "bakhytzhan.farmer@example.com",
        phone: "+7 (708) 567-89-01",
        address: "Туркестанская обл., с. Карабулак (Сайрамский р-н)",
        role: "farmer" as const,
      },
    ];

    const farmerIds: Record<string, any> = {};

    for (const farmer of mockFarmers) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", farmer.email))
        .unique();

      if (existing) {
        farmerIds[farmer.email] = existing._id;
        // Update address if farmer already exists
        await ctx.db.patch(existing._id, {
          name: farmer.name,
          phone: farmer.phone,
          address: farmer.address,
          updatedAt: now,
        });
      } else {
        const id = await ctx.db.insert("users", {
          ...farmer,
          createdAt: now,
          updatedAt: now,
        });
        farmerIds[farmer.email] = id;
      }
    }

    // 3. Create a mock buyer for generating reviews
    const buyerEmail = "baurzhan.buyer@example.com";
    let buyerId;
    const existingBuyer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", buyerEmail))
      .unique();

    if (existingBuyer) {
      buyerId = existingBuyer._id;
    } else {
      buyerId = await ctx.db.insert("users", {
        name: "Бауржан Мусаев",
        email: buyerEmail,
        phone: "+7 (777) 111-22-33",
        role: "buyer",
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Define mock lots with Shymkent-area addresses
    const mockLots = [
      {
        farmerEmail: "dmitry.farmer@example.com",
        categoryName: "Картофель",
        title: "Картофель молодой (сорт Санте)",
        description: "Крупный, чистый картофель, отлично подходит для варки и жарки. Выращен без использования пестицидов в экологически чистом районе.",
        photoUrl: "/mock-images/potatoes.png",
        pricePerUnit: 4500,
        unitType: "мешок",
        unitWeight: 30,
        minOrder: 2,
        availableQuantity: 150,
        address: "Туркестанская обл., с. Аксукент (Сайрамский р-н)",
        storageInstructions: "Хранить в темном прохладном месте при температуре +4..+8°C.",
        shelfLifeDays: 90,
      },
      {
        farmerEmail: "aibek.farmer@example.com",
        categoryName: "Помидоры",
        title: "Помидоры розовые тепличные",
        description: "Очень сочные и сладкие розовые помидоры. Настоящий домашний вкус, тонкая кожица, идеальны для свежих салатов.",
        photoUrl: "/mock-images/tomatoes.png",
        pricePerUnit: 8000,
        unitType: "ящик",
        unitWeight: 10,
        minOrder: 1,
        availableQuantity: 40,
        address: "г. Шымкент, жилой массив Сайрам",
        storageInstructions: "Хранить при комнатной температуре, избегать прямых солнечных лучей.",
        shelfLifeDays: 14,
      },
      {
        farmerEmail: "marat.farmer@example.com",
        categoryName: "Яблоки",
        title: "Яблоки Апорт Алматинский",
        description: "Тот самый легендарный Алматинский Апорт. Огромные, ароматные, кисло-сладкие плоды. Собраны вручную в предгорьях Заилийского Алатау.",
        photoUrl: "/mock-images/apples.png",
        pricePerUnit: 9000,
        unitType: "ящик",
        unitWeight: 15,
        minOrder: 1,
        availableQuantity: 50,
        address: "г. Шымкент, массив Кайнар-Булак",
        storageInstructions: "Хранить в холодильнике или прохладном погребе.",
        shelfLifeDays: 60,
      },
      {
        farmerEmail: "svetlana.farmer@example.com",
        categoryName: "Огурцы",
        title: "Огурцы грунтовые хрустящие",
        description: "Свежие огурчики прямо с грядки. Крепкие, пупырчатые, без горечи. Отлично подойдут как для салатов, так и для засолки.",
        photoUrl: "/mock-images/cucumbers.png",
        pricePerUnit: 4800,
        unitType: "ящик",
        unitWeight: 12,
        minOrder: 1,
        availableQuantity: 60,
        address: "г. Шымкент, микрорайон Нурсат, ул. Астана",
        storageInstructions: "Хранить в холодильнике в отделении для овощей.",
        shelfLifeDays: 10,
      },
      {
        farmerEmail: "bakhytzhan.farmer@example.com",
        categoryName: "Арбузы",
        title: "Арбузы сладкие без косточек",
        description: "Жетысайские арбузы высшего качества. Очень сладкие, сахарная мякоть, практически без косточек. Идеальное спасение в летнюю жару.",
        photoUrl: "/mock-images/watermelons.png",
        pricePerUnit: 1200,
        unitType: "штука",
        unitWeight: 8,
        minOrder: 5,
        availableQuantity: 500,
        address: "Туркестанская обл., с. Карабулак (Сайрамский р-н)",
        storageInstructions: "Хранить в сухом прохладном месте.",
        shelfLifeDays: 30,
      },
      {
        farmerEmail: "marat.farmer@example.com",
        categoryName: "Лук",
        title: "Лук репчатый золотистый",
        description: "Качественный репчатый лук нового урожая. Сухой, плотный, отлично хранится круглый год. Отсортирован вручную.",
        photoUrl: "/mock-images/onions.png",
        pricePerUnit: 3500,
        unitType: "мешок",
        unitWeight: 35,
        minOrder: 5,
        availableQuantity: 300,
        address: "г. Шымкент, массив Кайнар-Булак",
        storageInstructions: "Хранить в сухом, хорошо проветриваемом месте.",
        shelfLifeDays: 180,
      },
      {
        farmerEmail: "dmitry.farmer@example.com",
        categoryName: "Морковь",
        title: "Морковь свежая сочная мытая",
        description: "Мытая отборная морковь сорта Шантанэ. Сладкая, хрустящая, идеально подходит для плова и свежих соков.",
        photoUrl: "/mock-images/carrots.png",
        pricePerUnit: 3750,
        unitType: "сетка",
        unitWeight: 25,
        minOrder: 3,
        availableQuantity: 200,
        address: "Туркестанская обл., с. Аксукент (Сайрамский р-н)",
        storageInstructions: "Хранить в прохладном месте при влажности 80-90%.",
        shelfLifeDays: 120,
      },
      {
        farmerEmail: "aibek.farmer@example.com",
        categoryName: "Виноград",
        title: "Виноград Кишмиш черный сладкий",
        description: "Спелый южный виноград без косточек. Очень сладкий, плотные ягоды с насыщенным мускатным ароматом. Собран в утренние часы.",
        photoUrl: "/mock-images/grapes.png",
        pricePerUnit: 9600,
        unitType: "ящик",
        unitWeight: 8,
        minOrder: 1,
        availableQuantity: 35,
        address: "г. Шымкент, жилой массив Сайрам",
        storageInstructions: "Хранить в холодильнике, мыть непосредственно перед употреблением.",
        shelfLifeDays: 14,
      },
      {
        farmerEmail: "svetlana.farmer@example.com",
        categoryName: "Болгарский перец",
        title: "Свежий болгарский перец (микс)",
        description: "Сочный болгарский перец разных цветов (красный, yellow, зеленый). Мясистый, сладкий, отличного качества.",
        photoUrl: "/mock-images/peppers.png",
        pricePerUnit: 7000,
        unitType: "ящик",
        unitWeight: 10,
        minOrder: 2,
        availableQuantity: 80,
        address: "г. Шымкент, микрорайон Нурсат, ул. Астана",
        storageInstructions: "Хранить в сухом прохладном месте.",
        shelfLifeDays: 14,
      },
      {
        farmerEmail: "bakhytzhan.farmer@example.com",
        categoryName: "Абрикосы",
        title: "Абрикосы медовые спелые",
        description: "Сладкие, ароматные абрикосы с нежной мякотью. Отлично подходят для употребления в свежем виде, а также для варенья и компотов.",
        photoUrl: "/mock-images/apricots.png",
        pricePerUnit: 5400,
        unitType: "ящик",
        unitWeight: 6,
        minOrder: 1,
        availableQuantity: 45,
        address: "Туркестанская обл., с. Карабулак (Сайрамский р-н)",
        storageInstructions: "Хранить в прохладном темном месте, беречь от сдавливания.",
        shelfLifeDays: 7,
      },
    ];

    let seededLotsCount = 0;
    let updatedLotsCount = 0;
    const seededLots: any[] = [];

    for (const lot of mockLots) {
      const categoryId = getCategoryId(lot.categoryName);
      const farmerId = farmerIds[lot.farmerEmail];

      if (!farmerId) continue;

      // Check if lot already exists
      const existing = await ctx.db
        .query("lots")
        .withIndex("by_farmerId", (q) => q.eq("farmerId", farmerId))
        .filter((q) => q.eq(q.field("title"), lot.title))
        .unique();

      if (existing) {
        // Update existing lot with new address
        await ctx.db.patch(existing._id, {
          address: lot.address,
          description: lot.description,
          pricePerUnit: lot.pricePerUnit,
          unitType: lot.unitType,
          unitWeight: lot.unitWeight,
          minOrder: lot.minOrder,
          availableQuantity: lot.availableQuantity,
          storageInstructions: lot.storageInstructions,
          shelfLifeDays: lot.shelfLifeDays,
          updatedAt: now,
        });
        const updated = await ctx.db.get(existing._id);
        seededLots.push(updated);
        updatedLotsCount++;
        continue;
      }

      const lotId = await ctx.db.insert("lots", {
        farmerId,
        categoryId,
        title: lot.title,
        description: lot.description,
        photoUrl: lot.photoUrl,
        pricePerUnit: lot.pricePerUnit,
        unitType: lot.unitType,
        unitWeight: lot.unitWeight,
        minOrder: lot.minOrder,
        availableQuantity: lot.availableQuantity,
        harvestDate: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        shelfLifeDays: lot.shelfLifeDays,
        address: lot.address,
        storageInstructions: lot.storageInstructions,
        status: "active",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const inserted = await ctx.db.get(lotId);
      seededLots.push(inserted);
      seededLotsCount++;
    }

    // 5. Create mock reviews to give farmers star ratings
    const mockReviews = [
      {
        farmerEmail: "marat.farmer@example.com",
        rating: 5,
        comment: "Отличные яблоки! Аромат стоит на весь склад. Марат — пунктуальный и честный продавец. Будем заказывать еще.",
      },
      {
        farmerEmail: "dmitry.farmer@example.com",
        rating: 5,
        comment: "Картофель чистый, калиброванный. Очень довольны качеством товара и быстрой отгрузкой. Спасибо!",
      },
      {
        farmerEmail: "aibek.farmer@example.com",
        rating: 4,
        comment: "Помидоры очень вкусные, сладкие. Немного задержалась доставка, но качество товара это полностью компенсировало.",
      },
      {
        farmerEmail: "svetlana.farmer@example.com",
        rating: 5,
        comment: "Огурчики свежайшие, хрустящие, один к одному. Светлана помогла организовать погрузку. Настоящий профессионал.",
      },
      {
        farmerEmail: "bakhytzhan.farmer@example.com",
        rating: 5,
        comment: "Самые сладкие арбузы, которые мы брали в этом сезоне. Покупатели в восторге. Большое спасибо Бахытжану!",
      },
    ];

    let reviewsCount = 0;
    for (const review of mockReviews) {
      const farmerId = farmerIds[review.farmerEmail];
      if (!farmerId) continue;

      // Check if a review already exists for this farmer from our mock buyer
      const existingReview = await ctx.db
        .query("reviews")
        .withIndex("by_farmerId", (q) => q.eq("farmerId", farmerId))
        .filter((q) => q.eq(q.field("buyerId"), buyerId))
        .first();

      if (existingReview) continue;

      // Create a dummy completed order first to satisfy review dependencies
      const orderId = await ctx.db.insert("orders", {
        buyerId,
        farmerId,
        status: "completed",
        totalAmount: 10000,
        paymentMethod: "transfer",
        paymentStatus: "paid",
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      });

      // Find the first lot of this farmer to associate with the review
      const farmerLot = seededLots.find((l) => l.farmerId === farmerId);

      await ctx.db.insert("reviews", {
        buyerId,
        farmerId,
        lotId: farmerLot ? farmerLot._id : undefined,
        orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: now - 4 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 24 * 60 * 60 * 1000,
      });

      reviewsCount++;
    }

    return `Seeding completed: Created ${seededLotsCount} new lots, updated ${updatedLotsCount} existing lots with new addresses.`;
  },
});
