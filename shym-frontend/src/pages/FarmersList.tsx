import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MagnifyingGlass, CaretDown, MapPin, Star, Package } from '@phosphor-icons/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Link } from 'react-router-dom';

function FarmerSkeletonCard() {
  return (
    <Card className="overflow-hidden border border-[#E8E4DE] bg-white p-6 shadow-[0_4px_12px_rgba(45,45,45,0.03)] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-[#F0EDE8] flex-shrink-0" />
        <div className="flex-1 space-y-2 mt-1">
          <div className="h-5 w-40 bg-[#F0EDE8] rounded-full" />
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#7A7065]/40" />
            <div className="h-3.5 w-24 bg-[#F0EDE8] rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3.5 w-full bg-[#F0EDE8] rounded-full" />
        <div className="h-3.5 w-5/6 bg-[#F0EDE8] rounded-full" />
      </div>
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#F0EDE8]">
        <div className="flex-1 flex items-center justify-center gap-2 h-9 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-3">
          <Star className="h-4 w-4 text-[#7A7065]/40" />
          <div className="h-3 w-8 bg-[#F0EDE8] rounded-full" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 h-9 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-3">
          <Package className="h-4 w-4 text-[#7A7065]/40" />
          <div className="h-3 w-10 bg-[#F0EDE8] rounded-full" />
        </div>
      </div>
      <div className="mt-4 h-10 w-full bg-[#F0EDE8] rounded-xl" />
    </Card>
  );
}

export default function FarmersList() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  const farmers = useQuery(api.users.getAllFarmersWithStats);

  const filteredFarmers = farmers?.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = region ? farmer.address?.includes(region) : true;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="bg-[#F9F8F6] min-h-[70vh] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Наши фермеры</h1>
          <p className="text-sm text-[#7A7065]">
            Прямые контакты проверенных дехкан и производителей региона
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7065] h-4 w-4 pointer-events-none" />
            <Input
              type="text"
              placeholder="Поиск по имени фермера или району..."
              className="pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-64">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-white border border-[#E8E4DE] rounded-xl text-sm text-[#2D2D2D] shadow-[0_1px_3px_rgba(45,45,45,0.06)] focus:outline-none focus:ring-2 focus:ring-[#E04F33]/30 focus:border-[#E04F33] transition-all duration-200 cursor-pointer appearance-none"
            >
              <option value="">Все районы</option>
              <option value="Сарыагаш">Сарыагаш</option>
              <option value="Казыгурт">Казыгурт</option>
              <option value="Тюлькубас">Тюлькубас</option>
              <option value="Туркестан">Туркестан</option>
            </select>
            <CaretDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A7065] h-4 w-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers === undefined ? (
            <>
              <FarmerSkeletonCard />
              <FarmerSkeletonCard />
              <FarmerSkeletonCard />
            </>
          ) : filteredFarmers?.length === 0 ? (
             <div className="col-span-full py-12 text-center text-[#7A7065]">
               Фермеры не найдены
             </div>
          ) : (
            filteredFarmers?.map(farmer => (
              <Card key={farmer._id} className="overflow-hidden border border-[#E8E4DE] bg-white p-6 shadow-[0_4px_12px_rgba(45,45,45,0.03)] hover:shadow-[0_8px_24px_rgba(45,45,45,0.08)] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#FAE0DB] flex items-center justify-center flex-shrink-0 text-xl font-bold text-[#E04F33]">
                    {farmer.name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1 mt-1">
                    <h3 className="font-bold text-lg text-[#2D2D2D] leading-tight">{farmer.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-[#7A7065]">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{farmer.address || 'Адрес не указан'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#F0EDE8]">
                  <div className="flex-1 flex items-center justify-center gap-2 h-9 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-3">
                    <Star className="h-4 w-4 text-[#E04F33]" weight="fill" />
                    <span className="text-sm font-semibold text-[#2D2D2D]">
                      {farmer.avgRating > 0 ? farmer.avgRating : 'Нет оценок'}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2 h-9 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl px-3">
                    <Package className="h-4 w-4 text-[#4A7C59]" />
                    <span className="text-sm font-semibold text-[#2D2D2D]">
                      {farmer.activeLots} лотов
                    </span>
                  </div>
                </div>

                <Link to={`/farmers/${farmer._id}`} className="mt-4 flex items-center justify-center w-full h-10 bg-[#EEF4F1] text-[#4A7C59] font-semibold rounded-xl hover:bg-[#4A7C59] hover:text-white transition-colors text-sm">
                  Перейти в профиль
                </Link>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
