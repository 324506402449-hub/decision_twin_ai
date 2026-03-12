import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Globe, TrendingUp, Users, Activity, Zap, GraduationCap,
  DollarSign, ChevronRight, MapPin, Cpu, BarChart3,
} from "lucide-react";
export interface UniversityData {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface CareerMetrics {
  globalStudentsAnalyzed: string;
  activeSimulations: string;
  careerDemandIndex: number;
  growthIndex: string;
  avgSalary: string;
  demand: string;
  growthRate: string;
}

export interface CareerAnalytics {
  career: string;
  topUniversities: UniversityData[];
  metrics: CareerMetrics;
  topSkills: string[];
  topCountries: { name: string; lat: number; lng: number }[];
  salaryGrowth: { year: number; salary: number }[];
  studentDemandTrend: { year: number; students: number }[];
}
const defaults: CareerAnalytics = {
  career: "Software Engineer",
  topUniversities: [
    { name: "MIT", country: "USA", lat: 42.36, lng: -71.09 },
    { name: "Stanford", country: "USA", lat: 37.42, lng: -122.16 },
    { name: "Carnegie Mellon", country: "USA", lat: 40.44, lng: -79.94 },
    { name: "ETH Zurich", country: "Switzerland", lat: 47.37, lng: 8.54 },
  ],
  metrics: {
    globalStudentsAnalyzed: "2.8M",
    activeSimulations: "18K",
    careerDemandIndex: 85,
    growthIndex: "85%",
    avgSalary: "$94K",
    demand: "High",
    growthRate: "18%",
  },
  topSkills: ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "Cloud"],
  topCountries: [
    { name: "USA", lat: 37.09, lng: -95.71 },
    { name: "Germany", lat: 51.16, lng: 10.45 },
    { name: "Canada", lat: 56.13, lng: -106.34 },
    { name: "UK", lat: 55.37, lng: -3.43 },
    { name: "Singapore", lat: 1.35, lng: 103.81 },
  ],
  salaryGrowth: [
    { year: 2021, salary: 72 }, { year: 2022, salary: 80 },
    { year: 2023, salary: 88 }, { year: 2024, salary: 94 }, { year: 2025, salary: 102 },
  ],
  studentDemandTrend: [
    { year: 2021, students: 420 }, { year: 2022, students: 510 },
    { year: 2023, students: 590 }, { year: 2024, students: 680 }, { year: 2025, students: 780 },
  ],
};

const tooltipStyle = {
  background: "rgba(5,5,15,0.95)",
  border: "1px solid rgba(59,130,246,0.2)",
  borderRadius: 10,
  fontSize: 11,
  backdropFilter: "blur(12px)",
  color: "#94a3b8",
};
export function updateMetrics(data: CareerAnalytics | null): CareerMetrics {
  return data?.metrics || defaults.metrics;
}

export function updateTopSkills(data: CareerAnalytics | null): string[] {
  return data?.topSkills || defaults.topSkills;
}

export function updateUniversityList(data: CareerAnalytics | null): UniversityData[] {
  return data?.topUniversities || defaults.topUniversities;
}

