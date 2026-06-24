import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Phone, ArrowLeft, Robot, CheckCircle, Star } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// ── Status config ──────────────────────────────────────────
const statusConfig: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'В ожидании',    variant: 'pending' },
  confirmed: { label: 'Подтверждён',   variant: 'confirmed' },
  ready:     { label: 'Готов',         variant: 'ready' },
  completed: { label: 'Завершён',      variant: 'completed' },
  cancelled: { label: 'Отменён',       variant: 'destructive' },
};

const statusSteps = [
  { key: 'pending',   icon: '⏳', label: 'Ожидает' },
  { key: 'confirmed', icon: '✓',  label: 'Подтверждён' },
  { key: 'ready',     icon: '📦', label: 'Готов' },
  { key: 'completed', icon: '✓',  label: 'Завершён' },
];

// ── Loading Skeleton ───────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-10 animate-pulse space-y-6">
        <div className="h-4 w-36 bg-[#F0EDE8] rounded-full" />
        <div className="h-8 w-56 bg-[#F0EDE8] rounded-xl" />
        <div className="h-24 bg-white rounded-2xl border border-[#E8E4DE]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-white rounded-2xl border border-[#E8E4DE]" />
          <div className="h-56 bg-white rounded-2xl border border-[#E8E4DE]" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role, userId } = useAuth();

  const order = useQuery(api.orders.getById, id ? { id: id as Id<"orders"> } : "skip");
  const updateStatus = useMutation(api.orders.updateStatus);
  const cancelOrder = useMutation(api.orders.cancel);
  const createReview = useMutation(api.reviews.create);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return <LoadingSkeleton />;

  const isFarmer = role === 'farmer';
  const currentStatusIndex = statusSteps.findIndex(s => s.key === order.status);
  const status = statusConfig[order.status] ?? { label: order.status, variant: 'muted' };
  const progressPct = currentStatusIndex >= 0
    ? (currentStatusIndex / (statusSteps.length - 1)) * 100
    : 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !order.farmer?._id) return;
    setIsSubmitting(true);
    try {
      await createReview({
        buyerId: userId as Id<"users">,
        farmerId: order.farmer._id,
        orderId: order._id,
        lotId: order.items[0]?.lotId, // review the first lot for now
        rating,
        comment,
      });
      setIsReviewModalOpen(false);
      alert('Спасибо за ваш отзыв!');
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8E4DE]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-6">
          <Link
            to={isFarmer ? '/farmer/orders' : '/orders'}
            className="inline-flex items-center gap-1.5 text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к заказам
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#2D2D2D]">
                Заказ #{order._id.substring(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-[#7A7065] mt-1">
                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8 space-y-6">

        {/* ── AI Bot Banner (Farmer only) ───────── */}
        {isFarmer && (
          <div className="flex items-start gap-4 bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-[0_4px_12px_rgba(45,45,45,0.06)]">
            <div className="h-10 w-10 rounded-xl bg-[#EEF4F1] flex items-center justify-center flex-shrink-0">
              <Robot className="h-5 w-5 text-[#4A7C59]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2D2D]">ИИ-автоответчик активен</h3>
              <p className="text-sm text-[#7A7065] mt-0.5 leading-relaxed">
                Бот AlemLLM автоматически подскажет водителю дорогу к складу, когда он свяжется через Telegram.
              </p>
            </div>
          </div>
        )}

        {/* ── Progress Bar ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-[0_4px_12px_rgba(45,45,45,0.06)]">
          <h3 className="text-sm font-semibold text-[#7A7065] uppercase tracking-widest mb-6">
            Статус заказа
          </h3>

          <div className="relative flex items-center justify-between">
            {/* Track */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#F0EDE8] z-0" />
            {/* Progress */}
            <div
              className="absolute top-4 left-0 h-0.5 bg-[#4A7C59] z-0 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />

            {statusSteps.map((step, index) => {
              const done = index <= currentStatusIndex;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-sm border-2 bg-white transition-colors',
                    done
                      ? 'border-[#4A7C59] bg-[#4A7C59] text-white'
                      : 'border-[#E8E4DE] text-[#7A7065]'
                  )}>
                    {done ? <CheckCircle className="h-4 w-4" weight="fill" /> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <span className="text-xs text-[#7A7065] text-center leading-tight max-w-16">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Content Grid ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left col */}
          <div className="space-y-5">
            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{isFarmer ? 'Покупатель' : 'Фермер'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#F0EDE8] flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-[#7A7065]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D] text-sm">
                      {isFarmer ? order.buyer?.name : order.farmer?.name}
                    </p>
                    <p className="text-xs text-[#7A7065] mt-0.5">
                      {isFarmer ? order.buyer?.phone : order.farmer?.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#EEF4F1] flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-[#4A7C59]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7A7065] mb-0.5">Адрес самовывоза</p>
                    <p className="font-semibold text-[#2D2D2D] text-sm">
                      {order.pickupAddress || order.farmer?.address || 'Не указан'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farmer actions */}
            {isFarmer && currentStatusIndex >= 0 && currentStatusIndex < 3 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-[#2D2D2D] mb-4">Управление заказом</h3>
                  <div className="space-y-2">
                    {order.status === 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => updateStatus({ orderId: order._id, status: 'confirmed' })}
                      >
                        Подтвердить заказ
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        className="w-full"
                        onClick={() => updateStatus({ orderId: order._id, status: 'ready' })}
                      >
                        Заказ готов к выдаче
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => updateStatus({ orderId: order._id, status: 'completed' })}
                      >
                        Завершить заказ
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => cancelOrder({ orderId: order._id })}
                      >
                        Отменить заказ
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review button */}
            {!isFarmer && order.status === 'completed' && (
              <Button variant="outline" className="w-full" onClick={() => setIsReviewModalOpen(true)}>
                Оставить отзыв о фермере
              </Button>
            )}
          </div>

          {/* Right col: Order items */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Детали заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-5">
                {order.items?.map((item: any) => (
                  <div key={item.lotId} className="flex justify-between items-center text-sm py-2 border-b border-[#F0EDE8] last:border-0">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">{item.lot?.title || 'Товар'}</p>
                      <p className="text-xs text-[#7A7065]">× {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-[#2D2D2D]">
                      {(item.totalPrice || 0).toLocaleString()} ₸
                    </span>
                  </div>
                )) ?? (
                  <p className="text-sm text-[#7A7065] italic">Товары не загружены</p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#E8E4DE]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7065]">Оплата:</span>
                  <span className="font-medium text-[#2D2D2D]">
                    {order.paymentMethod === 'cash' ? 'Наличными' : 'Переводом'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7065]">Самовывоз:</span>
                  <span className="font-medium text-[#2D2D2D]">
                    {order.pickupTime
                      ? new Date(order.pickupTime).toLocaleString('ru-RU')
                      : 'Как можно скорее'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#E8E4DE]">
                <span className="font-semibold text-[#2D2D2D]">Итого:</span>
                <span className="text-xl font-bold text-[#2D2D2D]">
                  {(order.totalAmount || 0).toLocaleString()} ₸
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 text-center">Оставить отзыв</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      weight={star <= rating ? "fill" : "regular"} 
                      className={`h-8 w-8 ${star <= rating ? "text-[#F4A261]" : "text-[#E8E4DE]"}`} 
                    />
                  </button>
                ))}
              </div>
              <div>
                <textarea 
                  required
                  className="w-full p-3 bg-white border border-[#E8E4DE] rounded-xl text-sm focus:ring-2 focus:ring-[#E04F33]/30 focus:border-[#E04F33] outline-none resize-none" 
                  rows={4} 
                  value={comment} 
                  onChange={e => setComment(e.target.value)}
                  placeholder="Расскажите о качестве товара и фермере..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsReviewModalOpen(false)}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
