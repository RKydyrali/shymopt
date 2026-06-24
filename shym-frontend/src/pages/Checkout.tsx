import React, { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { MapPin, Phone, Truck } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { cn } from '@/lib/utils';

function FarmerCheckoutBlock({ 
  farmerId, 
  items, 
  form, 
  onChange 
}: { 
  farmerId: string, 
  items: any[], 
  form: any, 
  onChange: (updates: any) => void 
}) {
  const farmer = useQuery(api.users.getById, { id: farmerId as Id<"users"> });
  
  if (!form) return null;

  return (
    <Card className="mb-6 overflow-hidden border-[#E8E4DE]">
      <CardHeader className="bg-[#EEF4F1] border-b border-[#E8E4DE] py-4">
        <CardTitle className="text-lg text-[#4A7C59] flex items-center gap-2">
          👨‍🌾 Ферма: {farmer ? farmer.name : 'Загрузка...'}
        </CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-[#7A7065] mt-1.5 font-normal">
          <MapPin className="h-4 w-4" />
          <span>{farmer?.address || 'Адрес не указан'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="bg-[#F0EDE8]/50 p-4 rounded-xl">
          <h4 className="font-semibold text-sm mb-3 text-[#2D2D2D]">Товары этого фермера:</h4>
          <div className="space-y-2">
            {items.map((item: any) => (
               <div key={item.lotId} className="flex justify-between text-sm">
                 <span className="text-[#7A7065]">{item.name} x{item.qty} {item.type}</span>
                 <span className="font-medium">{item.price * item.qty} ₸</span>
               </div>
            ))}
          </div>
          <div className="border-t border-[#E8E4DE] mt-3 pt-3 flex justify-between font-bold text-sm">
             <span>Подытог:</span>
             <span className="text-[#E04F33]">{items.reduce((acc: number, item: any) => acc + item.price * item.qty, 0)} ₸</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`date-${farmerId}`}>Дата вывоза</Label>
            <Input id={`date-${farmerId}`} type="date" required value={form.date} onChange={e => onChange({ date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`time-${farmerId}`}>Время</Label>
            <Input id={`time-${farmerId}`} type="time" required value={form.time} onChange={e => onChange({ time: e.target.value })} />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Оплата</Label>
          <div className="flex gap-4">
            <label className={cn("flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer transition-colors", form.paymentMethod === 'cash' ? "border-[#4A7C59] bg-[#EEF4F1]" : "border-[#E8E4DE] hover:bg-[#F0EDE8]")}>
              <input type="radio" name={`payment-${farmerId}`} value="cash" checked={form.paymentMethod === 'cash'} onChange={() => onChange({ paymentMethod: 'cash' })} className="hidden" />
              <span className="text-sm font-medium">Наличными</span>
            </label>
            <label className={cn("flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer transition-colors", form.paymentMethod === 'transfer' ? "border-[#4A7C59] bg-[#EEF4F1]" : "border-[#E8E4DE] hover:bg-[#F0EDE8]")}>
              <input type="radio" name={`payment-${farmerId}`} value="transfer" checked={form.paymentMethod === 'transfer'} onChange={() => onChange({ paymentMethod: 'transfer' })} className="hidden" />
              <span className="text-sm font-medium">Переводом</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`notes-${farmerId}`}>Комментарий (необязательно)</Label>
          <Input id={`notes-${farmerId}`} placeholder="Например: Буду на газели" value={form.notes} onChange={e => onChange({ notes: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Checkout() {
  const { items, clearCart } = useCart();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const groupedItems = React.useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.farmerId]) {
        acc[item.farmerId] = { farmerId: item.farmerId, items: [] };
      }
      acc[item.farmerId].items.push(item);
      return acc;
    }, {} as Record<string, { farmerId: string, items: typeof items }>);
  }, [items]);
  
  const farmerGroups = Object.values(groupedItems);
  const createOrder = useMutation(api.orders.create);

  const [farmerForms, setFarmerForms] = useState<Record<string, { date: string, time: string, notes: string, paymentMethod: 'cash' | 'transfer' }>>({});

  React.useEffect(() => {
    if (items.length === 0) return;
    const newForms = { ...farmerForms };
    let changed = false;
    farmerGroups.forEach(g => {
      if (!newForms[g.farmerId]) {
        newForms[g.farmerId] = { date: '', time: '', notes: '', paymentMethod: 'cash' };
        changed = true;
      }
    });
    if (changed) setFarmerForms(newForms);
  }, [items, farmerGroups]);

  const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Пожалуйста, войдите в систему");
      navigate('/login');
      return;
    }
    if (farmerGroups.length === 0) return;

    try {
      for (const group of farmerGroups) {
        const form = farmerForms[group.farmerId];
        if (!form || !form.date || !form.time) {
          alert("Пожалуйста, заполните дату и время для всех фермеров");
          return;
        }

        await createOrder({
          buyerId: userId as Id<"users">,
          farmerId: group.farmerId as Id<"users">,
          items: group.items.map(i => ({
            lotId: i.lotId,
            quantity: i.qty,
            pricePerUnit: i.price
          })),
          pickupTime: new Date(`${form.date}T${form.time}`).getTime() || Date.now(),
          notes: form.notes,
          paymentMethod: form.paymentMethod
        });
      }

      setShowModal(true);
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Ошибка при создании заказа");
    }
  };

  if (items.length === 0 && !showModal) {
    return <div className="container py-20 text-center">Ваша корзина пуста</div>;
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Оформление заказа</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={handleConfirm}>
            <div className="bg-[#EEF4F1] p-4 rounded-xl flex items-start gap-3 border border-[#4A7C59]/20 mb-6">
              <Truck className="h-5 w-5 text-[#4A7C59] mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-[#2D2D2D] mb-1">Маршрутные листы самовывоза</p>
                <p className="text-[#7A7065]">Заказы ShymOpt осуществляются путем самовывоза со складов фермеров. Выберите дату и время для каждого пункта вывоза.</p>
              </div>
            </div>

            {farmerGroups.map(group => (
              <FarmerCheckoutBlock 
                key={group.farmerId}
                farmerId={group.farmerId}
                items={group.items}
                form={farmerForms[group.farmerId]}
                onChange={(updates) => setFarmerForms(prev => ({
                  ...prev,
                  [group.farmerId]: { ...prev[group.farmerId], ...updates }
                }))}
              />
            ))}
          </form>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ваш заказ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.lotId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} x{item.qty}</span>
                    <span className="font-medium">{item.price * item.qty} ₸</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                <span>Итого:</span>
                <span>{total} ₸</span>
              </div>
              <Button type="submit" form="checkout-form" className="w-full bg-brand-accent hover:bg-brand-accent/90" size="lg">
                Подтвердить заказ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => navigate('/orders')}></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold text-[#4A7C59]">Заказы подтверждены!</h2>
              <p className="text-sm text-[#7A7065]">
                Ваши заказы успешно оформлены и отправлены фермерам. Вы можете связаться с ними для уточнения деталей.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#F9F8F6] p-4 rounded-xl space-y-4 border border-[#E8E4DE] text-center">
                <p className="font-medium text-[#2D2D2D]">Оформлено заказов: {farmerGroups.length}</p>
                <p className="text-xs text-[#7A7065]">Все контактные данные фермеров и адреса складов доступны в разделе "Мои заказы".</p>
              </div>

              <div className="h-48 w-full bg-[#E8E4DE] rounded-xl border border-[#E8E4DE] overflow-hidden relative">
                <img src="https://api.maptiler.com/maps/streets-v2/static/76.883,43.238,13/600x400.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL" alt="Map" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-2.5 rounded-full shadow-lg text-[#E04F33] animate-bounce">
                    <Truck weight="fill" className="h-7 w-7" />
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-[#E04F33] hover:bg-[#C93B25]" size="lg" onClick={() => navigate('/orders')}>
                Перейти к моим заказам
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
