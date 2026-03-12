import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Heart, Shield, ArrowUpRight, Sparkles, Brain,
  Zap, Loader2, Search, Briefcase, MapPin, Code, Award, Clock, Users, Upload, File, X,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, AreaChart, Area,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ResumeAnalysisResponse {
  name: string;
  country: string;
  education: string;
  degree: string;
  university: string;
  graduation_year: number;
  career_role: string;
  career_prediction_score: number;
  career_match_score: number;
  future_salary_estimate: number;
  stress_level: string;
  job_stability_score: number;
  income_growth_prediction: number;
  market_stability_score: number;
  ai_confidence_score: number;
  programming_languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
  cloud_platforms: string[];
  soft_skills: string[];
  top_5_strongest_skills: string[];
  skill_proficiency_estimate: number;
  skills_to_learn: string[];
  recommended_certifications: string[];
  tools_to_prepare: string[];
  missing_industry_skills: string[];
  recommended_projects: string[];
  recommended_practice_platforms: string[];
  framework_strength: Record<string, number>;
  test_plan: Record<string, string>;
  ai_insight: string;
}

interface GeminiResponse {
  careerPredictionScore: number;
  futureIncomeEstimate: string;
  stressLevel: string;
  jobStability: number;
  careerMatchScore: number;
  incomeGrowth: number;
  stressPercentage: number;
  marketStability: number;
  salaryGrowth: number[];
  skillDemand: Record<string, number>;
  skillsToLearn: { name: string; priority: string; description: string }[];
  toolsToLearn: Record<string, number>;
  recentSimulations: { title: string; score: number }[];
  aiInsight: string;
  recommendations: string[];
}

interface UserProfile {
  userName: string;
  career: string;
  country: string;
  skills: string;
  internships: number;
  lookingForJob: string;
  experience: string;
  currentIncome: string;
}

// ---------------------------------------------------------------------------
// Defaults (original hardcoded data)
// ---------------------------------------------------------------------------
const defaultStats = [
  { label: "Career Prediction Score", value: "87%", change: "+12%", icon: TrendingUp, color: "text-primary" },
  { label: "Future Income Estimate", value: "$95K", change: "+24%", icon: DollarSign, color: "text-neon-blue" },
  { label: "Stress Level Index", value: "Low", change: "-18%", icon: Heart, color: "text-neon-purple" },
  { label: "Job Stability Score", value: "94%", change: "+8%", icon: Shield, color: "text-primary" },
];

const defaultSalaryLine = [
  { year: "2024", salary: 55 }, { year: "2025", salary: 62 }, { year: "2026", salary: 71 },
  { year: "2027", salary: 85 }, { year: "2028", salary: 98 }, { year: "2029", salary: 115 },
];

const defaultSkillDemand = [
  { name: "Python", value: 92 }, { name: "JavaScript", value: 85 }, { name: "AWS", value: 78 },
  { name: "React", value: 65 }, { name: "Docker", value: 72 },
];

const defaultSkillsToLearn: { name: string; priority: string; description: string }[] = [
  { name: "Machine Learning", priority: "High", description: "Core skill for AI-driven roles" },
  { name: "Cloud Architecture", priority: "High", description: "Essential for scalable systems" },
  { name: "System Design", priority: "Medium", description: "Key for senior-level positions" },
  { name: "Data Engineering", priority: "Medium", description: "Growing demand in analytics" },
];

const defaultToolsToLearn = [
  { name: "TensorFlow", value: 90 }, { name: "Kubernetes", value: 82 }, { name: "PostgreSQL", value: 75 },
  { name: "Git", value: 88 }, { name: "Linux", value: 70 },
];

const defaultSimulations = [
  { title: "Data Science vs Software Eng", time: "2h ago", score: "87%" },
  { title: "NYC vs Austin relocation", time: "Yesterday", score: "72%" },
  { title: "MBA vs Work Experience", time: "3 days ago", score: "91%" },
  { title: "Startup vs Corporate", time: "1 week ago", score: "68%" },
];

