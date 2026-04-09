import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Loader2, Shield, User, MessageSquare } from 'lucide-react';
import { apiClient } from '../api/client';
import type { Chat, Message } from '../types';

export const AIChat = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isLoading]);

  const fetchChat = async () => {
    try {
      const response = await apiClient.get<Chat>('/chats/my');
      setChat(response.data);
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    setIsLoading(true);

    const tempUserMsg: Message = {
      id: Date.now(),
      chat_id: chat?.id || 0,
      sender_role: 'user',
      content: userMessageText,
      created_at: new Date().toISOString(),
    };

    setChat(prev => prev ? { ...prev, messages:[...prev.messages, tempUserMsg] } : null);

    try {
      const response = await apiClient.post<Message>('/chats/message', {
        content: userMessageText
      });
      
      setChat(prev => prev ? { ...prev, messages:[...prev.messages, response.data] } : null);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!chat || !window.confirm('Очистить историю чата?')) return;
    try {
      await apiClient.delete(`/chats/${chat.id}/clear`);
      setChat({ ...chat, messages:[] });
    } catch (error) {
      console.error('Ошибка очистки:', error);
    }
  };

  if (!chat) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="chat-layout fade-in">
      <div className="chat-header">
        <div className="chat-title">
          <div className="msg-avatar bot">
            <Bot size={20} />
          </div>
          <div>
            <div>ИИ-Ассистент</div>
            <div className="chat-status">Онлайн</div>
          </div>
        </div>
        <button 
          onClick={handleClearChat}
          className="logout-btn"
          title="Очистить чат"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {chat.messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Bot size={48} />
            </div>
            <h3>Добро пожаловать в чат</h3>
            <p>Задайте вопрос логистическому агенту</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', opacity: 0.7 }}>
              Например: "Сколько стоит доставка?"
            </p>
          </div>
        )}
        
        {(chat.messages ?? []).map((msg) => {
          const isBot = msg.sender_role === 'bot';
          const isMod = msg.sender_role === 'moderator';
          const isUser = msg.sender_role === 'user';
          
          return (
            <div
              key={msg.id}
              className={`msg-row ${isUser ? 'user' : 'bot'}`}
            >
              <div className={`msg-avatar ${isUser ? 'user' : isMod ? 'moderator' : 'bot'}`}>
                {isBot ? (
                  <Bot size={18} />
                ) : isMod ? (
                  <Shield size={18} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="msg-bubble">
                {msg.content}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="msg-row bot">
            <div className="msg-avatar bot">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="msg-bubble" style={{ color: 'var(--text-secondary)' }}>
              Агент думает...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите сообщение..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};