import React, { useState } from 'react';

// Типы для компонентов архитектуры
type ComponentType = 'frontend' | 'backend' | 'database' | 'ai' | 'infra';

interface ArchComponent {
  id: string;
  title: string;
  icon: string;
  type: ComponentType;
  description: string;
  details: string[];
  connections: string[];
  color: string;
}

// Данные архитектуры
const architectureData: ArchComponent[] = [
  {
    id: 'browser',
    title: 'Браузер',
    icon: '🌐',
    type: 'frontend',
    description: 'React + Vite SPA приложение',
    details: [
      'React 19 + TypeScript',
      'React Router v7',
      'Axios для HTTP',
      'Lucide React иконки',
      'Vite 8 (HMR, proxy)'
    ],
    connections: ['api-gateway'],
    color: '#3b82f6'
  },
  {
    id: 'api-gateway',
    title: 'API Gateway',
    icon: '🔗',
    type: 'infra',
    description: 'Vite Dev Server proxy / Nginx (prod)',
    details: [
      'Vite proxy: /api → :8000',
      'WebSocket поддержка',
      'CORS конфигурация',
      'Статические файлы'
    ],
    connections: ['fastapi'],
    color: '#64748b'
  },
  {
    id: 'fastapi',
    title: 'FastAPI Backend',
    icon: '⚡',
    type: 'backend',
    description: 'Основной API сервер (Python 3.11)',
    details: [
      'Uvicorn ASGI сервер',
      'JWT аутентификация',
      'Ролевая модель: user/moderator/admin',
      'SQLAlchemy 2.0 ORM',
      'Pydantic валидация',
      'RESTful API',
      'Swagger UI (/docs)'
    ],
    connections: ['auth', 'orders', 'chats', 'postgres', 'agent'],
    color: '#10b981'
  },
  {
    id: 'auth',
    title: 'Auth Module',
    icon: '🔐',
    type: 'backend',
    description: 'Аутентификация и авторизация',
    details: [
      'BCrypt хеширование',
      'JWT access tokens',
      'Legacy password migration',
      'Role-based access control',
      'Заявки на повышение роли'
    ],
    connections: ['postgres'],
    color: '#f59e0b'
  },
  {
    id: 'orders',
    title: 'Orders Module',
    icon: '📦',
    type: 'backend',
    description: 'Управление заказами и трекингом',
    details: [
      'Создание заказов',
      'Генерация трек-номеров',
      'Фильтрация по пользователю',
      'CRUD операции',
      'Статусы доставки'
    ],
    connections: ['postgres'],
    color: '#8b5cf6'
  },
  {
    id: 'chats',
    title: 'Chat Module',
    icon: '💬',
    type: 'backend',
    description: 'Чат с ИИ-ассистентом и модерацией',
    details: [
      'История сообщений',
      'AI-ассистент (tool calling)',
      'Модераторские ответы',
      'Toggle бота',
      'Очистка чата'
    ],
    connections: ['agent', 'postgres'],
    color: '#ec4899'
  },
  {
    id: 'agent',
    title: 'AI Agent (Ollama)',
    icon: '🤖',
    type: 'ai',
    description: 'ИИ-агент с tool calling и RAG',
    details: [
      'Ollama (Mistral/Llama)',
      'Function Calling (OpenAI-compatible API)',
      '8 инструментов (стоимость, статус, даты)',
      'RAG: ChromaDB векторная БД',
      'System prompt engineering',
      'Tool registry pattern',
      'Max 3 итерации tool calls'
    ],
    connections: ['tools', 'rag', 'postgres'],
    color: '#06b6d4'
  },
  {
    id: 'tools',
    title: 'Tools (Function Registry)',
    icon: '🔧',
    type: 'ai',
    description: 'Инструменты для ИИ-агента',
    details: [
      'get_order_status — статус заказа',
      'get_my_orders — список заказов',
      'calculate_shipping_cost — расчёт доставки',
      'calculate_storage_cost — хранение',
      'estimate_delivery_date — сроки',
      'validate_package_dimensions — габариты',
      'get_insurance_quote — страховка',
      'get_prohibited_items — запреты'
    ],
    connections: ['postgres'],
    color: '#14b8a6'
  },
  {
    id: 'rag',
    title: 'RAG (ChromaDB)',
    icon: '📚',
    type: 'ai',
    description: 'Retrieval Augmented Generation',
    details: [
      'ChromaDB PersistentClient',
      'Векторные эмбеддинги',
      'База знаний логистики',
      'Правила упаковки/хранения',
      'Query similarity search',
      'n_results=3'
    ],
    connections: [],
    color: '#f97316'
  },
  {
    id: 'postgres',
    title: 'PostgreSQL',
    icon: '🐘',
    type: 'database',
    description: 'Основная база данных (Docker)',
    details: [
      'PostgreSQL 15 (Alpine)',
      'Docker Compose',
      'Adminer для управления',
      'SQLAlchemy ORM',
      'Таблицы: users, orders, chats, messages',
      'Роли: admin/admin:root'
    ],
    connections: [],
    color: '#3b82f6'
  },
  {
    id: 'adminer',
    title: 'Adminer',
    icon: '🗄️',
    type: 'database',
    description: 'Веб-интерфейс управления БД',
    details: [
      'localhost:8080',
      'Сервер: db',
      'БД: logistics',
      'SQL запросы',
      'Экспорт/импорт данных'
    ],
    connections: ['postgres'],
    color: '#64748b'
  }
];

