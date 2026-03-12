import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, AlertCircle, CheckCircle2, TrendingUp, Award,
  Brain, Zap, Target, BookOpen, Code, Briefcase, BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalysisData {
  name: string;
  country: string;
  education: string;
  university: string;
  graduation_year: number;
  career_role: string;
  career_match_score: number;
  job_stability_score: number;
  stress_level: string;
  future_salary_estimate: number;
  skills: string[];
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
  top_frameworks: Array<{ name: string; level: number }>;
  framework_strength: Record<string, number>;
  missing_industry_skills: string[];
  recommended_projects: string[];
  recommended_practice_platforms: string[];
  test_plan: Record<string, string>;
  career_prediction_score: number;
  income_growth_prediction: number;
  market_stability_score: number;
  ai_confidence_score: number;
  ai_insight: string;
}

export default function ResumeAnalysis() {
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setResumeText(event.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setError("Please upload a .txt file. PDF/DOCX support coming soon.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError("Please provide resume content");
      return;
    }

    if (resumeText.trim().length < 50) {
      setError("Resume content is too short. Please provide a complete resume.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/resume-analysis/analyze-text-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed");
      }

      const data = await response.json();
      setAnalysisData(data);
      setActiveTab("results");
      setUploadedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            className="text-4xl font-bold text-white mb-2 flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Brain className="w-10 h-10 text-cyan-400" />
            AI Resume Analysis
          </motion.h1>
          <p className="text-slate-300">Analyze your resume and get personalized career insights</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Button
            onClick={() => setActiveTab("upload")}
            variant={activeTab === "upload" ? "default" : "outline"}
            className={activeTab === "upload" ? "bg-cyan-500 hover:bg-cyan-600" : ""}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
          {analysisData && (
            <Button
              onClick={() => setActiveTab("results")}
              variant={activeTab === "results" ? "default" : "outline"}
              className={activeTab === "results" ? "bg-cyan-500 hover:bg-cyan-600" : ""}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analysis
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Paste or Upload Your Resume</CardTitle>
                  <CardDescription>Provide your resume content in text format</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Upload Resume File</label>
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-300">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400 mt-1">.txt files only (PDF/DOCX coming soon)</p>
                      </label>
                    </div>
                    {uploadedFile && (
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        File loaded: {uploadedFile.name}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-800 text-slate-400">or paste below</span>
                    </div>
                  </div>

                  {/* Text Area */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200">Resume Content</label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume content here..."
                      className="w-full h-64 p-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Analyze Button */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={isLoading || !resumeText.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && analysisData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profile Section */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-700/50">
                  <CardHeader>
                    <CardTitle className="text-2xl">{analysisData.name}</CardTitle>
                    <CardDescription>
                      {analysisData.education} • {analysisData.university} ({analysisData.graduation_year})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricBox label="Predicted Role" value={analysisData.career_role} />
                      <MetricBox label="Country" value={analysisData.country} />
                      <MetricBox label="Stress Level" value={analysisData.stress_level} />
                      <MetricBox label="Education" value={analysisData.education} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Dashboard Metrics */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ScoreCard
                    title="Career Prediction"
                    score={analysisData.career_prediction_score}
                    icon={<Target className="w-5 h-5" />}
                    color="from-blue-500 to-cyan-500"
                  />
                  <ScoreCard
                    title="Job Stability"
                    score={analysisData.job_stability_score}
                    icon={<Briefcase className="w-5 h-5" />}
                    color="from-green-500 to-emerald-500"
                  />
                  <ScoreCard
                    title="Income Growth"
                    score={analysisData.income_growth_prediction}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="from-amber-500 to-orange-500"
                  />
                  <ScoreCard
                    title="AI Confidence"
                    score={analysisData.ai_confidence_score}
                    icon={<Brain className="w-5 h-5" />}
                    color="from-purple-500 to-pink-500"
                  />
                </div>
              </motion.div>

              {/* Career Match Score */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      Career Match Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Match Compatibility</span>
                          <span className="font-bold text-cyan-400">{analysisData.career_match_score}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisData.career_match_score}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-300">Future Salary Estimate</p>
                        <p className="text-2xl font-bold text-green-400">
                          ${analysisData.future_salary_estimate.toLocaleString()}<span className="text-lg text-slate-400">/year</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Insight */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      AI Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-200 leading-relaxed">{analysisData.ai_insight}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skills Section */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Skills */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Top 5 Strongest Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisData.top_5_strongest_skills.map((skill, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
                            <Code className="w-4 h-4 text-cyan-400" />
                            <span className="text-slate-200">{skill}</span>
                            <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                              {Math.floor((idx + 1) * 5 + 65)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skill Proficiency */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Overall Proficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="2" />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            strokeDasharray="282.7"
                            initial={{ strokeDashoffset: 282.7 }}
                            animate={{
                              strokeDashoffset: 282.7 - (282.7 * analysisData.skill_proficiency_estimate) / 100,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06B6D4" />
                              <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-cyan-400">
                            {analysisData.skill_proficiency_estimate}%
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mt-4">Overall Proficiency</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Framework Strength */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-400" />
                      Framework & Technology Strength
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysisData.framework_strength).map(([tech, level]) => (
                        <FrameworkBar key={tech} name={tech} level={level} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learn & Certifications */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        Skills to Learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.skills_to_learn.map((skill, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <span className="inline-block w-1 h-1 mt-2 bg-purple-400 rounded-full flex-shrink-0" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        Recommended Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.recommended_certifications.map((cert, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <span className="inline-block w-1 h-1 mt-2 bg-amber-400 rounded-full flex-shrink-0" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Recommended Projects */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-400" />
                      Recommended Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisData.recommended_projects.map((project, idx) => (
                        <motion.div
                          key={idx}
                          className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <p className="text-slate-200 text-sm">{project}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Test Plan */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      Assessment & Test Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(analysisData.test_plan).map(([phase, description], idx) => (
                        <motion.div
                          key={phase}
                          className="p-4 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700/50 rounded-lg"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <div className="text-cyan-400 font-semibold mb-2 capitalize">{phase.replace("_", " ")}</div>
                          <p className="text-slate-300 text-sm">{description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
}

function MetricBox({ label, value }: MetricBoxProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-cyan-300">{value}</p>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}

function ScoreCard({ title, score, icon, color }: ScoreCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm font-medium">{title}</span>
          <div className={`p-2 bg-gradient-to-br ${color} text-white rounded-lg`}>{icon}</div>
        </div>
        <motion.div
          className="text-3xl font-bold text-cyan-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {score}%
        </motion.div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
          <motion.div
            className={`bg-gradient-to-r ${color} h-full`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FrameworkBarProps {
  name: string;
  level: number;
}

function FrameworkBar({ name, level }: FrameworkBarProps) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-slate-300">{name}</span>
        <span className="text-sm font-semibold text-cyan-400">{level}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
