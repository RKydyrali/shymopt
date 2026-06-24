import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from '@phosphor-icons/react';

export default function MyOrders() {
  const { userId } = useAuth();
  const farmerId = userId as Id<"users">;

  const orders = useQuery(api.orders.getByFarmer, farmerId ? { farmerId } : "skip");
  const updateStatus = useMutation(api.orders.updateStatus);
  const cancelOrder = useMutation(api.orders.cancel);

  const handleStatusChange = async (orderId: Id<"orders">, status: any) => {
    try {
      if (status === "cancelled") {
        await cancelOrder({ orderId });
      } else {
        await updateStatus({ orderId, status });
      }
    } catch (e: any) {
      alert('Ошибка обновления статуса: ' + e.message);
    }
  };

  return (
    <div className="bg-[#F9F8F6] min-h-[70vh] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Заказы покупателей</h1>
          <p className="text-sm text-[#7A7065]">Управление входящими заказами</p>
        </div>

        {orders === undefined ? (
          <div className="p-8 text-center">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center bg-white border border-[#E8E4DE] rounded-2xl">
            <div className="h-16 w-16 bg-[#F0EDE8] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-[#7A7065]" />
            </div>
            <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">Пока нет заказов</h3>
            <p className="text-sm text-[#7A7065]">Здесь будут отображаться новые заказы от покупателей</p>
          </div>
        ) : (
          <Card className="border-[#E8E4DE] shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                 <thead>
                   <tr className="bg-[#F0EDE8] text-[#7A7065]">
                     <th className="px-4 py-3 font-medium">№ Заказа / Дата</th>
                     <th className="px-4 py-3 font-medium">Покупатель</th>
                     <th className="px-4 py-3 font-medium">Сумма</th>
                     <th className="px-4 py-3 font-medium">Статус</th>
                     <th className="px-4 py-3 font-medium text-right">Действие</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#E8E4DE]">
                   {orders.map(o => (
                     <tr key={o._id} className="hover:bg-[#F9F8F6]">
                       <td className="px-4 py-4">
                         <div className="font-medium text-[#2D2D2D]">
                           <Link to={`/orders/${o._id}`} className="hover:text-[#E04F33]">#{o._id.slice(-6)}</Link>
                         </div>
                         <div className="text-xs text-[#7A7065] mt-1">
                           {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </div>
                       </td>
                       <td className="px-4 py-4 text-[#7A7065]">
                         <div>{o.buyer?.name}</div>
                         <div className="text-xs">{o.buyer?.phone}</div>
                       </td>
                       <td className="px-4 py-4 font-medium text-[#2D2D2D]">{o.totalAmount.toLocaleString()} ₸</td>
                       <td className="px-4 py-4">
                         <select
                           value={o.status}
                           onChange={(e) => handleStatusChange(o._id, e.target.value)}
                           className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 focus:ring-2 outline-none cursor-pointer ${
                             o.status === 'completed' ? 'bg-[#EEF4F1] text-[#4A7C59] focus:ring-[#4A7C59]/30' :
                             o.status === 'pending' ? 'bg-[#FFF3E0] text-[#F4A261] focus:ring-[#F4A261]/30' :
                             o.status === 'cancelled' ? 'bg-[#FAE0DB] text-[#E04F33] focus:ring-[#E04F33]/30' :
                             'bg-[#F0EDE8] text-[#7A7065] focus:ring-[#7A7065]/30'
                           }`}
                         >
                           <option value="pending">Ожидает</option>
                           <option value="confirmed">Подтвержден</option>
                           <option value="ready">Готов</option>
                           <option value="completed">Завершен</option>
                           <option value="cancelled">Отменен</option>
                         </select>
                       </td>
                       <td className="px-4 py-4 text-right">
                         <Link to={`/orders/${o._id}`} className="inline-flex items-center gap-1 text-[#E04F33] text-sm font-medium hover:underline">
                           Детали <ArrowRight className="h-4 w-4" />
                         </Link>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Card>
        )}
      </div>
    </div>
  );
}
