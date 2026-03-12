import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Clock, TrendingUp, ChevronDown, MapPin, GraduationCap, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";

const API_BASE = "http://localhost:8001";

interface ScenarioSummary {
  id: number;
  career_a: string;
  career_b: string;
  education_level: string;
  location_preference: string;
  created_at: string;
}

interface ScenarioDetail {
  id: number;
  career_a: string;
  career_b: string;
  education_level: string;
  location_preference: string;
  salary_graph_a: number[];
  salary_graph_b: number[];
  salary_growth_percent_a: number;
  salary_growth_percent_b: number;
  stability_a: number;
  stability_b: number;
  stress_a: number;
  stress_b: number;
  created_at: string;
}

const Scenarios = () => {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, ScenarioDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/scenarios`);
      const data = await resp.json();
      setScenarios(data.scenarios);
    } catch {
      console.error("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!details[id]) {
      setLoadingDetail(id);
      try {
        const resp = await fetch(`${API_BASE}/scenario/${id}`);
        const data: ScenarioDetail = await resp.json();
        setDetails((prev) => ({ ...prev, [id]: data }));
      } catch {
        console.error("Failed to load scenario detail");
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const deleteScenario = async (id: number) => {
    try {
      await fetch(`${API_BASE}/scenario/${id}`, { method: "DELETE" });
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      console.error("Failed to delete scenario");
    }
  };

  const buildSalaryChart = (d: ScenarioDetail) =>
    d.salary_graph_a.map((v, i) => ({
      year: `Y${i + 1}`,
      a: Math.round(v / 1000),
      b: Math.round(d.salary_graph_b[i] / 1000),
    }));

  const buildMetricsData = (d: ScenarioDetail) => [
    { name: "Salary Growth %", a: d.salary_growth_percent_a, b: d.salary_growth_percent_b },
    { name: "Job Stability %", a: d.stability_a, b: d.stability_b },
    { name: "Stress Level %", a: d.stress_a, b: d.stress_b },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">My Scenarios</h1>
        <p className="text-sm text-muted-foreground">View and manage your saved decision simulations.</p>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading scenarios...</p>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No saved scenarios yet. Run a simulation and save it!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s, i) => {
            const isExpanded = expandedId === s.id;
            const detail = details[s.id];
            const isLoadingThis = loadingDetail === s.id;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div
                  className="glass-card-hover p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(s.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        {s.career_a} vs {s.career_b}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> {s.education_level}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.location_preference}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.created_at}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScenario(s.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {isLoadingThis ? (
                        <div className="glass-card mt-1 p-10 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                        </div>
                      ) : detail ? (
                        <div className="glass-card mt-1 p-6 space-y-6">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {[
                              {
                                name: detail.career_a,
                                growth: detail.salary_growth_percent_a,
                                stability: detail.stability_a,
                                stress: detail.stress_a,
                                color: "hsl(174,72%,56%)",
                              },
                              {
                                name: detail.career_b,
                                growth: detail.salary_growth_percent_b,
                                stability: detail.stability_b,
                                stress: detail.stress_b,
                                color: "hsl(265,60%,55%)",
                              },
                            ].map((c, ci) => (
                              <div key={ci} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                                <h4 className="text-sm font-semibold mb-3" style={{ color: c.color }}>
                                  {c.name}
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Salary Growth</span>
                                    <span className="font-medium">{c.growth}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stability</span>
                                    <span className="font-medium">{c.stability}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stress</span>
                                    <span className="font-medium">{c.stress}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
                            <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                              Predicted Salary Growth (K$)
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <AreaChart data={buildSalaryChart(detail)}>
                                <defs>
                                  <linearGradient id={`sgA-${detail.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(174,72%,56%)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(174,72%,56%)" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id={`sgB-${detail.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(265,60%,55%)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(265,60%,55%)" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="year" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                                <Area type="monotone" dataKey="a" stroke="hsl(174,72%,56%)" fill={`url(#sgA-${detail.id})`} strokeWidth={2} name={detail.career_a} />
                                <Area type="monotone" dataKey="b" stroke="hsl(265,60%,55%)" fill={`url(#sgB-${detail.id})`} strokeWidth={2} name={detail.career_b} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
                            <h3 className="text-sm font-medium mb-4 text-muted-foreground">Metric Comparison</h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={buildMetricsData(detail)} layout="vertical">
                                <XAxis type="number" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip contentStyle={{ background: "hsl(0,0%,7%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                                <Bar dataKey="a" fill="hsl(174,72%,56%)" radius={[0, 4, 4, 0]} name={detail.career_a} />
                                <Bar dataKey="b" fill="hsl(265,60%,55%)" radius={[0, 4, 4, 0]} name={detail.career_b} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Scenarios;
