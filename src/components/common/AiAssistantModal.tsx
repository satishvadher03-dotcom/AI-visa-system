import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Languages,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: Array<{
    country: string;
    visaType: string;
    name: string;
    url: string;
    verifiedDate: string;
  }>;
  disclaimer?: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose, initialTopic }) => {
  const [language, setLanguage] = useState<'en' | 'gu' | 'hi'>('en');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        'Hello! I am Aura, your AI Visa Consultant at AuraVisa Global. I can guide you through electronic visa requirements, document checklists, application statuses, and verified government portals for India, UAE, UK, US, Schengen, and more. How can I assist your travel plans today?',
      sources: [
        {
          country: 'India',
          visaType: 'Official e-Visa',
          name: 'Government of India e-Visa Portal',
          url: 'https://indianvisaonline.gov.in/evisa/',
          verifiedDate: '2026-10-25',
        },
      ],
      disclaimer:
        'AuraVisa Global provides consular facilitation. Official approval rests strictly with sovereign immigration authorities.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialTopic) {
      handleSendMessage(`I need information regarding ${initialTopic}`);
    }
  }, [isOpen, initialTopic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post<{
        success: boolean;
        reply: string;
        sources: any[];
        disclaimer: string;
        sessionToken: string;
      }>('/ai/chat', {
        message: textToSend.trim(),
        language,
        sessionToken: sessionToken || undefined,
        history,
      });

      if (res.sessionToken) {
        setSessionToken(res.sessionToken);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: res.reply,
          sources: res.sources,
          disclaimer: res.disclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            'I experienced a connection issue reaching our consular knowledge base. Please check official embassy requirements or book a consultation with our human case specialists.',
          sources: [
            {
              country: 'Official Verification',
              visaType: 'Government Portal',
              name: 'Indian e-Visa Portal',
              url: 'https://indianvisaonline.gov.in/evisa/',
              verifiedDate: new Date().toISOString().split('T')[0],
            },
          ],
          disclaimer:
            'AuraVisa Global provides consular facilitation. Official approval rests strictly with sovereign immigration authorities.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What are the passport requirements for a Dubai 30-day tourist eVisa?',
    'Explain the Indian e-Tourist visa rules for foreign passport holders.',
    'What documents do I need for a UK Standard Visitor visa?',
    'How does AuraVisa ensure private document security?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl h-[90vh] max-h-[700px] rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Aura AI Visa Consultant</h3>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Data
                </span>
              </div>
              <p className="text-xs text-slate-500">Multilingual Embassy & e-Visa Advisory</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition ${
                  language === 'en' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('gu')}
                className={`px-2 py-1 rounded transition ${
                  language === 'gu' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Gujarati (ગુજરાતી)"
              >
                ગુજરાતી
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded transition ${
                  language === 'hi' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hindi (हिन्दी)"
              >
                हिन्दी
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">
            Consultancy assistance only. No government approval guarantees. Cites verified official portals.
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Sources Card */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="font-semibold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>Verified Official Reference Portals:</span>
                    </div>
                    {msg.sources.map((s, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-900">{s.country}: </span>
                          <span className="text-slate-600">{s.name}</span>
                          {s.verifiedDate && (
                            <span className="text-[10px] text-slate-400 block">Verified on: {s.verifiedDate}</span>
                          )}
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                          title="Open official portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-xs w-fit shadow-2xs text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Checking official consular guidelines...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        {messages.length < 3 && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto text-xs scrollbar-none">
            {samplePrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition border border-slate-200 shrink-0 font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'વિઝા અંગે પ્રશ્ન પૂછો (દા.ત. દુબઈ અથવા ભારત ઇ-વિઝા)...'
                  : language === 'hi'
                  ? 'वीज़ा से संबंधित प्रश्न पूछें (उदा. दुबई या भारत ई-वीज़ा)...'
                  : 'Ask about visa rules, fees, required documents, or travel flows...'
              }
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
