import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Bot, User, Sparkles, Loader2,
  ChevronDown, Minus,
} from "lucide-react";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  
  forceOpen?: boolean;
  onClose?: () => void;
}
const API_BASE = "http://localhost:8001";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your Decision Twin AI assistant. I can help you analyze simulation results, suggest AI learning phases, recommend projects, and guide your career path.",
  timestamp: new Date(),
};

const QUICK_SUGGESTIONS = [
  "Suggest AI projects",
  "Find internships",
  "Show learning roadmap",
  "Analyze my simulation",
];
const AIChatbot = ({ forceOpen = false, onClose }: AIChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [forceOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isTyping) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: msg,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });

        if (!res.ok) throw new Error("Request failed");

        const data = await res.json();

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please check that the backend server is running and try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      onClose?.();
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  
  const renderMessage = (msg: Message) => {
    const isUser = msg.role === "user";
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
            isUser
              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
              : "bg-gradient-to-br from-neon-blue to-neon-purple text-white"
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
        </div>
        <div
          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "bg-primary/20 text-foreground border border-primary/20"
              : "bg-white/[0.04] text-foreground/90 border border-white/[0.06]"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <span className="block text-[10px] text-muted-foreground/50 mt-1 text-right">
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </motion.div>
    );
  };
  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.35)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] transition-shadow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
            <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-h-[600px] rounded-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(45,212,191,0.08)] overflow-hidden"
            style={{ background: "rgba(8,8,10,0.92)", backdropFilter: "blur(24px)" }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={
              isMinimized
                ? { opacity: 1, y: 0, scale: 1, height: 56 }
                : { opacity: 1, y: 0, scale: 1, height: "auto" }
            }
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_12px_rgba(96,165,250,0.3)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Decision Twin AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {isMinimized ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180" />
                  ) : (
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px] max-h-[420px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {messages.map(renderMessage)}
                  {isTyping && (
                    <motion.div
                      className="flex gap-2.5"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
                {messages.length <= 1 && !isTyping && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-primary/20 text-primary/80 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01] flex-shrink-0">
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 focus-within:border-primary/30 transition-colors">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Decision Twin AI..."
                      disabled={isTyping}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isTyping}
                      className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground/40 text-center mt-2">
                    Powered by Gemini AI · Decision Twin
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
