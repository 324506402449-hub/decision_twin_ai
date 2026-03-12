

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });
dotenv.config({ path: resolve(__dirname, "..", ".env") });
dotenv.config({ path: resolve(__dirname, "..", "backend", ".env") });

const PORT = process.env.CHAT_PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set. Add it to .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Decision Twin AI, an intelligent assistant that helps users with career simulations, AI learning phases, internships, project recommendations, and data-driven decisions.

You are embedded in a career decision simulator dashboard. Your capabilities include:
- Analyzing simulation results and career comparisons
- Suggesting AI/ML learning phases and roadmaps
- Recommending projects for portfolio building
- Finding internship opportunities and strategies
- Guiding career paths in tech, AI, data science, and related fields
- Providing data-driven insights for career decisions

Be concise, professional, and actionable in your responses. Use bullet points and structured formatting when helpful. Always be encouraging and supportive while being realistic about career outcomes.`;

const app = express();

app.use(cors({
  origin: [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
  ],
  credentials: true,
}));

app.use(express.json());
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "Decision Twin AI Chat Server" });
});
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Who are you and what can you do?" }] },
        { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
      ],
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    return res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err.message);
    try {
      const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = backupModel.startChat({
        history: [
          { role: "user", parts: [{ text: "Who are you and what can you do?" }] },
          { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
        ],
      });

      const result = await chat.sendMessage(message.trim());
      const reply = result.response.text();

      return res.json({ reply });
    } catch (fallbackErr) {
      console.error("Fallback model error:", fallbackErr.message);
      return res.status(500).json({
        error: "AI service temporarily unavailable. Please try again.",
      });
    }
  }
});
const CAREER_ANALYTICS_PROMPT = (course, country) => `You are a global career intelligence engine. Provide accurate 2024-2026 data.

Career: "${course}"
Region: "${country}"

Return ONLY valid JSON (no markdown, no code blocks) in this EXACT format:
{
  "career": "${course}",
  "topUniversities": [
    {"name": "MIT", "country": "USA", "lat": 42.3601, "lng": -71.0942},
    {"name": "Stanford University", "country": "USA", "lat": 37.4275, "lng": -122.1697},
    {"name": "Carnegie Mellon University", "country": "USA", "lat": 40.4433, "lng": -79.9436},
    {"name": "ETH Zurich", "country": "Switzerland", "lat": 47.3769, "lng": 8.5417},
    {"name": "University of Cambridge", "country": "UK", "lat": 52.2053, "lng": 0.1218},
    {"name": "National University of Singapore", "country": "Singapore", "lat": 1.2966, "lng": 103.7764},
    {"name": "University of Toronto", "country": "Canada", "lat": 43.6629, "lng": -79.3957},
    {"name": "TU Munich", "country": "Germany", "lat": 48.1497, "lng": 11.5679}
  ],
  "metrics": {
    "globalStudentsAnalyzed": "2.8M",
    "activeSimulations": "18K",
    "careerDemandIndex": 85,
    "growthIndex": "85%",
    "avgSalary": "$94K",
    "demand": "High",
    "growthRate": "18%"
  },
  "topSkills": ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "Cloud"],
  "topCountries": [
    {"name": "USA", "lat": 37.0902, "lng": -95.7129},
    {"name": "Germany", "lat": 51.1657, "lng": 10.4515},
    {"name": "Canada", "lat": 56.1304, "lng": -106.3468},
    {"name": "UK", "lat": 55.3781, "lng": -3.4360},
    {"name": "Singapore", "lat": 1.3521, "lng": 103.8198}
  ],
  "salaryGrowth": [
    {"year": 2021, "salary": 72},
    {"year": 2022, "salary": 80},
    {"year": 2023, "salary": 88},
    {"year": 2024, "salary": 94},
    {"year": 2025, "salary": 102}
  ],
  "studentDemandTrend": [
    {"year": 2021, "students": 420},
    {"year": 2022, "students": 510},
    {"year": 2023, "students": 590},
    {"year": 2024, "students": 680},
    {"year": 2025, "students": 780}
  ]
}

RULES:
- Return 8-12 top universities worldwide for "${course}" with REAL lat/lng coordinates.
- Provide 5 top countries with real coordinates.
- All numbers must be realistic for 2024-2026.
- If country is "${country}", prioritise universities from that region but include global ones.
- University lat/lng must be accurate to their real campus location.
- Return ONLY the JSON object, nothing else.`;

app.post("/api/career-analytics", async (req, res) => {
  const { course, country } = req.body;

  if (!course || typeof course !== "string" || !course.trim()) {
    return res.status(400).json({ error: "Course field is required." });
  }

  const countryVal = (country && typeof country === "string") ? country.trim() : "Global";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(CAREER_ANALYTICS_PROMPT(course.trim(), countryVal));
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const data = JSON.parse(jsonMatch[0]);
    return res.json(data);
  } catch (err) {
    console.error("Career analytics error:", err.message);

    try {
      const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await backupModel.generateContent(CAREER_ANALYTICS_PROMPT(course.trim(), countryVal));
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in backup response");

      const data = JSON.parse(jsonMatch[0]);
      return res.json(data);
    } catch (fallbackErr) {
      console.error("Fallback career analytics error:", fallbackErr.message);
      return res.status(500).json({
        error: "AI service temporarily unavailable.",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🤖 Decision Twin Chat Server running on http://localhost:${PORT}`);
});
