
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { ambientEngine } from '../utils/audioEngine';

interface WhiteboardProps {
  content: string | PlanData;
  mode: 'text' | 'plan';
  onRefine: (image: string, notes: string) => void;
  onClose: () => void;
}

export interface PlanData {
  title: string;
  steps: {
    id: string;
    label: string;
    type: 'start' | 'process' | 'decision' | 'end';
    details?: string;
  }[];
}

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  type: 'highlight' | 'pen';
  color: string;
}

interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ content, mode, onRefine, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'select' | 'highlight' | 'pen' | 'sticky'>('select');
  const [paths, setPaths] = useState<Path[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [refining, setRefining] = useState(false);

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize canvas to match container
    const resize = () => {
        if (containerRef.current && canvas) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
            redraw();
        }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all paths
      [...paths, { points: currentPath, type: tool === 'select' || tool === 'sticky' ? 'pen' : tool, color: '' }].forEach(path => {
          if (path.points.length < 2) return;
          
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          path.points.forEach(p => ctx.lineTo(p.x, p.y));
          
          if (path.type === 'highlight' || (tool === 'highlight' && path === paths[paths.length])) {
              ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
              ctx.lineWidth = 20;
              ctx.lineCap = 'butt';
          } else if (path.type === 'pen' || (tool === 'pen' && path === paths[paths.length])) {
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
          }
          
          ctx.stroke();
      });
  };

  useEffect(() => {
      redraw();
  }, [paths, currentPath, tool]);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (tool === 'select') return;
      if (tool === 'sticky') {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
              setStickies([...stickies, {
                  id: Date.now().toString(),
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  text: ''
              }]);
              setTool('select');
              ambientEngine.playSFX('click');
          }
          return;
      }
      
      setIsDrawing(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
          setCurrentPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
          setCurrentPath(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      }
  };

  const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      if (currentPath.length > 0) {
          setPaths([...paths, { points: currentPath, type: tool as 'highlight' | 'pen', color: '' }]);
          setCurrentPath([]);
          ambientEngine.playSFX('hover'); // Drawing sound effect simulation
      }
  };

  const handleCapture = async () => {
      if (!containerRef.current) return;
      setRefining(true);
      ambientEngine.playSFX('activate');
      
      try {
          const canvas = await html2canvas(containerRef.current, {
              backgroundColor: '#050510',
              scale: 1, // Keep scale manageable for tokens
              ignoreElements: (el) => el.classList.contains('exclude-capture')
          });
          const image = canvas.toDataURL('image/png');
          
          // Collect sticky text notes
          const notes = stickies.map(s => `Note at (${Math.round(s.x)},${Math.round(s.y)}): ${s.text}`).join('\n');
          
          onRefine(image, notes);
          onClose();
      } catch (e) {
          console.error("Capture failed", e);
      } finally {
          setRefining(false);
      }
  };

  const updateSticky = (id: string, text: string) => {
      setStickies(stickies.map(s => s.id === id ? { ...s, text } : s));
  };
  
  const deleteSticky = (id: string) => {
      setStickies(stickies.filter(s => s.id !== id));
      ambientEngine.playSFX('click');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-300">
      
      {/* --- TOOLBAR --- */}
      <div className="h-16 border-b border-gray-800 bg-[#0a0a12] flex items-center justify-between px-6 shrink-0 z-[70]">
          <div className="flex items-center gap-4">
              <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="text-cyan-500 text-xl">◈</span>
                  Blueprint Mode
                  <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded ml-2">{mode === 'plan' ? 'ALGORITHM VISUALIZER' : 'PROMPT ANNOTATOR'}</span>
              </h2>
          </div>

          <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-gray-800">
              <button 
                onClick={() => setTool('select')}
                className={`p-2 rounded transition-colors ${tool === 'select' ? 'bg-cyan-900/50 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="Select / Interact"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              </button>
              <button 
                onClick={() => setTool('highlight')}
                className={`p-2 rounded transition-colors ${tool === 'highlight' ? 'bg-yellow-900/50 text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                title="Highlighter"
              >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button 
                onClick={() => setTool('pen')}
                className={`p-2 rounded transition-colors ${tool === 'pen' ? 'bg-cyan-900/50 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="Pen"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button 
                onClick={() => setTool('sticky')}
                className={`p-2 rounded transition-colors ${tool === 'sticky' ? 'bg-green-900/50 text-green-400' : 'text-gray-400 hover:text-white'}`}
                title="Add Note"
              >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
              <div className="w-px h-6 bg-gray-700 mx-1"></div>
              <button 
                onClick={() => setPaths([])}
                className="p-2 text-gray-400 hover:text-red-400"
                title="Clear Drawings"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white uppercase font-bold text-xs tracking-wider"
              >
                  Cancel
              </button>
              <button 
                onClick={handleCapture}
                disabled={refining}
                className="exclude-capture px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold uppercase text-xs tracking-wider rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center gap-2 transition-all"
              >
                  {refining ? 'Capturing...' : 'Refine with AI'}
                  {!refining && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </button>
          </div>
      </div>

      {/* --- CANVAS CONTAINER --- */}
      <div 
        ref={containerRef}
        className="flex-grow relative overflow-auto bg-[#0a0a12] cursor-crosshair"
        style={{ 
            backgroundImage: 'radial-gradient(circle, #1f2937 1px, transparent 1px)',
            backgroundSize: '20px 20px' 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
          {/* CONTENT LAYER */}
          <div className="absolute inset-0 p-10 min-w-full min-h-full flex justify-center pointer-events-none">
              {mode === 'text' && typeof content === 'string' && (
                  <div className="max-w-3xl w-full bg-black/20 p-8 rounded-xl border border-gray-800 text-gray-200 font-mono whitespace-pre-wrap leading-loose text-lg shadow-2xl">
                      {content}
                  </div>
              )}
              
              {mode === 'plan' && typeof content !== 'string' && (
                  <div className="flex flex-col items-center gap-12 py-10 w-full max-w-4xl">
                      <h3 className="text-2xl font-bold text-cyan-400 uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full border border-cyan-500/30">
                          {content.title}
                      </h3>
                      <div className="flex flex-col items-center gap-8 w-full relative">
                          {/* SVG Lines Connector Layer */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                             <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                  <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
                                </marker>
                             </defs>
                             {content.steps.map((step, i) => {
                                 if (i === content.steps.length - 1) return null;
                                 // Simple vertical lines for this MVP visualization
                                 // A real graph library would be better for complex branching, but this suffices for "Algorithm Style"
                                 return (
                                     <line 
                                        key={i} 
                                        x1="50%" y1={`${(i * 140) + 80}px`} 
                                        x2="50%" y2={`${((i + 1) * 140) + 10}px`} 
                                        stroke="#4b5563" 
                                        strokeWidth="2" 
                                        markerEnd="url(#arrowhead)" 
                                     />
                                 )
                             })}
                          </svg>

                          {content.steps.map((step, i) => (
                              <div 
                                key={step.id}
                                className={`
                                    relative z-10 p-6 rounded-lg border-2 w-full max-w-md text-center shadow-lg bg-[#0f0e17]
                                    ${step.type === 'start' || step.type === 'end' ? 'border-green-500/50 rounded-full' : ''}
                                    ${step.type === 'process' ? 'border-cyan-500/50 rounded-lg' : ''}
                                    ${step.type === 'decision' ? 'border-purple-500/50 transform rotate-0' : ''}
                                `}
                              >
                                  <div className="font-bold text-white uppercase tracking-wider mb-1">{step.label}</div>
                                  {step.details && <div className="text-xs text-gray-400 font-mono">{step.details}</div>}
                                  
                                  {/* Step Number Badge */}
                                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-xs font-bold text-gray-300">
                                      {i + 1}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* DRAWING LAYER */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-20"
          />

          {/* STICKY NOTES LAYER */}
          {stickies.map(note => (
              <div 
                key={note.id}
                className="absolute z-30 w-48 bg-yellow-100/90 text-black p-3 rounded shadow-xl transform -rotate-1 animate-in zoom-in duration-200"
                style={{ left: note.x, top: note.y }}
                onMouseDown={(e) => e.stopPropagation()} 
              >
                  <textarea 
                    autoFocus
                    className="w-full h-24 bg-transparent border-none resize-none text-sm font-handwriting focus:ring-0 p-0"
                    value={note.text}
                    onChange={(e) => updateSticky(note.id, e.target.value)}
                    placeholder="Add comment..."
                  />
                  <div className="absolute -top-2 -right-2">
                      <button onClick={() => deleteSticky(note.id)} className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
              </div>
          ))}

      </div>
    </div>
  );
};

export default Whiteboard;
