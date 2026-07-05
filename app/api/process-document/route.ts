import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30; // Extend Vercel function timeout if needed

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Missing image file parameter" },
        { status: 400 }
      );
    }

    // Verify Google API Key presence
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables. Falling back to mock data.");
      return getMockData();
    }

    // Convert base64 string to Buffer
    const imageBuffer = Buffer.from(image, "base64");

    // Execute multimodal parsing request using Vercel AI SDK and Gemini 1.5 Flash
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert voter guide parsing assistant. Analyze this election mailer or ballot flyer image.
Extract any candidates running for office and any ballot propositions mentioned.
Output your findings STRICTLY as a single valid JSON object. Do not include markdown codeblocks (e.g., \`\`\`json) or extra explanation text.

Required JSON Structure:
{
  "candidates": [
    {
      "name": "Full name of the candidate",
      "office": "The public office they are running for",
      "details": "A brief 1-2 sentence description of their platform or key policies mentioned on the flyer"
    }
  ],
  "propositions": [
    {
      "number": "The proposition number or name (e.g., Prop 401)",
      "title": "Short title of the proposition",
      "summary": "A brief summary of what the proposition proposes and its fiscal or local impact"
    }
  ],
  "rawOcrSummary": "A general summary of what this document is (e.g., A campaign mailer advocating for schools bond funding)"
}`,
            },
            {
              type: "image",
              image: imageBuffer,
            },
          ],
        },
      ],
    });

    // Clean response text just in case model adds markdown formatting wrappers
    const cleanJsonText = text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanJsonText);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Document process API error:", error);
    return NextResponse.json(
      { error: "Failed to parse document: " + (error.message || error) },
      { status: 500 }
    );
  }
}

// Fallback mock data if API key is missing
function getMockData() {
  return NextResponse.json({
    candidates: [
      {
        name: "Sarah Jenkins",
        office: "Maricopa County Board of Supervisors",
        details: "Focuses on water security, infrastructure investments, and transparent ballot auditing."
      },
      {
        name: "David Cole",
        office: "State Senate District 12",
        details: "Advocates for tax cuts, reduced municipal spending, and charter school choice funding."
      }
    ],
    propositions: [
      {
        number: "Prop 479",
        title: "Maricopa County Transportation Excise Tax",
        summary: "Extends the existing half-cent sales tax for 20 years to fund county freeways, streets, and transit."
      }
    ],
    rawOcrSummary: "Voter information flyer highlighting district candidates Sarah Jenkins and David Cole, supporting Prop 479."
  });
}
