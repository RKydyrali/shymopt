import React, { useState, useEffect } from 'react';
import { X, Trash, ShoppingCart } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const itemCount = items.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        onTransitionEnd={() => { if (!isOpen) setMounted(false); }}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl sm:max-w-md transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#FAE0DB] flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-[#E04F33]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#2D2D2D] leading-tight">Корзина</h2>
                  <p className="text-xs text-[#7A7065]">{itemCount} товар{itemCount === 1 ? '' : itemCount < 5 ? 'а' : 'ов'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth-y">
              {items.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div
                      key={item.lotId}
                      className="flex gap-4 bg-[#F9F8F6] rounded-2xl p-4 border border-[#E8E4DE]"
                    >
                      {/* Thumbnail */}
                      <div className="h-18 w-18 flex-shrink-0 overflow-hidden rounded-xl border border-[#E8E4DE] bg-[#F0EDE8]">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#7A7065] text-xs">
                            Фото
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-medium text-[#2D2D2D] line-clamp-1 text-sm">{item.name}</h3>
                          <p className="font-bold text-[#2D2D2D] text-sm flex-shrink-0">
                            {(item.price * item.qty).toLocaleString()} ₸
                          </p>
                        </div>
                        <p className="text-xs text-[#7A7065] mt-0.5">{item.type} · {item.weight} кг</p>

                        {/* Qty + remove */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-white rounded-lg border border-[#E8E4DE] overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.lotId, item.qty - 1)}
                              className="h-8 w-8 flex items-center justify-center text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D] transition-colors text-sm font-bold"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-[#2D2D2D]">{item.qty}</span>
                            <button
                              onClick={() => updateQuantity(item.lotId, item.qty + 1)}
                              className="h-8 w-8 flex items-center justify-center text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D] transition-colors text-sm font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.lotId)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#7A7065] hover:bg-[#FAE0DB] hover:text-[#E04F33] transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center py-16 gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#F0EDE8] flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7 text-[#7A7065]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D] mb-1">Корзина пуста</p>
                    <p className="text-sm text-[#7A7065]">Добавьте товары из каталога</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Перейти в каталог
                  </Button>
                </div>
              )}
            </div>

            {/* Checkout Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#E8E4DE] p-6 bg-[#F9F8F6] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#7A7065] text-sm">Итого ({itemCount} поз.):</span>
                  <span className="text-xl font-bold text-[#2D2D2D]">{total.toLocaleString()} ₸</span>
                </div>
                <Button className="w-full gap-2" size="lg" onClick={handleCheckout}>
                  Оформить заказ
                </Button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-[#7A7065] hover:text-[#E04F33] transition-colors py-1"
                >
                  Продолжить покупки
                </button>
              </div>
            )}
      </div>
    </>
  );
}
