import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Star, Package, Phone, Warning } from '@phosphor-icons/react';

export default function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const farmerId = id as Id<"users">;

  const farmer = useQuery(api.users.getFarmerWithStats, farmerId ? { farmerId } : "skip");
  const lots = useQuery(api.lots.getByFarmer, farmerId ? { farmerId } : "skip");

  if (farmer === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">Загрузка...</div>;
  }

  if (farmer === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">Фермер не найден</div>;
  }

  return (
    <div className="bg-[#F9F8F6] min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {!farmer.telegramId && (
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
            >
              <Button variant="outline" className="whitespace-nowrap border-[#D4854A] text-[#D4854A] hover:bg-[#D4854A] hover:text-white">
                Подключить Telegram
              </Button>
            </a>
          </div>
        )}

        <Card className="overflow-hidden border border-[#E8E4DE] bg-white p-6 shadow-sm">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
             <div className="h-24 w-24 rounded-full bg-[#FAE0DB] flex items-center justify-center flex-shrink-0 text-3xl font-bold text-[#E04F33]">
               {farmer.name.charAt(0)}
             </div>
             <div className="flex-1">
               <h1 className="text-2xl font-bold text-[#2D2D2D]">{farmer.name}</h1>
               <div className="flex items-center gap-2 text-[#7A7065] mt-2">
                 <MapPin className="h-5 w-5" />
                 <span>{farmer.address || 'Адрес не указан'}</span>
               </div>
               <div className="flex items-center gap-2 text-[#7A7065] mt-1">
                 <Phone className="h-5 w-5" />
                 <span>{farmer.phone || 'Телефон скрыт'}</span>
               </div>
             </div>
             <div className="flex flex-row sm:flex-col gap-4 mt-4 sm:mt-0 bg-[#F9F8F6] p-4 rounded-xl border border-[#E8E4DE]">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#E04F33]" weight="fill" />
                  <div>
                    <div className="font-bold text-[#2D2D2D]">{farmer.avgRating > 0 ? farmer.avgRating : 'Нет'}</div>
                    <div className="text-xs text-[#7A7065]">Оценка</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#4A7C59]" />
                  <div>
                    <div className="font-bold text-[#2D2D2D]">{farmer.activeLots}</div>
                    <div className="text-xs text-[#7A7065]">Активных лотов</div>
                  </div>
                </div>
             </div>
           </div>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Предложения фермера</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {lots === undefined ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />
                ))
             ) : lots.length === 0 ? (
                <div className="col-span-full py-8 text-center text-[#7A7065]">
                  У фермера пока нет активных предложений
                </div>
             ) : (
               lots.map(lot => {
                 const pricePerKg = lot.unitWeight > 0 ? Math.round(lot.pricePerUnit / lot.unitWeight) : 0;
                 return (
                   <Link key={lot._id} to={`/catalog/${lot._id}`} className="block group">
                     <Card className="overflow-hidden hover:shadow-[0_8px_24px_rgba(45,45,45,0.10)] transition-all duration-300">
                        <div className="aspect-video bg-[#F0EDE8] relative overflow-hidden">
                          {lot.photoUrl ? (
                            <img src={lot.photoUrl} alt={lot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#7A7065]">Нет фото</div>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-semibold text-[#2D2D2D] line-clamp-1 mb-2">{lot.title}</h3>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="font-bold text-[#2D2D2D] text-lg">{lot.pricePerUnit.toLocaleString()} ₸</div>
                              <div className="text-[10px] text-[#7A7065]">за {lot.unitType}</div>
                            </div>
                            {pricePerKg > 0 && (
                              <div className="text-[10px] text-[#D4854A] font-medium">{pricePerKg} ₸/кг</div>
                            )}
                          </div>
                        </CardContent>
                     </Card>
                   </Link>
                 );
               })
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
