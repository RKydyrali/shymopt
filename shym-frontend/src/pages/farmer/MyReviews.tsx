import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/Card';
import { Star } from '@phosphor-icons/react';

export default function MyReviews() {
  const { userId } = useAuth();
  const farmerId = userId as Id<"users">;

  const reviews = useQuery(api.reviews.getByFarmer, farmerId ? { farmerId } : "skip");
  const stats = useQuery(api.users.getFarmerWithStats, farmerId ? { farmerId } : "skip");

  return (
    <div className="bg-[#F9F8F6] min-h-[70vh] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Отзывы покупателей</h1>
          <p className="text-sm text-[#7A7065]">Ваш рейтинг: <span className="font-bold text-[#2D2D2D]">{stats?.avgRating && stats.avgRating > 0 ? stats.avgRating : '—'}</span> / 5</p>
        </div>

        <div className="space-y-4">
          {reviews === undefined ? (
            <div className="p-8 text-center">Загрузка...</div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center bg-white border border-[#E8E4DE] rounded-2xl">
              <div className="h-16 w-16 bg-[#FFF3E0] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-[#F4A261]" />
              </div>
              <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">Пока нет отзывов</h3>
              <p className="text-sm text-[#7A7065]">Покупатели могут оставить отзыв после получения заказа</p>
            </div>
          ) : (
            reviews.map((r, idx) => (
              <Card key={r._id || idx} className="border-[#E8E4DE] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#F0EDE8] flex items-center justify-center font-bold text-[#7A7065]">
                        {r.buyerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#2D2D2D] text-sm">{r.buyerName}</p>
                        <p className="text-xs text-[#7A7065]">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#FFF3E0] px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-[#F4A261]" weight="fill" />
                      <span className="text-sm font-bold text-[#2D2D2D]">{r.rating}</span>
                    </div>
                  </div>
                  {r.lotTitle && (
                    <div className="text-xs font-medium text-[#4A7C59] mb-2">Товар: {r.lotTitle}</div>
                  )}
                  <p className="text-sm text-[#2D2D2D]">{r.comment}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
