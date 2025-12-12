import React, { useState, useRef, useEffect } from 'react';
import { Topic } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";

interface PromptBuilderProps {
  selectedTopics: Topic[];
  onRemove: (topic: Topic) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

const PromptBuilder: React.FC<PromptBuilderProps> = ({ selectedTopics, onRemove }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBuilding, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
      if (isExpanded && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isExpanded]);

  const initializeChat = async () => {
    if (!process.env.API_KEY) return null;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const techniques = selectedTopics.map(t => `${t.element} (${t.category})`).join(', ');
    
    const systemInstruction = `You are an expert AI Prompt Engineer and Tutor (ELI5).
    
    CONTEXT: The user has selected these techniques: ${techniques}.
    
    YOUR MISSION:
    1. RESEARCH: Use Google Search to find the latest best practices for these specific techniques if needed.
    2. EXPLAIN: Explain HOW these techniques work together to solve the user's task. Use simple analogies (ELI5).
    3. GENERATE: Create a highly optimized, production-ready prompt using the techniques. Put the final prompt in a code block.
    
    Tone: Educational, futuristic, encouraging.`;

    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });
  };

  const generateInfographic = async () => {
      if (!process.env.API_KEY) return null;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const concepts = selectedTopics.map(t => t.element).join(', ');
        const prompt = `Futuristic neon UI block diagram infographic explaining the concept of: ${concepts}. Dark background, cyan and purple neon lines, schematic style, high tech, detailed.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      } catch (e) {
          console.error("Infographic error:", e);
      }
      return null;
  };

  const handleGenerate = async (isRegen = false) => {
    const promptText = userPrompt.trim();
    if (!promptText && !isRegen) return;

    if (!isExpanded) setIsExpanded(true);
    setIsBuilding(true);
    
    // Clear input if new message
    if (!isRegen) setUserPrompt('');

    // Optimistic UI for user message
    if (!isRegen) {
        setMessages(prev => [...prev, { role: 'user', text: promptText }]);
    }

    try {
        if (!process.env.API_KEY) {
            // Simulation
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', text: "// SIMULATION: API KEY MISSING.\nPlease add your API Key to generate real research and infographics." }]);
                setIsBuilding(false);
            }, 1000);
            return;
        }

        let chat = chatSession;
        if (!chat) {
            chat = await initializeChat();
            setChatSession(chat);
        }

        if (!chat) throw new Error("Could not init chat");

        const msgToSend = isRegen ? "Regenerate the previous response with a different approach." : promptText;

        // Parallel tasks: Text + Image (only if first message or explicitly asked)
        const runImageGen = messages.length === 0 && !isRegen;
        
        const [textResult, imageResult] = await Promise.all([
            chat.sendMessage({ message: msgToSend }),
            runImageGen ? generateInfographic() : Promise.resolve(null)
        ]);

        setMessages(prev => [...prev, { 
            role: 'model', 
            text: textResult.text, 
            image: imageResult || undefined 
        }]);

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { role: 'model', text: "Error: Could not generate content. Please try again." }]);
    } finally {
        setIsBuilding(false);
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-500/30 bg-[#050510]/95 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col ${isExpanded ? 'h-[85vh]' : 'h-24'}`}>
      
      {/* Handle */}
      <div 
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#050510] border border-cyan-500/30 border-b-0 px-8 py-1 rounded-t-xl cursor-pointer flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Prompt Builder</span>
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▲</span>
      </div>

      {/* Main Container */}
      <div className="container mx-auto h-full flex flex-col p-4 md:p-6 gap-4">
        
        {/* Top: Topic Chips */}
        <div className="flex-shrink-0 flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 min-h-[50px]">
           {selectedTopics.length === 0 ? (
               <div className="text-gray-500 text-sm font-mono flex items-center gap-2">
                  <span className="animate-pulse">●</span> Select topics from the table to begin...
               </div>
           ) : (
               selectedTopics.map(t => (
                   <div key={t.symbol} className="flex items-center gap-2 bg-[#0f0e17] border border-gray-700 px-3 py-1.5 rounded-full shrink-0 animate-in fade-in slide-in-from-bottom-2">
                       <span className="text-cyan-400 font-bold font-mono">{t.symbol}</span>
                       <span className="text-gray-300 text-xs font-bold uppercase">{t.element}</span>
                       <button onClick={(e) => { e.stopPropagation(); onRemove(t); }} className="text-gray-600 hover:text-red-400 ml-1">×</button>
                   </div>
               ))
           )}
        </div>

        {/* Middle: Dashed Workspace (Chat) */}
        {isExpanded && (
            <div 
                ref={scrollRef}
                className="flex-grow border-2 border-dashed border-cyan-900/50 bg-[#0a0a12]/50 rounded-lg p-6 overflow-y-auto custom-scrollbar space-y-6 relative"
            >
                {messages.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                        <div className="text-6xl mb-4 grayscale">🧬</div>
                        <p className="font-mono text-sm uppercase tracking-widest">Workspace Ready</p>
                        <p className="text-xs mt-2">Enter a task below to generate a researched prompt</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4`}>
                        <div className={`max-w-[90%] md:max-w-[80%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-100' : 'bg-gray-800/50 border border-gray-700 text-gray-200'}`}>
                            
                            {/* Infographic Display */}
                            {msg.image && (
                                <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 shadow-lg relative group">
                                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-[10px] uppercase font-bold text-white backdrop-blur-md rounded">Generated Infographic</div>
                                    <img src={msg.image} alt="Generated Infographic" className="w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform duration-700" />
                                </div>
                            )}

                            {/* Text Content */}
                            <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap">
                                {msg.text}
                            </div>
                        </div>
                        <span className="text-[10px] uppercase text-gray-600 mt-1 px-1 font-bold tracking-wider">{msg.role === 'user' ? 'You' : 'Gemini 2.5 Tutor'}</span>
                    </div>
                ))}

                {isBuilding && (
                    <div className="flex items-start animate-in fade-in">
                        <div className="bg-[#0a0a12]/80 border border-cyan-500/30 rounded-lg p-4 flex items-center gap-4 shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-sm">
                            {/* Quantum Spinner */}
                            <div className="relative w-8 h-8 flex-shrink-0">
                                <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent border-l-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-1 border-2 border-purple-500 border-b-transparent border-r-transparent rounded-full animate-spin-reverse"></div>
                                <div className="absolute inset-0 m-auto w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                            </div>
                            
                            {/* Text Stream */}
                            <div className="flex flex-col">
                                <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                                    Gemini 2.5 Active
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    // Synthesizing response vectors...
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Bottom: Input Area */}
        <div className="flex gap-3 h-12 md:h-14 shrink-0">
            <input 
                ref={inputRef}
                type="text" 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isBuilding && handleGenerate()}
                placeholder={messages.length > 0 ? "Ask a follow-up question or refine..." : "Describe your task (e.g., 'Write a python script to scrape stock data')"}
                className="flex-1 bg-[#0a0a12] border border-gray-700 rounded-lg px-6 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors"
            />
            
            {messages.length > 0 && !isBuilding && (
                 <button 
                    onClick={() => handleGenerate(true)}
                    className="px-4 border border-gray-700 hover:border-white text-gray-400 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                    title="Regenerate last response"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
            )}

            <button 
                onClick={() => handleGenerate(false)}
                disabled={isBuilding}
                className={`bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 rounded-lg uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all flex items-center gap-2 ${isBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isBuilding ? 'Thinking...' : messages.length > 0 ? 'Send' : 'Generate'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PromptBuilder;