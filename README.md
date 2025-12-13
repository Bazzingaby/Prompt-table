# 🧪 Robot Talk: The Periodic Table of Prompt Engineering

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Powered By](https://img.shields.io/badge/Powered%20By-Google%20Gemini-orange.svg)

**Robot Talk** is an immersive, futuristic web application designed to gamify the learning of Prompt Engineering. Visualized as an interactive "Periodic Table," it breaks down abstract AI concepts into atomic elements, allowing users to experiment, visualize, and synthesize powerful prompts using Google's Gemini models.

---

## 🚀 Key Features

### 1. The Periodic Grid
- **Interactive Taxonomy**: Explore categorized elements like *Chain-of-Thought (CoT)*, *Few-Shot (Fs)*, and *ReAct (Ra)*.
- **Neon Aesthetic**: A responsive, cyberpunk-inspired interface with dynamic lighting and sound effects.

### 2. The Reaction Chamber (Prompt Builder)
- **Visual Synthesis**: Drag and drop "elements" to construct complex prompt strategies.
- **Multi-Modal Generation**: Generate Text, Code, Video prompts, or Audio synthesis instructions.
- **Stop & Refine**: Real-time control over the generation process with interrupt capabilities.

### 3. Blueprint Mode (New!)
- **Tldraw-style Annotation**: Annotate generated prompts with a highlighter, pen, and sticky notes.
- **Algorithm Visualizer**: Automatically generate and visualize step-by-step execution plans from your prompts.
- **Visual Refinement**: Capture your annotated whiteboard and feed it back to the AI to refine the prompt based on your visual notes.

### 4. The Robot Tutor
- **Deep Dive Learning**: Click any element to launch a dedicated AI tutor session.
- **Live Infographics**: Generates real-time neon block diagrams to explain abstract concepts.
- **Slide Deck Generator**: Instantly creates a 4-slide presentation on any topic.

### 5. Immersive Tech
- **3D Intro Scene**: Built with Three.js and React Three Fiber.
- **Ambient Audio Engine**: Procedural sound generation using the Web Audio API (no external assets required).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **AI & Logic**: Google Gemini API (`@google/genai`)
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Audio**: Custom Web Audio API Engine (`AudioContext`)
- **Utilities**: `html2canvas` for whiteboard captures.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/robot-talk.git
   cd robot-talk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Set your API key in your environment variables. 
   *(Note: The app expects `process.env.API_KEY`. If using Vite/Next.js, ensure your bundler exposes this).*

4. **Run the application**
   ```bash
   npm start
   ```

---

## 🎮 Usage Guide

1. **Explore**: Hover over elements to hear unique sonic signatures. Click to read brief descriptions.
2. **Learn**: Click an element to open the **Modal**. Use "Start Tutor" for a chat session or "Generate Slide Deck" for a summary.
3. **Build**: Toggle elements to add them to the **Reaction Chamber** at the bottom.
4. **Generate**: 
   - Click "Generate" to create a prompt based on your selected stack.
   - Click the **Annotate Icon** on a message to enter **Blueprint Mode**.
   - In Blueprint Mode, draw feedback, add sticky notes, and click "Refine with AI".
5. **Plan**: In the builder, click "Generate Plan" to see a visual flowchart of the AI's execution logic.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features, bug fixes, or new "Elements" for the table.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
