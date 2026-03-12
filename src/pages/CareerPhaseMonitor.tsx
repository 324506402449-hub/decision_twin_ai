import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
  Code2,
  ClipboardCheck,
  Briefcase,
  Building2,
  ExternalLink,
  ArrowLeft,
  Trophy,
  Target,
  GraduationCap,
  Rocket,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  completed: boolean;
}

interface PracticeProblem {
  id: string;
  title: string;
  platform: string;
  url: string;
  completed: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
}

interface Company {
  name: string;
  roles: string[];
  applyUrl: string;
}

interface PhaseData {
  modules: Module[];
  practice?: PracticeProblem[];
  assignments?: Assignment[];
  projects?: Project[];
  internships?: string[];
  companies?: Company[];
}

type CareerPhases = Record<string, PhaseData>;

const CAREER_CONTENT: Record<string, CareerPhases> = {
  "Data Science": {
    foundations: {
      modules: [
        { id: "ds-f1", title: "Python Programming Basics", completed: false },
        { id: "ds-f2", title: "Variables and Data Types", completed: false },
        { id: "ds-f3", title: "Loops, Conditionals & Functions", completed: false },
        { id: "ds-f4", title: "Descriptive Statistics", completed: false },
        { id: "ds-f5", title: "Probability Fundamentals", completed: false },
        { id: "ds-f6", title: "Linear Algebra Basics", completed: false },
        { id: "ds-f7", title: "NumPy & Pandas Introduction", completed: false },
      ],
    },
    intermediate: {
      modules: [
        { id: "ds-i1", title: "Advanced Python (OOP, Decorators)", completed: false },
        { id: "ds-i2", title: "Data Wrangling with Pandas", completed: false },
        { id: "ds-i3", title: "Data Visualization (Matplotlib, Seaborn)", completed: false },
        { id: "ds-i4", title: "Exploratory Data Analysis (EDA)", completed: false },
        { id: "ds-i5", title: "SQL & Database Querying", completed: false },
        { id: "ds-i6", title: "Scikit-learn Fundamentals", completed: false },
      ],
      practice: [
        { id: "ds-p1", title: "Python Data Structures Challenge", platform: "HackerRank", url: "https://www.hackerrank.com/domains/python", completed: false },
        { id: "ds-p2", title: "Pandas Practice Problems", platform: "Kaggle", url: "https://www.kaggle.com/learn/pandas", completed: false },
        { id: "ds-p3", title: "SQL Practice Queries", platform: "LeetCode", url: "https://leetcode.com/problemset/database/", completed: false },
        { id: "ds-p4", title: "Statistics & Probability Set", platform: "HackerRank", url: "https://www.hackerrank.com/domains/ai/statistics-foundations", completed: false },
      ],
    },
    assignments: {
      modules: [],
      assignments: [
        { id: "ds-a1", title: "Titanic Survival Prediction", description: "Build a classification model on the Titanic dataset using logistic regression and random forest.", completed: false },
        { id: "ds-a2", title: "Sales Data Dashboard", description: "Create an interactive dashboard analyzing retail sales data with visualizations.", completed: false },
        { id: "ds-a3", title: "Customer Segmentation", description: "Implement K-Means clustering to segment customers based on purchasing behavior.", completed: false },
        { id: "ds-a4", title: "Sentiment Analysis Pipeline", description: "Build a text classification pipeline that analyzes product review sentiment.", completed: false },
      ],
    },
    projects: {
      modules: [],
      projects: [
        { id: "ds-pr1", title: "End-to-End ML Pipeline", description: "Build a complete ML pipeline with data ingestion, preprocessing, training, evaluation, and deployment." },
        { id: "ds-pr2", title: "Real-time Analytics Dashboard", description: "Create a Streamlit/Dash dashboard with live data feeds and interactive visualizations." },
        { id: "ds-pr3", title: "Recommendation System", description: "Build a movie/product recommendation engine using collaborative filtering." },
      ],
      internships: [
        "Data Science Intern — Remote/Hybrid positions",
        "ML Research Intern — University labs & startups",
        "Analytics Intern — Fortune 500 companies",
      ],
      companies: [
        { name: "Google", roles: ["Data Scientist", "ML Engineer", "Research Scientist"], applyUrl: "https://careers.google.com" },
        { name: "Microsoft", roles: ["Data Scientist", "Applied Scientist"], applyUrl: "https://careers.microsoft.com" },
        { name: "Amazon", roles: ["Data Scientist", "Business Intelligence Engineer"], applyUrl: "https://www.amazon.jobs" },
        { name: "Meta", roles: ["Data Scientist", "Research Scientist"], applyUrl: "https://www.metacareers.com" },
        { name: "Netflix", roles: ["Data Scientist", "Analytics Engineer"], applyUrl: "https://jobs.netflix.com" },
      ],
    },
  },

  "Machine Learning": {
    foundations: {
      modules: [
        { id: "ml-f1", title: "Python Programming Essentials", completed: false },
        { id: "ml-f2", title: "Linear Algebra for ML", completed: false },
        { id: "ml-f3", title: "Calculus & Optimization", completed: false },
        { id: "ml-f4", title: "Probability & Statistics", completed: false },
        { id: "ml-f5", title: "NumPy & Data Manipulation", completed: false },
        { id: "ml-f6", title: "Introduction to Scikit-learn", completed: false },
      ],
    },
    intermediate: {
      modules: [
        { id: "ml-i1", title: "Supervised Learning (Regression & Classification)", completed: false },
        { id: "ml-i2", title: "Unsupervised Learning (Clustering, PCA)", completed: false },
        { id: "ml-i3", title: "Model Evaluation & Cross-Validation", completed: false },
        { id: "ml-i4", title: "Feature Engineering & Selection", completed: false },
        { id: "ml-i5", title: "Ensemble Methods (Random Forest, XGBoost)", completed: false },
        { id: "ml-i6", title: "Neural Networks with TensorFlow/PyTorch", completed: false },
      ],
      practice: [
        { id: "ml-p1", title: "ML Algorithm Challenges", platform: "Kaggle", url: "https://www.kaggle.com/competitions", completed: false },
        { id: "ml-p2", title: "Algorithm Implementation", platform: "HackerRank", url: "https://www.hackerrank.com/domains/ai", completed: false },
        { id: "ml-p3", title: "Data Structures for ML", platform: "LeetCode", url: "https://leetcode.com/problemset/all/", completed: false },
      ],
    },
    assignments: {
      modules: [],
      assignments: [
        { id: "ml-a1", title: "House Price Prediction", description: "Build regression models to predict housing prices with feature engineering.", completed: false },
        { id: "ml-a2", title: "Image Classification (CIFAR-10)", description: "Train a CNN to classify images into 10 categories.", completed: false },
        { id: "ml-a3", title: "NLP Text Classifier", description: "Build a spam detector or topic classifier using NLP techniques.", completed: false },
      ],
    },
    projects: {
      modules: [],
      projects: [
        { id: "ml-pr1", title: "Object Detection System", description: "Build a real-time object detection system using YOLO or SSD." },
        { id: "ml-pr2", title: "Chatbot with Transformers", description: "Create a conversational AI chatbot using transformer architecture." },
      ],
      internships: [
        "ML Engineer Intern — AI startups",
        "Deep Learning Research Intern — Research labs",
        "Applied ML Intern — Tech companies",
      ],
      companies: [
        { name: "Google DeepMind", roles: ["ML Engineer", "Research Scientist"], applyUrl: "https://deepmind.google/careers/" },
        { name: "OpenAI", roles: ["ML Engineer", "Research Engineer"], applyUrl: "https://openai.com/careers" },
        { name: "NVIDIA", roles: ["Deep Learning Engineer", "ML Researcher"], applyUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/" },
        { name: "Apple", roles: ["ML Engineer", "AI Researcher"], applyUrl: "https://jobs.apple.com" },
        { name: "Tesla", roles: ["ML Engineer", "Autopilot Engineer"], applyUrl: "https://www.tesla.com/careers" },
      ],
    },
  },
};
function getCareerContent(career: string): CareerPhases {
  if (CAREER_CONTENT[career]) return CAREER_CONTENT[career];

  const slug = career.toLowerCase().replace(/\s+/g, "-");
  return {
    foundations: {
      modules: [
        { id: `${slug}-f1`, title: `Introduction to ${career}`, completed: false },
        { id: `${slug}-f2`, title: "Core Programming Skills", completed: false },
        { id: `${slug}-f3`, title: "Fundamental Concepts & Theory", completed: false },
        { id: `${slug}-f4`, title: "Tools & Environment Setup", completed: false },
        { id: `${slug}-f5`, title: "Basic Problem Solving", completed: false },
      ],
    },
    intermediate: {
      modules: [
        { id: `${slug}-i1`, title: "Advanced Concepts", completed: false },
        { id: `${slug}-i2`, title: "Industry Frameworks & Libraries", completed: false },
        { id: `${slug}-i3`, title: "System Design Principles", completed: false },
        { id: `${slug}-i4`, title: "Best Practices & Patterns", completed: false },
      ],
      practice: [
        { id: `${slug}-p1`, title: "Coding Challenges", platform: "HackerRank", url: "https://www.hackerrank.com", completed: false },
        { id: `${slug}-p2`, title: "Algorithm Practice", platform: "LeetCode", url: "https://leetcode.com", completed: false },
        { id: `${slug}-p3`, title: "Domain Exercises", platform: "Kaggle", url: "https://www.kaggle.com", completed: false },
      ],
    },
    assignments: {
      modules: [],
      assignments: [
        { id: `${slug}-a1`, title: `${career} Mini Project`, description: `Build a small application applying core ${career} concepts.`, completed: false },
        { id: `${slug}-a2`, title: "Technical Report", description: `Write a technical analysis on a real-world ${career} use case.`, completed: false },
        { id: `${slug}-a3`, title: "Code Review Exercise", description: "Review and refactor an existing codebase following best practices.", completed: false },
      ],
    },
    projects: {
      modules: [],
      projects: [
        { id: `${slug}-pr1`, title: `${career} Portfolio Project`, description: `Build a comprehensive portfolio project demonstrating ${career} skills.` },
        { id: `${slug}-pr2`, title: "Open Source Contribution", description: `Contribute to an open source project in the ${career} ecosystem.` },
      ],
      internships: [
        `${career} Intern — Startups & mid-size companies`,
        `Junior ${career} — Entry-level positions`,
        `${career} Research — University & lab positions`,
      ],
      companies: [
        { name: "Google", roles: [`${career} Engineer`, `Senior ${career} Engineer`], applyUrl: "https://careers.google.com" },
        { name: "Microsoft", roles: [`${career} Developer`, `${career} Analyst`], applyUrl: "https://careers.microsoft.com" },
        { name: "Amazon", roles: [`${career} Specialist`], applyUrl: "https://www.amazon.jobs" },
        { name: "Meta", roles: [`${career} Engineer`], applyUrl: "https://www.metacareers.com" },
        { name: "Netflix", roles: [`${career} Engineer`], applyUrl: "https://jobs.netflix.com" },
      ],
    },
  };
}

const PHASE_META = [
  { key: "foundations", title: "Phase 1 — Foundations", icon: BookOpen, color: "text-teal-400", bg: "bg-teal-400" },
  { key: "intermediate", title: "Phase 2 — Intermediate Learning", icon: Code2, color: "text-blue-400", bg: "bg-blue-400" },
  { key: "assignments", title: "Phase 3 — Assignments", icon: ClipboardCheck, color: "text-purple-400", bg: "bg-purple-400" },
  { key: "projects", title: "Phase 4 — Projects & Opportunities", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-400" },
] as const;

const STORAGE_KEY = "decisiontwin_career_progress";

interface ProgressState {
  career: string;
  completedIds: string[]; // ids of completed modules, practice, assignments
}

function loadProgress(): ProgressState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProgressState;
  } catch {
    return null;
  }
}

function saveProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const CareerPhaseMonitor = () => {
  const navigate = useNavigate();
  const [career, setCareer] = useState("");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedPhase, setExpandedPhase] = useState<string | null>("foundations");
  useEffect(() => {
    const saved = loadProgress();
    const storedCareer = localStorage.getItem("decisiontwin_selected_career");
    if (saved && saved.career) {
      setCareer(saved.career);
      setCompletedIds(new Set(saved.completedIds));
    } else if (storedCareer) {
      setCareer(storedCareer);
    } else {
      navigate("/dashboard/recommendations");
    }
  }, [navigate]);
  useEffect(() => {
    if (career) {
      saveProgress({ career, completedIds: Array.from(completedIds) });
    }
  }, [career, completedIds]);

  const toggleItem = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePhase = useCallback((key: string) => {
    setExpandedPhase((prev) => (prev === key ? null : key));
  }, []);

  if (!career) return null;

  const content = getCareerContent(career);
  const allCheckableIds: string[] = [];
  for (const phaseKey of ["foundations", "intermediate", "assignments", "projects"] as const) {
    const phase = content[phaseKey];
    if (!phase) continue;
    phase.modules.forEach((m) => allCheckableIds.push(m.id));
    phase.practice?.forEach((p) => allCheckableIds.push(p.id));
    phase.assignments?.forEach((a) => allCheckableIds.push(a.id));
  }

  const totalItems = allCheckableIds.length;
  const completedCount = allCheckableIds.filter((id) => completedIds.has(id)).length;
  const overallPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  function phasePercent(phaseKey: string): number {
    const phase = content[phaseKey as keyof typeof content];
    if (!phase) return 0;
    const ids: string[] = [];
    phase.modules.forEach((m) => ids.push(m.id));
    phase.practice?.forEach((p) => ids.push(p.id));
    phase.assignments?.forEach((a) => ids.push(a.id));
    if (ids.length === 0) return 0;
    return Math.round((ids.filter((id) => completedIds.has(id)).length / ids.length) * 100);
  }
  const allAssignmentIds = content.assignments?.assignments?.map((a) => a.id) || [];
  const completedAssignments = allAssignmentIds.filter((id) => completedIds.has(id)).length;
  const assignmentPercent = allAssignmentIds.length > 0 ? Math.round((completedAssignments / allAssignmentIds.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-white"
        onClick={() => navigate("/dashboard/recommendations")}
      >
        <ArrowLeft size={16} /> Back to AI Insights
      </Button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{career} Path</h1>
            <p className="text-sm text-muted-foreground">Career Phase Monitor — Track your learning journey</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Course Progress</span>
            <span className="font-semibold text-teal-400">{overallPercent}%</span>
          </div>
          <Progress value={overallPercent} className="h-3" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-3 text-center">
            <Target size={18} className="mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold">{overallPercent}%</p>
            <p className="text-[11px] text-muted-foreground">Course Completion</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Trophy size={18} className="mx-auto mb-1 text-purple-400" />
            <p className="text-lg font-bold">{assignmentPercent}%</p>
            <p className="text-[11px] text-muted-foreground">Assignments Done</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Rocket size={18} className="mx-auto mb-1 text-amber-400" />
            <p className="text-lg font-bold">{completedCount}/{totalItems}</p>
            <p className="text-[11px] text-muted-foreground">Tasks Completed</p>
          </div>
        </div>
      </motion.div>
      <div className="space-y-3">
        {PHASE_META.map((phase, idx) => {
          const isOpen = expandedPhase === phase.key;
          const pct = phasePercent(phase.key);
          const PhaseIcon = phase.icon;
          const phaseData = content[phase.key];

          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => togglePhase(phase.key)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${phase.bg}/15`}>
                  <PhaseIcon size={20} className={phase.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-sm">{phase.title}</h2>
                    <Badge variant="outline" className="text-[10px]">{pct}%</Badge>
                  </div>
                  <div className="mt-1.5">
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {isOpen && phaseData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-5">
                      {phaseData.modules.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modules</h3>
                          <div className="space-y-1">
                            {phaseData.modules.map((mod) => (
                              <CheckItem
                                key={mod.id}
                                label={mod.title}
                                checked={completedIds.has(mod.id)}
                                onToggle={() => toggleItem(mod.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {phaseData.practice && phaseData.practice.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Practice Problems</h3>
                          <div className="space-y-1">
                            {phaseData.practice.map((prob) => (
                              <div key={prob.id} className="flex items-center gap-3 group">
                                <CheckItem
                                  label={prob.title}
                                  checked={completedIds.has(prob.id)}
                                  onToggle={() => toggleItem(prob.id)}
                                  className="flex-1"
                                />
                                <a
                                  href={prob.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0"
                                >
                                  {prob.platform} <ExternalLink size={10} />
                                </a>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed: {phaseData.practice.filter((p) => completedIds.has(p.id)).length}/{phaseData.practice.length} problems
                          </div>
                        </div>
                      )}
                      {phaseData.assignments && phaseData.assignments.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignments</h3>
                          {phaseData.assignments.map((assgn) => (
                            <div key={assgn.id} className="glass-card p-4 space-y-2">
                              <div className="flex items-start gap-3">
                                <button onClick={() => toggleItem(assgn.id)} className="mt-0.5 shrink-0">
                                  {completedIds.has(assgn.id) ? (
                                    <CheckCircle2 size={18} className="text-teal-400" />
                                  ) : (
                                    <Circle size={18} className="text-muted-foreground/40 hover:text-muted-foreground" />
                                  )}
                                </button>
                                <div>
                                  <p className={`text-sm font-medium ${completedIds.has(assgn.id) ? "line-through text-muted-foreground" : ""}`}>
                                    {assgn.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">{assgn.description}</p>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  variant={completedIds.has(assgn.id) ? "secondary" : "default"}
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => toggleItem(assgn.id)}
                                >
                                  {completedIds.has(assgn.id) ? "Mark Incomplete" : "Mark Complete"}
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="text-xs text-muted-foreground">
                            Assignment completion: {phaseData.assignments.filter((a) => completedIds.has(a.id)).length}/{phaseData.assignments.length}
                          </div>
                        </div>
                      )}
                      {phaseData.projects && phaseData.projects.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project Ideas</h3>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {phaseData.projects.map((proj) => (
                              <div key={proj.id} className="glass-card p-4">
                                <p className="font-medium text-sm mb-1">{proj.title}</p>
                                <p className="text-xs text-muted-foreground">{proj.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {phaseData.internships && phaseData.internships.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Internship Opportunities</h3>
                          <div className="space-y-1.5">
                            {phaseData.internships.map((intern, ii) => (
                              <div key={ii} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Briefcase size={14} className="text-amber-400 shrink-0" />
                                {intern}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {phaseData.companies && phaseData.companies.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Companies Hiring</h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {phaseData.companies.map((comp) => (
                              <div key={comp.name} className="glass-card p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building2 size={16} className="text-blue-400 shrink-0" />
                                  <p className="font-semibold text-sm">{comp.name}</p>
                                </div>
                                <div className="space-y-1">
                                  {comp.roles.map((role, ri) => (
                                    <p key={ri} className="text-xs text-muted-foreground">• {role}</p>
                                  ))}
                                </div>
                                <a
                                  href={comp.applyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                  Apply Now <ExternalLink size={11} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

function CheckItem({
  label,
  checked,
  onToggle,
  className = "",
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-md w-full text-left hover:bg-white/[0.03] transition-colors ${className}`}
    >
      {checked ? (
        <CheckCircle2 size={16} className="text-teal-400 shrink-0" />
      ) : (
        <Circle size={16} className="text-muted-foreground/40 shrink-0" />
      )}
      <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>
        {label}
      </span>
    </button>
  );
}

export default CareerPhaseMonitor;