const defaultIncomeSparkline = [
  { v: 40 }, { v: 45 }, { v: 42 }, { v: 55 }, { v: 60 }, { v: 58 }, { v: 72 }, { v: 80 },
];

const tooltipStyle = {
  background: "hsl(0,0%,7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const CAREERS = [
  "Software Engineer", "Data Scientist", "AI/ML Engineer", "Product Manager",
  "Cybersecurity Analyst", "Cloud Engineer", "Full Stack Developer",
  "Robotics Engineer", "Blockchain Developer", "DevOps Engineer",
];

const COUNTRIES = [
  "USA", "Canada", "Germany", "Australia", "United Kingdom",
  "India", "Singapore", "Japan", "Netherlands", "South Korea",
];

// ---------------------------------------------------------------------------
// Gemini API helpers
// ---------------------------------------------------------------------------
const GEMINI_API_KEY = "AIzaSyAY6R853a8hwWz0pKRBgnxvF79KTijJsM0";
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];
function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

function createUserProfile(form: UserProfile) {
  return {
    career: form.career || "Software Engineer",
    country: form.country || "USA",
    skills: form.skills || "Python, JavaScript",
    internships: form.internships || 0,
    lookingForJob: form.lookingForJob || "Yes",
    experience: form.experience || "0",
    currentIncome: form.lookingForJob === "Yes" ? (form.currentIncome || "Not specified") : "N/A",
  };
}

