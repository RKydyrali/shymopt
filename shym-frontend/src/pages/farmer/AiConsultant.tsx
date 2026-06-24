import React, { useState, useRef, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { PaperPlaneRight, Robot, User, Sparkle, ChatCircleText, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiConsultant() {
  const generateFarmAdvice = useAction(api.ai.generateFarmAdvice);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Ассалаумагалейкум! Я ваш личный ИИ-агроном и бизнес-консультант по сельскому хозяйству в Казахстане. Готов ответить на ваши вопросы об уходе за посевами, хранении, логистике и оптимизации продаж. Задайте вопрос или выберите одну из тем ниже!",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    {
      text: "🐛 Как бороться с тлей на картофеле без химии?",
      query: "Как эффективно и безопасно бороться с тлей на картофеле?"
    },
    {
      text: "🍓 Құлпынайды сақтау мерзімін қалай ұзартуға болады?",
      query: "Құлпынайды жинағаннан кейін оның сақтау мерзімін қалай ұзартуға болады? Қандай температура мен ылғалдылық қажет?"
    },
    {
      text: "💰 Оптимальные цены на капусту в Шымкенте сейчас",
      query: "Каковы рекомендации по ценообразованию и продажам ранней капусты в Туркестанской области/Шымкенте?"
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const response = await generateFarmAdvice({ question: userText });
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: response 
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "К сожалению, произошла ошибка при получении ответа. Попробуйте еще раз." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8 items-stretch min-h-[65vh]">
        
        {/* Left Side: Tips and Suggestions */}
        <div className="w-full md:w-1/3 flex flex-col justify-between bg-white border border-[#E8E4DE] rounded-3xl p-6 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-[#EEF4F1] text-[#4A7C59] rounded-2xl flex items-center justify-center">
                <Sparkle className="h-6 w-6" weight="fill" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#2D2D2D]">ИИ-Агроном</h2>
                <p className="text-xs text-[#7A7065]">Консультант ШымОпт</p>
              </div>
            </div>

            <p className="text-sm text-[#7A7065] leading-relaxed">
              Наш ИИ-консультант разработан специально для фермеров Туркестанской области и всего Казахстана. 
              Он знает тонкости местного климата, правила логистики и особенности выращивания культур.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wider">Частые вопросы</h3>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.query)}
                    disabled={isLoading}
                    className="text-left text-xs bg-[#F9F8F6] hover:bg-[#EEF4F1] active:bg-[#E8E4DE] text-[#2D2D2D] hover:text-[#4A7C59] border border-[#E8E4DE] rounded-xl p-3 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="font-medium pr-2">{q.text}</span>
                    <CaretRight className="h-4 w-4 text-[#7A7065] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E4DE] pt-4 mt-6 text-center md:text-left">
            <p className="text-[10px] text-[#7A7065]">
              Ответы генерируются нейросетью. Всегда сверяйте критические агрономические решения с сертифицированными специалистами.
            </p>
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex-1 bg-white border border-[#E8E4DE] rounded-3xl overflow-hidden flex flex-col shadow-sm">
          {/* Chat Header */}
          <div className="border-b border-[#E8E4DE] px-6 py-4 bg-[#F9F8F6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 bg-[#4A7C59] text-white rounded-full flex items-center justify-center shadow-sm">
                  <Robot className="h-5 w-5" weight="fill" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4A7C59] border-2 border-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D2D2D] text-sm md:text-base">Чат с агрономом</h3>
                <p className="text-[10px] text-[#4A7C59] font-medium">Отвечает на русском и казахском</p>
              </div>
            </div>
            <ChatCircleText className="h-5 w-5 text-[#7A7065]" />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[450px] min-h-[300px]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 bg-[#EEF4F1] text-[#4A7C59] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E8E4DE]">
                    <Robot className="h-4.5 w-4.5" weight="fill" />
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#E04F33] text-white rounded-br-none'
                    : 'bg-[#F9F8F6] text-[#2D2D2D] border border-[#E8E4DE] rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="h-8 w-8 bg-[#FAE0DB] text-[#E04F33] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E8E4DE]">
                    <User className="h-4.5 w-4.5" weight="fill" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 bg-[#EEF4F1] text-[#4A7C59] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E8E4DE]">
                  <Robot className="h-4.5 w-4.5 animate-bounce" weight="fill" />
                </div>
                <div className="bg-[#F9F8F6] border border-[#E8E4DE] rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-[#4A7C59] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#4A7C59] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#4A7C59] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#E8E4DE] bg-[#F9F8F6]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputText);
              }}
              className="flex items-center gap-2 bg-white border border-[#E8E4DE] rounded-2xl p-2 focus-within:border-[#4A7C59] focus-within:ring-1 focus-within:ring-[#4A7C59]/30 transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder="Задайте свой вопрос по посевам, ценам или хранению..."
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-[#2D2D2D] placeholder-[#7A7065] h-10 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="bg-[#4A7C59] hover:bg-[#3A6347] text-white p-2.5 rounded-xl h-10 w-10 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
              >
                <PaperPlaneRight className="h-5 w-5" weight="fill" />
              </Button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
