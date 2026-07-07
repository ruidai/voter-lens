import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { previousStance, questions, answers, eliminatedTopics } = await req.json();

    if (!questions || !answers) {
      return NextResponse.json(
        { error: "Questions and answers are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Build the context string
    let contextStr = `Previous Voter Stance:\n"${previousStance || 'None provided.'}"\n\n`;
    
    if (eliminatedTopics && eliminatedTopics.length > 0) {
      contextStr += "Topics already covered by the previous stance:\n";
      eliminatedTopics.forEach((et: any) => {
        contextStr += `- ${et.topic}: ${et.reason}\n`;
      });
      contextStr += "\n";
    }

    contextStr += "New Q&A Session:\n";
    questions.forEach((q: any) => {
      const answerIdx = answers[q.id];
      if (answerIdx !== undefined) {
        contextStr += `Q: ${q.text}\nA: ${q.options[answerIdx]}\n\n`;
      }
    });

    const prompt = `You are a non-partisan political analyst. Your task is to maintain and update a voter's comprehensive political profile based on their chat history and newly answered questions.
    
Here is the context of what we know about this voter:
${contextStr}

Please generate a SINGLE, cohesive paragraph (written in the first person, e.g., "I support...", "I believe...") that merges their previous stance with the new information we learned from their Q&A answers. 
This paragraph will act as their "Portable Profile". Do not include any introductory text, just the paragraph itself. Make it factual and direct.`;

    const { text: newStance } = await generateText({
      model: google("gemini-3.1-flash-lite"),
      prompt: prompt,
    });

    return NextResponse.json({ stance: newStance.trim() });
  } catch (error: any) {
    console.error("Profile Generate API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate profile: " + (error.message || error) },
      { status: 500 }
    );
  }
}
