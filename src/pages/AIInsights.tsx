import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Lock, ArrowRight, ArrowLeft, Send, AlertCircle,
  Sparkles, Trophy, BarChart3, Zap, Brain, Code, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Types
interface Phase {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  constraints: string;
  examples: string;
  testCases: { input: string; output: string }[];
  difficulty: "easy" | "medium" | "hard";
}

interface DebugExercise {
  id: number;
  title: string;
  description: string;
  buggyCode: string;
  language: string;
  expectedBehavior: string;
}

interface RealWorldProblem {
  id: number;
  scenario: string;
  context: string;
  requirements: string[];
}

interface AssessmentResult {
  phase: number;
  score: number;
  maxScore: number;
  timestamp: string;
  details: Record<string, unknown>;
}

// ============================================================================
// PHASE 1: MCQ Skill Test
// ============================================================================
const MCQPhase = ({ resumeSkills, onComplete, onAnswer }: {
  resumeSkills: string[];
  onComplete: (score: number, maxScore: number) => void;
  onAnswer: (questionId: number, selectedAnswer: number) => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const mcqQuestions: MCQQuestion[] = [
    {
      id: 1,
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1,
      category: "Algorithms",
      difficulty: "easy"
    },
    {
      id: 2,
      question: "Which data structure uses LIFO (Last In First Out)?",
      options: ["Queue", "Stack", "Heap", "Tree"],
      correctAnswer: 1,
      category: "Data Structures",
      difficulty: "easy"
    },
    {
      id: 3,
      question: "What does REST stand for?",
      options: ["Request End States Transfer", "Representational State Transfer", "Remote Execution System Tool", "Response Event State Tracking"],
      correctAnswer: 1,
      category: "Web Development",
      difficulty: "easy"
    },
    {
      id: 4,
      question: "In React, what hook is used to manage state?",
      options: ["useEffect", "useState", "useContext", "useMemo"],
      correctAnswer: 1,
      category: "React",
      difficulty: "easy"
    },
    {
      id: 5,
      question: "What is the main purpose of an index in a database?",
      options: ["Increase storage", "Improve query performance", "Encrypt data", "Backup data"],
      correctAnswer: 1,
      category: "Databases",
      difficulty: "medium"
    }
  ];

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: optionIndex });
    onAnswer(mcqQuestions[currentQuestion].id, optionIndex);
  };

  const handleNext = () => {
    if (currentQuestion < mcqQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishMCQ();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishMCQ = () => {
    const score = mcqQuestions.filter((q, idx) => 
      selectedAnswers[idx] === q.correctAnswer
    ).length;
    setShowResult(true);
    setTimeout(() => {
      onComplete(score, mcqQuestions.length);
    }, 2000);
  };

  const question = mcqQuestions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const isAnswered = selectedAnswer !== undefined;

  if (showResult) {
    const score = mcqQuestions.filter((q, idx) => 
      selectedAnswers[idx] === q.correctAnswer
    ).length;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="mb-4 text-5xl font-bold text-yellow-300">
          {score}/{mcqQuestions.length}
        </div>
        <p className="text-gray-400 mb-2">MCQ Test Completed</p>
        <p className="text-sm text-gray-500">Proceeding to Phase 2...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Question {currentQuestion + 1} / {mcqQuestions.length}</span>
          <span className="text-gray-300 font-medium">{Math.round((currentQuestion + 1) / mcqQuestions.length * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 backdrop-blur-sm overflow-hidden border border-white/5">
          <motion.div
            className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 h-2.5 rounded-full shadow-lg shadow-blue-500/50"
            initial={{ width: 0 }}
            animate={{ width: `${(currentQuestion + 1) / mcqQuestions.length * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-lg p-6 space-y-5 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-white flex-1 leading-relaxed">{question.question}</h3>
              <Badge className={`ml-3 whitespace-nowrap border-0 ${
                question.difficulty === "easy" 
                  ? "bg-green-500/20 text-green-300" 
                  : question.difficulty === "medium"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-orange-500/20 text-orange-300"
              }`}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </Badge>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-2">
              {question.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm group ${
                    selectedAnswer === idx
                      ? "bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-blue-400/60 shadow-lg shadow-blue-500/20"
                      : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedAnswer === idx
                        ? "bg-gradient-to-br from-blue-400 to-purple-400 border-blue-300 shadow-lg shadow-blue-500/30"
                        : "border-gray-500 group-hover:border-gray-300"
                    }`}>
                      {selectedAnswer === idx && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-white text-sm font-medium group-hover:text-gray-100 transition-colors">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-4 pt-2">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="gap-2 border-white/20 hover:bg-white/10 hover:border-white/40 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isAnswered}
              className="gap-2 bg-gradient-to-r from-blue-500/60 to-purple-500/60 hover:from-blue-500/80 hover:to-purple-500/80 border border-blue-400/30 text-white font-semibold disabled:opacity-40 shadow-lg shadow-blue-500/20"
            >
              {currentQuestion === mcqQuestions.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// PHASE 2: Coding Challenges
// ============================================================================
const CodingPhase = ({ onComplete }: {
  onComplete: (score: number, maxScore: number) => void;
}) => {
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [solutions, setSolutions] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const challenges: CodingChallenge[] = [
    {
      id: 1,
      title: "Two Sum",
      description: "Find two numbers that add up to target",
      constraints: "O(n) time complexity",
      examples: "Input: [2,7,11,15], target=9\nOutput: [0,1]",
      testCases: [{ input: "[2,7,11,15], 9", output: "[0,1]" }],
      difficulty: "easy"
    }
  ];

  const handleCodeChange = (code: string) => {
    setSolutions({ ...solutions, [currentChallengeIdx]: code });
  };

  const completePhase = () => {
    setShowResult(true);
    setTimeout(() => {
      onComplete(1, 1);
    }, 2000);
  };

  const challenge = challenges[currentChallengeIdx];

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="mb-4 text-5xl font-bold text-green-300">1/1</div>
        <p className="text-gray-400 mb-2">Coding Phase Completed</p>
        <p className="text-sm text-gray-500">Moving to Phase 3...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-lg p-6 space-y-5 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
        <p className="text-gray-400 text-sm">{challenge.description}</p>

        <div className="bg-gradient-to-br from-gray-950/80 to-slate-950/80 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-gray-400 text-xs font-medium mb-3">💻 Write Solution:</p>
          <textarea
            value={solutions[currentChallengeIdx] || ""}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Write your solution here..."
            className="w-full h-40 bg-transparent text-white font-mono text-sm p-3 rounded border border-white/10 focus:outline-none focus:border-green-500/50 placeholder:text-gray-600"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            onClick={completePhase}
            className="gap-2 bg-gradient-to-r from-green-500/60 to-emerald-500/60 hover:from-green-500/80 hover:to-emerald-500/80 border border-green-400/30 text-white font-semibold shadow-lg shadow-green-500/20"
          >
            <Send className="w-4 h-4" />
            Complete Phase
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 3: Debugging Lab
// ============================================================================
const DebuggingPhase = ({ onComplete }: {
  onComplete: (score: number, maxScore: number) => void;
}) => {
  const [fixes, setFixes] = useState("");
  const [showResult, setShowResult] = useState(false);

  const completePhase = () => {
    setShowResult(true);
    setTimeout(() => {
      onComplete(1, 1);
    }, 2000);
  };

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="mb-4 text-5xl font-bold text-purple-300">1/1</div>
        <p className="text-gray-400 mb-2">Debugging Phase Completed</p>
        <p className="text-sm text-gray-500">Moving to Phase 4...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-lg p-6 space-y-5 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Fix the Bug</h3>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-red-300 text-xs mb-3 font-semibold">🐛 BUGGY CODE:</p>
          <pre className="bg-slate-950/60 rounded p-4 text-red-300/90 text-xs font-mono">
            const arr = [1, 2, 3];\nconsole.log(arr[5]);
          </pre>
        </div>

        <div className="bg-gradient-to-br from-gray-950/80 to-slate-950/80 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-gray-400 text-xs font-medium mb-3">✏️ Corrected Code:</p>
          <textarea
            value={fixes}
            onChange={(e) => setFixes(e.target.value)}
            placeholder="Write corrected code..."
            className="w-full h-40 bg-transparent text-white font-mono text-sm p-3 rounded border border-white/10 focus:outline-none focus:border-purple-500/50 placeholder:text-gray-600"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            onClick={completePhase}
            className="gap-2 bg-gradient-to-r from-purple-500/60 to-violet-500/60 hover:from-purple-500/80 hover:to-violet-500/80 border border-purple-400/30 text-white font-semibold shadow-lg shadow-purple-500/20"
          >
            <Send className="w-4 h-4" />
            Complete Phase
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHASE 4: Real World Problem Solving
// ============================================================================
const RealWorldPhase = ({ onComplete }: {
  onComplete: (score: number, maxScore: number) => void;
}) => {
  const [solution, setSolution] = useState("");
  const [showResult, setShowResult] = useState(false);

  const completePhase = () => {
    setShowResult(true);
    setTimeout(() => {
      onComplete(1, 1);
    }, 2000);
  };

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="mb-4 text-5xl font-bold text-orange-300">1/1</div>
        <p className="text-gray-400 mb-2">Assessment Complete</p>
        <p className="text-sm text-gray-500">Generating results...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 rounded-lg p-6 space-y-5 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">System Design Challenge</h3>
        <p className="text-gray-400 text-sm">Design an e-commerce platform</p>

        <div className="bg-gradient-to-br from-gray-950/80 to-slate-950/80 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-gray-400 text-xs font-medium mb-3">📝 Write Solution:</p>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Provide your solution..."
            className="w-full h-48 bg-transparent text-white font-mono text-sm p-3 rounded border border-white/10 focus:outline-none focus:border-orange-500/50 placeholder:text-gray-600"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            onClick={completePhase}
            className="gap-2 bg-gradient-to-r from-orange-500/60 to-red-500/60 hover:from-orange-500/80 hover:to-red-500/80 border border-orange-400/30 text-white font-semibold shadow-lg shadow-orange-500/20"
          >
            <Send className="w-4 h-4" />
            Complete Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FINAL RESULTS
// ============================================================================
const FinalResults = ({
  results,
  resumeSkills,
}: {
  results: Record<number, { score: number; maxScore: number }>;
  resumeSkills: string[];
}) => {
  const finalScore = 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Score */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-xl p-12 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <Trophy className="w-20 h-20 text-yellow-300 drop-shadow-lg" />
          </div>
          <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
            {finalScore}%
          </h2>
          <p className="text-xl text-gray-300 mb-6">Final Skill Grip Score</p>
          <Badge className="text-lg py-2 px-6 font-semibold bg-gradient-to-r from-green-400/40 to-emerald-400/40 border border-green-500/50 text-green-200">
            Advanced Level
          </Badge>
        </div>
      </Card>

      {/* AI Feedback */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-white/[0.02] border border-cyan-500/20 backdrop-blur-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">AI Feedback & Recommendations</h3>
        </div>
        <div className="space-y-4 text-gray-300 text-sm">
          <p>Excellent performance! You demonstrate strong problem-solving abilities and solid understanding of core concepts.</p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="font-semibold text-white mb-3">📋 Recommendations:</p>
            <ul className="space-y-2 ml-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">→</span>
                <span>Continue practicing advanced algorithms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">→</span>
                <span>Work on system design patterns</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button 
          onClick={() => window.location.href = '/dashboard'}
          className="flex-1 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 border border-blue-500/50 text-blue-200 font-semibold hover:from-blue-500/60 hover:to-cyan-500/60 gap-2 shadow-lg shadow-blue-500/20"
        >
          <BarChart3 className="w-5 h-5" />
          Back to Dashboard
        </Button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AIInsights() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [phaseResults, setPhaseResults] = useState<Record<number, { score: number; maxScore: number }>>({});
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);

  useEffect(() => {
    const storedSkills = localStorage.getItem("resumeSkills");
    if (storedSkills) {
      try {
        setResumeSkills(JSON.parse(storedSkills));
      } catch {
        setResumeSkills([]);
      }
    }
  }, []);

  const handlePhaseComplete = (score: number, maxScore: number) => {
    setPhaseResults({
      ...phaseResults,
      [currentPhase]: { score, maxScore },
    });
    setCompletedPhases(new Set([...completedPhases, currentPhase]));

    if (currentPhase < 4) {
      setTimeout(() => {
        setCurrentPhase(currentPhase + 1);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-6 relative overflow-hidden">
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles className="w-6 h-6 text-blue-300" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                AI Insights Assessment
              </h1>
              <p className="text-gray-400 text-sm mt-1">Complete all phases to get detailed feedback</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-xl p-10 shadow-2xl">
          <AnimatePresence mode="wait">
            {currentPhase === 1 && (
              <motion.div key="phase1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MCQPhase resumeSkills={resumeSkills} onComplete={handlePhaseComplete} onAnswer={() => {}} />
              </motion.div>
            )}

            {currentPhase === 2 && (
              <motion.div key="phase2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CodingPhase onComplete={handlePhaseComplete} />
              </motion.div>
            )}

            {currentPhase === 3 && (
              <motion.div key="phase3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DebuggingPhase onComplete={handlePhaseComplete} />
              </motion.div>
            )}

            {currentPhase === 4 && (
              <motion.div key="phase4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RealWorldPhase onComplete={handlePhaseComplete} />
              </motion.div>
            )}

            {completedPhases.size === 4 && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FinalResults results={phaseResults} resumeSkills={resumeSkills} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
