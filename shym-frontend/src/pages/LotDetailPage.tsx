import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { Star, MapPin, Leaf, ArrowLeft, Minus, Plus, ShoppingCart, Sparkle, CaretDown, CaretUp, Thermometer, Drop } from '@phosphor-icons/react';
import { useCart } from '@/hooks/useCart';

// ── Loading Skeleton ───────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square rounded-3xl bg-[#F0EDE8]" />
          <div className="space-y-6 pt-4">
            <div className="h-3 w-20 bg-[#F0EDE8] rounded-full" />
            <div className="h-8 w-3/4 bg-[#F0EDE8] rounded-xl" />
            <div className="h-4 w-1/2 bg-[#F0EDE8] rounded-full" />
            <div className="h-40 bg-[#F0EDE8] rounded-2xl" />
            <div className="h-12 w-full bg-[#F0EDE8] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Not Found ──────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="h-20 w-20 rounded-3xl bg-[#F0EDE8] flex items-center justify-center mx-auto mb-6">
          <Leaf className="h-10 w-10 text-[#7A7065]" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">Лот не найден</h2>
        <p className="text-sm text-[#7A7065] mb-6 leading-relaxed">
          Этот лот мог быть снят с продажи или временно недоступен.
        </p>
        <Link to="/catalog">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Вернуться в каталог
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const lot = useQuery(api.lots.getById, { id: id as Id<"lots"> });
  const getStorageAdvice = useAction(api.ai.generateStorageAdvice);
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const [advice, setAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);

  const handleFetchAdvice = async () => {
    if (advice) {
      setIsAdviceOpen(!isAdviceOpen);
      return;
    }
    setIsAdviceOpen(true);
    setIsAdviceLoading(true);
    try {
      const res = await getStorageAdvice({ productTitle: lot?.title || "" });
      setAdvice(res);
    } catch (err) {
      console.error(err);
      setAdvice("Не удалось сгенерировать советы по хранению. Попробуйте позже.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  if (lot === undefined) return <LoadingSkeleton />;
  if (lot === null) return <NotFoundState />;

  const pricePerKg = lot.unitWeight > 0 ? Math.round(lot.pricePerUnit / lot.unitWeight) : 0;

  const handleAddToCart = () => {
    addItem({
      lotId: lot._id,
      farmerId: lot.farmerId,
      name: lot.title,
      type: lot.unitType,
      price: lot.pricePerUnit,
      qty,
      weight: lot.unitWeight,
      photoUrl: lot.photoUrl
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-8 md:py-12">

        {/* Breadcrumb */}
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться в каталог
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Photo ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-[#E8E4DE] shadow-[0_4px_12px_rgba(45,45,45,0.06)]">
              {lot.photoUrl ? (
                <img
                  src={lot.photoUrl}
                  alt={lot.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#7A7065]">
                  <Leaf className="h-16 w-16 text-[#4A7C59]/30" />
                  <span className="text-sm">Нет фото</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Info Panel ────────────────────────── */}
          <div className="flex flex-col">
            {/* Category tag */}
            {lot.category?.name && (
              <span className="inline-flex items-center gap-1.5 bg-[#EEF4F1] text-[#4A7C59] text-xs font-semibold px-3 py-1.5 rounded-full self-start mb-4">
                <Leaf className="h-3 w-3" />
                {lot.category.name}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-[#2D2D2D] leading-tight mb-4">
              {lot.title}
            </h1>

            {/* Rating + Farmer */}
            <div className="flex flex-wrap items-center gap-3 mb-8 text-sm">
              <div className="flex items-center gap-1.5 bg-[#FEF3E8] px-3 py-1.5 rounded-full">
                <Star weight="fill" className="text-[#F4A261] h-4 w-4" />
                <span className="font-semibold text-[#2D2D2D]">{lot.avgRating || '—'}</span>
                <span className="text-[#7A7065]">({lot.reviewCount || 0} отзывов)</span>
              </div>
              <div className="h-4 w-px bg-[#E8E4DE]" />
              <span className="font-medium text-[#4A7C59]">{lot.farmer?.name}</span>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_4px_12px_rgba(45,45,45,0.06)] p-6 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-[#2D2D2D]">
                  {lot.pricePerUnit.toLocaleString()} ₸
                </span>
              </div>
              <p className="text-sm text-[#7A7065] mb-3">
                за 1 {lot.unitType} ({lot.unitWeight} кг)
              </p>

              {pricePerKg > 0 && (
                <span className="inline-block bg-[#FEF3E8] text-[#D4854A] font-semibold px-3 py-1 rounded-full text-sm mb-5">
                  {pricePerKg} ₸ / кг
                </span>
              )}

              {/* Quantity selector */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-[#F0EDE8] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-11 w-11 flex items-center justify-center text-[#2D2D2D] hover:bg-[#E8E4DE] transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-[#2D2D2D]">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="h-11 w-11 flex items-center justify-center text-[#2D2D2D] hover:bg-[#E8E4DE] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-[#7A7065]">
                  = {(lot.pricePerUnit * qty).toLocaleString()} ₸
                </span>
              </div>

              <Button
                size="lg"
                className={`w-full gap-2.5 transition-all duration-300 ${added ? 'bg-[#4A7C59] hover:bg-[#3A6347]' : ''}`}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {added ? 'Добавлено в корзину ✓' : 'Добавить в корзину'}
              </Button>

              <p className="text-xs text-center text-[#7A7065] mt-3">
                Минимальный заказ: {lot.minOrder} {lot.unitType}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {lot.description && (
                <div>
                  <h3 className="font-semibold text-[#2D2D2D] mb-2">Описание</h3>
                  <p className="text-sm text-[#7A7065] leading-relaxed">{lot.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-[#E8E4DE] p-4">
                  <p className="text-xs text-[#7A7065] mb-1">Срок годности</p>
                  <p className="font-semibold text-[#2D2D2D] text-sm">
                    {lot.shelfLifeDays ? `${lot.shelfLifeDays} дней` : 'Не указан'}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#E8E4DE] p-4">
                  <p className="text-xs text-[#7A7065] mb-1">Доступно</p>
                  <p className="font-semibold text-[#2D2D2D] text-sm">
                    {lot.availableQuantity} {lot.unitType}
                  </p>
                </div>
              </div>

              <div className="bg-[#EEF4F1] rounded-2xl p-5 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#4A7C59] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#2D2D2D] text-sm mb-0.5">{lot.farmer?.address}</p>
                  <p className="text-xs text-[#7A7065]">Самовывоз · Оплата при получении</p>
                </div>
              </div>

              {/* AI storage advice card */}
              <div className="bg-gradient-to-br from-[#EEF4F1]/60 to-white rounded-2xl border border-[#4A7C59]/10 shadow-sm p-5">
                <button
                  onClick={handleFetchAdvice}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#4A7C59] text-white rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkle className="h-5 w-5" weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D2D2D] text-sm group-hover:text-[#4A7C59] transition-colors flex items-center gap-1.5">
                        Советник ИИ по хранению
                      </h3>
                      <p className="text-xs text-[#7A7065]">Рекомендации для долгой свежести товара</p>
                    </div>
                  </div>
                  {isAdviceOpen ? (
                    <CaretUp className="h-5 w-5 text-[#7A7065] group-hover:text-[#2D2D2D] transition-colors" />
                  ) : (
                    <CaretDown className="h-5 w-5 text-[#7A7065] group-hover:text-[#2D2D2D] transition-colors" />
                  )}
                </button>

                {isAdviceOpen && (
                  <div className="mt-4 pt-4 border-t border-[#E8E4DE] transition-all duration-300">
                    {isAdviceLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="h-6 w-6 border-2 border-[#4A7C59] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-[#7A7065] animate-pulse">Анализирую требования к хранению...</span>
                      </div>
                    ) : advice ? (
                      <div className="space-y-4">
                        <div className="text-sm text-[#2D2D2D] bg-[#F9F8F6] p-4 rounded-xl border border-[#E8E4DE] leading-relaxed whitespace-pre-line">
                          {advice}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-[#FEF3E8] text-[#D4854A] p-3 rounded-xl border border-[#FEF3E8] flex items-center gap-2">
                            <Thermometer className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Температурный режим</span>
                          </div>
                          <div className="bg-[#EEF4F1] text-[#4A7C59] p-3 rounded-xl border border-[#EEF4F1] flex items-center gap-2">
                            <Drop className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">Контроль влажности</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ────────────────────── */}
        <div className="mt-16 pt-12 border-t border-[#E8E4DE]">
          <h2 className="text-2xl font-bold text-[#2D2D2D] mb-8 flex items-center gap-3">
            Отзывы о товаре
            <span className="text-sm font-medium text-[#7A7065] bg-[#F0EDE8] px-3 py-1 rounded-full">
              {lot.reviewCount}
            </span>
          </h2>

          {lot.reviews && lot.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lot.reviews.map((r: any, idx: number) => (
                <div key={r._id || idx} className="bg-white p-6 rounded-2xl border border-[#E8E4DE] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#F0EDE8] flex items-center justify-center font-bold text-[#7A7065]">
                        {r.buyerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#2D2D2D] text-sm">{r.buyerName}</p>
                        <p className="text-xs text-[#7A7065]">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#FEF3E8] px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-[#F4A261]" weight="fill" />
                      <span className="text-sm font-bold text-[#2D2D2D]">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#2D2D2D] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E8E4DE]">
              <Star className="h-10 w-10 text-[#E8E4DE] mx-auto mb-3" />
              <p className="text-[#7A7065]">Пока нет отзывов. Станьте первым!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
