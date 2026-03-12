import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from "recharts";
import { TrendingUp, Loader2, Zap } from "lucide-react";

const API_BASE = "http://localhost:8001";

interface CareerDemand {
  name: string;
  demand: number;
}

interface WeekData {
  week: number;
  careers: CareerDemand[];
}

const COLORS = [
  "#1E3A8A", "#2563EB", "#3B82F6", "#1D4ED8", "#60A5FA",
  "#1E40AF", "#2563EB", "#1E3A8A", "#3B82F6", "#1D4ED8",
];

const BAR_COLORS = [
  "#1E3A8A", "#2563EB", "#3B82F6", "#1D4ED8", "#60A5FA",
  "#1E40AF", "#2563EB", "#1E3A8A", "#3B82F6", "#1D4ED8",
  "#60A5FA", "#1E40AF",
];

const worldSkillDemand = [
  { career: "Data Science", demand: 94, topSkill: 88 },
  { career: "Software Eng", demand: 91, topSkill: 85 },
  { career: "AI/ML", demand: 88, topSkill: 82 },
  { career: "Cybersecurity", demand: 82, topSkill: 78 },
  { career: "Cloud Eng", demand: 79, topSkill: 74 },
  { career: "Full Stack", demand: 77, topSkill: 72 },
  { career: "DevOps", demand: 74, topSkill: 69 },
  { career: "Product Mgmt", demand: 72, topSkill: 68 },
  { career: "Blockchain", demand: 69, topSkill: 63 },
  { career: "Robotics", demand: 66, topSkill: 60 },
  { career: "UX/UI Design", demand: 64, topSkill: 58 },
  { career: "Mobile Dev", demand: 61, topSkill: 55 },
];

const Trends = () => {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/career-demand-trends`);
        const data = await resp.json();
        if (data.weeks?.length) setWeeks(data.weeks);
      } catch (err) {
        console.error("Failed to load demand trends", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sampleWeeks = [0, 3, 7, 11, 15, 19, 23];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const careerNames = weeks.length ? weeks[0].careers.map((c) => c.name) : [];

  const trendData = sampleWeeks
    .filter((i) => i < weeks.length)
    .map((i, mi) => {
      const row: Record<string, any> = { month: monthLabels[mi] };
      weeks[i].careers.forEach((c) => {
        row[c.name] = c.demand;
      });
      return row;
    });

  const topCareers = weeks.length ? weeks[weeks.length - 1].careers.slice(0, 10) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Career Trends</h1>
        <p className="text-sm text-muted-foreground">Real-time market trends and career demand data powered by AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium mb-4 text-[#E5E7EB]">Career Demand Trends (2026)</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mb-3" />
              <p className="text-sm text-muted-foreground">Loading demand trends from AI...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#E5E7EB', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickLine={false} />
                <YAxis tick={{ fill: '#E5E7EB', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickLine={false} domain={[30, 100]} />
                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid #1E3A8A', borderRadius: 8, color: '#E5E7EB' }} />
                {careerNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[i % COLORS.length], stroke: '#0a0f1a', strokeWidth: 1 }} activeDot={{ r: 5 }} name={name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-medium mb-1 text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            World Skill Demand by Career
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#E5E7EB]">
              <div className="w-3 h-2 rounded-sm" style={{ background: '#1E3A8A' }} /> Demand Index
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#E5E7EB]">
              <div className="w-4 h-0.5 rounded" style={{ background: '#60A5FA' }} /> Most Popular Skill
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={worldSkillDemand} barCategoryGap="20%">
              <defs>
                {worldSkillDemand.map((_, i) => (
                  <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BAR_COLORS[i % BAR_COLORS.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor="rgba(30,58,138,0.3)" stopOpacity={0.3} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="career" tick={{ fill: '#E5E7EB', fontSize: 10 }} axisLine={{ stroke: '#374151' }} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#E5E7EB', fontSize: 10 }} axisLine={{ stroke: '#374151' }} tickLine={false} domain={[0, 100]} label={{ value: 'Demand Scale', angle: -90, position: 'insideLeft', fill: '#E5E7EB', fontSize: 10, dx: -5 }} />
              <Tooltip
                contentStyle={{ background: '#0a0f1a', border: '1px solid #1E3A8A', borderRadius: 8, fontSize: 12, color: '#E5E7EB' }}
                formatter={(value: number, name: string) => [`${value}%`, name === 'demand' ? 'Demand Index' : 'Top Skill Score']}
                cursor={{ fill: 'rgba(30,58,138,0.08)' }}
              />
              <Bar dataKey="demand" radius={[6, 6, 0, 0]} barSize={22} animationDuration={1200} animationBegin={200}>
                {worldSkillDemand.map((_, i) => (
                  <Cell key={i} fill={`url(#barGrad-${i})`} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="topSkill" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 4, fill: '#60A5FA', stroke: '#0a0f1a', strokeWidth: 1 }} activeDot={{ r: 6, fill: '#3B82F6' }} name="topSkill" />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#E5E7EB] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#3B82F6]" /> Most In-Demand Skills
        </h3>
        {topCareers.map((c, i) => (
          <motion.div key={c.name} className="glass-card p-4 flex items-center gap-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#E5E7EB]" style={{ background: 'rgba(30,58,138,0.3)' }}>
              #{i + 1}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[#E5E7EB]">{c.name}</span>
              <div className="w-full h-1.5 rounded-full mt-2" style={{ background: '#1F2937' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #1E3A8A, #3B82F6)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.demand}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-[#3B82F6]">{c.demand}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Trends;
