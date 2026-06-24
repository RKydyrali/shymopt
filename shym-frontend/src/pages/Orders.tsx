import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Lock } from '@phosphor-icons/react';

// ── Status helpers ─────────────────────────────────────────
const statusConfig: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'В ожидании',  variant: 'pending' },
  confirmed: { label: 'Подтверждён', variant: 'confirmed' },
  ready:     { label: 'Готов',       variant: 'ready' },
  completed: { label: 'Завершён',    variant: 'completed' },
};

// ── Empty / Auth States ────────────────────────────────────
function AuthRequiredState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#FAE0DB] flex items-center justify-center mb-5">
        <Lock className="h-7 w-7 text-[#E04F33]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">Требуется авторизация</h3>
      <p className="text-sm text-[#7A7065] max-w-xs mb-6 leading-relaxed">
        Войдите в аккаунт, чтобы просмотреть свои заказы.
      </p>
      <Link to="/login">
        <Button>Войти в аккаунт</Button>
      </Link>
    </div>
  );
}

function EmptyOrdersState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#F0EDE8] flex items-center justify-center mb-5">
        <Package className="h-7 w-7 text-[#7A7065]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">Заказов пока нет</h3>
      <p className="text-sm text-[#7A7065] max-w-xs mb-6 leading-relaxed">
        Оформите первый заказ в каталоге — фермеры ждут!
      </p>
      <Link to="/catalog">
        <Button>Перейти в каталог</Button>
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-[#E8E4DE] p-6 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-[#F0EDE8] rounded-full" />
              <div className="h-3 w-24 bg-[#F0EDE8] rounded-full" />
              <div className="h-3 w-20 bg-[#F0EDE8] rounded-full" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-5 w-20 bg-[#F0EDE8] rounded-full" />
              <div className="h-9 w-28 bg-[#F0EDE8] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function Orders() {
  const { userId, role } = useAuth();
  const queryArgs = userId ? (role === 'farmer' ? { farmerId: userId as Id<"users"> } : { buyerId: userId as Id<"users"> }) : "skip";
  const orders = useQuery(
    role === 'farmer' ? (api.orders as any).getByFarmer : (api.orders as any).getByBuyer,
    queryArgs as any
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12">
          <AuthRequiredState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8E4DE]">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8">
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Мои заказы</h1>
          <p className="text-sm text-[#7A7065] mt-1">
            {orders !== undefined
              ? `${orders.length} заказ${orders.length === 1 ? '' : orders.length < 5 ? 'а' : 'ов'}`
              : 'Загрузка...'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-8">
        {orders === undefined ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = statusConfig[order.status] ?? { label: order.status, variant: 'muted' };
              return (
                <Card key={order._id} className="hover:shadow-[0_8px_24px_rgba(45,45,45,0.08)] transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      {/* Left: order info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-[#2D2D2D]">
                            Заказ #{order._id.substring(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-[#7A7065]">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          {role === 'farmer' ? order.buyerName : order.farmerName}
                        </p>
                      </div>

                      {/* Right: total + action */}
                      <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                        <span className="text-xl font-bold text-[#2D2D2D]">
                          {(order.totalAmount || 0).toLocaleString()} ₸
                        </span>
                        <Link
                          to={role === 'farmer' ? `/farmer/orders/${order._id}` : `/orders/${order._id}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto gap-1.5"
                          >
                            Детали заказа
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
