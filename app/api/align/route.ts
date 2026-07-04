import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { candidates, stance } = await req.json();

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { error: "A list of candidates is required to analyze alignments." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not defined. Falling back to mock distilled questions.");
      return getMockQuestions(candidates);
    }

    // Call Gemini 1.5 Flash using the Vercel AI SDK to analyze public platform info
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: `You are an expert non-partisan voter alignment analyst.
We are comparing these candidates: ${candidates.join(", ")}.
The voter described themselves politically as: "${stance || "No statement provided"}".

Task:
1. Identify major policy differences and track records for the listed candidates based on public data.
2. Formulate a list of up to 4 highly distinguishing multiple-choice questions that can separate their platforms.
3. If the voter provided a political statement, automatically pre-evaluate/filter out questions that their statement already clearly answers, so the quiz is as short as possible.
4. For each question, map which of the multiple-choice options each candidate aligns with.

Output your findings STRICTLY as a single valid JSON array of objects. Do not wrap it in markdown block tags (e.g. \`\`\`json).

Required JSON format:
[
  {
    "id": "q1",
    "category": "Education / Economy / Energy etc.",
    "text": "The multiple choice question text?",
    "options": [
      "Option 1 text",
      "Option 2 text",
      "Option 3 text"
    ],
    "candidateStances": {
      "Candidate Name 1": "The exact matching option text this candidate aligns with",
      "Candidate Name 2": "The exact matching option text this candidate aligns with"
    }
  }
]`,
        },
      ],
    });

    const cleanJson = text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    const parsedQuestions = JSON.parse(cleanJson);
    return NextResponse.json(parsedQuestions);
  } catch (error: any) {
    console.error("Alignment API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate alignment questions: " + (error.message || error) },
      { status: 500 }
    );
  }
}

// Fallback questions if API key is missing
function getMockQuestions(candidates: string[]) {
  const candidateStancesQ1: Record<string, string> = {};
  const candidateStancesQ2: Record<string, string> = {};

  candidates.forEach((name, idx) => {
    candidateStancesQ1[name] = idx % 2 === 0 
      ? "Increase funding exclusively for public district school systems"
      : "Prioritize choice and fund charter vouchers heavily";
    
    candidateStancesQ2[name] = idx % 2 === 0
      ? "Support to fund transit, highway and road safety improvements"
      : "Oppose to lower property/sales taxes and reduce capital borrowing";
  });

  return NextResponse.json([
    {
      id: "q1",
      category: "Education",
      text: "How should our district allocate funding for charter schools and alternative options?",
      options: [
        "Prioritize choice and fund charter vouchers heavily",
        "Increase funding exclusively for public district school systems",
        "Maintain current balance with strong performance auditing"
      ],
      candidateStances: candidateStancesQ1
    },
    {
      id: "q2",
      category: "Fiscal Management",
      text: "What is your stance on regional sales tax increases for infrastructure projects (e.g. Prop 479)?",
      options: [
        "Support to fund transit, highway and road safety improvements",
        "Oppose to lower property/sales taxes and reduce capital borrowing",
        "Support, but only if matched by equal spending cuts elsewhere"
      ],
      candidateStances: candidateStancesQ2
    }
  ]);
}
