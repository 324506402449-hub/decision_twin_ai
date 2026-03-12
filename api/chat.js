

import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are Decision Twin AI, an intelligent assistant that helps users with career simulations, AI learning phases, internships, project recommendations, and data-driven decisions.

You are embedded in a career decision simulator dashboard. Your capabilities include:
- Analyzing simulation results and career comparisons
- Suggesting AI/ML learning phases and roadmaps
- Recommending projects for portfolio building
- Finding internship opportunities and strategies
- Guiding career paths in tech, AI, data science, and related fields
- Providing data-driven insights for career decisions

Be concise, professional, and actionable in your responses. Use bullet points and structured formatting when helpful. Always be encouraging and supportive while being realistic about career outcomes.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Who are you and what can you do?" }] },
          { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
        ],
      });

      const result = await chat.sendMessage(message.trim());
      return res.status(200).json({ reply: result.response.text() });
    } catch (err) {
      console.error(`Model ${modelName} error:`, err.message);
      continue;
    }
  }

  return res.status(503).json({
    error: "AI service temporarily unavailable. Please try again.",
  });
}
