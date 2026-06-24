import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Leaf, Eye, EyeSlash } from '@phosphor-icons/react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'buyer' | 'farmer'>('buyer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useMutation(api.users.login);

  const redirectTo = searchParams.get('from') || '/catalog';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Введите email адрес');
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginMutation({ email });
      if (user.role !== role) {
        throw new Error(`Вы зарегистрированы как ${user.role === 'farmer' ? 'Фермер' : 'Покупатель'}`);
      }
      login(user._id as Id<"users">, user.role);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#E04F33] shadow-md mb-4">
            <Leaf className="h-6 w-6 text-white" weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Войти в ShymOpt</h1>
          <p className="text-sm text-[#7A7065] mt-1.5">Введите данные для входа в аккаунт</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#E8E4DE] shadow-[0_4px_24px_rgba(45,45,45,0.08)] p-8">

          {/* Role toggle */}
          <div className="flex bg-[#F0EDE8] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                role === 'buyer'
                  ? 'bg-white text-[#2D2D2D] shadow-sm'
                  : 'text-[#7A7065] hover:text-[#2D2D2D]'
              }`}
            >
              Покупатель
            </button>
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                role === 'farmer'
                  ? 'bg-white text-[#2D2D2D] shadow-sm'
                  : 'text-[#7A7065] hover:text-[#2D2D2D]'
              }`}
            >
              Фермер
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5" htmlFor="password">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A7065] hover:text-[#2D2D2D] transition-colors"
                >
                  {showPassword
                    ? <EyeSlash className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[#E04F33] bg-[#FAE0DB] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Входим...
                </span>
              ) : (
                'Войти'
              )}
            </Button>
          </form>


        </div>

        <p className="text-center text-sm text-[#7A7065] mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-[#E04F33] font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
