import { motion } from "framer-motion";
import { BookOpen, MapPin, ChevronDown, Loader2 } from "lucide-react";

const COURSES = [
  "AI/ML Engineer",
  "Data Scientist",
  "Software Engineer",
  "Cybersecurity",
  "Cloud Engineer",
  "Robotics Engineer",
  "VLSI Engineer",
  "Blockchain Developer",
  "Full Stack Development",
  "Embedded Systems",
];

const COUNTRIES = [
  "United States",
  "Canada",
  "Germany",
  "United Kingdom",
  "Singapore",
  "India",
  "Australia",
  "Japan",
  "South Korea",
  "Netherlands",
];

interface CourseSelectorProps {
  selectedCourse: string;
  selectedCountry: string;
  onCourseChange: (course: string) => void;
  onCountryChange: (country: string) => void;
  loading: boolean;
}

const CourseSelector = ({
  selectedCourse,
  selectedCountry,
  onCourseChange,
  onCountryChange,
  loading,
}: CourseSelectorProps) => {
  return (
    <motion.div
      className="glass-card p-4 border border-white/[0.04]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="relative flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-0.5 block">
              Career / Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => onCourseChange(e.target.value)}
              disabled={loading}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pr-8 text-sm text-white/90 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.06]"
              style={{ backgroundImage: "none" }}
            >
              <option value="" className="bg-[#0a0a0a] text-white/60">
                Choose career path...
              </option>
              {COURSES.map((c) => (
                <option key={c} value={c} className="bg-[#0a0a0a] text-white">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 bottom-2.5 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div className="relative flex-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-0.5 block">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              disabled={loading}
              className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pr-8 text-sm text-white/90 outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.06]"
              style={{ backgroundImage: "none" }}
            >
              <option value="" className="bg-[#0a0a0a] text-white/60">
                Select country...
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-[#0a0a0a] text-white">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 bottom-2.5 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-xs text-blue-400 shrink-0"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AI analyzing...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseSelector;
