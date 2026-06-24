import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, Plus, Trash } from '@phosphor-icons/react';
import CreateLotModal from '@/components/farmer/CreateLotModal';
import EditLotModal from '@/components/farmer/EditLotModal';

export default function MyLots() {
  const { userId } = useAuth();
  const farmerId = userId as Id<"users">;

  const lots = useQuery(api.lots.getByFarmer, farmerId ? { farmerId } : "skip");
  const removeLot = useMutation(api.lots.remove);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);

  return (
    <div className="bg-[#F9F8F6] min-h-[70vh] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">Мои лоты</h1>
            <p className="text-sm text-[#7A7065]">Управление вашими товарами</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus weight="bold" /> Добавить лот
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots === undefined ? (
            <div className="col-span-full text-center p-8">Загрузка...</div>
          ) : lots.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-[#E8E4DE] rounded-2xl">
              <div className="h-16 w-16 bg-[#F0EDE8] rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-[#7A7065]" />
              </div>
              <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">У вас пока нет лотов</h3>
              <p className="text-sm text-[#7A7065] mb-6">Добавьте первый лот, чтобы начать продажи</p>
              <Button onClick={() => setIsModalOpen(true)}>Добавить лот</Button>
            </div>
          ) : (
            lots.map(lot => {
              const pricePerKg = lot.unitWeight > 0 ? Math.round(lot.pricePerUnit / lot.unitWeight) : 0;
              return (
                <Card key={lot._id} className="overflow-hidden border border-[#E8E4DE] shadow-sm">
                  <div className="aspect-video bg-[#F0EDE8] relative overflow-hidden">
                    {lot.photoUrl ? (
                      <img src={lot.photoUrl} alt={lot.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7A7065]">Нет фото</div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#4A7C59] text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      {lot.status === 'active' ? 'Активен' : lot.status}
                    </span>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-[#2D2D2D] line-clamp-1 mb-1">{lot.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#7A7065] mb-4">
                      <Package className="h-3.5 w-3.5" /> В наличии: {lot.availableQuantity} {lot.unitType}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="font-bold text-[#2D2D2D] text-lg leading-tight">
                          {lot.pricePerUnit.toLocaleString()} ₸
                        </div>
                        <div className="text-[10px] text-[#7A7065]">за {lot.unitType}</div>
                        {pricePerKg > 0 && (
                          <div className="text-[10px] text-[#D4854A] font-medium mt-0.5">{pricePerKg} ₸/кг</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditingLot(lot)}>Изменить лот</Button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Вы уверены, что хотите удалить этот лот?')) {
                              removeLot({ id: lot._id as Id<"lots"> }).catch(e => alert(e.message));
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E8E4DE] text-[#C93B25] hover:bg-[#FAE0DB] transition-colors"
                          title="Удалить лот"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <CreateLotModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditLotModal isOpen={!!editingLot} onClose={() => setEditingLot(null)} lot={editingLot} />
    </div>
  );
}
