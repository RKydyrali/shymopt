import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, List, X, User, SignOut, Tractor, Package, Bell, Star } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import CartDrawer from '@/components/cart/CartDrawer';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { userId, role, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(api.notifications.getByUser, userId ? { userId: userId as Id<"users"> } : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isProfileOpen || isNotificationsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileOpen, isNotificationsOpen]);

  const navLinks = [
    { to: '/catalog', label: 'Каталог' },
    { to: '/farmers', label: 'Фермеры' },
    { to: '/orders', label: 'Мои заказы' },
  ];

  const cartCount = items.reduce((acc, i) => acc + i.qty, 0);
  const isFarmer = role === 'farmer';

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/', { replace: true });
  };

  // Active link check — exact for home, startsWith for others
  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markRead({ notificationId: n._id });
    }
    setIsNotificationsOpen(false);
    if (n.relatedOrderId) {
      navigate(isFarmer ? `/farmer/orders/${n.relatedOrderId}` : `/orders/${n.relatedOrderId}`);
    } else {
      navigate(isFarmer ? `/farmer/dashboard` : `/profile`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#2D2D2D]">
      {/* ── Header ─────────────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-white border-b border-[#E8E4DE]',
          'transition-shadow duration-200',
          scrolled && 'shadow-[0_2px_12px_rgba(45,45,45,0.07)]'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 flex h-16 items-center justify-between max-w-7xl">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-[#E04F33] flex items-center justify-center shadow-sm group-hover:bg-[#C93B25] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 4 6 4 10C4 14 8 18 12 22C16 18 20 14 20 10C20 6 16 2 12 2Z" fill="white" opacity="0.9"/>
                <path d="M12 8C12 8 9 11 9 14H15C15 11 12 8 12 8Z" fill="#E04F33"/>
              </svg>
            </div>
            <span className="font-bold text-[1.1rem] tracking-tight text-[#2D2D2D] group-hover:text-[#E04F33] transition-colors">
              ShymOpt
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'text-[#E04F33]'
                      : 'text-[#7A7065] hover:text-[#2D2D2D] hover:bg-[#F0EDE8]'
                  )}
                >
                  {link.label}
                  {/* Active underline indicator */}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-[#E04F33] rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Farmer dashboard link */}
            {isFarmer && (
              <Link
                to="/farmer/dashboard"
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive('/farmer')
                    ? 'text-[#E04F33]'
                    : 'text-[#7A7065] hover:text-[#2D2D2D] hover:bg-[#F0EDE8]'
                )}
              >
                Кабинет фермера
                {isActive('/farmer') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-[#E04F33] rounded-full" />
                )}
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            {userId && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={cn(
                    'relative h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-150',
                    isNotificationsOpen ? 'bg-[#F0EDE8] text-[#2D2D2D]' : 'text-[#7A7065] hover:text-[#2D2D2D] hover:bg-[#F0EDE8]'
                  )}
                  aria-label="Уведомления"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#E04F33] ring-2 ring-white"></span>
                  )}
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 max-h-[400px] overflow-y-auto bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_8px_32px_rgba(45,45,45,0.12)] z-50 animate-fade-in flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8] sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                      <h3 className="font-bold text-[#2D2D2D]">Уведомления</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAllRead({ userId: userId as Id<"users"> })}
                          className="text-xs font-medium text-[#E04F33] hover:underline"
                        >
                          Прочитать всё
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {!notifications || notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-8 w-8 text-[#E8E4DE] mx-auto mb-2" />
                          <p className="text-sm text-[#7A7065]">Нет новых уведомлений</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#F0EDE8]">
                          {notifications.map(n => (
                            <div 
                              key={n._id} 
                              onClick={() => handleNotificationClick(n)}
                              className={cn(
                                'p-4 cursor-pointer hover:bg-[#F9F8F6] transition-colors',
                                !n.isRead ? 'bg-[#EEF4F1]/30' : ''
                              )}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                  n.type === 'order' ? 'bg-[#EEF4F1] text-[#4A7C59]' :
                                  n.type === 'review' ? 'bg-[#FFF3E0] text-[#F4A261]' :
                                  'bg-[#F0EDE8] text-[#7A7065]'
                                )}>
                                  {n.type === 'order' ? <Package className="h-4 w-4" /> :
                                   n.type === 'review' ? <Star className="h-4 w-4" /> :
                                   <Bell className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={cn("text-sm leading-tight", !n.isRead ? "font-bold text-[#2D2D2D]" : "font-semibold text-[#2D2D2D]")}>
                                      {n.title}
                                    </h4>
                                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#E04F33] mt-1 flex-shrink-0"></span>}
                                  </div>
                                  <p className="text-xs text-[#7A7065] leading-snug mb-1">{n.message}</p>
                                  <p className="text-[10px] text-[#A39A90] font-medium uppercase tracking-wider">
                                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative h-10 w-10 rounded-lg flex items-center justify-center text-[#7A7065] hover:text-[#2D2D2D] hover:bg-[#F0EDE8] transition-all duration-150"
              aria-label="Корзина"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#E04F33] text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Профиль"
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-150',
                  userId
                    ? 'bg-[#FAE0DB] text-[#E04F33] hover:bg-[#F5C5BB]'
                    : 'text-[#7A7065] hover:text-[#2D2D2D] hover:bg-[#F0EDE8]'
                )}
              >
                <User className="h-5 w-5" />
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_8px_32px_rgba(45,45,45,0.12)] overflow-hidden z-50 animate-fade-in">
                  {userId ? (
                    <>
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-[#F0EDE8]">
                        <p className="text-xs text-[#7A7065]">Вы вошли как</p>
                        <p className="text-sm font-semibold text-[#2D2D2D] mt-0.5 truncate">{userId}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold bg-[#EEF4F1] text-[#4A7C59] px-2 py-0.5 rounded-full">
                          {isFarmer ? 'Фермер' : 'Покупатель'}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors"
                        >
                          <User className="h-4 w-4 text-[#7A7065]" />
                          Мой профиль
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors"
                        >
                          <Package className="h-4 w-4 text-[#7A7065]" />
                          Мои заказы
                        </Link>
                        {isFarmer && (
                          <Link
                            to="/farmer/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors"
                          >
                            <Tractor className="h-4 w-4 text-[#7A7065]" />
                            Кабинет фермера
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-[#F0EDE8] py-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#E04F33] hover:bg-[#FAE0DB] transition-colors"
                        >
                          <SignOut className="h-4 w-4" />
                          Выйти
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <Link
                        to="/login"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors"
                      >
                        <User className="h-4 w-4 text-[#7A7065]" />
                        Войти
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors"
                      >
                        <User className="h-4 w-4 text-[#7A7065]" />
                        Зарегистрироваться
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA button — hidden when logged in as farmer */}
            {!isFarmer && (
              <Link to="/catalog" className="hidden md:flex ml-1">
                <Button size="sm">Начать закупки</Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden h-10 w-10 rounded-lg flex items-center justify-center text-[#7A7065] hover:bg-[#F0EDE8] transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Меню"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ───────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[#E8E4DE] bg-white px-4 py-3 flex flex-col gap-1 shadow-sm">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#FAE0DB] text-[#E04F33]'
                    : 'text-[#2D2D2D] hover:bg-[#F0EDE8]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {isFarmer && (
            <Link
              to="/farmer/dashboard"
              className={cn(
                'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive('/farmer') ? 'bg-[#FAE0DB] text-[#E04F33]' : 'text-[#2D2D2D] hover:bg-[#F0EDE8]'
              )}
            >
              Кабинет фермера
            </Link>
          )}

          {/* Auth actions in mobile menu */}
          <div className="mt-2 pt-2 border-t border-[#F0EDE8] flex flex-col gap-1">
            {userId ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#E04F33] hover:bg-[#FAE0DB] transition-colors text-left"
              >
                <SignOut className="h-4 w-4" />
                Выйти
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-3 rounded-xl text-sm font-medium text-[#2D2D2D] hover:bg-[#F0EDE8] transition-colors">
                  Войти
                </Link>
                <Link to="/register" className="mt-1">
                  <Button className="w-full">Зарегистрироваться</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main ──────────────────────────────────── */}
      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-[#E8E4DE] bg-white mt-auto">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#E04F33] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8 2 4 6 4 10C4 14 8 18 12 22C16 18 20 14 20 10C20 6 16 2 12 2Z" fill="white" opacity="0.9"/>
                    <path d="M12 8C12 8 9 11 9 14H15C15 11 12 8 12 8Z" fill="#E04F33"/>
                  </svg>
                </div>
                <span className="font-bold text-[#2D2D2D]">ShymOpt</span>
              </div>
              <p className="text-sm text-[#7A7065] max-w-xs leading-relaxed">
                Прямые оптовые закупки у фермеров Казахстана. Без посредников.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="text-xs font-semibold text-[#2D2D2D] uppercase tracking-widest mb-3">Покупателям</p>
                <ul className="space-y-2">
                  <li><Link to="/catalog" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Каталог</Link></li>
                  <li><Link to="/orders" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Мои заказы</Link></li>
                  <li><Link to="/checkout" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Оформить заказ</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#2D2D2D] uppercase tracking-widest mb-3">Фермерам</p>
                <ul className="space-y-2">
                  <li><Link to="/register?role=farmer" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Стать фермером</Link></li>
                  <li><Link to="/farmer/dashboard" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Кабинет</Link></li>
                  <li><Link to="/farmers" className="text-sm text-[#7A7065] hover:text-[#E04F33] transition-colors">Все фермеры</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#F0EDE8] flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#7A7065]">© 2026 ShymOpt. Все права защищены.</p>
            <p className="text-xs text-[#7A7065]">Прямые закупки у фермеров Казахстана</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
