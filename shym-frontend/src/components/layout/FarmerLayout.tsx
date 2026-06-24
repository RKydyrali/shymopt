import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChartBar, Package, ShoppingCart, ChatCircle, Robot } from '@phosphor-icons/react';
import AiAssistant from '@/components/farmer/AiAssistant';

export default function FarmerLayout() {
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const navLinks = [
    { to: '/farmer/dashboard', label: '📊 Главная панель' },
    { to: '/farmer/lots', label: '📦 Мои лоты' },
    { to: '/farmer/orders', label: '🛒 Входящие заказы' },
    { to: '/farmer/reviews', label: '💬 Отзывы' },
    { to: '/farmer/consultant', label: '🌾 ИИ-Консультант' },
  ];

  return (
    <div className="flex flex-col min-h-[70vh] bg-[#F9F8F6]">
      {/* Sub-navigation bar */}
      <div className="bg-white border-b border-[#E8E4DE] sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-6 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => {
              const active = location.pathname === link.to || (link.to !== '/farmer/dashboard' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-2 py-4 text-sm whitespace-nowrap transition-colors border-b-2',
                    active 
                      ? 'text-[#2D2D2D] font-semibold border-[#E04F33]' 
                      : 'text-[#7A7065] font-medium border-transparent hover:text-[#2D2D2D]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>
      {/* FAB for AI Assistant */}
      <button 
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-[#E04F33] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#c8432a] hover:scale-105 transition-all z-40 group"
      >
        <Robot className="h-7 w-7" weight="fill" />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 bg-[#2D2D2D] text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
          ИИ-Помощник
        </span>
      </button>

      {/* Slide-out AI Panel */}
      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
