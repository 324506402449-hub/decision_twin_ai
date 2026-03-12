import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, BookOpen, Clock } from "lucide-react";

const CAREER_OPTIONS = [
  "Software Engineering",
  "Full-Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile App Development",
  "Data Science",
  "AI Engineering",
  "Machine Learning Engineering",
  "AI/ML Engineering",
  "Data Analytics",
  "Deep Learning",
  "Cloud Engineering",
  "DevOps Engineering",
  "Site Reliability Engineering",
  "Cybersecurity",
  "Ethical Hacking / Penetration Testing",
  "Embedded Systems",
  "VLSI Engineering",
  "Robotics Engineering",
  "Blockchain Development",
  "AR/VR Engineering",
];

const FOCUS_MODES = [
  { value: "one_focus", label: "Focus on one career path" },
  { value: "two_alternating", label: "Alternate between two careers" },
  { value: "three_simultaneous", label: "Explore three careers simultaneously" },
];

const SCHEDULE_STYLES = [
  { value: "morning", label: "Morning Schedule (2h/day)" },
  { value: "evening", label: "Evening Schedule (2h/day)" },
  { value: "full_day", label: "Full Day Schedule (4h/day)" },
];

const NODE_COLORS: Record<string, string> = {
  root: "#14b8a6",
  career: "#3b82f6",
  skill: "#8b5cf6",
  subtopic: "#ec4899",
};

interface RoadmapData {
  mindmap: Record<string, string[]>;
  schedule: { day: string; date: string; topic: string; hours: string }[];
}

const LEAF_W = 150;
const LEAF_GAP = 20;
const SKILL_GAP = 40;
const CAREER_GAP = 80;
const LEVEL_Y = [0, 140, 300, 480]; // root, career, skill, subtopic

interface TreeItem {
  label: string;
  children: TreeItem[];
  width: number; // computed total width of this subtree
}

function measureTree(
  mindmap: Record<string, string[]>,
  careers: string[],
): TreeItem {
  const root: TreeItem = { label: "Career Decision", children: [], width: 0 };

  for (const career of careers) {
    const skills = mindmap[career] || [];
    const careerItem: TreeItem = { label: career, children: [], width: 0 };

    for (const skill of skills) {
      const subs = mindmap[skill] || [];
      const skillItem: TreeItem = { label: skill, children: [], width: 0 };

      if (subs.length === 0) {
        skillItem.width = LEAF_W;
      } else {
        for (const sub of subs) {
          skillItem.children.push({ label: sub, children: [], width: LEAF_W });
        }
        skillItem.width =
          skillItem.children.length * LEAF_W +
          (skillItem.children.length - 1) * LEAF_GAP;
      }

      careerItem.children.push(skillItem);
    }

    if (careerItem.children.length === 0) {
      careerItem.width = LEAF_W;
    } else {
      careerItem.width =
        careerItem.children.reduce((sum, c) => sum + c.width, 0) +
        (careerItem.children.length - 1) * SKILL_GAP;
    }

    root.children.push(careerItem);
  }

  root.width =
    root.children.reduce((sum, c) => sum + c.width, 0) +
    (root.children.length > 1
      ? (root.children.length - 1) * CAREER_GAP
      : 0);

  return root;
}

