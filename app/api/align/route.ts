import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

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
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not defined.");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const { object } = await generateObject({
      model: google("gemini-3.5-flash"),
      schema: z.object({
        questions: z.array(z.object({
          id: z.string(),
          category: z.string(),
          text: z.string(),
          options: z.array(z.string()),
          candidateStancesArr: z.array(z.object({
            candidate: z.string(),
            stance: z.string()
          }))
        }))
      }),
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
4. For each question, indicate which exact option string each candidate aligns with in the 'candidateStancesArr'. Make sure the 'candidate' field exactly matches the names provided.`,
        },
      ],
    });

    // Map the array format back to a Record<string, string> so the frontend contract remains unchanged
    const formattedQuestions = object.questions.map(q => {
      const stancesRecord: Record<string, string> = {};
      q.candidateStancesArr.forEach(c => {
        stancesRecord[c.candidate] = c.stance;
      });
      return {
        id: q.id,
        category: q.category,
        text: q.text,
        options: q.options,
        candidateStances: stancesRecord
      };
    });

    return NextResponse.json(formattedQuestions);
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
