
import { Topic, Tier2Topic, Category } from './types';

export const TOPICS: Topic[] = [
  {
    "symbol": "Cl",
    "element": "Clarity",
    "category": "Universal",
    "description": "Direct instructions outperform cleverness. State exactly what you want; modern models do not 'go above and beyond' unless asked.",
    "usage": "Avoid flowery language. Be explicit about constraints.",
    "details": {
      "title": "Clarity Over Cleverness",
      "subtitle": "CORE PRINCIPLE · WORKS ACROSS ALL MODELS",
      "body": "Direct, explicit instructions consistently outperform elaborate prompts. Modern models like Claude 4, GPT-4.1, and Gemini 3 follow instructions precisely—they won't 'go above and beyond' unless explicitly asked.",
      "best_practices": [
        "State exactly what you want in simple language",
        "Specify the output format clearly",
        "Provide context for why the task matters",
        "Be specific rather than clever"
      ],
      "examples": [
        {
          "type": "Poor",
          "content": "\"Think about this...\""
        },
        {
          "type": "Good",
          "content": "\"Analyze this code for security vulnerabilities.\n\nList each issue with: 1) the problem,\n2) severity level, 3) recommended fix.\""
        }
      ]
    }
  },
  {
    "symbol": "Xml",
    "element": "Structure",
    "category": "Universal",
    "description": "Use XML tags (<context>, <task>) to structure long inputs. Improves accuracy by 15-30% over unstructured text.",
    "usage": "<context>...</context> <instructions>...</instructions>"
  },
  {
    "symbol": "Fs",
    "element": "Few-Shot",
    "category": "Universal",
    "description": "Provide examples to guide output. Start with zero-shot; use 2-5 examples for complex patterns.",
    "usage": "Input: [Example] -> Output: [Example]"
  },
  {
    "symbol": "Tmp",
    "element": "Temperature",
    "category": "Universal",
    "description": "Control randomness. Use 0.0-0.3 for code/extraction, 0.7-1.0 for general tasks, and strictly 1.0 for Gemini 3.",
    "usage": "Set temperature parameter in API call."
  },
  {
    "symbol": "Cx",
    "element": "Context Eng",
    "category": "Universal",
    "description": "Strategic orchestration of prompts. Place actual query AFTER context material (documents/code) for optimal retrieval.",
    "usage": "[Background Data] -> [Specific Query]"
  },
  {
    "symbol": "Gm",
    "element": "Thinking",
    "category": "Gemini",
    "description": "Gemini 3/2.5 reasoning control. Use 'high' thinking level for complex tasks.",
    "usage": "config = Types.ThinkingConfig(thinking_level='high')",
    "details": {
      "title": "Thinking Level Control",
      "subtitle": "GEMINI 3 · HIGH VS LOW",
      "body": "Gemini 3 is a reasoning model with configurable thinking depth.",
      "configuration_code": "config=types.GenerateContentConfig(\n    thinking_config=types.ThinkingConfig(\n        thinking_level=\"high\" # or \"low\"\n    )\n)",
      "when_to_use": [
        {
          "level": "high (default)",
          "description": "Maximum reasoning depth for complex tasks like multi-step problem solving, code architecture, research synthesis"
        },
        {
          "level": "low",
          "description": "Minimizes latency for simple tasks, chat responses, high-throughput applications"
        }
      ],
      "critical_note": "Gemini 3 requires temperature of exactly 1.0. Lower values cause infinite looping."
    }
  },
  {
    "symbol": "Mc",
    "element": "1M Context",
    "category": "Gemini",
    "description": "Massive context window utilization (up to 2M tokens). capable of processing ~50k lines of code or 11hrs of audio.",
    "usage": "Upload entire codebases or long PDF documents."
  },
  {
    "symbol": "Cf",
    "element": "CodeExec",
    "category": "Gemini",
    "description": "Native Python execution for math and logic tasks.",
    "usage": "Enable 'tools: [code_execution]' in config."
  },
  {
    "symbol": "Gs",
    "element": "Grounding",
    "category": "Gemini",
    "description": "Connect to Google Search for real-time validation and citations.",
    "usage": "Enable 'tools: [google_search]' in config."
  },
  {
    "symbol": "So",
    "element": "Struct",
    "category": "OpenAI",
    "description": "Structured Outputs (Pydantic/JSON Schema) for 100% schema reliability.",
    "usage": "response_format={ 'type': 'json_schema', ... }"
  },
  {
    "symbol": "O1",
    "element": "Reasoning",
    "category": "OpenAI",
    "description": "o1/o3 reasoning models. Do NOT use 'think step by step' or few-shot examples with these models.",
    "usage": "Keep prompts simple; let the model think internally."
  },
  {
    "symbol": "Ag",
    "element": "Agentic",
    "category": "OpenAI",
    "description": "Persistent agent patterns. Instruct model to keep going until the query is fully resolved.",
    "usage": "'You are an agent—keep going until the user's query is resolved.'"
  },
  {
    "symbol": "Th",
    "element": "Thinking",
    "category": "Claude",
    "description": "Extended thinking budgets. Use triggers like 'think hard' or 'ultrathink'.",
    "usage": "'Think step by step and explain your reasoning process.'",
    "details": {
      "title": "Extended Thinking",
      "subtitle": "CLAUDE 4 · PROGRESSIVE REASONING DEPTH",
      "body": "Claude 4 offers multiple levels of reasoning depth through simple keywords. Use these to control the thinking budget.",
      "thinking_levels": [
        {
          "keyword": "\"think\"",
          "description": "Basic reasoning for straightforward tasks"
        },
        {
          "keyword": "\"think hard\"",
          "description": "Deeper analysis for moderate complexity"
        },
        {
          "keyword": "\"think harder\"",
          "description": "Thorough exploration for complex problems"
        },
        {
          "keyword": "\"ultrathink\"",
          "description": "Maximum reasoning budget for hardest tasks"
        }
      ],
      "when_to_use": [
        {
          "level": "think",
          "use_cases": "Simple Q&A, basic code review"
        },
        {
          "level": "think hard",
          "use_cases": "Multi-step problems, refactoring"
        },
        {
          "level": "think harder",
          "use_cases": "Architecture design, complex debugging"
        },
        {
          "level": "ultrathink",
          "use_cases": "Novel algorithms, research synthesis"
        }
      ]
    }
  },
  {
    "symbol": "Pf",
    "element": "Prefill",
    "category": "Claude",
    "description": "Force specific output formats by prefilling the assistant's response (API only).",
    "usage": "Assistant Role Content: '{' (forces JSON)"
  },
  {
    "symbol": "Uc",
    "element": "Uncertainty",
    "category": "Claude",
    "description": "Reduce hallucinations by explicitly permitting the model to say 'I don't know'.",
    "usage": "'If data is insufficient, say so rather than speculating.'"
  },
  {
    "symbol": "Op",
    "element": "Anti-OverEng",
    "category": "Claude",
    "description": "Prevent Opus/Sonnet from over-engineering solutions.",
    "usage": "'Only make changes directly requested. Do not add features.'"
  },
  {
    "symbol": "Gk",
    "element": "Realtime",
    "category": "Grok",
    "description": "X Platform Integration and real-time data access.",
    "usage": "Query recent social sentiment or breaking news."
  },
  {
    "symbol": "Ro",
    "element": "Role Assign",
    "category": "Grok",
    "description": "Role assignment is the most effective technique for Grok models.",
    "usage": "'You are my operations lead...'"
  },
  {
    "symbol": "Px",
    "element": "Focus",
    "category": "Perplexity",
    "description": "Domain specific search filters (Academic, Math, Social).",
    "usage": "Select 'Academic' focus for research papers."
  },
  {
    "symbol": "Sf",
    "element": "Search Filter",
    "category": "Perplexity",
    "description": "Use API parameters for domain filtering rather than text prompts.",
    "usage": "search_domain_filter: ['wikipedia.org', 'gov']"
  },
  {
    "symbol": "Lm",
    "element": "Llama",
    "category": "OpenSource",
    "description": "Strict formatting templates. Always use the official tokenizer chat template.",
    "usage": "Use tokenizer.apply_chat_template()"
  },
  {
    "symbol": "Qw",
    "element": "Qwen",
    "category": "OpenSource",
    "description": "ChatML format sensitivity. Requires <|im_start|> tags.",
    "usage": "Follow ChatML structure precisely."
  },
  {
    "symbol": "Ps",
    "element": "Persona",
    "category": "Command",
    "description": "Adopt a specific expert role, tone, and domain expertise.",
    "usage": "/persona [Role] [Tone] [Goal]"
  },
  {
    "symbol": "Pl",
    "element": "Plan",
    "category": "Command",
    "description": "Force planning before execution. Break objectives into sub-tasks and dependency maps.",
    "usage": "/plan (creates Goal Decomposition -> Gap Analysis -> Execution)"
  },
  {
    "symbol": "Rv",
    "element": "Review",
    "category": "Command",
    "description": "Self-correction loop. Verify accuracy, completeness, and edge cases.",
    "usage": "/review (checks Accuracy, Completeness, Edge Cases)"
  },
  {
    "symbol": "Fm",
    "element": "Format",
    "category": "Command",
    "description": "Control visual output structure (JSON, Markdown, Table).",
    "usage": "/format [Structure] [Length] [Style]"
  },
  {
    "symbol": "Di",
    "element": "Diverse",
    "category": "Command",
    "description": "Generate multiple distinct approaches with different trade-offs.",
    "usage": "/diverse (Generates 3 distinct methodologies)"
  },
  {
    "symbol": "Cr",
    "element": "Code Review",
    "category": "Command",
    "description": "Systematic code analysis for Correctness, Security, and Performance.",
    "usage": "/code-review (Quotes problematic code -> Explains risk -> Fixes)"
  },
  {
    "symbol": "Rs",
    "element": "Research",
    "category": "Command",
    "description": "Structured investigation methodology with key sources and evidence gathering.",
    "usage": "/research (Core Question -> Evidence -> Synthesis)"
  }
];

