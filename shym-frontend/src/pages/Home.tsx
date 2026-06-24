import React from 'react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Leaf, Truck, Shield } from '@phosphor-icons/react';

// ── Empty / Loading State Components Removed ──────────────────────

// ── Trust pillars ──────────────────────────────────────────
const features = [
  {
    icon: <Leaf className="h-6 w-6 text-[#4A7C59]" />,
    title: 'Прямо с поля',
    desc: 'Без посредников — от фермера напрямую к вашему бизнесу',
  },
  {
    icon: <Truck className="h-6 w-6 text-[#4A7C59]" />,
    title: 'Удобная логистика',
    desc: 'Самовывоз или организация доставки с подтверждением',
  },
  {
    icon: <Shield className="h-6 w-6 text-[#4A7C59]" />,
    title: 'Гарантия качества',
    desc: 'Все фермеры проверены. Оплата только при получении',
  },
];

// ── Main Page ──────────────────────────────────────────────
export default function Home() {

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero Section ──────────────────────────── */}
      <section className="bg-[#F9F8F6] pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

            {/* Left: Text */}
            <div className="flex-1 max-w-xl animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-[#EEF4F1] text-[#4A7C59] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Leaf className="h-3.5 w-3.5" />
                Оптовые закупки напрямую у фермеров
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D2D2D] leading-[1.1] mb-6">
                Свежие продукты
                <br />
                <span className="text-[#E04F33]">без посредников</span>
              </h1>

              <p className="text-[#7A7065] text-lg leading-relaxed mb-8 max-w-md">
                ShymOpt объединяет оптовых покупателей и фермеров Казахстана. 
                Лучшие цены, проверенное качество, прямые поставки.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/catalog">
                  <Button size="lg" className="shadow-md shadow-[#E04F33]/25 hover:shadow-lg hover:shadow-[#E04F33]/30 transition-shadow">
                    Начать закупки
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/register?role=farmer">
                  <Button size="lg" variant="outline">
                    Стать фермером
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#2D2D2D]">500+</p>
                  <p className="text-xs text-[#7A7065]">Фермеров</p>
                </div>
                <div className="h-8 w-px bg-[#E8E4DE]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#2D2D2D]">10 000+</p>
                  <p className="text-xs text-[#7A7065]">Заказов</p>
                </div>
                <div className="h-8 w-px bg-[#E8E4DE]" />
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Star weight="fill" className="h-4 w-4 text-[#F4A261]" />
                    <p className="text-2xl font-bold text-[#2D2D2D]">4.9</p>
                  </div>
                  <p className="text-xs text-[#7A7065]">Рейтинг</p>
                </div>
              </div>
            </div>

            {/* Right: Static Image */}
            <div className="flex-1 w-full max-w-md md:max-w-lg">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                  alt="Свежие овощи на рынке" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="font-semibold text-lg drop-shadow-md">Натурально. Выгодно. Надежно.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Pillars ────────────────────────── */}
      <section className="bg-white border-y border-[#E8E4DE] py-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#EEF4F1] flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-[#2D2D2D] mb-0.5">{f.title}</p>
                  <p className="text-sm text-[#7A7065] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fresh Lots Section Removed ────────────────────── */}
      <section className="py-16 md:py-20 bg-[#F9F8F6]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="bg-[#2D2D2D] rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden">
            {/* Decorative colour accents — subtle */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#E04F33] opacity-[0.07]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#4A7C59] opacity-[0.10]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#F4A261] opacity-[0.03]" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-[#4A7C59]/20 border border-[#4A7C59]/30 text-[#A8CBAF] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Leaf className="h-3.5 w-3.5" />
                Для фермеров
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Продавайте урожай оптом</h2>
              <p className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Зарегистрируйтесь как фермер, добавьте свои лоты и получайте оптовые заказы от проверенных покупателей.
              </p>
              <Link to="/register?role=farmer">
                <Button size="lg" variant="secondary" className="shadow-md">
                  Стать фермером — бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