function buildFlowGraph(mindmap: Record<string, string[]>, careers: string[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const tree = measureTree(mindmap, careers);

  nodes.push({
    id: "root",
    data: {
      label: (
        <div className="flex items-center gap-1.5 font-bold text-sm whitespace-nowrap">
          <Sparkles size={14} /> Career Decision
        </div>
      ),
    },
    position: { x: 0, y: LEVEL_Y[0] },
    style: {
      background: "rgba(20, 184, 166, 0.15)",
      border: "2px solid #14b8a6",
      borderRadius: 12,
      padding: "10px 18px",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  let careerCursor = -tree.width / 2;

  tree.children.forEach((careerItem, ci) => {
    const careerId = `career-${ci}`;
    const cx = careerCursor + careerItem.width / 2;
    careerCursor += careerItem.width + CAREER_GAP;

    nodes.push({
      id: careerId,
      data: {
        label: (
          <div className="font-semibold text-xs text-center whitespace-nowrap">
            {careerItem.label}
          </div>
        ),
      },
      position: { x: cx, y: LEVEL_Y[1] },
      style: {
        background: "rgba(59, 130, 246, 0.15)",
        border: "2px solid #3b82f6",
        borderRadius: 10,
        padding: "8px 16px",
        color: "#fff",
        fontSize: 12,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    edges.push({
      id: `e-root-${careerId}`,
      source: "root",
      target: careerId,
      animated: true,
      style: { stroke: "#14b8a6", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#14b8a6" },
    });

    let skillCursor = cx - careerItem.width / 2;

    careerItem.children.forEach((skillItem, si) => {
      const skillId = `skill-${ci}-${si}`;
      const sx = skillCursor + skillItem.width / 2;
      skillCursor += skillItem.width + SKILL_GAP;

      nodes.push({
        id: skillId,
        data: {
          label: (
            <div className="text-[10px] text-center leading-tight whitespace-nowrap">
              {skillItem.label}
            </div>
          ),
        },
        position: { x: sx, y: LEVEL_Y[2] },
        style: {
          background: "rgba(139, 92, 246, 0.12)",
          border: "1.5px solid #8b5cf6",
          borderRadius: 8,
          padding: "6px 12px",
          color: "#e2e8f0",
          fontSize: 10,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      edges.push({
        id: `e-${careerId}-${skillId}`,
        source: careerId,
        target: skillId,
        style: { stroke: "#3b82f6", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
      });

      let subCursor = sx - skillItem.width / 2;

      skillItem.children.forEach((subItem, subi) => {
        const subId = `sub-${ci}-${si}-${subi}`;
        const subX = subCursor + LEAF_W / 2;
        subCursor += LEAF_W + LEAF_GAP;

        nodes.push({
          id: subId,
          data: {
            label: (
              <div className="text-[9px] text-center leading-tight">
                {subItem.label}
              </div>
            ),
          },
          position: { x: subX, y: LEVEL_Y[3] },
          style: {
            background: "rgba(236, 72, 153, 0.10)",
            border: "1px solid #ec4899",
            borderRadius: 6,
            padding: "5px 10px",
            color: "#cbd5e1",
            fontSize: 9,
          },
          targetPosition: Position.Top,
        });

        edges.push({
          id: `e-${skillId}-${subId}`,
          source: skillId,
          target: subId,
          style: { stroke: "#8b5cf6", strokeWidth: 1 },
        });
      });
    });
  });

  return { nodes, edges };
}

const MindMap = () => {
  const [primaryCareer, setPrimaryCareer] = useState("");
  const [secondaryCareer, setSecondaryCareer] = useState("");
  const [thirdCareer, setThirdCareer] = useState("");
  const [focusMode, setFocusMode] = useState("one_focus");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [scheduleStyle, setScheduleStyle] = useState("full_day");
  const [loading, setLoading] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [error, setError] = useState("");
  const [schedulePage, setSchedulePage] = useState(0);

  const ITEMS_PER_PAGE = 14;

  const handleGenerate = useCallback(async () => {
    if (!primaryCareer) {
      setError("Please select a primary career.");
      return;
    }
    if (focusMode === "two_alternating" && !secondaryCareer) {
      setError("Please select a secondary career for alternating mode.");
      return;
    }
    if (focusMode === "three_simultaneous" && (!secondaryCareer || !thirdCareer)) {
      setError("Please select all three careers for simultaneous mode.");
      return;
    }

    setError("");
    setLoading(true);
    setSchedulePage(0);

    try {
      const res = await fetch("http://localhost:8001/generate-career-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_career: primaryCareer,
          secondary_career: secondaryCareer,
          third_career: thirdCareer,
          focus_mode: focusMode,
          start_date: startDate,
          end_date: endDate,
          schedule_style: scheduleStyle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: RoadmapData = await res.json();
      setRoadmapData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate roadmap";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [primaryCareer, secondaryCareer, thirdCareer, focusMode, startDate, endDate, scheduleStyle]);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!roadmapData) return { flowNodes: [] as Node[], flowEdges: [] as Edge[] };

    const careers: string[] = [primaryCareer];
    if (focusMode !== "one_focus" && secondaryCareer) careers.push(secondaryCareer);
    if (focusMode === "three_simultaneous" && thirdCareer) careers.push(thirdCareer);

    const { nodes, edges } = buildFlowGraph(roadmapData.mindmap, careers);
    return { flowNodes: nodes, flowEdges: edges };
  }, [roadmapData, primaryCareer, secondaryCareer, thirdCareer, focusMode]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setRfNodes(flowNodes);
    setRfEdges(flowEdges);
  }, [flowNodes, flowEdges, setRfNodes, setRfEdges]);

  const paginatedSchedule = useMemo(() => {
    if (!roadmapData) return [];
    const start = schedulePage * ITEMS_PER_PAGE;
    return roadmapData.schedule.slice(start, start + ITEMS_PER_PAGE);
  }, [roadmapData, schedulePage]);

  const totalPages = roadmapData
    ? Math.ceil(roadmapData.schedule.length / ITEMS_PER_PAGE)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI Career Roadmap Generator</h1>
        <p className="text-sm text-muted-foreground">
          Choose your career paths and generate an AI-powered roadmap with visual mind map and daily learning schedule.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
        style={{ height: roadmapData ? 650 : 300 }}
      >
        {roadmapData ? (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
            nodesDraggable
            nodesConnectable={false}
            minZoom={0.1}
            maxZoom={2}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls
              style={{
                background: "rgba(30,41,59,0.8)",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.2)",
              }}
            />
            <MiniMap
              style={{ background: "rgba(15,23,42,0.8)", borderRadius: 8 }}
              nodeColor={() => "#3b82f6"}
              maskColor="rgba(0,0,0,0.4)"
            />
          </ReactFlow>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Sparkles size={40} className="text-teal-400 opacity-50" />
            <p className="text-sm">Select your careers below and generate a roadmap to see the mind map here.</p>
          </div>
        )}
      </motion.div>
      {roadmapData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(NODE_COLORS).map(([key, color]) => (
            <div key={key} className="glass-card p-3 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {key === "root" ? "Career Decision" : key}
              </span>
            </div>
          ))}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={18} className="text-teal-400" />
          Career Selection
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Main Career (Primary Focus)</Label>
            <Select value={primaryCareer} onValueChange={setPrimaryCareer}>
              <SelectTrigger>
                <SelectValue placeholder="Select primary career" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Switch Career (Alternative)</Label>
            <Select value={secondaryCareer} onValueChange={setSecondaryCareer}>
              <SelectTrigger>
                <SelectValue placeholder="Select secondary career" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_OPTIONS.filter((c) => c !== primaryCareer).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Partially Interested Career</Label>
            <Select value={thirdCareer} onValueChange={setThirdCareer}>
              <SelectTrigger>
                <SelectValue placeholder="Select third career" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_OPTIONS.filter((c) => c !== primaryCareer && c !== secondaryCareer).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">How do you want to focus your learning?</Label>
          <Select value={focusMode} onValueChange={setFocusMode}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOCUS_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} /> Start Date
            </Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} /> End Date
            </Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> Preferred Learning Style
            </Label>
            <Select value={scheduleStyle} onValueChange={setScheduleStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !primaryCareer}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Roadmap...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Roadmap
            </>
          )}
        </Button>
      </motion.div>
      {roadmapData && roadmapData.schedule.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Daily Learning Schedule
            </h2>
            <Badge variant="secondary" className="text-xs">
              {roadmapData.schedule.length} days planned
            </Badge>
          </div>

          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="w-[80px]">Day</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-[120px] text-right">Study Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedule.map((item, i) => (
                  <TableRow key={i} className="border-border/30 hover:bg-white/5">
                    <TableCell className="font-medium text-teal-400 text-sm">
                      {item.day}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.date}
                    </TableCell>
                    <TableCell className="text-sm">{item.topic}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {item.hours}h
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchedulePage((p) => Math.max(0, p - 1))}
                disabled={schedulePage === 0}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {schedulePage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchedulePage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={schedulePage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MindMap;
