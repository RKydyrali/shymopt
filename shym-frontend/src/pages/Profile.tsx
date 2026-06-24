import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  User, ShoppingBag, Tractor, SignOut, ArrowRight, Leaf, PencilSimple
} from '@phosphor-icons/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export default function Profile() {
  const { userId, role, logout } = useAuth();
  const navigate = useNavigate();

  const user = useQuery(api.users.getById, userId ? { id: userId as Id<"users"> } : "skip");
  const updateUser = useMutation(api.users.update);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await updateUser({
        id: userId as Id<"users">,
        name,
        phone,
        address
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
  };

  // Not logged in
  if (!userId) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-3xl bg-[#F0EDE8] flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-[#7A7065]" />
          </div>
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">Вы не вошли в систему</h2>
          <p className="text-sm text-[#7A7065] mb-7 leading-relaxed">
            Войдите в аккаунт, чтобы просматривать заказы и управлять профилем.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/login">
              <Button size="lg" className="w-full">Войти в аккаунт</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="w-full">Зарегистрироваться</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in
  const isFarmer = role === 'farmer';

  const buyerLinks = [
    { to: '/catalog', icon: <Leaf className="h-5 w-5" />, label: 'Каталог', desc: 'Просмотр предложений фермеров' },
    { to: '/orders', icon: <ShoppingBag className="h-5 w-5" />, label: 'Мои заказы', desc: 'История и статусы заказов' },
    { to: '/checkout', icon: <ArrowRight className="h-5 w-5" />, label: 'Оформить заказ', desc: 'Перейти к корзине' },
  ];

  const farmerLinks = [
    { to: '/farmer/dashboard', icon: <Tractor className="h-5 w-5" />, label: 'Панель управления', desc: 'Статистика и аналитика' },
    { to: '/farmer/lots', icon: <Leaf className="h-5 w-5" />, label: 'Мои лоты', desc: 'Управление товарами' },
    { to: '/farmer/orders', icon: <ShoppingBag className="h-5 w-5" />, label: 'Заказы покупателей', desc: 'Входящие заказы' },
  ];

  const links = isFarmer ? farmerLinks : buyerLinks;

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header bar */}
      <div className="bg-white border-b border-[#E8E4DE]">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-8">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-[#FAE0DB] flex items-center justify-center flex-shrink-0">
              {isFarmer
                ? <Tractor className="h-7 w-7 text-[#E04F33]" />
                : <User className="h-7 w-7 text-[#E04F33]" />
              }
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#2D2D2D]">
                {user ? user.name : 'Загрузка...'}
              </h1>
              <p className="text-sm text-[#7A7065] mt-0.5">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold bg-[#EEF4F1] text-[#4A7C59] px-2 py-0.5 rounded-full">
                {isFarmer ? 'Фермер' : 'Покупатель'}
              </span>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F0EDE8] text-[#7A7065] hover:bg-[#E8E4DE] transition-colors"
            >
              <PencilSimple className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-8 space-y-4">
        {isEditing && (
          <Card className="border-[#E8E4DE] shadow-sm mb-6">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-[#2D2D2D]">Редактирование профиля</h2>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Имя</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Телефон</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {isFarmer && (
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Адрес склада (самовывоз)</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nav links */}
        {!isEditing && links.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:shadow-[0_8px_24px_rgba(45,45,45,0.10)] transition-all duration-200 cursor-pointer group">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F0EDE8] flex items-center justify-center text-[#7A7065] group-hover:bg-[#FAE0DB] group-hover:text-[#E04F33] transition-colors flex-shrink-0">
                    {link.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D] text-sm">{link.label}</p>
                    <p className="text-xs text-[#7A7065]">{link.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#7A7065] group-hover:text-[#E04F33] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-[#E8E4DE] bg-white text-[#7A7065] hover:text-[#E04F33] hover:border-[#E04F33]/30 hover:bg-[#FAE0DB]/30 transition-all duration-150 text-sm font-medium"
          >
            <SignOut className="h-4 w-4" />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}
