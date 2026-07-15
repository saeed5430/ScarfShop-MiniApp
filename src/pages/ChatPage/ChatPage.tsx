import { type FC, useState, useRef, useEffect } from 'react';
import { Page } from '@/components/Page.tsx';
import { useAuth } from '@/context/AuthContext.tsx';

import './ChatPage.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
}

const SUGGESTIONS = [
  'قیمت روسری نخی',
  'موجودی محصول',
  'ثبت سفارش',
  'پرفروش‌ترین مدل',
  'رنگ‌های موجود',
];

export const ChatPage: FC = () => {
  const { customer } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (inputRef.current) {
      inputRef.current.style.height = '52px';
    }

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: getAIResponse(text.trim()),
        sender: 'assistant',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const getAIResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('قیمت') || lower.includes('هزینه')) {
      return 'قیمت محصولات ما از ۸۹,۰۰۰ تومان شروع می‌شه. برای اطلاع از قیمت دقیق هر محصول می‌تونید وارد صفحه محصول بشید.';
    }
    if (lower.includes('موجودی') || lower.includes('موجود')) {
      return 'تمام محصولاتی که در سایت نمایش داده میشن موجود هستن. اگه محصولی ناموجود بشه، از لیست حذف میشه.';
    }
    if (lower.includes('سفارش') || lower.includes('خرید')) {
      return 'برای ثبت سفارش کافیه محصول مورد نظرتون رو انتخاب کنید و روی دکمه خرید بزنید. بعد از انتخاب سایز و رنگ، سفارشتون ثبت میشه.';
    }
    if (lower.includes('رنگ') || lower.includes('مدل')) {
      return 'ما در رنگ‌ها و مدل‌های متنوعی محصول داریم: مشکی، سرمه‌ای، زرشکی، کرمی و خیلی رنگ‌های دیگه. برای دیدن همه رنگ‌ها وارد صفحه محصولات بشید.';
    }
    if (lower.includes('سلام') || lower.includes('درود')) {
      return `سلام ${customer?.first_name || 'عزیز'}! 👋 خوش اومدی. چطور می‌تونم کمکت کنم؟`;
    }
    return 'ممنون از پیامت. در حال حاضر دستیار هوش مصنوعی ما در حال یادگیری هست. به زودی می‌تونه به تمام سوالات شما پاسخ بده. 🤖';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = '52px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <Page back={true}>
      <div className="chat-page">
        <div className="chat-header">
          <div className="chat-header-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </div>
          <div className="chat-header-info">
            <span className="chat-header-name">دستیار هوشمند</span>
            <span className="chat-header-status">
              <span className="chat-status-dot" />
              آنلاین
            </span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-avatar">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16.01" />
                  <line x1="16" y1="16" x2="16" y2="16.01" />
                </svg>
              </div>
              <h3 className="chat-empty-title">سلام 👋</h3>
              <p className="chat-empty-text">
                من دستیار هوشمند فروشگاه آرمانا هستم.
                می‌تونم درباره محصولات، موجودی، ثبت سفارش و پیشنهاد خرید به شما کمک کنم.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div className="chat-bubble-content">
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble assistant">
              <div className="chat-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="پیام خود را بنویسید..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="chat-send-btn"
            disabled={!input.trim()}
            onClick={() => sendMessage(input)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </Page>
  );
};