// Цвета по типу
const typeColors: Record<ComponentType, { bg: string; border: string; glow: string; text: string }> = {
  frontend: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', glow: '0 0 30px rgba(59, 130, 246, 0.3)', text: '#60a5fa' },
  backend: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', glow: '0 0 30px rgba(16, 185, 129, 0.3)', text: '#34d399' },
  database: { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6', glow: '0 0 30px rgba(139, 92, 246, 0.3)', text: '#a78bfa' },
  ai: { bg: 'rgba(6, 182, 212, 0.1)', border: '#06b6d4', glow: '0 0 30px rgba(6, 182, 212, 0.3)', text: '#22d3ee' },
  infra: { bg: 'rgba(148, 163, 184, 0.1)', border: '#64748b', glow: '0 0 30px rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
};

// Компонент-узел
function ArchNode({
  component,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  component: ArchComponent;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const colors = typeColors[component.type];
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: isSelected ? colors.bg : 'rgba(30, 41, 59, 0.5)',
        border: `2px solid ${isSelected ? component.color : colors.border}40`,
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isSelected ? colors.glow : '0 4px 6px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '180px',
      }}
    >
      {/* Иконка */}
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{component.icon}</div>
      
      {/* Заголовок */}
      <h3 style={{ 
        color: isSelected ? component.color : colors.text, 
        margin: '0 0 0.5rem 0',
        fontSize: '1rem',
        fontWeight: 700,
        transition: 'color 0.3s'
      }}>
        {component.title}
      </h3>
      
      {/* Описание */}
      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '0.8rem', 
        margin: 0,
        lineHeight: 1.4
      }}>
        {component.description}
      </p>
      
      {/* Индикатор типа */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: component.color,
        opacity: isSelected ? 1 : 0.5,
      }} />
    </div>
  );
}