// --- MEDIA SERIES (Detached Row) ---
export const MEDIA_TOPICS: Topic[] = [
    {
        "symbol": "Vid",
        "element": "Video Gen",
        "category": "Video",
        "description": "Veo / Sora prompting. Focus on camera motion, lighting, and physics consistency.",
        "usage": "Camera: [Pan/Zoom] | Lighting: [Cinematic] | Subject: [Action]"
    },
    {
        "symbol": "Aud",
        "element": "Audio/SFX",
        "category": "Audio",
        "description": "Sound generation prompting. Specify BPM, instruments, mood, and texture.",
        "usage": "Genre: [Lofi] | BPM: [90] | Instruments: [Synth, Bass]"
    },
    {
        "symbol": "Vox",
        "element": "Voice/TTS",
        "category": "Voice",
        "description": "Text-to-Speech styling. Control prosody, emotion, pauses, and accent.",
        "usage": "Emotion: [Whisper] | Pause: [..] | Speed: [Slow]"
    }
];

export const TIER_2_TOPICS: Tier2Topic[] = [
  { name: 'Soft Prompts', category: Category.UNIVERSAL, trend: 12.5, sentiment: 'up' },
  { name: 'P-Tuning', category: Category.OPENSOURCE, trend: 3.2, sentiment: 'up' },
  { name: 'Active Prompting', category: Category.UNIVERSAL, trend: -1.5, sentiment: 'down' },
  { name: 'Directional Stimulus', category: Category.UNIVERSAL, trend: 0.8, sentiment: 'neutral' },
  { name: 'Constitutional AI', category: Category.CLAUDE, trend: 8.4, sentiment: 'up' },
  { name: 'Reflexion', category: Category.UNIVERSAL, trend: 15.2, sentiment: 'up' },
  { name: 'Multi-Modal CoT', category: Category.GEMINI, trend: 22.1, sentiment: 'up' },
  { name: 'Jailbreaking', category: Category.UNIVERSAL, trend: -5.4, sentiment: 'down' },
  { name: 'Automatic Prompt Eng', category: Category.OPENAI, trend: 4.5, sentiment: 'up' },
  { name: 'System 2 Attention', category: Category.UNIVERSAL, trend: 6.7, sentiment: 'up' },
  { name: 'Role-Play Gaming', category: Category.UNIVERSAL, trend: -0.5, sentiment: 'neutral' },
  { name: 'Iterative Refinement', category: Category.UNIVERSAL, trend: 9.1, sentiment: 'up' },
  { name: 'Least-to-Most', category: Category.UNIVERSAL, trend: 7.3, sentiment: 'up' },
  { name: 'Emotional Prompt', category: Category.UNIVERSAL, trend: -2.1, sentiment: 'down' },
  { name: 'Hallucination Check', category: Category.UNIVERSAL, trend: 11.0, sentiment: 'up' },
];
