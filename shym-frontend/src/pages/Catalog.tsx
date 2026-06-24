import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { MapPin, MagnifyingGlass, Leaf, Funnel, X, SortAscending, SortDescending, Star, Microphone, MicrophoneSlash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { convertBlobToWavBase64 } from '@/lib/voice';

const categoryEmojis: Record<string, string> = {
  'Помидоры': '🍅',
  'Огурцы': '🥒',
  'Виноград': '🍇',
  'Картофель': '🥔',
  'Морковь': '🥕',
  'Лук': '🧅',
  'Яблоки': '🍎',
  'Капуста': '🥬',
  'Перец': '🫑',
  'Зелень': '🌿',
  'Ягоды': '🍓',
  'Фрукты': '🍎',
  'Овощи': '🥦'
};
const getEmoji = (name: string) => categoryEmojis[name] || '📦';

type SortType = 'default' | 'price_asc' | 'price_desc' | 'rating_desc';
// ── Skeleton Card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-[#E8E4DE] overflow-hidden animate-pulse">
      <div className="aspect-video bg-[#F0EDE8]" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 bg-[#F0EDE8] rounded-full" />
        <div className="h-4 w-3/4 bg-[#F0EDE8] rounded-full" />
        <div className="h-3 w-1/2 bg-[#F0EDE8] rounded-full" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 w-20 bg-[#F0EDE8] rounded-full" />
          <div className="h-8 w-20 bg-[#F0EDE8] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-full">
      <div className="h-16 w-16 rounded-2xl bg-[#F0EDE8] flex items-center justify-center mb-5">
        {hasSearch ? (
          <MagnifyingGlass className="h-7 w-7 text-[#7A7065]" />
        ) : (
          <Leaf className="h-7 w-7 text-[#4A7C59]" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
        {hasSearch ? 'Ничего не найдено' : 'Лоты не добавлены'}
      </h3>
      <p className="text-sm text-[#7A7065] max-w-xs leading-relaxed">
        {hasSearch
          ? 'Попробуйте изменить поисковый запрос или сбросить фильтры категории'
          : 'Фермеры скоро добавят свои предложения. Загляните позже!'}
      </p>
    </div>
  );
}

// ── Lot Card ──────────────────────────────────────────────
function LotCard({ lot }: { lot: any }) {
  const pricePerKg = lot.unitWeight > 0 ? Math.round(lot.pricePerUnit / lot.unitWeight) : 0;
  return (
    <Link to={`/catalog/${lot._id}`} className="group block">
      <Card className="overflow-hidden hover:shadow-[0_8px_24px_rgba(45,45,45,0.10)] transition-all duration-300 group-hover:-translate-y-0.5">
        <div className="aspect-video bg-[#F0EDE8] relative overflow-hidden">
          {lot.photoUrl ? (
            <img
              src={lot.photoUrl}
              alt={lot.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#7A7065]">
              <Leaf className="h-8 w-8 mb-1 text-[#4A7C59]/40" />
              <span className="text-xs">Нет фото</span>
            </div>
          )}
          {lot.category?.name && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#4A7C59] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#4A7C59]/20">
              {lot.category.name}
            </span>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-[#2D2D2D] line-clamp-1 mb-1.5">{lot.title}</h3>
          <div className="flex items-center gap-1 text-[#7A7065] mb-4">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1 text-xs">{lot.farmer?.address || 'Адрес не указан'}</span>
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
            <span className="inline-flex items-center gap-1 bg-[#E04F33] text-white text-xs font-semibold px-3 py-1.5 rounded-lg group-hover:bg-[#C93B25] transition-colors">
              Подробнее
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function Catalog() {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortType, setSortType] = useState<SortType>('default');
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const transcribe = useAction(api.ai.transcribeAudio);
  const categories = useQuery(api.categories.getAll);
  const lots = useQuery(api.lots.getAll, { search });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          setSearch("🎙️ Распознаю голос...");

          const wavBase64 = await convertBlobToWavBase64(audioBlob);

          const transcribedText = await transcribe({
            audioBase64: wavBase64,
            filename: 'voice.wav'
          });

          if (transcribedText && transcribedText.trim()) {
            setSearch(transcribedText);
          } else {
            setSearch("");
            alert("Не удалось распознать голос. Попробуйте сказать еще раз.");
          }
        } catch (err: any) {
          console.error(err);
          setSearch("");
          alert("Ошибка при распознавании голоса: " + (err.message || err));
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const filteredLots = lots?.filter(lot =>
    selectedCategoryId ? lot.categoryId === selectedCategoryId : true
  );

  const sortedLots = React.useMemo(() => {
    if (!filteredLots) return undefined;
    const lotsCopy = [...filteredLots];
    if (sortType === 'price_asc') {
      return lotsCopy.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    }
    if (sortType === 'price_desc') {
      return lotsCopy.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    }
    if (sortType === 'rating_desc') {
      return lotsCopy.sort((a, b) => ((b.farmer as any)?.rating || 0) - ((a.farmer as any)?.rating || 0));
    }
    return lotsCopy;
  }, [filteredLots, sortType]);

  const selectedCategory = categories?.find(c => c._id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8E4DE]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2D2D2D]">Каталог</h1>
              <p className="text-sm text-[#7A7065] mt-0.5">
                {sortedLots !== undefined
                  ? `${sortedLots.length} предложени${sortedLots.length === 1 ? 'е' : sortedLots.length < 5 ? 'я' : 'й'}`
                  : 'Загрузка...'}
                {selectedCategory ? ` в категории «${selectedCategory.name}»` : ''}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7065] h-4 w-4 pointer-events-none" />
              <Input
                placeholder={isRecording ? "🔴 Запись... Говорите" : "Поиск по каталогу..."}
                className="pl-10 pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isRecording}
              />
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E04F33] hover:text-[#c8432a] animate-pulse transition-colors"
                  title="Остановить запись"
                >
                  <MicrophoneSlash className="h-4.5 w-4.5" weight="fill" />
                </button>
              ) : search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7065] hover:text-[#2D2D2D] transition-colors"
                  title="Очистить"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7065] hover:text-[#E04F33] transition-colors"
                  title="Голосовой поиск"
                >
                  <Microphone className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile filter toggle */}
          <button
            className="mt-4 sm:hidden flex items-center gap-2 text-sm font-medium text-[#2D2D2D] bg-[#F0EDE8] px-4 py-2 rounded-lg"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          >
            <Funnel className="h-4 w-4" />
            Категории
            {selectedCategoryId && (
              <span className="ml-1 bg-[#E04F33] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>
            )}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* ── Sidebar ──────────────────────────── */}
          <aside className={cn(
            'w-full md:w-56 flex-shrink-0 self-start',
            !isMobileFiltersOpen && 'hidden md:block'
          )}>
            <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-[0_4px_12px_rgba(45,45,45,0.06)] sticky top-24">
              <h3 className="text-xs font-semibold text-[#7A7065] uppercase tracking-widest mb-4">
                Фильтры и Сортировка
              </h3>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#2D2D2D] mb-1">Сортировка</span>
                
                <button
                  onClick={() => setSortType('default')}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl text-sm transition-all duration-150 flex items-center gap-2',
                    sortType === 'default'
                      ? 'bg-[#EEF4F1] text-[#4A7C59] font-medium'
                      : 'text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D]'
                  )}
                >
                  <Funnel className="w-4 h-4" /> По умолчанию
                </button>

                <button
                  onClick={() => setSortType('price_asc')}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl text-sm transition-all duration-150 flex items-center gap-2',
                    sortType === 'price_asc'
                      ? 'bg-[#EEF4F1] text-[#4A7C59] font-medium'
                      : 'text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D]'
                  )}
                >
                  <SortAscending className="w-4 h-4" /> Сначала дешевле
                </button>

                <button
                  onClick={() => setSortType('price_desc')}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl text-sm transition-all duration-150 flex items-center gap-2',
                    sortType === 'price_desc'
                      ? 'bg-[#EEF4F1] text-[#4A7C59] font-medium'
                      : 'text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D]'
                  )}
                >
                  <SortDescending className="w-4 h-4" /> Сначала дороже
                </button>
                
                <button
                  onClick={() => setSortType('rating_desc')}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl text-sm transition-all duration-150 flex items-center gap-2',
                    sortType === 'rating_desc'
                      ? 'bg-[#EEF4F1] text-[#4A7C59] font-medium'
                      : 'text-[#7A7065] hover:bg-[#F0EDE8] hover:text-[#2D2D2D]'
                  )}
                >
                  <Star className="w-4 h-4" /> По рейтингу продавца
                </button>
              </div>

              {/* Reset filter */}
              {(selectedCategoryId || sortType !== 'default') && (
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSortType('default');
                  }}
                  className="mt-6 w-full text-center text-xs text-[#7A7065] hover:text-[#E04F33] transition-colors py-1"
                >
                  Сбросить всё
                </button>
              )}
            </div>
          </aside>

          {/* ── Main Grid ────────────────────────── */}
          <div className="flex-1 min-w-0 min-h-[400px]">
            {/* Horizontal Categories */}
            <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 min-w-max pb-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    'rounded-full px-4 py-2 border text-sm font-medium transition-all',
                    !selectedCategoryId
                      ? 'border-[#E04F33] bg-[#EEF4F1] text-[#2D2D2D]'
                      : 'border-gray-200 bg-white text-[#7A7065] hover:border-[#E04F33] hover:text-[#2D2D2D]'
                  )}
                >
                  Все товары
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={cn(
                      'rounded-full px-4 py-2 border text-sm font-medium transition-all flex items-center gap-1.5',
                      selectedCategoryId === cat._id
                        ? 'border-[#E04F33] bg-[#EEF4F1] text-[#2D2D2D]'
                        : 'border-gray-200 bg-white text-[#7A7065] hover:border-[#E04F33] hover:text-[#2D2D2D]'
                    )}
                  >
                    <span>{getEmoji(cat.name)}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {sortedLots === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : sortedLots.length === 0 ? (
              <EmptyState hasSearch={!!search || !!selectedCategoryId} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedLots.map((lot) => (
                  <LotCard key={lot._id} lot={lot} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