export function updateCharts(data: CareerAnalytics | null) {
  return {
    salaryGrowth: data?.salaryGrowth || defaults.salaryGrowth,
    studentDemandTrend: data?.studentDemandTrend || defaults.studentDemandTrend,
  };
}
export const LeftCards = ({ data }: { data: CareerAnalytics | null }) => {
  const m = updateMetrics(data);
  const skills = updateTopSkills(data);
  const charts = updateCharts(data);

  const skillBars = skills.slice(0, 5).map((s, i) => ({
    name: s.length > 12 ? s.slice(0, 11) + "…" : s,
    value: 95 - i * 12,
  }));

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div className="glass-card p-4 border border-white/[0.04] hover:border-blue-500/20 transition-colors" layout>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-muted-foreground">Global Students Analyzed</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={m.globalStudentsAnalyzed}
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {m.globalStudentsAnalyzed}
          </motion.p>
        </AnimatePresence>
        <p className="text-[10px] text-blue-400 mt-1">↑ 12% from last year</p>
      </motion.div>
      <motion.div className="glass-card p-4 border border-white/[0.04] hover:border-purple-500/20 transition-colors" layout>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-muted-foreground">Active Simulations</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={m.activeSimulations}
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {m.activeSimulations}
          </motion.p>
        </AnimatePresence>
        <p className="text-[10px] text-purple-400 mt-1">↑ 8% this month</p>
      </motion.div>
      <motion.div className="glass-card p-4 border border-white/[0.04] hover:border-yellow-500/20 transition-colors" layout>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-muted-foreground">Career Demand Index</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={m.careerDemandIndex}
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {m.careerDemandIndex}
          </motion.p>
        </AnimatePresence>
        <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(m.careerDemandIndex, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>
      <motion.div className="glass-card p-4 border border-white/[0.04] hover:border-blue-500/20 transition-colors" layout>
        <div className="flex items-center gap-1.5 mb-3">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-xs text-muted-foreground">Top Skills</h4>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={skills.join(",")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={skillBars} layout="vertical">
                <XAxis type="number" hide domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#3b82f6" barSize={14}>
                  {skillBars.map((_, i) => (
                    <motion.rect key={i} fill={i % 2 === 0 ? "#3b82f6" : "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-1 mt-1">
              {skills.slice(0, 5).map((s, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/10">
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <motion.div className="glass-card p-4 border border-white/[0.04] hover:border-cyan-500/20 transition-colors" layout>
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <h4 className="text-xs text-muted-foreground">Global Salary Growth (K)</h4>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={charts.salaryGrowth.map((s) => s.salary).join(",")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={charts.salaryGrowth}>
                <XAxis dataKey="year" tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="salary" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5, fill: "#60a5fa" }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
export const RightPanel = ({
  data,
  selectedCourse,
  selectedCountry,
}: {
  data: CareerAnalytics | null;
  selectedCourse: string;
  selectedCountry: string;
}) => {
  const d = data || defaults;
  const m = d.metrics;
  const label = selectedCourse || d.career || "Global Intelligence";
  const subtitle = selectedCountry || "Worldwide";
  const universities = updateUniversityList(data);
  const charts = updateCharts(data);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedCourse}-${selectedCountry}`}
          className="glass-card p-5 border border-white/[0.04]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{label}</h3>
              <p className="text-[10px] text-muted-foreground">{subtitle} — Market Intelligence</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
              <p className="text-[10px] text-muted-foreground mb-1">Growth Index</p>
              <p className="text-lg font-bold text-blue-400">{m.growthIndex}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
              <p className="text-[10px] text-muted-foreground mb-1">Avg Salary</p>
              <p className="text-lg font-bold">{m.avgSalary}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
              <p className="text-[10px] text-muted-foreground mb-1">Demand</p>
              <p className="text-sm font-semibold text-cyan-400">{m.demand}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
              <p className="text-[10px] text-muted-foreground mb-1">Growth Rate</p>
              <p className="text-sm font-semibold text-green-400">{m.growthRate}</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <h4 className="text-xs font-medium">Top Countries</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.topCountries.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-[10px] rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <h4 className="text-xs font-medium">Top Universities</h4>
            </div>
            <div className="space-y-1.5">
              {universities.slice(0, 6).map((uni, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    <span>{uni.name}</span>
                  </div>
                  <span className="text-[9px] text-white/30">{uni.country}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <h4 className="text-xs font-medium">Salary Growth</h4>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={charts.salaryGrowth}>
                <defs>
                  <linearGradient id="rightSalaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="salary" stroke="#3b82f6" fill="url(#rightSalaryGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-medium">Student Demand Trend</h4>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={charts.studentDemandTrend}>
                <defs>
                  <linearGradient id="rightStudentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="students" stroke="#06b6d4" fill="url(#rightStudentGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
