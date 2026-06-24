import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { CurrencyKzt, Package, Star, ShoppingBag, ArrowRight, Plus, Warning } from '@phosphor-icons/react';
import CreateLotModal from '@/components/farmer/CreateLotModal';

export default function Dashboard() {
  const { userId } = useAuth();
  const farmerId = userId as Id<"users">;

  const stats = useQuery(api.users.getFarmerWithStats, farmerId ? { farmerId } : "skip");
  const sales = useQuery(api.orders.getFarmerStats, farmerId ? { farmerId } : "skip");
  const orders = useQuery(api.orders.getByFarmer, farmerId ? { farmerId } : "skip");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!stats || !sales || !orders) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="bg-[#F9F8F6] min-h-[70vh] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Панель управления</h1>
          <p className="text-sm text-[#7A7065]">Сводка по вашим продажам и активности</p>
        </div>

        {!stats.telegramId && (
          <div className="flex items-start gap-4 bg-[#FFF3E0] rounded-2xl border border-[#F4A261]/30 p-5">
            <div className="h-10 w-10 rounded-xl bg-[#F4A261]/20 flex items-center justify-center flex-shrink-0">
              <Warning className="h-5 w-5 text-[#D4854A]" weight="fill" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#2D2D2D]">Telegram не подключён</h3>
              <p className="text-sm text-[#7A7065] mt-0.5 leading-relaxed">
                Для получения уведомлений о заказах необходимо подключить Telegram-бота
              </p>
            </div>
            <a
              href={`https://t.me/shymopt_bot?start=${farmerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#D4854A] text-[#D4854A] font-medium px-5 py-2.5 rounded-xl hover:bg-[#D4854A] hover:text-white transition-colors whitespace-nowrap"
            >
              Подключить Telegram
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E8E4DE] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#EEF4F1] text-[#4A7C59] rounded-lg"><CurrencyKzt className="h-5 w-5" /></div>
                <h3 className="text-sm font-medium text-[#7A7065]">Продажи (месяц)</h3>
              </div>
              <div className="text-2xl font-bold text-[#2D2D2D]">{sales.month.total.toLocaleString()} ₸</div>
              <p className="text-xs text-[#4A7C59] mt-1">{sales.month.count} заказов</p>
            </CardContent>
          </Card>
          <Card className="border-[#E8E4DE] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#EEF4F1] text-[#4A7C59] rounded-lg"><ShoppingBag className="h-5 w-5" /></div>
                <h3 className="text-sm font-medium text-[#7A7065]">Новые заказы</h3>
              </div>
              <div className="text-2xl font-bold text-[#2D2D2D]">{sales.today.count}</div>
              <p className="text-xs text-[#7A7065] mt-1">за сегодня</p>
            </CardContent>
          </Card>
          <Card className="border-[#E8E4DE] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#FAE0DB] text-[#E04F33] rounded-lg"><Package className="h-5 w-5" /></div>
                <h3 className="text-sm font-medium text-[#7A7065]">Активные лоты</h3>
              </div>
              <div className="text-2xl font-bold text-[#2D2D2D]">{stats.activeLots}</div>
              <p className="text-xs text-[#7A7065] mt-1">из {stats.totalLots} всего</p>
            </CardContent>
          </Card>
          <Card className="border-[#E8E4DE] shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#FFF3E0] text-[#F4A261] rounded-lg"><Star className="h-5 w-5" /></div>
                <h3 className="text-sm font-medium text-[#7A7065]">Рейтинг</h3>
              </div>
              <div className="text-2xl font-bold text-[#2D2D2D]">{stats.avgRating > 0 ? stats.avgRating : '—'}</div>
              <p className="text-xs text-[#7A7065] mt-1">{stats.totalReviews} отзывов</p>
            </CardContent>
          </Card>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Быстрые действия</h2>
            <p className="text-sm text-[#7A7065]">Управляйте своим инвентарем и предложениями</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#E04F33] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[#c8432a] transition-colors whitespace-nowrap shadow-sm active:scale-[0.98]"
          >
            <Plus weight="bold" /> Создать новый лот
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2D2D2D]">Последние заказы</h2>
            <Link to="/farmer/orders" className="text-sm font-medium text-[#E04F33] hover:underline flex items-center gap-1">
              Все заказы <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="border-[#E8E4DE] shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse text-sm">
                 <thead>
                   <tr className="bg-[#F0EDE8] text-[#7A7065]">
                     <th className="px-4 py-3 font-medium">Заказ</th>
                     <th className="px-4 py-3 font-medium">Покупатель</th>
                     <th className="px-4 py-3 font-medium">Сумма</th>
                     <th className="px-4 py-3 font-medium">Статус</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E8E4DE]">
                   {orders.slice(0, 5).map(o => (
                     <tr key={o._id} className="hover:bg-[#F9F8F6]">
                       <td className="px-4 py-3 font-medium text-[#2D2D2D]">
                         <Link to={`/orders/${o._id}`} className="hover:text-[#E04F33]">#{o._id.slice(-6)}</Link>
                       </td>
                       <td className="px-4 py-3 text-[#7A7065]">{o.buyer?.name}</td>
                       <td className="px-4 py-3 font-medium text-[#2D2D2D]">{o.totalAmount.toLocaleString()} ₸</td>
                       <td className="px-4 py-3">
                         <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${o.status === 'completed' ? 'bg-[#EEF4F1] text-[#4A7C59]' : o.status === 'pending' ? 'bg-[#FFF3E0] text-[#F4A261]' : 'bg-[#F0EDE8] text-[#7A7065]'}`}>
                           {o.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                   {orders.length === 0 && (
                     <tr><td colSpan={4} className="px-4 py-8 text-center text-[#7A7065]">Нет заказов</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </Card>
        </div>
      </div>
      
      <CreateLotModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