async function fetchCareerAnalysis(profile: ReturnType<typeof createUserProfile>): Promise<GeminiResponse> {
  const prompt = `You are a career analytics AI.

Based on this user profile:
Career: ${profile.career}
Location: ${profile.country}
Skills: ${profile.skills}
Internships: ${profile.internships}
Looking for Job: ${profile.lookingForJob}
Current Income: ${profile.currentIncome}
Years of experience: ${profile.experience}

Return JSON only in this EXACT format (no markdown, no code blocks):
{
  "careerPredictionScore": 0,
  "futureIncomeEstimate": "",
  "stressLevel": "",
  "jobStability": 0,
  "careerMatchScore": 0,
  "incomeGrowth": 0,
  "stressPercentage": 0,
  "marketStability": 0,
  "salaryGrowth": [40, 55, 70, 85, 110],
  "skillDemand": { "Python": 90, "JavaScript": 85, "AWS": 75, "React": 65, "Docker": 70 },
  "skillsToLearn": [
    { "name": "Machine Learning", "priority": "High", "description": "Core skill for AI-driven roles" },
    { "name": "Cloud Architecture", "priority": "High", "description": "Essential for scalable systems" },
    { "name": "System Design", "priority": "Medium", "description": "Key for senior-level positions" },
    { "name": "Data Engineering", "priority": "Medium", "description": "Growing demand in analytics" }
  ],
  "toolsToLearn": { "TensorFlow": 90, "Kubernetes": 82, "PostgreSQL": 75, "Git": 88, "Linux": 70 },
  "recentSimulations": [
    { "title": "Data Science vs Software Eng", "score": 87 },
    { "title": "NYC vs Austin relocation", "score": 72 },
    { "title": "MBA vs Work Experience", "score": 91 }
  ],
  "aiInsight": "Based on your skills and internships, pursuing Data Science has a higher growth potential over the next 5 years.",
  "recommendations": ["Learn Deep Learning", "Contribute to Open Source", "Apply for ML internships"]
}

RULES:
- Fill in realistic values based on the user's profile and selected career.
- careerPredictionScore, jobStability, careerMatchScore, marketStability should be 0-100.
- stressPercentage should be 0-100.
- incomeGrowth should be a percentage number (e.g. 34).
- futureIncomeEstimate should be like "$95K" or "$120K".
- stressLevel should be "Low", "Medium", or "High".
- salaryGrowth should have 5 numbers representing salary in K$ over 5 years.
- skillDemand: top 5 programming languages/tools most in demand for the selected career, with demand score 0-100.
- skillsToLearn: 4-6 skills the user should learn for the selected career, with priority (High/Medium/Low) and a short description.
- toolsToLearn: top 5 tools/frameworks/languages to prepare for the career, with importance score 0-100.
- Return ONLY the JSON object, nothing else.`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  let lastError = "";
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(geminiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.status === 429) {
        lastError = "Rate limit exceeded. Trying next model...";
        console.warn(`[Dashboard] ${model}: 429 rate limited, trying fallback`);
        continue;
      }
      if (!res.ok) {
        lastError = `API error: ${res.status}`;
        continue;
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) {
        lastError = "Empty response from API";
        continue;
      }
      console.log(`[Dashboard] Success with model: ${model}`);
      return parseGeminiResponse(text);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[Dashboard] ${model} failed:`, lastError);
    }
  }

  throw new Error(lastError || "All Gemini models failed");
}

function parseGeminiResponse(text: string): GeminiResponse {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  const data = JSON.parse(match[0]);

  return {
    careerPredictionScore: Number(data.careerPredictionScore) || 0,
    futureIncomeEstimate: String(data.futureIncomeEstimate || "$0"),
    stressLevel: String(data.stressLevel || "Medium"),
    jobStability: Number(data.jobStability) || 0,
    careerMatchScore: Number(data.careerMatchScore) || 0,
    incomeGrowth: Number(data.incomeGrowth) || 0,
    stressPercentage: Number(data.stressPercentage) || 0,
    marketStability: Number(data.marketStability) || 0,
    salaryGrowth: Array.isArray(data.salaryGrowth) ? data.salaryGrowth.map(Number) : [40, 55, 70, 85, 110],
    skillDemand: data.skillDemand && typeof data.skillDemand === "object" ? data.skillDemand : {},
    skillsToLearn: Array.isArray(data.skillsToLearn) ? data.skillsToLearn.map((s: { name?: string; priority?: string; description?: string }) => ({
      name: String(s.name || ""),
      priority: String(s.priority || "Medium"),
      description: String(s.description || ""),
    })) : [],
    toolsToLearn: data.toolsToLearn && typeof data.toolsToLearn === "object" ? data.toolsToLearn : {},
    recentSimulations: Array.isArray(data.recentSimulations) ? data.recentSimulations : [],
    aiInsight: String(data.aiInsight || ""),
    recommendations: Array.isArray(data.recommendations) ? data.recommendations.map(String) : [],
  };
}

// ---------------------------------------------------------------------------
// Transform helpers — build chart-ready data from Gemini response
// ---------------------------------------------------------------------------
function buildStats(d: GeminiResponse) {
  return [
    { label: "Career Prediction Score", value: `${d.careerPredictionScore}%`, change: `+${d.careerPredictionScore > 80 ? 12 : 5}%`, icon: TrendingUp, color: "text-primary" },
    { label: "Future Income Estimate", value: d.futureIncomeEstimate, change: `+${d.incomeGrowth}%`, icon: DollarSign, color: "text-neon-blue" },
    { label: "Stress Level Index", value: d.stressLevel, change: `${d.stressPercentage < 40 ? "-" : "+"}${d.stressPercentage}%`, icon: Heart, color: "text-neon-purple" },
    { label: "Job Stability Score", value: `${d.jobStability}%`, change: `+${d.jobStability > 80 ? 8 : 3}%`, icon: Shield, color: "text-primary" },
  ];
}

function buildSalaryLine(salaryGrowth: number[]) {
  const baseYear = 2024;
  return salaryGrowth.map((s, i) => ({ year: String(baseYear + i), salary: s }));
}

function buildSkillDemand(sd: Record<string, number>) {
  return Object.entries(sd).map(([name, value]) => ({ name, value: Number(value) }));
}

function buildToolsToLearn(tools: Record<string, number>) {
  return Object.entries(tools).map(([name, value]) => ({ name, value: Number(value) }));
}

function buildSimulations(sims: { title: string; score: number }[]) {
  const times = ["Just now", "1h ago", "Today", "Yesterday"];
  return sims.map((s, i) => ({ title: s.title, time: times[i] || `${i + 1}d ago`, score: `${s.score}%` }));
}

function buildIncomeSparkline(growth: number) {
  const base = 40;
  const steps = 8;
  return Array.from({ length: steps }, (_, i) => ({
    v: Math.round(base + (growth / steps) * (i + 1) + (Math.random() - 0.5) * 8),
  }));
}

// Convert ResumeAnalysisResponse to GeminiResponse format for display
function convertResumeResponseToDisplay(data: ResumeAnalysisResponse): GeminiResponse {
  return {
    careerPredictionScore: data.career_prediction_score,
    futureIncomeEstimate: `$${Math.round(data.future_salary_estimate / 1000)}K`,
    stressLevel: data.stress_level,
    jobStability: data.job_stability_score,
    careerMatchScore: data.career_match_score,
    incomeGrowth: data.income_growth_prediction,
    stressPercentage: data.stress_level === "Low" ? 30 : data.stress_level === "Medium" ? 55 : 80,
    marketStability: data.market_stability_score,
    salaryGrowth: [
      data.future_salary_estimate * 0.85,
      data.future_salary_estimate * 0.92,
      data.future_salary_estimate,
      data.future_salary_estimate * 1.15,
      data.future_salary_estimate * 1.32,
      data.future_salary_estimate * 1.5,
    ],
    skillDemand: data.framework_strength || {},
    skillsToLearn: data.skills_to_learn.map(skill => ({
      name: skill,
      priority: "High",
      description: `Key skill for ${data.career_role} roles`
    })),
    toolsToLearn: data.framework_strength || {},
    recentSimulations: [],
    aiInsight: data.ai_insight,
    recommendations: data.recommended_projects || [],
  };
}

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------
const Dashboard = () => {
  const [form, setForm] = useState<UserProfile>({
    userName: "", career: "", country: "", skills: "", internships: 0, lookingForJob: "Yes", experience: "", currentIncome: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<GeminiResponse | ResumeAnalysisResponse | null>(null);
  const [resumeAnalysisMode, setResumeAnalysisMode] = useState(false);
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  // Persist userName to localStorage for the navbar
  useEffect(() => {
    localStorage.setItem("dt_userName", form.userName);
  }, [form.userName]);

  // Derived chart data — falls back to defaults
  const displayData = data && 'career_prediction_score' in data ? convertResumeResponseToDisplay(data as ResumeAnalysisResponse) : data as GeminiResponse | null;
  const stats = displayData ? buildStats(displayData) : defaultStats;
  const salaryLine = displayData ? buildSalaryLine(displayData.salaryGrowth) : defaultSalaryLine;
  const skillDemand = displayData ? buildSkillDemand(displayData.skillDemand) : defaultSkillDemand;
  const skillsToLearn = displayData?.skillsToLearn?.length ? displayData.skillsToLearn : defaultSkillsToLearn;
  const toolsToLearn = displayData ? buildToolsToLearn(displayData.toolsToLearn) : defaultToolsToLearn;
  const simulations = displayData ? buildSimulations(displayData.recentSimulations) : defaultSimulations;
  const incomeSparkline = displayData ? buildIncomeSparkline(displayData.incomeGrowth) : defaultIncomeSparkline;
  const careerMatchScore = displayData?.careerMatchScore ?? 72;
  const incomeGrowthPct = displayData ? `+${displayData.incomeGrowth}%` : "+34%";
  const stressPct = displayData?.stressPercentage ?? 32;
  const marketStability = displayData?.marketStability ?? 88;
  const aiInsight = displayData?.aiInsight || 'Based on market trends, pursuing <span class="text-foreground font-medium">Data Science</span> has a <span class="text-primary font-semibold">68% higher</span> growth potential over the next 5 years.';
  const recommendations = displayData?.recommendations || [];

  const handleAnalyze = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const profile = createUserProfile(form);
      const result = await fetchCareerAnalysis(profile);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Dashboard] Gemini error:", msg);
      if (msg.includes("429") || msg.includes("Rate limit") || msg.includes("quota")) {
        setError("API quota exceeded. Please wait a minute and try again.");
      } else {
        setError(`Analysis failed: ${msg}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handleResumeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = [".txt", ".pdf", ".doc", ".docx"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (allowed.includes(ext)) {
        setResumeFile(file);
        setResumeError("");
      } else {
        setResumeError("Please upload a .txt, .pdf, .doc, or .docx file");
      }
    }
  };

  const handleResumeAnalyze = useCallback(async () => {
    if (!resumeFile) {
      setResumeError("Please select a resume file");
      return;
    }

    setResumeError("");
    setResumeLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      console.log("[Dashboard] Uploading resume:", resumeFile.name);
      const response = await fetch("/api/resume-analysis/analyze-dashboard", {
        method: "POST",
        body: formData,
      });

      console.log("[Dashboard] Response status:", response.status);
      
      // Get response text first to diagnose issues
      const responseText = await response.text();
      console.log("[Dashboard] Response text preview:", responseText.substring(0, 200));

      if (!response.ok) {
        // Try to parse as JSON error, otherwise use text
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.detail || `Server error: ${response.status}`);
        } catch {
          throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
        }
      }

      // Try to parse response as JSON
      try {
        const result = JSON.parse(responseText) as ResumeAnalysisResponse;
        console.log("[Dashboard] Resume analysis success:", result);
        
        // Save resume skills to localStorage for AIInsights page
        const allSkills = [
          ...(result.programming_languages || []),
          ...(result.frameworks || []),
          ...(result.tools || []),
          ...(result.databases || []),
          ...(result.cloud_platforms || []),
          ...(result.soft_skills || []),
        ];
        localStorage.setItem("resumeSkills", JSON.stringify(allSkills));
        console.log("[Dashboard] Saved skills to localStorage:", allSkills);
        
        setData(result);
        setResumeAnalysisMode(true);
        setResumeFile(null);
      } catch (parseErr) {
        console.error("[Dashboard] Failed to parse response as JSON:", parseErr);
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Dashboard] Resume analysis error:", msg);
      setResumeError(`Resume analysis failed: ${msg}`);
    } finally {
      setResumeLoading(false);
    }
  }, [resumeFile]);

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-white/30";
  const selectClass = "w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Resume Upload Widget */}
      <motion.div className="glass-card p-5 border border-white/[0.04]" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center">
            <Upload className="w-4 h-4 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Resume Analysis</h3>
            <p className="text-[10px] text-muted-foreground">Upload your resume to auto-populate career metrics (.pdf, .doc, .docx)</p>
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] text-white/40 uppercase tracking-wider font-medium mb-2">
              <File className="w-3 h-3 inline mr-1" />Resume File
            </label>
            <div className="relative">
              <input
                type="file"
                id="resume-upload"
                onChange={handleResumeFile}
                accept=".pdf,.doc,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full bg-white/[0.04] border border-white/[0.08] border-dashed rounded-lg px-4 py-3 text-sm text-white/70 hover:border-neon-blue/50 transition-colors flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {resumeFile ? resumeFile.name : "Click or drag to upload"}
              </div>
            </div>
            {resumeError && <span className="text-[10px] text-red-400 mt-1 block">{resumeError}</span>}
          </div>
          <button
            onClick={handleResumeAnalyze}
            disabled={!resumeFile || resumeLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-neon-blue/20 border border-neon-blue/30 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {resumeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {resumeLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left main content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Career Insights Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of your career potential and growth opportunities.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={`${s.label}-${s.value}`} className="glass-card-hover p-4" {...anim(i * 0.08)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={s.value} className="text-2xl font-bold mb-1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {s.value}
                  </motion.div>
                </AnimatePresence>
                <div className="flex items-center gap-1 text-[11px] text-primary">
                  <ArrowUpRight className="w-3 h-3" />
                  {s.change} from last month
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div className="glass-card p-5" {...anim(0.35)}>
              <h3 className="text-xs font-medium mb-4 text-muted-foreground">
                Salary Growth Over Time (K$)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salaryLine}>
                  <defs>
                    <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(174,72%,56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(174,72%,56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="salary" stroke="hsl(174,72%,56%)" strokeWidth={2} fill="url(#salaryGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="glass-card p-5" {...anim(0.4)}>
              <h3 className="text-xs font-medium mb-4 text-muted-foreground">
                Languages & Tools to Prepare {form.career && <span className="text-primary">· {form.career}</span>}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={skillDemand}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(200,100%,60%)" />
                      <stop offset="100%" stopColor="hsl(174,72%,56%)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Bottom row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills to Learn */}
            <motion.div className="glass-card p-5" {...anim(0.5)}>
              <h3 className="text-xs font-medium mb-4 text-muted-foreground">
                Skills to Learn {form.career && <span className="text-primary">· {form.career}</span>}
              </h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {skillsToLearn.map((skill, i) => (
                  <motion.div
                    key={`${skill.name}-${i}`}
                    className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04] hover:border-primary/20 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        skill.priority === "High" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                        skill.priority === "Medium" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" :
                        "bg-green-500/15 text-green-400 border border-green-500/20"
                      }`}>{skill.priority}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{skill.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Top Tools to Learn chart */}
            <motion.div className="glass-card p-5" {...anim(0.45)}>
              <h3 className="text-xs font-medium mb-4 text-muted-foreground">
                Top Tools & Frameworks {form.career && <span className="text-primary">· {form.career}</span>}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={toolsToLearn} layout="vertical">
                  <defs>
                    <linearGradient id="toolGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(265,60%,55%)" />
                      <stop offset="100%" stopColor="hsl(200,100%,60%)" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#999", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, "Importance"]} />
                  <Bar dataKey="value" fill="url(#toolGrad)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div className="glass-card p-5" {...anim(0.55)}>
              <h3 className="text-xs font-medium mb-4 text-muted-foreground">Recent Simulations</h3>
              <div className="space-y-2">
                {simulations.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                    </div>
                    <span className="text-sm text-primary font-semibold">{item.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Resume Analysis Details Section */}
          {resumeAnalysisMode && data && 'career_prediction_score' in data && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Profile Header */}
              <div className="glass-card p-5">
                <h2 className="text-lg font-bold mb-4">Resume Analysis Results</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-semibold">{(data as ResumeAnalysisResponse).name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Target Role</p>
                    <p className="font-semibold text-primary">{(data as ResumeAnalysisResponse).career_role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">University</p>
                    <p className="font-semibold text-xs">{(data as ResumeAnalysisResponse).university}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Graduation Year</p>
                    <p className="font-semibold">{(data as ResumeAnalysisResponse).graduation_year}</p>
                  </div>
                </div>
              </div>

              {/* Top 5 Skills */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Top 5 Strongest Skills
                </h3>
                <div className="space-y-2">
                  {(data as ResumeAnalysisResponse).top_5_strongest_skills.map((skill, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between p-2 bg-white/[0.03] rounded border border-white/[0.04]"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <span className="text-xs font-medium">{skill}</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${85 - i * 8}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">{85 - i * 8}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Technical Stack
                </h3>
                <div className="space-y-4 text-xs">
                  {(data as ResumeAnalysisResponse).programming_languages.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(data as ResumeAnalysisResponse).programming_languages.slice(0, 6).map((lang, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/15 text-blue-300 rounded text-[10px] border border-blue-500/20 hover:bg-blue-500/25 transition">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(data as ResumeAnalysisResponse).frameworks.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Frameworks</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(data as ResumeAnalysisResponse).frameworks.slice(0, 6).map((fw, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/15 text-purple-300 rounded text-[10px] border border-purple-500/20 hover:bg-purple-500/25 transition">
                            {fw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(data as ResumeAnalysisResponse).cloud_platforms.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Cloud Platforms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(data as ResumeAnalysisResponse).cloud_platforms.slice(0, 5).map((cloud, i) => (
                          <span key={i} className="px-2 py-1 bg-orange-500/15 text-orange-300 rounded text-[10px] border border-orange-500/20 hover:bg-orange-500/25 transition">
                            {cloud}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills to Learn & Framework Strength */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    Next: Skills to Learn
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(data as ResumeAnalysisResponse).skills_to_learn.slice(0, 6).map((skill, i) => (
                      <motion.div
                        key={i}
                        className="text-xs p-2 bg-green-500/10 rounded border border-green-500/20 text-green-300 hover:bg-green-500/15 transition"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-400" />
                    Framework Strength
                  </h3>
                  <div className="space-y-2">
                    {Object.entries((data as ResumeAnalysisResponse).framework_strength)
                      .slice(0, 5)
                      .map(([tool, level], i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">{tool}</span>
                            <span className="text-xs text-muted-foreground">{level}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${level}%` }}
                              transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                            />
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Certifications & Projects */}
              <div className="grid md:grid-cols-2 gap-6">
                {(data as ResumeAnalysisResponse).recommended_certifications.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      Recommended Certifications
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data as ResumeAnalysisResponse).recommended_certifications.slice(0, 5).map((cert, i) => (
                        <div key={i} className="text-xs p-2 bg-yellow-500/10 rounded border border-yellow-500/20 text-yellow-300">
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(data as ResumeAnalysisResponse).recommended_projects.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      Recommended Projects
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data as ResumeAnalysisResponse).recommended_projects.slice(0, 5).map((project, i) => (
                        <div key={i} className="text-xs p-2 bg-cyan-500/10 rounded border border-cyan-500/20 text-cyan-300">
                          {project}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Insight */}
              <motion.div
                className="glass-card p-5 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  AI-Generated Insight
                </h3>
                <p className="text-xs leading-relaxed text-white/80">
                  {(data as ResumeAnalysisResponse).ai_insight}
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Right profile analytics panel */}
        <motion.aside className="space-y-4" {...anim(0.2)}>
          {/* Profile card */}
          <div className="glass-card p-5">
            <div className="flex flex-col items-center text-center mb-5">
              <img
                src="/logo-icon.png"
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover mb-3 shadow-[0_0_20px_rgba(45,212,191,0.3)] border-2 border-primary/30"
              />
              <h3 className="text-sm font-bold">{form.userName || "User"}</h3>
              <p className="text-[11px] text-muted-foreground">Student · Career Explorer</p>
            </div>

            {/* Career Match Score - circular */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(220,10%,14%)" strokeWidth="6" />
                  <motion.circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke="hsl(174,72%,56%)"
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ strokeDasharray: "0 251" }}
                    animate={{ strokeDasharray: `${careerMatchScore * 2.51} 251` }}
                    transition={{ duration: 0.8 }}
                    className="drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span key={careerMatchScore} className="text-lg font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {careerMatchScore}%
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[9px] text-muted-foreground">Match</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mb-4">Career Match Score</p>

            {/* Income Growth sparkline */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">Income Growth</span>
                <AnimatePresence mode="wait">
                  <motion.span key={incomeGrowthPct} className="text-[11px] font-semibold text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {incomeGrowthPct}
                  </motion.span>
                </AnimatePresence>
              </div>
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={incomeSparkline}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(200,100%,60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(200,100%,60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="hsl(200,100%,60%)" strokeWidth={1.5} fill="url(#sparkGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stress Level bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">Stress Level</span>
                <AnimatePresence mode="wait">
                  <motion.span key={stressPct} className="text-[11px] font-semibold text-neon-purple" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {stressPct}%
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(265,60%,55%), hsl(200,100%,60%))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Market Stability bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">Market Stability</span>
                <AnimatePresence mode="wait">
                  <motion.span key={marketStability} className="text-[11px] font-semibold text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {marketStability}%
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${marketStability}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>

          {/* AI Insight card */}
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold">AI Insight</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={aiInsight}
                className="text-[12px] text-muted-foreground leading-relaxed mb-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                dangerouslySetInnerHTML={{ __html: `"${aiInsight}"` }}
              />
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">Confidence: <span className="text-primary font-medium">{data ? `${Math.max(data.careerMatchScore, 70)}%` : "92%"}</span></span>
              </div>
              <ResponsiveContainer width={60} height={24}>
                <LineChart data={[{ v: 20 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 42 }, { v: 58 }]}>
                  <Line type="monotone" dataKey="v" stroke="hsl(174,72%,56%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold">Recommendations</span>
              </div>
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Quick actions */}
          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/dashboard/simulator")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/10 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                New Simulation
              </button>
              <button
                onClick={() => navigate("/dashboard/trends")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/10 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                View Trends
              </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default Dashboard;
