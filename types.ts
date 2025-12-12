export enum Category {
  UNIVERSAL = 'Universal',
  GEMINI = 'Gemini',
  OPENAI = 'OpenAI',
  CLAUDE = 'Claude',
  GROK = 'Grok',
  PERPLEXITY = 'Perplexity',
  OPENSOURCE = 'OpenSource',
  COMMAND = 'Command'
}

export interface TopicDetails {
  title?: string;
  subtitle?: string;
  body?: string;
  best_practices?: string[];
  examples?: { type: string; content: string }[];
  configuration_code?: string;
  when_to_use?: { level: string; description?: string; use_cases?: string }[];
  thinking_levels?: { keyword: string; description: string }[];
  critical_note?: string;
  marketing_note?: string;
}

export interface Topic {
  symbol: string;
  element: string; // Used as name
  category: string; // Mapped to Category enum in UI
  description: string;
  usage: string;
  details?: TopicDetails;
}

export interface Tier2Topic {
  name: string;
  category: Category;
  trend?: number; // Percentage change
  sentiment?: 'up' | 'down' | 'neutral';
}

export const CATEGORY_STYLES: Record<Category, string> = {
  [Category.UNIVERSAL]: 'text-green-400 border-green-500/50 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]',
  [Category.GEMINI]: 'text-pink-400 border-pink-500/50 hover:border-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse-slow',
  [Category.OPENAI]: 'text-cyan-400 border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]',
  [Category.CLAUDE]: 'text-orange-400 border-orange-500/50 hover:border-orange-400 hover:shadow-[0_0_15px_rgba(251,146,60,0.4)]',
  [Category.GROK]: 'text-gray-100 border-gray-400/50 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]',
  [Category.PERPLEXITY]: 'text-teal-400 border-teal-500/50 hover:border-teal-400 hover:shadow-[0_0_15px_rgba(45,212,191,0.4)]',
  [Category.OPENSOURCE]: 'text-yellow-400 border-yellow-500/50 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]',
  [Category.COMMAND]: 'text-purple-400 border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(192,132,252,0.4)]',
};

export const CATEGORY_HOVER_STYLES: Record<Category, string> = {
  [Category.UNIVERSAL]: 'hover:bg-green-900/20',
  [Category.GEMINI]: 'bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.15),transparent_70%)] hover:bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.3),transparent_70%)]',
  [Category.OPENAI]: 'hover:bg-cyan-900/20',
  [Category.CLAUDE]: 'hover:bg-orange-900/20',
  [Category.GROK]: 'hover:bg-gray-800',
  [Category.PERPLEXITY]: 'hover:bg-teal-900/20',
  [Category.OPENSOURCE]: 'hover:bg-yellow-900/20',
  [Category.COMMAND]: 'hover:bg-purple-900/20',
};