import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';

interface EditLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: any; // The lot object to edit
}

export default function EditLotModal({ isOpen, onClose, lot }: EditLotModalProps) {
  const categories = useQuery(api.categories.getAll);
  const updateLot = useMutation(api.lots.update);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unitType, setUnitType] = useState('кг');
  const [unitWeight, setUnitWeight] = useState('1');
  const [availableQuantity, setAvailableQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [photoStorageId, setPhotoStorageId] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Load lot data when opened
  useEffect(() => {
    if (isOpen && lot) {
      setTitle(lot.title);
      setCategoryId(lot.categoryId);
      setPricePerUnit(lot.pricePerUnit.toString());
      setUnitType(lot.unitType);
      setUnitWeight(lot.unitWeight.toString());
      setAvailableQuantity(lot.availableQuantity.toString());
      setDescription(lot.description || '');
      setPhotoStorageId(lot.photo || null);
      setPhotoPreviewUrl(lot.photoUrl || null);
      setAddress(lot.address || '');
      setExpirationDate(lot.expirationDate || '');
    }
  }, [isOpen, lot]);

  if (!isOpen || !lot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateLot({
        id: lot._id as Id<"lots">,
        categoryId: categoryId as Id<"categories">,
        title,
        description,
        pricePerUnit: Number(pricePerUnit),
        unitType,
        unitWeight: Number(unitWeight),
        availableQuantity: Number(availableQuantity),
        photo: photoStorageId as Id<"_storage"> | undefined,
        address: address.trim() || undefined,
        expirationDate: expirationDate || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления лота');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-[#2D2D2D] mb-6">Изменить лот</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Фото товара</label>
            <ImageUpload 
              previewUrl={photoPreviewUrl} 
              onUpload={(storageId, previewUrl) => {
                setPhotoStorageId(storageId);
                setPhotoPreviewUrl(previewUrl);
              }} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Название товара</label>
            <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Картофель Гала" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Категория</label>
            <select 
              required 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              className="w-full h-11 px-4 bg-white border border-[#E8E4DE] rounded-xl text-sm focus:ring-2 focus:ring-[#E04F33]/30 focus:border-[#E04F33] outline-none"
            >
              <option value="" disabled>Выберите категорию</option>
              {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Цена (₸)</label>
              <Input required type="number" min="0" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Единица (шт, кг, мешок)</label>
              <Input required value={unitType} onChange={e => setUnitType(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Вес единицы (кг)</label>
              <Input required type="number" min="0" step="0.1" value={unitWeight} onChange={e => setUnitWeight(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">В наличии (шт)</label>
              <Input required type="number" min="0" value={availableQuantity} onChange={e => setAvailableQuantity(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Адрес самовывоза / отгрузки</label>
            <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="г. Шымкент, ул. Байдибек би, 123" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Срок годности</label>
            <Input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Описание</label>
            <textarea 
              className="w-full p-3 bg-white border border-[#E8E4DE] rounded-xl text-sm focus:ring-2 focus:ring-[#E04F33]/30 focus:border-[#E04F33] outline-none resize-none" 
              rows={3} 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите сорт, качество, условия хранения..."
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#E8E4DE]">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
