
import React, { useState, useRef, useEffect } from 'react';
import { Topic, Category } from '../types';
import { GoogleGenAI, Chat } from "@google/genai";
import { ambientEngine } from '../utils/audioEngine';

interface ModalProps {
  topic: Topic | null;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

interface Slide {
    title: string;
    subtitle?: string;
    points: string[];
    visualDescription?: string; // for image gen
    imageUrl?: string;
}

type Tab = 'overview' | 'specs' | 'code' | 'examples';

const LOADING_MESSAGES = [
    "// Accessing Global Knowledge Base...",
    "// Analyzing Research Papers...",
    "// Synthesizing Infographic Vectors...",
    "// Formulating Educational Analogies...",
    "// Generating Deep Dive Report..."
];

const PRESENTATION_LOADING_MESSAGES = [
    "// Structuring Narrative Arc...",
    "// Designing Visual Hierarchy...",
    "// Rendering Slide Layouts...",
    "// Compiling Key Takeaways...",
    "// Finalizing Deck Export..."
];

const Modal: React.FC<ModalProps> = ({ topic, onClose }) => {
  const [generatedBg, setGeneratedBg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Tutor Mode State
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const tutorScrollRef = useRef<HTMLDivElement>(null);

  // Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresentationLoading, setIsPresentationLoading] = useState(false);

  // SFX: Activate on mount
  useEffect(() => {
    ambientEngine.playSFX('activate');
  }, []);

  // SFX: Loop processing sound when loading
  useEffect(() => {
    if (isTutorLoading || isPresentationLoading || isGenerating) {
        ambientEngine.startProcessingLoop();
    } else {
        ambientEngine.stopProcessingLoop();
    }
    return () => ambientEngine.stopProcessingLoop();
  }, [isTutorLoading, isPresentationLoading, isGenerating]);


  useEffect(() => {
    if (tutorScrollRef.current) {
        tutorScrollRef.current.scrollTop = tutorScrollRef.current.scrollHeight;
    }
  }, [tutorMessages, isTutorLoading]);

  // Cycle loading messages for tutor/presentation
  useEffect(() => {
    if (!isTutorLoading && !isPresentationLoading) return;
    const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % (isPresentationLoading ? PRESENTATION_LOADING_MESSAGES.length : LOADING_MESSAGES.length));
    }, 800);
    return () => clearInterval(interval);
  }, [isTutorLoading, isPresentationLoading]);

  if (!topic) return null;

  const getColor = (cat: string) => {
    switch (cat) {
      case Category.UNIVERSAL: return 'text-green-400 border-green-500';
      case Category.GEMINI: return 'text-pink-400 border-pink-500';
      case Category.OPENAI: return 'text-cyan-400 border-cyan-500';
      case Category.CLAUDE: return 'text-orange-400 border-orange-500';
      case Category.GROK: return 'text-gray-100 border-gray-400';
      case Category.PERPLEXITY: return 'text-teal-400 border-teal-500';
      case Category.OPENSOURCE: return 'text-yellow-400 border-yellow-500';
      case Category.COMMAND: return 'text-purple-400 border-purple-500';
      // Media Series
      case Category.VIDEO: return 'text-purple-500 border-purple-500';
      case Category.AUDIO: return 'text-blue-500 border-blue-500';
      case Category.VOICE: return 'text-orange-500 border-orange-500';
      default: return 'text-white border-white';
    }
  };

  const themeColor = getColor(topic.category);
  const themeHex = themeColor.includes('pink') ? '#ec4899' : themeColor.includes('cyan') ? '#06b6d4' : themeColor.includes('green') ? '#4ade80' : '#a855f7';

  const details = topic.details;

  // Determine available tabs
  const showSpecs = details?.thinking_levels || details?.when_to_use;
  const showCode = details?.configuration_code;
  const showExamples = details?.examples && details.examples.length > 0;
  
  // Reset state on topic change
  useEffect(() => {
    setActiveTab('overview');
    setIsTutorMode(false);
    setIsPresentationMode(false);
    setTutorMessages([]);
    setChatSession(null);
    setSlides([]);
  }, [topic]);

  const handleGenerateBackground = async () => {
    if (!process.env.API_KEY) {
       setGeneratedBg("simulated");
       return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Abstract, futuristic, neon digital art representing: "${topic.element}". Dark background, cyber aesthetic, high quality, 1k resolution.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageUrl) setGeneratedBg(imageUrl);
    } catch (e) {
      console.error(e);
      setGeneratedBg("simulated"); 
    } finally {
      setIsGenerating(false);
    }
  };

  const startTutorMode = async () => {
    setIsTutorMode(true);
    setIsTutorLoading(true);
    setLoadingMsgIndex(0);

    if (!process.env.API_KEY) {
        setTutorMessages([{ role: 'model', text: "Simulation: API Key missing. Please provide an API key to generate a real deep dive review and infographic."}]);
        setIsTutorLoading(false);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Init Chat
        const systemInstruction = `You are an expert AI Tutor specialized in Prompt Engineering. 
        Topic: ${topic.element} (${topic.category}).
        
        GOAL: Provide a comprehensive Deep Dive Review of this topic.
        1. EXPLAIN: What is it? (ELI5 + Technical Depth).
        2. IMPORTANCE: Why does it matter?
        3. HOW-TO: Practical usage advice.
        
        Tone: Engaging, Futuristic, Educational. Use formatting.`;

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }]
            }
        });
        setChatSession(chat);

        // 2. Generate Image (Parallel)
        const imagePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Futuristic neon infographic block diagram explaining the concept of "${topic.element}" in software engineering. Dark background, glowing cyan/purple lines, schematic style, text labels, high tech.` }] }
        });

        // 3. Generate Text (Initial Review)
        const textPromise = chat.sendMessage({ message: "Begin the deep dive review now." });

        const [imageRes, textRes] = await Promise.all([imagePromise, textPromise]);

        let imageUrl = undefined;
        for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }

        setTutorMessages([{
            role: 'model',
            text: textRes.text || "Error generating text.",
            image: imageUrl
        }]);

    } catch (e) {
        console.error(e);
        setTutorMessages([{ role: 'model', text: "Error initializing Tutor Mode. Please check console." }]);
    } finally {
        setIsTutorLoading(false);
    }
  };

  const handleTutorSend = async (msgOverride?: string) => {
      const textToSend = msgOverride || tutorInput;
      if (!textToSend.trim() || !chatSession) return;
      
      ambientEngine.playSFX('click');
      
      if (!msgOverride) {
          setTutorMessages(prev => [...prev, { role: 'user', text: textToSend }]);
          setTutorInput("");
      }
      
      setIsTutorLoading(true);
      setLoadingMsgIndex(0);

      try {
          const res = await chatSession.sendMessage({ message: textToSend });
          setTutorMessages(prev => [...prev, { role: 'model', text: res.text }]);
      } catch (e) {
          console.error(e);
          setTutorMessages(prev => [...prev, { role: 'model', text: "Error sending message." }]);
      } finally {
          setIsTutorLoading(false);
      }
  };

  const generatePresentation = async () => {
    setIsPresentationMode(true);
    setIsPresentationLoading(true);
    setLoadingMsgIndex(0);
    setCurrentSlide(0);

    if (!process.env.API_KEY) {
        // Mock Slides
        setTimeout(() => {
            setSlides([
                { title: topic.element, subtitle: "Simulation: API Key Missing", points: ["Please add API Key for real content."], visualDescription: "" },
                { title: "Concept", points: [topic.description], visualDescription: "" },
                { title: "Usage", points: [topic.usage], visualDescription: "" }
            ]);
            setIsPresentationLoading(false);
        }, 2000);
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Generate Slide Content (JSON)
        const prompt = `Create a professional 4-slide presentation on "${topic.element}" (${topic.category}). 
        Slide 1: Title & Catchy Subtitle.
        Slide 2: Core Concept & Definition.
        Slide 3: Mechanics & How-to.
        Slide 4: Key Takeaway / Future Outlook.
        
        Return pure JSON array of objects with keys: title, subtitle (optional), points (array of strings), visualDescription (for image generation).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });

        let generatedSlides: Slide[] = [];
        try {
            generatedSlides = JSON.parse(response.text || "[]");
        } catch (e) {
            console.error("Failed to parse slides JSON", e);
            generatedSlides = [{ title: "Error", points: ["Failed to generate slides."], visualDescription: "" }];
        }

        // 2. Generate One Hero Image for the deck (to save time/quota, or could do per slide)
        // Let's do a hero image for Slide 1
        if (generatedSlides.length > 0) {
            const imagePrompt = generatedSlides[0].visualDescription || `Futuristic digital art representing ${topic.element}`;
            
            try {
                const imgRes = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: imagePrompt + " Neon style, dark background, 16:9 aspect ratio." }] }
                });
                
                let imageUrl = undefined;
                for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }
                if (imageUrl) generatedSlides[0].imageUrl = imageUrl;

            } catch (e) {
                console.warn("Slide image gen failed", e);
            }
        }

        setSlides(generatedSlides);

    } catch (e) {
        console.error(e);
        setSlides([{ title: "Error", points: ["Could not generate presentation."], visualDescription: "" }]);
    } finally {
        setIsPresentationLoading(false);
    }
  };

  const nextSlide = () => {
    ambientEngine.playSFX('click');
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  }
  const prevSlide = () => {
    ambientEngine.playSFX('click');
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }
  const handleClose = () => {
    // New: Distinct close sound
    ambientEngine.playSFX('close');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-7xl h-[90vh] overflow-hidden bg-[#0a0a12] border-2 ${themeColor} shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-xl flex flex-col md:flex-row transition-all duration-500`}
        role="dialog"
        style={generatedBg && generatedBg !== 'simulated' && !isPresentationMode ? { 
            backgroundImage: `linear-gradient(rgba(10,10,18,0.95), rgba(10,10,18,0.95)), url(${generatedBg})`,
            backgroundSize: 'cover'
        } : {}}
      >
        {/* Nano Banana Simulated BG */}
        {generatedBg === 'simulated' && !isPresentationMode && (
            <div className="absolute inset-0 z-0 opacity-20 bg-[conic-gradient(at_top,var(--tw-gradient-stops))] from-pink-900 via-purple-900 to-black animate-pulse"></div>
        )}

        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-white bg-black/40 rounded-full hover:bg-black/60 transition-all border border-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Sidebar */}
        <div className={`p-6 md:p-10 md:w-[35%] border-b md:border-b-0 md:border-r border-gray-800 bg-gradient-to-b from-gray-900/90 to-[#050510]/95 flex flex-col relative z-10 overflow-y-auto shrink-0 custom-scrollbar ${isPresentationMode ? 'hidden md:flex' : ''}`}>
          
          {/* Watermark Symbol */}
          <div className={`text-[12rem] font-mono font-bold ${themeColor} opacity-[0.03] absolute -top-10 -right-10 select-none pointer-events-none tracking-tighter`}>
            {topic.symbol}
          </div>

          <div className="relative z-10 mt-4">
              <div className={`text-6xl md:text-7xl font-mono font-bold ${themeColor} mb-2 tracking-tighter inline-block drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                {topic.symbol}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-[Rajdhani] uppercase tracking-wide leading-none drop-shadow-md">
                {topic.element}
              </h2>
              <span className={`inline-flex items-center px-4 py-1.5 text-xs font-bold border ${themeColor} rounded-full mb-8 uppercase tracking-widest bg-black/30 backdrop-blur-md shadow-lg`}>
                {topic.category}
              </span>
          </div>

          <div className="mb-10 relative z-10">
            <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span> Usage Syntax
            </h3>
            <div className={`font-mono text-sm ${themeColor} bg-[#0a0a0f] p-4 rounded-lg border border-gray-800 shadow-inner break-words leading-relaxed relative overflow-hidden group`}>
               <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-30"></div>
               <span className="opacity-40 select-none mr-3">$</span>
               {topic.usage}
            </div>
          </div>

          <div className="relative z-10 flex-grow">
              <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-[0.2em]">Description</h3>
              <p className="text-gray-300 text-sm md:text-base leading-7 font-sans opacity-90 tracking-wide">
                {topic.description}
              </p>
          </div>

          {/* Generator Button for Gemini BG */}
          {topic.category === Category.GEMINI && !generatedBg && !isPresentationMode && (
              <button 
                onClick={handleGenerateBackground}
                disabled={isGenerating}
                className={`mt-8 py-4 px-6 border ${themeColor} bg-white/5 hover:bg-white/10 text-xs uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-3 rounded-lg group`}
              >
                 {isGenerating ? (
                    <span className="animate-pulse">Generating Matrix...</span>
                 ) : (
                    <>
                        <span>Generate Neural Background</span>
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity">⚡</span>
                    </>
                 )}
              </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className={`md:w-[65%] flex flex-col bg-[#0f0e17]/80 relative z-10 h-full backdrop-blur-sm ${isPresentationMode ? 'w-full md:w-full bg-black' : ''}`}>
          
          {/* --- PRESENTATION MODE UI --- */}
          {isPresentationMode ? (
            <div className="flex flex-col h-full relative overflow-hidden bg-black animate-in fade-in">
                 
                 {/* Presentation Loader */}
                 {isPresentationLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-24 h-24">
                                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                                    <circle cx="50" cy="50" r="45" stroke={themeHex} strokeWidth="1" fill="none" strokeDasharray="10 5" />
                                    <circle cx="50" cy="50" r="30" stroke="#fff" strokeWidth="1" fill="none" strokeDasharray="50 50" className="opacity-30" />
                                </svg>
                                <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl ${themeColor} animate-pulse`}>
                                    {Math.floor(Math.random() * 99)}%
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2">Generating Deck</h3>
                                <p className="text-gray-500 font-mono text-xs">{PRESENTATION_LOADING_MESSAGES[loadingMsgIndex]}</p>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Slide View */}
                 {!isPresentationLoading && slides.length > 0 && (
                     <div className="flex-grow relative flex flex-col">
                        {/* Slide Content */}
                        <div className="relative flex-grow flex items-center justify-center p-8 md:p-16 overflow-hidden">
                            
                            {/* Slide Background Image (if any for this slide, or reuse slide 0 for deck) */}
                            {(slides[currentSlide].imageUrl || (currentSlide === 0 && slides[0].imageUrl)) && (
                                <div className="absolute inset-0 z-0">
                                    <img 
                                        src={slides[currentSlide].imageUrl || slides[0].imageUrl} 
                                        alt="Slide Background" 
                                        className="w-full h-full object-cover opacity-20 mask-image-gradient"
                                        style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-br from-black via-black/80 to-${themeColor.split(' ')[0].replace('text-', '')}/20`}></div>
                                </div>
                            )}

                            <div className="relative z-10 w-full max-w-4xl animate-in slide-in-from-right-8 duration-500 key={currentSlide}">
                                <div className="mb-2 flex items-center gap-3">
                                    <span className={`px-2 py-0.5 border ${themeColor} text-[10px] uppercase tracking-widest font-bold rounded bg-black/50`}>
                                        Slide 0{currentSlide + 1}
                                    </span>
                                    <div className="h-px bg-gray-700 flex-grow"></div>
                                </div>
                                
                                <h1 className={`text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-xl font-[Rajdhani] uppercase`}>
                                    {slides[currentSlide].title}
                                </h1>
                                {slides[currentSlide].subtitle && (
                                    <h2 className={`text-xl md:text-2xl ${themeColor} mb-12 font-mono tracking-wide`}>
                                        {slides[currentSlide].subtitle}
                                    </h2>
                                )}

                                <ul className="space-y-6">
                                    {slides[currentSlide].points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-4 text-lg md:text-xl text-gray-300 font-light tracking-wide animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 150}ms` }}>
                                            <span className={`mt-2 w-2 h-2 ${themeColor.split(' ')[0].replace('text', 'bg')} rounded-full shadow-[0_0_10px_currentColor]`}></span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="h-20 border-t border-gray-800 bg-[#050510] flex items-center justify-between px-8 z-20">
                            <button 
                                onClick={() => setIsPresentationMode(false)}
                                className="text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                Exit Deck
                            </button>

                            <div className="flex gap-4">
                                <button 
                                    onClick={prevSlide} 
                                    disabled={currentSlide === 0}
                                    className="p-3 rounded-full border border-gray-700 hover:border-white text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:border-gray-700 transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div className="flex items-center gap-1">
                                    {slides.map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-white shadow-[0_0_10px_white]' : 'bg-gray-800'}`}></div>
                                    ))}
                                </div>
                                <button 
                                    onClick={nextSlide} 
                                    disabled={currentSlide === slides.length - 1}
                                    className="p-3 rounded-full border border-gray-700 hover:border-white text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:border-gray-700 transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                     </div>
                 )}
            </div>
          ) : !isTutorMode ? (
            <>
                {/* Tabs Header - Sticky */}
                <div className="flex border-b border-gray-800 shrink-0 sticky top-0 z-30 bg-[#0f0e17]/95 backdrop-blur-xl">
                    <button 
                        onClick={() => { ambientEngine.playSFX('click'); setActiveTab('overview'); }}
                        className={`flex-1 md:flex-none px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] + ' bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        Overview
                    </button>
                    {showSpecs && (
                        <button 
                            onClick={() => { ambientEngine.playSFX('click'); setActiveTab('specs'); }}
                            className={`flex-1 md:flex-none px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'specs' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] + ' bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            Specs
                        </button>
                    )}
                    {showCode && (
                        <button 
                            onClick={() => { ambientEngine.playSFX('click'); setActiveTab('code'); }}
                            className={`flex-1 md:flex-none px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'code' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] + ' bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            Config
                        </button>
                    )}
                    {showExamples && (
                        <button 
                            onClick={() => { ambientEngine.playSFX('click'); setActiveTab('examples'); }}
                            className={`flex-1 md:flex-none px-8 py-5 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'examples' ? 'text-white border-b-2 ' + themeColor.split(' ')[1] + ' bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            Examples
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-10 overflow-y-auto flex-grow custom-scrollbar">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col max-w-4xl mx-auto">
                        {details ? (
                            <>
                                {/* Header Details */}
                                <div>
                                    <h3 className={`text-2xl md:text-3xl font-bold ${themeColor} uppercase mb-2 tracking-wide drop-shadow-sm`}>{details.title || topic.element}</h3>
                                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-6 font-mono border-b border-gray-800 pb-6">{details.subtitle}</p>
                                    <div className="text-gray-200 leading-8 text-lg font-light">
                                        {details.body || topic.description}
                                    </div>
                                </div>

                                {/* Best Practices Card */}
                                {details.best_practices && (
                                    <div className="bg-white/5 rounded-xl p-8 border border-white/10 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50 text-gray-500"></div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-6 tracking-widest flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                            Best Practices
                                        </h4>
                                        <ul className="grid gap-4 md:grid-cols-1">
                                            {details.best_practices.map((bp, i) => (
                                                <li key={i} className="flex items-start text-gray-300 group">
                                                    <span className={`mr-4 mt-2.5 w-1.5 h-1.5 ${themeColor.split(' ')[0].replace('text', 'bg')} rounded-full flex-shrink-0 group-hover:scale-150 transition-transform`}></span>
                                                    <span className="leading-relaxed text-base">{bp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Critical Note */}
                                {details.critical_note && (
                                    <div className="p-6 bg-red-950/30 border border-red-500/30 rounded-xl text-red-100 text-sm flex gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                        <div className="text-2xl mt-1">⚠️</div>
                                        <div>
                                            <strong className="block text-xs uppercase text-red-400 mb-2 tracking-widest font-bold">Critical System Warning</strong>
                                            <p className="leading-relaxed">{details.critical_note}</p>
                                        </div>
                                    </div>
                                )}

                                {/* ACTIONS */}
                                <div className="mt-8 pt-8 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={startTutorMode}
                                        className={`py-6 border-2 border-dashed ${themeColor} bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-all rounded-xl flex flex-col items-center gap-3 group hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
                                    >
                                        <span className="text-base">Start Deep Dive</span>
                                        <span className="text-xs opacity-60 font-mono group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1 rounded">Interactive Tutor</span>
                                    </button>

                                    <button 
                                        onClick={generatePresentation}
                                        className={`py-6 border-2 border-gray-700 bg-[#050510] hover:border-white text-gray-300 hover:text-white font-bold uppercase tracking-widest transition-all rounded-xl flex flex-col items-center gap-3 group`}
                                    >
                                        <span className="text-base">Generate Slide Deck</span>
                                        <span className="text-xs opacity-60 font-mono group-hover:opacity-100 transition-opacity bg-gray-800 px-3 py-1 rounded">4-Slide Presentation</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <p>No detailed guide available for this element.</p>
                                <div className="flex gap-4 mt-4">
                                    <button 
                                        onClick={startTutorMode}
                                        className={`px-6 py-2 border ${themeColor} rounded hover:bg-white/5 text-xs uppercase font-bold`}
                                    >
                                        Start Tutor
                                    </button>
                                    <button 
                                        onClick={generatePresentation}
                                        className={`px-6 py-2 border border-gray-600 rounded hover:bg-white/5 text-xs uppercase font-bold`}
                                    >
                                        Make Slides
                                    </button>
                                </div>
                            </div>
                        )}
                        </div>
                    )}

                    {/* SPECS TAB */}
                    {activeTab === 'specs' && details && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto">
                            {details.thinking_levels && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Thinking Levels</h3>
                                    <div className="grid gap-4">
                                        {details.thinking_levels.map((level, i) => (
                                            <div key={i} className="bg-white/5 p-6 rounded-xl border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-white/10 transition-colors">
                                                <code className={`text-base font-mono font-bold ${themeColor} whitespace-nowrap bg-black/30 px-3 py-1 rounded`}>{level.keyword}</code>
                                                <p className="text-gray-300 leading-relaxed">{level.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {details.when_to_use && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">When to Use</h3>
                                    <div className="overflow-hidden rounded-xl border border-gray-800">
                                        <table className="w-full text-left text-sm text-gray-400">
                                            <thead className="text-xs uppercase bg-white/5 text-gray-200">
                                                <tr>
                                                    <th className="p-4 tracking-wider">Level/Mode</th>
                                                    <th className="p-4 tracking-wider">Use Case</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800 bg-black/20">
                                                {details.when_to_use.map((item, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className={`p-4 font-mono ${themeColor} font-bold`}>{item.level}</td>
                                                        <td className="p-4 text-gray-300">{item.description || item.use_cases}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CODE TAB */}
                    {activeTab === 'code' && details && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col max-w-4xl mx-auto">
                            <div className="bg-[#0f0e15] p-6 rounded-xl border border-gray-700 font-mono text-sm text-blue-300 overflow-x-auto whitespace-pre shadow-inner">
                                {details.configuration_code}
                            </div>
                            <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Copy this configuration into your SDK initialization options.
                            </p>
                        </div>
                    )}

                    {/* EXAMPLES TAB */}
                    {activeTab === 'examples' && details?.examples && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto">
                            {details.examples.map((ex, i) => {
                                const isPoor = ex.type.toLowerCase() === 'poor';
                                const colorClass = isPoor ? 'text-red-400 border-red-900/50 bg-red-950/20' : 'text-green-400 border-green-900/50 bg-green-950/20';
                                return (
                                    <div key={i} className="group">
                                        <div className={`flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider ${isPoor ? 'text-red-500' : 'text-green-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isPoor ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                                            {ex.type} Example
                                        </div>
                                        <div className={`p-6 rounded-xl border font-mono text-sm shadow-inner whitespace-pre-wrap leading-relaxed ${colorClass}`}>
                                            {ex.content}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </>
          ) : (
            // --- TUTOR MODE UI ---
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-md">
                    <div>
                        <h3 className={`text-xl font-bold ${themeColor} uppercase tracking-widest`}>AI Tutor Deep Dive</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Gemini 2.5 • Live Research • Visualizing</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleTutorSend("Regenerate the entire review with a different focus.")}
                        className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Regenerate
                    </button>
                </div>

                {/* Messages Area */}
                <div 
                    ref={tutorScrollRef}
                    className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 bg-[#0a0a0f]/50 relative"
                >
                    {tutorMessages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            {/* Infographic (Only for Model) */}
                            {msg.image && (
                                <div className="w-full mb-8 rounded-xl overflow-hidden border border-gray-700 relative group animate-in zoom-in-95 duration-700 shadow-2xl">
                                    <div className="absolute top-4 left-4 bg-black/80 px-3 py-1.5 text-[10px] uppercase font-bold text-white backdrop-blur-md rounded border border-white/10">Generated Infographic</div>
                                    <img src={msg.image} alt="Tutor Infographic" className="w-full h-auto max-h-[400px] object-cover object-top hover:scale-[1.02] transition-transform duration-700" />
                                </div>
                            )}

                            <div className={`max-w-[95%] rounded-2xl p-6 md:p-8 shadow-lg ${msg.role === 'user' ? 'bg-white/10 text-white backdrop-blur-sm' : 'bg-black/40 border border-white/5 text-gray-200'}`}>
                                <div className="prose prose-invert prose-sm md:prose-base max-w-none font-mono whitespace-pre-wrap leading-loose">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTutorLoading && (
                        <div className="flex items-center gap-8 p-10 bg-black/30 rounded-xl border border-white/5 mx-4 backdrop-blur-md max-w-xl shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                {/* SVG Quantum Core Visualization (Updated per request) */}
                                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                    <defs>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    {/* Main Outer Orbit (Blue/Purple) */}
                                    <circle cx="50" cy="50" r="42" stroke="#60a5fa" strokeWidth="2" fill="none" className="animate-[spin_3s_linear_infinite]" strokeDasharray="60 120" strokeLinecap="round" filter="url(#glow)"/>
                                    
                                    {/* Secondary Inner Orbit (Purple) */}
                                    <circle cx="50" cy="50" r="32" stroke="#a855f7" strokeWidth="2" fill="none" className="animate-[spin_2s_linear_infinite_reverse]" strokeDasharray="40 80" strokeLinecap="round"/>
                                    
                                    {/* Static Ring */}
                                    <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="1" fill="none" className="opacity-30"/>
                                    
                                    {/* Center Core */}
                                    <rect x="42" y="42" width="16" height="16" fill="#fff" className="animate-pulse origin-center" />
                                    <rect x="42" y="42" width="16" height="16" stroke={themeHex} strokeWidth="1" fill="none" className="animate-[spin_4s_linear_infinite] origin-center" />
                                </svg>
                                
                                {/* Pointer Arrow (Simulated from screenshot) */}
                                <div className="absolute -right-8 -top-8 text-blue-300 text-2xl rotate-12 opacity-0 animate-in fade-in delay-1000">
                                    
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className={`text-sm font-bold font-mono text-orange-400 uppercase tracking-[0.2em] animate-pulse flex items-center gap-3`}>
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    Neural Synthesis
                                </span>
                                <span className="text-xs text-gray-500 font-mono leading-relaxed h-8 flex items-center">
                                    <span className="mr-2 text-white/50">{'>'}</span>
                                    {LOADING_MESSAGES[loadingMsgIndex]}
                                    <span className="animate-pulse ml-1 text-cyan-500">_</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-[#0a0a12] border-t border-gray-800">
                    <div className={`flex items-center gap-2 border-2 border-dashed ${themeColor} bg-[#050510] rounded-xl p-1.5`}>
                        <input 
                            type="text" 
                            value={tutorInput}
                            onChange={(e) => setTutorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTutorSend()}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:ring-0 text-sm font-mono placeholder-gray-600"
                        />
                        <button 
                            onClick={() => handleTutorSend()}
                            disabled={isTutorLoading}
                            className={`px-6 py-2 ${themeColor.split(' ')[0].replace('text', 'bg')} text-black font-bold uppercase text-xs rounded-lg hover:opacity-90 transition-opacity`}
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Modal;
