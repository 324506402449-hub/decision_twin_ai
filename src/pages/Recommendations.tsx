import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, ArrowRight, Rocket, BookOpen, Zap, Clock, Loader2, Sparkles, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const recommendations = [
  {
    title: "Switch to Data Science",
    career: "Data Science",
    explanation: "Based on current market trends, switching to Data Science has a 72% higher growth potential compared to your current path.",
    confidence: 92,
    impact: "High",
    category: "Career",
  },
  {
    title: "Upskill in Machine Learning",
    career: "Machine Learning",
    explanation: "ML skills are in top 3 demand across all tech sectors. Adding ML to your skillset increases earning potential by 35%.",
    confidence: 88,
    impact: "High",
    category: "Skills",
  },
  {
    title: "Pursue Cloud Certifications",
    career: "Cloud Engineering",
    explanation: "AWS/Azure certifications boost job stability score by 24% and open doors to high-growth cloud infrastructure roles.",
    confidence: 81,
    impact: "Medium",
    category: "Skills",
  },
];

interface SkillItem {
  name: string;
  demand_score: number;
  avg_salary?: number;
  avg_hourly?: number;
  growth: string;
  category: string;
}

interface DemandingSkillsData {
  full_time_skills: SkillItem[];
  part_time_skills: SkillItem[];
  prediction_summary: string;
}

const STORAGE_KEY = "decisiontwin_career_progress";

const CATEGORY_COLORS: Record<string, string> = {
  AI: "text-teal-400 bg-teal-400/10",
  ML: "text-blue-400 bg-blue-400/10",
  Cloud: "text-sky-400 bg-sky-400/10",
  Dev: "text-green-400 bg-green-400/10",
  Data: "text-purple-400 bg-purple-400/10",
  Security: "text-red-400 bg-red-400/10",
  Design: "text-pink-400 bg-pink-400/10",
  Content: "text-amber-400 bg-amber-400/10",
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [activeCareer, setActiveCareer] = useState<string | null>(null);
  const [skillsData, setSkillsData] = useState<DemandingSkillsData | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsTab, setSkillsTab] = useState<"fulltime" | "parttime">("fulltime");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.career) setActiveCareer(parsed.career);
      }
    } catch {  }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("http://localhost:8001/demanding-skills");
        if (res.ok) {
          const data: DemandingSkillsData = await res.json();
          if (!cancelled) setSkillsData(data);
        }
      } catch {  }
      if (!cancelled) setSkillsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSwitchCareer = useCallback(
    (career: string) => {
      localStorage.setItem("decisiontwin_selected_career", career);

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : null;
        if (!existing || existing.career !== career) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ career, completedIds: [] }),
          );
        }
      } catch {  }
      setActiveCareer(career);
      navigate("/dashboard/career-phase");
    },
    [navigate],
  );

  const handleContinueCourse = useCallback(() => {
    navigate("/dashboard/career-phase");
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI Recommendations</h1>
        <p className="text-sm text-muted-foreground">Personalized suggestions based on your profile and market data.</p>
      </div>
      <div className="space-y-4">
        {recommendations.map((r, i) => {
          const isActiveCareer = activeCareer === r.career && r.career !== "";
          const hasCareer = r.career !== "";

          return (
            <motion.div
              key={i}
              className="glass-card-hover p-6 group cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:glow-teal transition-all">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold">{r.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.impact === 'High' ? 'bg-neon-teal/10 text-neon-teal' : 'bg-neon-purple/10 text-neon-purple'}`}>
                      {r.impact} Impact
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{r.explanation}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.confidence}%` }} />
                      </div>
                      <span className="text-xs text-primary font-medium">{r.confidence}%</span>
                    </div>
                    {hasCareer && (
                      isActiveCareer ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7 gap-1.5"
                          onClick={handleContinueCourse}
                        >
                          <BookOpen size={13} /> Continue Course
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="text-xs h-7 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleSwitchCareer(r.career)}
                        >
                          <Rocket size={13} /> Switch to Career
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          );
        })}
        {skillsData && (
          <motion.div
            className="glass-card-hover p-6 group cursor-default"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: recommendations.length * 0.1 }}
          >
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:glow-teal transition-all">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold">AI-Predicted Top Skills</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">AI Prediction</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neon-teal/10 text-neon-teal">High Impact</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{skillsData.prediction_summary}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skillsData.full_time_skills.slice(0, 3).map((s) => {
                    const cc = CATEGORY_COLORS[s.category] || "text-gray-400 bg-gray-400/10";
                    return (
                      <span key={s.name} className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${cc}`}>
                        {s.name} — {s.demand_score}% demand
                      </span>
                    );
                  })}
                  {skillsData.part_time_skills.slice(0, 2).map((s) => {
                    const cc = CATEGORY_COLORS[s.category] || "text-gray-400 bg-gray-400/10";
                    return (
                      <span key={s.name} className={`text-[11px] px-2.5 py-1 rounded-full font-medium border border-dashed border-white/10 ${cc}`}>
                        {s.name} — ${s.avg_hourly}/hr
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Top demand:</span>
                    <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${skillsData.full_time_skills[0]?.demand_score ?? 0}%` }} />
                    </div>
                    <span className="text-xs text-purple-400 font-medium">{skillsData.full_time_skills[0]?.demand_score ?? 0}%</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>
          </motion.div>
        )}
        {skillsLoading && (
          <motion.div
            className="glass-card-hover p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: recommendations.length * 0.1 }}
          >
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading AI skill predictions…</span>
            </div>
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Skill Demand Predictions</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini AI — real-time market analysis</p>
          </div>
        </div>

        {skillsLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Analyzing current skill demand trends...</span>
          </div>
        ) : skillsData ? (
          <>
            <p className="text-sm text-muted-foreground bg-white/[0.03] rounded-lg p-3 border border-border/30">
              {skillsData.prediction_summary}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={skillsTab === "fulltime" ? "default" : "outline"}
                className="text-xs h-8 gap-1.5"
                onClick={() => setSkillsTab("fulltime")}
              >
                <Zap size={13} /> Full-Time Demanding Skills
              </Button>
              <Button
                size="sm"
                variant={skillsTab === "parttime" ? "default" : "outline"}
                className="text-xs h-8 gap-1.5"
                onClick={() => setSkillsTab("parttime")}
              >
                <Clock size={13} /> Part-Time / Freelance Skills
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(skillsTab === "fulltime" ? skillsData.full_time_skills : skillsData.part_time_skills).map(
                (skill, idx) => {
                  const catColor = CATEGORY_COLORS[skill.category] || "text-gray-400 bg-gray-400/10";
                  return (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="glass-card p-4 space-y-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{skill.name}</h4>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${catColor}`}>
                          {skill.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Demand</span>
                          <span className="font-medium text-teal-400">{skill.demand_score}%</span>
                        </div>
                        <Progress value={skill.demand_score} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign size={11} />
                          {skill.avg_salary
                            ? `$${(skill.avg_salary / 1000).toFixed(0)}K/yr`
                            : `$${skill.avg_hourly}/hr`}
                        </span>
                        <span className="flex items-center gap-1 text-green-400 font-medium">
                          <BarChart3 size={11} /> {skill.growth}
                        </span>
                      </div>
                    </motion.div>
                  );
                },
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Unable to load skill predictions. Make sure the backend server is running.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Recommendations;
