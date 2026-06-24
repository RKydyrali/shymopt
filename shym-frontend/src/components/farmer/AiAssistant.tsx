import React, { useState, useEffect, useRef } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import type { Id } from '@convex/_generated/dataModel';
import { Robot, X, PaperPlaneRight, CheckCircle, Package, ArrowCounterClockwise, Microphone, MicrophoneSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { convertBlobToWavBase64 } from '@/lib/voice';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isCard?: boolean;
  lotDraft?: any;
}

export default function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const { userId } = useAuth();
  const farmerId = userId as Id<"users">;
  
  const parseLot = useAction(api.ai.parseLotFromText);
  const generateQuestions = useAction(api.ai.generateLotClarifyingQuestions);
  const transcribe = useAction(api.ai.transcribeAudio);
  const createLot = useMutation(api.lots.create);
  const categories = useQuery(api.categories.getAll);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Ассалаумагалейкум! Я ваш ИИ-помощник ShymOpt. Просто напишите мне, какой урожай вы хотите выставить на продажу (например: 'Собрал тонну картошки по 120 тенге в мешках'), или наговорите голосом, нажав на микрофон!",
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const resetChat = () => {
    setExtractedData({});
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Хорошо, давайте начнем заново! Что будем продавать?",
      }
    ]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsLoading(true);
        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });

          setMessages(prev => [...prev, { 
            id: 'transcribing', 
            role: 'assistant', 
            content: "🎙️ Распознаю вашу речь..." 
          }]);

          const wavBase64 = await convertBlobToWavBase64(audioBlob);

          const transcribedText = await transcribe({
            audioBase64: wavBase64,
            filename: 'voice.wav'
          });

          // Remove the loading message
          setMessages(prev => prev.filter(m => m.id !== 'transcribing'));

          if (transcribedText && transcribedText.trim()) {
            setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'user', 
              content: transcribedText 
            }]);
            
            await processText(transcribedText);
          } else {
            setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'assistant', 
              content: "Не удалось распознать речь. Попробуйте сказать громче или напишите текстом." 
            }]);
          }
        } catch (err: any) {
          console.error(err);
          setMessages(prev => prev.filter(m => m.id !== 'transcribing'));
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            content: "Ошибка при расшифровке голоса: " + (err.message || "проверьте ключ Alem AI") 
          }]);
        } finally {
          setIsLoading(false);
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

  const processText = async (userText: string) => {
    setIsLoading(true);
    try {
      const allUserText = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('. ') + '. ' + userText;

      let parsed: any = {};
      try {
        parsed = await parseLot({ text: allUserText });
      } catch (err) {
        console.warn("LLM failed, using fallback simulation");
        parsed = { ...extractedData };
        if (userText.toLowerCase().includes('картош') || userText.toLowerCase().includes('помидор')) parsed.title = userText;
        if (userText.includes('кг')) parsed.unitWeight = 1;
        if (/\d+/.test(userText)) parsed.availableQuantity = parseInt(userText.match(/\d+/)![0]);
      }

      const newData = { ...extractedData, ...parsed };
      Object.keys(newData).forEach(key => {
        if (newData[key] === null) delete newData[key];
      });
      
      setExtractedData(newData);

      const required = ['title', 'pricePerUnit', 'unitType', 'unitWeight', 'availableQuantity'];
      const missing = required.filter(k => newData[k] === undefined || newData[k] === null || newData[k] === '');

      if (missing.length > 0) {
        let question = '';
        try {
          question = await generateQuestions({ currentInfo: JSON.stringify(newData) });
        } catch (e) {
          question = "Отлично, записал! А подскажите еще, пожалуйста: не хватает данных о " + missing.join(', ') + " (например, количество или цена).";
        }
        
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: question 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: "Всё готово! Проверьте данные лота перед публикацией:",
          isCard: true,
          lotDraft: newData
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "Извините, произошла ошибка при обработке сообщения. Попробуйте еще раз." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userText = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);
    
    await processText(userText);
  };

  const handlePublish = async (draft: any) => {
    setIsLoading(true);
    try {
      // Find category ID based on parsed name, fallback to first category
      let catId = categories?.[0]?._id;
      if (draft.categoryName && categories) {
        const found = categories.find(c => c.name.toLowerCase().includes(draft.categoryName.toLowerCase()) || draft.categoryName.toLowerCase().includes(c.name.toLowerCase()));
        if (found) catId = found._id;
      }

      await createLot({
        farmerId,
        categoryId: catId as Id<"categories">,
        title: draft.title,
        pricePerUnit: Number(draft.pricePerUnit),
        unitType: draft.unitType,
        unitWeight: Number(draft.unitWeight),
        availableQuantity: Number(draft.availableQuantity),
        minOrder: 1,
        description: draft.description || '',
        photoUrl: `https://picsum.photos/seed/${Date.now()}/800/600` // Auto-generate mock photo for AI flow
      });

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "✅ Супер! Лот успешно опубликован в каталоге. Вы можете найти его в разделе 'Мои лоты'." 
      }]);
      setExtractedData({});
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      
      {/* Slide-out Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-[#F9F8F6] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 border-l border-[#E8E4DE]">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E8E4DE] px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#FAE0DB] text-[#E04F33] rounded-full flex items-center justify-center">
              <Robot className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D2D2D]">ИИ-Помощник Дехканина</h3>
              <p className="text-xs text-[#4A7C59] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse" /> Онлайн
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#7A7065] hover:bg-[#F0EDE8] rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-[#E04F33] text-white rounded-br-none shadow-sm' 
                  : 'bg-white text-[#2D2D2D] border border-[#E8E4DE] rounded-bl-none shadow-sm'
              }`}>
                {msg.content}
                
                {/* Lot Confirmation Card */}
                {msg.isCard && msg.lotDraft && (
                  <div className="mt-4 bg-[#F9F8F6] border border-[#E8E4DE] rounded-xl overflow-hidden shadow-inner">
                    <div className="aspect-video bg-[#E8E4DE] relative flex items-center justify-center text-[#7A7065]">
                      <Package className="h-10 w-10 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                        <span className="text-white font-bold">{msg.lotDraft.title}</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#7A7065]">Цена за тару:</span>
                        <span className="font-bold text-[#2D2D2D]">{msg.lotDraft.pricePerUnit} ₸</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#7A7065]">Фасовка:</span>
                        <span className="font-medium text-[#2D2D2D]">{msg.lotDraft.unitType} ({msg.lotDraft.unitWeight} кг)</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#7A7065]">В наличии:</span>
                        <span className="font-medium text-[#2D2D2D]">{msg.lotDraft.availableQuantity} шт</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-[#E8E4DE] pt-2 mt-2">
                        <span className="text-[#7A7065]">Цена за кг:</span>
                        <span className="font-bold text-[#4A7C59]">
                          {Math.round(msg.lotDraft.pricePerUnit / msg.lotDraft.unitWeight)} ₸/кг
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white border-t border-[#E8E4DE] flex flex-col gap-2">
                      <Button 
                        onClick={() => handlePublish(msg.lotDraft)}
                        disabled={isLoading}
                        className="w-full bg-[#E04F33] hover:bg-[#c8432a] text-white flex items-center justify-center gap-2 h-10"
                      >
                        <CheckCircle className="h-5 w-5" weight="bold" /> Подтвердить и опубликовать
                      </Button>
                      <Button 
                        onClick={resetChat}
                        variant="outline"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 h-10"
                      >
                        <X className="h-4 w-4" /> Сбросить / Начать заново
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E8E4DE] rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-[#E04F33] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#E04F33] rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-[#E04F33] rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-[#E8E4DE]">
          <div className="flex items-end gap-2 bg-[#F9F8F6] border border-[#E8E4DE] rounded-2xl p-2 focus-within:border-[#E04F33] focus-within:ring-1 focus-within:ring-[#E04F33]/30 transition-all">
            <button 
              onClick={resetChat} 
              className="p-2 text-[#7A7065] hover:text-[#E04F33] hover:bg-[#FAE0DB] rounded-xl transition-colors mb-0.5"
              title="Начать заново"
            >
              <ArrowCounterClockwise className="h-5 w-5" />
            </button>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? "🔴 Запись... Говорите на казахском или русском" : "Напишите, что вы продаете..."}
              disabled={isRecording || isLoading}
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm text-[#2D2D2D] py-2.5 px-2"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="bg-[#E04F33] text-white p-2.5 rounded-xl hover:bg-[#c8432a] transition-colors shadow-sm mb-0.5 animate-pulse flex items-center justify-center"
                title="Остановить запись"
              >
                <MicrophoneSlash className="h-5 w-5" weight="fill" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isLoading}
                className="p-2.5 text-[#7A7065] hover:text-[#E04F33] hover:bg-[#FAE0DB] rounded-xl transition-colors mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Записать голос"
              >
                <Microphone className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading || isRecording}
              className="bg-[#E04F33] text-white p-2.5 rounded-xl hover:bg-[#c8432a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-0.5"
            >
              <PaperPlaneRight className="h-5 w-5" weight="fill" />
            </button>
          </div>
          <p className="text-[10px] text-center text-[#7A7065] mt-2">
            ИИ может допускать ошибки. Пожалуйста, проверяйте данные перед публикацией.
          </p>
        </div>
      </div>
    </>
  );
}
