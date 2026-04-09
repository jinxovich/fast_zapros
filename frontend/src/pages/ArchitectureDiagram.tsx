import React, { useState, useRef, useCallback } from 'react';

// --- Types ---
interface Position {
  x: number;
  y: number;
}

interface NodeData {
  id: string;
  label: string;
  category: 'client' | 'gateway' | 'backend' | 'ai' | 'data';
  description: string;
  tech: string[];
  pos: Position;
  width: number;
  height: number;
}

interface Connection {
  from: string;
  to: string;
  label: string;
}

// --- Configuration ---
const NODE_WIDTH = 320;  // Увеличил с 260
const NODE_HEIGHT = 180; // Увеличил с 140
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1200;

const NODES: NodeData[] = [
  {
    id: 'browser',
    label: 'Web Browser',
    category: 'client',
    description: 'Клиентское приложение (SPA)',
    tech: ['React 19', 'TypeScript', 'Vite 8', 'Lucide React'],
    pos: { x: 1100, y: 100 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'proxy',
    label: 'Vite Proxy',
    category: 'gateway',
    description: 'Дев-сервер / Шлюз',
    tech: ['HTTP Proxy', 'HMR', 'Rewrite /api -> :8000'],
    pos: { x: 1100, y: 350 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'fastapi',
    label: 'FastAPI Core',
    category: 'backend',
    description: 'Основной REST API',
    tech: ['Uvicorn', 'JWT Auth', 'SQLAlchemy ORM', 'Roles: User/Mod/Admin'],
    pos: { x: 1100, y: 600 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'auth',
    label: 'Auth Module',
    category: 'backend',
    description: 'Аутентификация',
    tech: ['BCrypt', 'Access Tokens', 'Role Checks'],
    pos: { x: 700, y: 600 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'orders',
    label: 'Orders Module',
    category: 'backend',
    description: 'Управление заказами',
    tech: ['CRUD', 'Tracking', 'User Filtering'],
    pos: { x: 1500, y: 600 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'chats',
    label: 'Chat Module',
    category: 'backend',
    description: 'Обработка сообщений',
    tech: ['Session Context', 'Moderator Override', 'History'],
    pos: { x: 1100, y: 850 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'agent',
    label: 'AI Agent',
    category: 'ai',
    description: 'Интеллектуальный ассистент',
    tech: ['Ollama (Mistral)', 'Function Calling', 'Tool Registry'],
    pos: { x: 1100, y: 1100 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'rag',
    label: 'RAG (ChromaDB)',
    category: 'ai',
    description: 'База знаний',
    tech: ['Vector DB', 'Embeddings', 'Logistics Rules'],
    pos: { x: 700, y: 1100 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'tools',
    label: 'Tool Registry',
    category: 'ai',
    description: 'Инструменты ИИ',
    tech: ['Cost Calc', 'Delivery Est.', 'Status Check', 'Validations'],
    pos: { x: 1500, y: 1100 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    category: 'data',
    description: 'Основная база данных',
    tech: ['Docker Container', 'Relational Data', 'Users/Orders/Chats'],
    pos: { x: 1900, y: 600 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  }
];

const CONNECTIONS: Connection[] = [
  { from: 'browser', to: 'proxy', label: 'HTTP /api/*' },
  { from: 'proxy', to: 'fastapi', label: 'Forward to :8000' },
  { from: 'fastapi', to: 'auth', label: 'Dependencies' },
  { from: 'fastapi', to: 'orders', label: 'Dependencies' },
  { from: 'fastapi', to: 'chats', label: 'Dependencies' },
  { from: 'fastapi', to: 'postgres', label: 'SQLAlchemy ORM' },
  { from: 'chats', to: 'agent', label: 'User Message' },
  { from: 'agent', to: 'rag', label: 'Context Query' },
  { from: 'agent', to: 'tools', label: 'Function Calling' },
  { from: 'agent', to: 'fastapi', label: 'Response' },
  { from: 'tools', to: 'postgres', label: 'DB Query' }
];

const CATEGORY_COLORS = {
  client: { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  gateway: { bg: '#1e293b', border: '#64748b', text: '#f1f5f9' },
  backend: { bg: '#064e3b', border: '#10b981', text: '#d1fae5' },
  ai: { bg: '#4a044e', border: '#d946ef', text: '#fae8ff' },
  data: { bg: '#431407', border: '#f97316', text: '#ffedd5' }
};

// --- Components ---

function Arrow({ 
  x1, y1, x2, y2, label, 
  isAnimated, active 
}: { 
  x1: number; y1: number; x2: number; y2: number; 
  label: string; isAnimated: boolean; active: boolean 
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  
  // Adjust start/end to stop at border
  const startX = x1 + ux * 40; 
  const startY = y1 + uy * 35;
  const endX = x2 - ux * 40;
  const endY = y2 - uy * 35;

  // Midpoint for label (shifted up)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 20; // Сдвигаем вверх на 20px

  return (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
        </marker>
        <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>
      
      {/* Line */}
      <line 
        x1={startX} y1={startY} x2={endX} y2={endY} 
        stroke={active ? '#3b82f6' : '#374151'} 
        strokeWidth={active ? 3 : 1.5}
        strokeDasharray={active ? "none" : "4 4"}
        markerEnd={active ? "url(#arrowhead-active)" : "url(#arrowhead)"}
      />
      
      {/* Animated particle */}
      {isAnimated && (
        <circle r="4" fill="#3b82f6">
          <animateMotion dur="2s" repeatCount="indefinite" path={`M${startX},${startY} L${endX},${endY}`} />
        </circle>
      )}
      
      {/* Label above line */}
      {label && (
        <g>
          <rect 
            x={midX - (label.length * 4 + 8)} 
            y={midY - 12} 
            width={label.length * 8 + 16} 
            height="24" 
            rx="12" 
            fill="#111827" 
            stroke="#374151" 
            strokeWidth="1"
            opacity="0.9"
          />
          <text 
            x={midX} 
            y={midY + 5} 
            textAnchor="middle" 
            fill="#9ca3af" 
            fontSize="11" 
            fontFamily="monospace"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

function FlowNode({ 
  data, isActive, onHover, onClick 
}: { 
  data: NodeData; isActive: boolean; onHover: (id: string | null) => void; onClick: () => void 
}) {
  const colors = CATEGORY_COLORS[data.category];
  
  return (
    <g 
      transform={`translate(${data.pos.x - data.width / 2}, ${data.pos.y - data.height / 2})`}
      onMouseEnter={() => onHover(data.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow */}
      <rect 
        x={-4} y={-4} width={data.width + 8} height={data.height + 8} rx="16" 
        fill="none" stroke={isActive ? colors.border : 'transparent'} strokeWidth="2"
        filter="drop-shadow(0px 0px 10px rgba(0,0,0,0.5))"
      />
      
      {/* Main Card */}
      <rect 
        width={data.width} height={data.height} rx="12" 
        fill={colors.bg} stroke={isActive ? colors.border : '#1f2937'} strokeWidth="1.5"
      />
      
      {/* Header */}
      <path 
        d={`M 0 12 Q 0 0 12 0 L ${data.width - 12} 0 Q ${data.width} 0 ${data.width} 12 L ${data.width} 45 L 0 45 Z`} 
        fill={colors.border} fillOpacity="0.2"
      />
      
      {/* Title */}
      <text x="15" y="28" fill={colors.text} fontWeight="bold" fontSize="16" fontFamily="Inter, sans-serif">
        {data.label}
      </text>
      
      {/* Badge */}
      <rect x={data.width - 90} y="8" width="80" height="20" rx="10" fill={colors.border} fillOpacity="0.3" />
      <text x={data.width - 50} y={22} textAnchor="middle" fill={colors.text} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" textTransform="uppercase">
        {data.category}
      </text>
      
      {/* Description */}
      <text x="15" y={70} fill="#9ca3af" fontSize="13" fontFamily="Inter, sans-serif">
        {data.description}
      </text>
      
      {/* Tech Tags */}
      <g transform="translate(15, 90)">
        {data.tech.map((t, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <g key={t} transform={`translate(${col * 145}, ${row * 28})`}>
              <rect width={t.length * 7.5 + 16} height="20" rx="10" fill="#111827" stroke="#374151" strokeWidth="0.5" />
              <text x={t.length * 7.5 / 2 + 8} y={14} textAnchor="middle" fill="#d1d5db" fontSize="11" fontFamily="monospace">
                {t}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

export function ArchitectureDiagram() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedData = NODES.find(n => n.id === selectedNode);
  const connectedNodes = hoveredNode ? CONNECTIONS.filter(c => c.from === hoveredNode || c.to === hoveredNode) : [];
  const connectedNodeIds = new Set([hoveredNode, ...connectedNodes.map(c => c.from), ...connectedNodes.map(c => c.to)]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Проверяем, что клик был по фону, а не по узлу
    if ((e.target as HTMLElement).closest('g') === null) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 2));
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0b0f19', color: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: '#0b0f19' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #3b82f6, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LogisticAI System Architecture
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Interactive Topology Map</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.border }} />
                {cat}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1f2937', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Speed</span>
            <input type="range" min="0" max="3" step="0.1" value={animationSpeed} onChange={e => setAnimationSpeed(parseFloat(e.target.value))} style={{ width: '80px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1f2937', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Zoom: {Math.round(zoom * 100)}%</span>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'radial-gradient(circle at center, #0f172a 0%, #0b0f19 100%)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg 
          width="100%" 
          height="100%"
          style={{ 
            display: 'block',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" />

          {/* Connections */}
          {CONNECTIONS.map((conn, i) => {
            const fromNode = NODES.find(n => n.id === conn.from);
            const toNode = NODES.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            
            const isActive = connectedNodeIds.has(conn.from) && connectedNodeIds.has(conn.to);
            
            return (
              <Arrow
                key={i}
                x1={fromNode.pos.x}
                y1={fromNode.pos.y}
                x2={toNode.pos.x}
                y2={toNode.pos.y}
                label={conn.label}
                isAnimated={isActive && animationSpeed > 0}
                active={isActive}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => (
            <FlowNode
              key={node.id}
              data={node}
              isActive={connectedNodeIds.has(node.id)}
              onHover={setHoveredNode}
              onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            />
          ))}
        </svg>
      </div>

      {/* Side Panel */}
      <div style={{ 
        width: 350, 
        background: '#111827', 
        borderLeft: '1px solid #1f2937', 
        padding: '1.5rem', 
        overflowY: 'auto',
        position: 'absolute',
        right: 0,
        top: 89,
        bottom: 0,
        zIndex: 10,
        transform: selectedData ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease'
      }}>
        {selectedData && (
          <>
            <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem', marginBottom: '1rem', position: 'absolute', top: '1rem', right: '1rem' }}>✕</button>
            <div style={{ width: 50, height: 50, borderRadius: '12px', background: CATEGORY_COLORS[selectedData.category].bg, border: `2px solid ${CATEGORY_COLORS[selectedData.category].border}`, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              {selectedData.label[0]}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: CATEGORY_COLORS[selectedData.category].text, fontSize: '1.5rem' }}>{selectedData.label}</h2>
            <p style={{ color: '#9ca3af', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.5rem' }}>{selectedData.description}</p>
            
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 600 }}>Technologies</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedData.tech.map(t => (
                <span key={t} style={{ background: '#1f2937', border: '1px solid #374151', padding: '0.375rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', color: '#d1d5db' }}>{t}</span>
              ))}
            </div>

            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 600 }}>Connections</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CONNECTIONS.filter(c => c.from === selectedData.id || c.to === selectedData.id).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#9ca3af', padding: '0.5rem', background: '#1f2937', borderRadius: '6px' }}>
                  <span style={{ color: c.from === selectedData.id ? '#3b82f6' : '#ef4444', fontWeight: 'bold' }}>{c.from === selectedData.id ? '→' : '←'}</span>
                  <span style={{ color: '#f1f5f9' }}>{c.from === selectedData.id ? NODES.find(n => n.id === c.to)?.label : NODES.find(n => n.id === c.from)?.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.5rem 2rem', background: '#0b0f19', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem', color: '#4b5563', position: 'absolute', bottom: 0, left: 0, right: '350px' }}>
        <span>🖱️ Drag to pan</span>
        <span>🔍 Scroll to zoom</span>
        <span>👆 Click node for details</span>
      </div>
    </div>
  );
}