// Компонент панели деталей
function DetailPanel({ component }: { component: ArchComponent | null }) {
  if (!component) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🏗️</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Выберите компонент</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Кликните на любой узел для просмотра деталей</p>
      </div>
    );
  }

  const colors = typeColors[component.type];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${component.color}40`,
      borderRadius: '16px',
      padding: '2rem',
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Заголовок панели */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          background: `${component.color}20`, 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          {component.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: component.color }}>{component.title}</h2>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '999px', 
            background: `${component.color}20`,
            color: component.color,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {component.type}
          </span>
        </div>
      </div>

      {/* Описание */}
      <p style={{ 
        color: 'var(--text-secondary)', 
        lineHeight: 1.6, 
        marginBottom: '1.5rem',
        fontSize: '0.95rem'
      }}>
        {component.description}
      </p>

      {/* Детали */}
      <h4 style={{ 
        color: 'var(--text-primary)', 
        margin: '0 0 1rem 0', 
        fontSize: '0.9rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        📋 Технологии и возможности
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {component.details.map((detail, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: component.color,
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{detail}</span>
          </div>
        ))}
      </div>

      {/* Связи */}
      {component.connections.length > 0 && (
        <>
          <h4 style={{ 
            color: 'var(--text-primary)', 
            margin: '1.5rem 0 1rem 0', 
            fontSize: '0.9rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            🔗 Связи
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {component.connections.map((conn, idx) => {
              const connComp = architectureData.find(c => c.id === conn);
              return (
                <span
                  key={idx}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: connComp ? `${connComp.color}20` : 'var(--bg-primary)',
                    color: connComp ? connComp.color : 'var(--text-muted)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    border: `1px solid ${connComp ? connComp.color + '40' : 'var(--border-color)'}`,
                  }}
                >
                  {connComp ? `${connComp.icon} ${connComp.title}` : conn}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Основной компонент страницы
export function Architecture() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ComponentType | 'all'>('all');

  const selectedComponent = architectureData.find(c => c.id === selectedId) || null;
  
  const filteredData = filterType === 'all' 
    ? architectureData 
    : architectureData.filter(c => c.type === filterType);

  // Группировка по слоям
  const layers = [
    { name: '🌐 Клиентский слой', type: 'frontend' as ComponentType },
    { name: '🔗 Инфраструктура', type: 'infra' as ComponentType },
    { name: '⚡ Backend (FastAPI)', type: 'backend' as ComponentType },
    { name: '🤖 AI Agent', type: 'ai' as ComponentType },
    { name: ' Данные', type: 'database' as ComponentType },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      padding: '2rem',
    }}>
      {/* Заголовок */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto 2rem auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800,
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🏗️ Архитектура LogisticAI
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Интерактивная схема системы логистики + ИИ-чат
        </p>

        {/* Фильтры */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: `1px solid ${filterType === 'all' ? '#3b82f6' : 'var(--border-color)'}`,
              background: filterType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: filterType === 'all' ? '#60a5fa' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Все
          </button>
          {layers.map(layer => (
            <button
              key={layer.type}
              onClick={() => setFilterType(layer.type === filterType ? 'all' : layer.type)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${filterType === layer.type ? typeColors[layer.type].border : 'var(--border-color)'}`,
                background: filterType === layer.type ? `${typeColors[layer.type].border}20` : 'transparent',
                color: filterType === layer.type ? typeColors[layer.type].text : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Левая часть: граф компонентов */}
        <div>
          {/* Слой: Frontend */}
          {(filterType === 'all' || filterType === 'frontend') && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #3b82f6'
              }}>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>🌐 Клиентский слой</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {filteredData.filter(c => c.type === 'frontend').map(comp => (
                  <ArchNode
                    key={comp.id}
                    component={comp}
                    isSelected={selectedId === comp.id}
                    onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                    onMouseEnter={() => setHoveredId(comp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Стрелка вниз */}
          {(filterType === 'all') && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '1.5rem' }}>
              ↓
            </div>
          )}

          {/* Слой: Infra + Backend */}
          {(filterType === 'all' || filterType === 'infra' || filterType === 'backend') && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #10b981'
              }}>
                <span style={{ fontWeight: 600, color: '#34d399' }}>⚡ Backend слой (FastAPI)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {filteredData.filter(c => c.type === 'infra' || c.type === 'backend').map(comp => (
                  <ArchNode
                    key={comp.id}
                    component={comp}
                    isSelected={selectedId === comp.id}
                    onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                    onMouseEnter={() => setHoveredId(comp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Стрелка вниз */}
          {(filterType === 'all') && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '1.5rem' }}>
              ↓
            </div>
          )}

          {/* Слой: AI */}
          {(filterType === 'all' || filterType === 'ai') && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #06b6d4'
              }}>
                <span style={{ fontWeight: 600, color: '#22d3ee' }}>🤖 AI слой (Ollama + RAG)</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {filteredData.filter(c => c.type === 'ai').map(comp => (
                  <ArchNode
                    key={comp.id}
                    component={comp}
                    isSelected={selectedId === comp.id}
                    onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                    onMouseEnter={() => setHoveredId(comp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Стрелка вниз */}
          {(filterType === 'all') && (
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '1.5rem' }}>
              ↓
            </div>
          )}

          {/* Слой: Database */}
          {(filterType === 'all' || filterType === 'database') && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #8b5cf6'
              }}>
                <span style={{ fontWeight: 600, color: '#a78bfa' }}>🐘 Слой данных</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {filteredData.filter(c => c.type === 'database').map(comp => (
                  <ArchNode
                    key={comp.id}
                    component={comp}
                    isSelected={selectedId === comp.id}
                    onClick={() => setSelectedId(selectedId === comp.id ? null : comp.id)}
                    onMouseEnter={() => setHoveredId(comp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая часть: панель деталей */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <DetailPanel component={selectedComponent} />
        </div>
      </div>

      {/* Статистика внизу */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '3rem auto 0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{architectureData.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Компонентов</div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>8</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI Инструментов</div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#06b6d4' }}>3</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Роли (user/mod/admin)</div>
        </div>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>5</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Технологических слоёв</div>
        </div>
      </div>
    </div>
  );
}