import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, ArrowRight, TrendingUp, Heart, Shield, Smile, Loader2, Sparkles, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";

const API_BASE = "http://localhost:8001";

interface CareerResult {
  name: string;
  five_year_salary: number;
  stability: number;
  stress: "Low" | "Medium" | "High";
  salary_growth: number[];
}

interface SimulationResult {
  career_a: CareerResult;
  career_b: CareerResult;
}

const stressToScore = (s: string) => (s === "Low" ? 30 : s === "Medium" ? 60 : 85);

const Simulator = () => {
  const [hasResults, setHasResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [careerA, setCareerA] = useState("");
  const [careerB, setCareerB] = useState("");
  const [education, setEducation] = useState("Bachelor's Degree");
  const [location, setLocation] = useState("San Francisco");
  const [riskTolerance, setRiskTolerance] = useState(5);

  const [careers, setCareers] = useState<string[]>([]);
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingCareers(true);
      try {
        const [c, e, l] = await Promise.all([
          fetch(`${API_BASE}/career-options`).then((r) => r.json()),
          fetch(`${API_BASE}/education-levels`).then((r) => r.json()),
          fetch(`${API_BASE}/locations`).then((r) => r.json()),
        ]);
        setCareers(c.careers);
        setEducationLevels(e.education_levels);
        setLocations(l.locations);
        if (c.careers.length >= 2) {
          setCareerA(c.careers[0]);
          setCareerB(c.careers[1]);
        }
      } catch {
        const fallback = [
          "Software Engineer", "Full-Stack Developer", "Frontend Developer",
          "Backend Developer", "Mobile App Developer", "Data Scientist",
          "AI Engineer", "Machine Learning Engineer", "AI/ML Engineer",
          "Data Analyst", "Deep Learning Engineer", "Cloud Engineer",
          "DevOps Engineer", "Site Reliability Engineer (SRE)",
          "Cybersecurity Engineer", "Ethical Hacker / Penetration Tester",
          "Embedded Systems Engineer", "VLSI Engineer", "Robotics Engineer",
          "Blockchain Developer", "AR/VR Engineer",
        ];
        setCareers(fallback);
        setCareerA(fallback[0]);
        setCareerB(fallback[1]);
      } finally {
        setLoadingCareers(false);
      }
    };
    load();
  }, []);

  const runSimulation = async () => {
    if (!careerA || !careerB) return;
    if (careerA === careerB) { setError("Please select two different careers."); return; }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const resp = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          career_option_a: careerA,
          career_option_b: careerB,
          education_level: education,
          location,
          risk_tolerance: riskTolerance / 10,
        }),
      });
      if (!resp.ok) throw new Error("Simulation request failed");
      const data: SimulationResult = await resp.json();
      setResult(data);
      setHasResults(true);
    } catch (err) {
      console.error(err);
      setError("Simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const salaryChartData = result
    ? result.career_a.salary_growth.map((v, i) => ({
        year: `Y${i + 1}`,
        a: Math.round(v / 1000),
        b: Math.round(result.career_b.salary_growth[i] / 1000),
      }))
    : [];

  const metricsData = result
    ? [
        { name: "Salary Growth", a: Math.round((result.career_a.five_year_salary / result.career_a.salary_growth[0]) * 100 - 100), b: Math.round((result.career_b.five_year_salary / result.career_b.salary_growth[0]) * 100 - 100) },
        { name: "Job Stability", a: result.career_a.stability, b: result.career_b.stability },
        { name: "Stress Level", a: stressToScore(result.career_a.stress), b: stressToScore(result.career_b.stress) },
      ]
    : [];

  const radioClass = "h-4 w-4 accent-primary cursor-pointer";
  const labelClass = "text-sm text-foreground cursor-pointer ml-2";

  const saveScenario = async () => {
    if (!result) return;
    setSaving(true);
    setSaved(false);
    try {
      const salaryGrowthA = Math.round((result.career_a.five_year_salary / result.career_a.salary_growth[0]) * 100 - 100);
      const salaryGrowthB = Math.round((result.career_b.five_year_salary / result.career_b.salary_growth[0]) * 100 - 100);
      const resp = await fetch(`${API_BASE}/save-scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          career_a: result.career_a.name,
          career_b: result.career_b.name,
          education_level: education,
          location_preference: location,
          salary_graph_a: result.career_a.salary_growth,
          salary_graph_b: result.career_b.salary_growth,
          salary_growth_percent_a: salaryGrowthA,
          salary_growth_percent_b: salaryGrowthB,
          stability_a: result.career_a.stability,
          stability_b: result.career_b.stability,
          stress_a: stressToScore(result.career_a.stress),
          stress_b: stressToScore(result.career_b.stress),
        }),
      });
      if (!resp.ok) throw new Error("Save failed");
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 rounded-lg bg-[#0a0a0a] border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";
  const optionClass = "bg-[#0a0a0a] text-white";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Decision Simulator</h1>
        <p className="text-sm text-muted-foreground">Compare two career paths and see AI-predicted outcomes.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div className="lg:col-span-2 glass-card p-6 space-y-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI Simulation Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Career Option A</label>
              <select className={inputClass} value={careerA} onChange={(e) => setCareerA(e.target.value)}>
                {careers.map((c) => (
                  <option key={c} className={optionClass}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Career Option B</label>
              <select className={inputClass} value={careerB} onChange={(e) => setCareerB(e.target.value)}>
                {careers.map((c) => (
                  <option key={c} className={optionClass}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Education Level</label>
              <select className={inputClass} value={education} onChange={(e) => setEducation(e.target.value)}>
                {(educationLevels.length ? educationLevels : ["Bachelor's Degree", "Master's Degree", "PhD", "Self-taught"]).map((e) => (
                  <option key={e} className={optionClass}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Location Preference</label>
              <select className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)}>
                {(locations.length ? locations : [
                  "San Francisco", "New York", "Seattle", "Austin", "Los Angeles", "Chicago", "Boston", "Denver",
                  "Washington D.C.", "Toronto", "Vancouver", "London", "Berlin", "Amsterdam", "Paris", "Dublin",
                  "Zurich", "Singapore", "Tokyo", "Sydney", "Melbourne", "Dubai", "Bangalore", "Hyderabad",
                  "Mumbai", "Chennai", "Pune", "Delhi NCR", "Tel Aviv", "Seoul", "Remote",
                ]).map((l) => (
                  <option key={l} className={optionClass}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Risk Tolerance</label>
              <input type="range" min="1" max="10" value={riskTolerance} onChange={(e) => setRiskTolerance(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Conservative</span><span>Aggressive</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button className="w-full bg-primary text-primary-foreground glow-teal" onClick={runSimulation} disabled={loading || loadingCareers}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Run Simulation <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </motion.div>
        <motion.div className="lg:col-span-3 space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {!hasResults ? (
            <div className="glass-card p-16 text-center">
              <Cpu className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Configure your parameters and run a simulation to see predicted outcomes.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {result && [
                  { label: result.career_a.name, salary: `$${Math.round(result.career_a.five_year_salary / 1000)}K`, stability: `${result.career_a.stability}%`, stress: result.career_a.stress, icon: TrendingUp },
                  { label: result.career_b.name, salary: `$${Math.round(result.career_b.five_year_salary / 1000)}K`, stability: `${result.career_b.stability}%`, stress: result.career_b.stress, icon: TrendingUp },
                ].map((c, i) => (
                  <div key={i} className="glass-card p-5">
                    <h4 className="text-sm font-semibold mb-3">{c.label}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">5Y Salary</span><span className="font-medium">{c.salary}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Stability</span><span className="font-medium">{c.stability}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Stress</span><span className="font-medium">{c.stress}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">Predicted Salary Growth (K$)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={salaryChartData}>
                    <defs>
                      <linearGradient id="simGradA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(174,72%,56%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(174,72%,56%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="simGradB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(265,60%,55%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(265,60%,55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="a" stroke="hsl(174,72%,56%)" fill="url(#simGradA)" strokeWidth={2} name={result?.career_a.name ?? careerA} />
                    <Area type="monotone" dataKey="b" stroke="hsl(265,60%,55%)" fill="url(#simGradB)" strokeWidth={2} name={result?.career_b.name ?? careerB} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">Metric Comparison</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metricsData} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="a" fill="hsl(174,72%,56%)" radius={[0, 4, 4, 0]} name={result?.career_a.name ?? careerA} />
                    <Bar dataKey="b" fill="hsl(265,60%,55%)" radius={[0, 4, 4, 0]} name={result?.career_b.name ?? careerB} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground glow-teal"
                onClick={saveScenario}
                disabled={saving || saved}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : saved ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving..." : saved ? "Scenario Saved" : "Save Scenario"}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Simulator;
