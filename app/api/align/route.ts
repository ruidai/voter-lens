import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createAdminClient } from "../../../utils/supabase/server";

export const maxDuration = 60; // Increased to 60s to accommodate potential research step

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

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

    const supabase = createAdminClient();
    const dossiers: Record<string, string> = {};
    const canonicalCandidates: string[] = [];

    // Step A & B: Cache Retrieval and Smart Research Engine (Fuzzy Deduplication)
    for (const candidateName of candidates) {
      // 1. Check cache using RPC for fuzzy matching
      const { data: profiles, error } = await supabase
        .rpc("match_candidate", { search_name: candidateName, match_threshold: 0.4 });

      const profile = profiles && profiles.length > 0 ? profiles[0] : null;
      
      const now = Date.now();
      let needsResearch = false;
      let existingDossier = "";
      
      // The canonical name is the DB name if matched, otherwise it's the user's input
      const canonicalName = profile ? profile.name : candidateName;
      canonicalCandidates.push(canonicalName);
      
      if (error && error.code !== 'PGRST116') {
        console.error(`Error querying cache for ${candidateName}:`, error);
      }

      if (!profile || !profile.dossier) {
        needsResearch = true;
      } else {
        existingDossier = profile.dossier;
        const lastUpdated = new Date(profile.last_updated_at).getTime();
        if (now - lastUpdated > THREE_MONTHS_MS) {
          needsResearch = true; // Stale data, needs updating
        }
      }

      // 2. Perform Research if needed
      if (needsResearch) {
        console.log(`[Research Engine] Generating dossier for ${canonicalName}... (existing: ${!!existingDossier})`);
        
        let researchPrompt = `Research and provide a detailed, highly factual political platform dossier for the candidate: ${canonicalName}. Include their stances on major issues like Economy, Healthcare, Education, and Environment. Ensure the tone is objective and non-partisan.`;
        
        if (existingDossier) {
           researchPrompt = `Here is the existing dossier for the candidate ${canonicalName}: \n\n"${existingDossier}"\n\nResearch and provide an UPDATED dossier. Keep all the accurate historical information, but strictly ADD any new developments or shifts in their platform from the last 3 months.`;
        }

        const { text: newDossier } = await generateText({
          model: google("gemini-3.5-flash"),
          prompt: researchPrompt,
        });

        // Save to Supabase (Upsert using canonical name)
        await supabase
          .from("candidate_profiles")
          .upsert({
            name: canonicalName,
            dossier: newDossier,
            last_updated_at: new Date().toISOString()
          }, { onConflict: 'name' });
          
        dossiers[canonicalName] = newDossier;
      } else {
        console.log(`[Research Engine] Cache HIT for ${canonicalName} (matched via '${candidateName}'), skipping research.`);
        dossiers[canonicalName] = existingDossier;
      }
    }

    // Step C: Alignment Question Generation (Using cached dossiers)
    let dossierContextStr = "Candidate Dossiers (Use strictly for generating questions):\n";
    for (const [name, dossier] of Object.entries(dossiers)) {
      dossierContextStr += `\n--- [ ${name} ] ---\n${dossier}\n`;
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
        })),
        eliminatedTopics: z.array(z.object({
          topic: z.string(),
          reason: z.string()
        })).optional()
      }),
      messages: [
        {
          role: "user",
          content: `You are an expert non-partisan voter alignment analyst.
We are comparing these candidates: ${canonicalCandidates.join(", ")}.
The voter described themselves politically as: "${stance || "No statement provided"}".

${dossierContextStr}

Task:
1. Identify major policy differences and track records for the listed candidates strictly based on the provided candidate dossiers. Do NOT hallucinate outside information.
2. Formulate a list of up to 4 highly distinguishing multiple-choice questions that can separate their platforms.
3. If the voter provided a political statement, automatically pre-evaluate/filter out questions that their statement already clearly answers. For any question/topic you eliminate this way, document it in the 'eliminatedTopics' array (e.g. topic: "Taxes", reason: "Voter already stated support for lower taxes").
4. For each question generated, indicate which exact option string each candidate aligns with in the 'candidateStancesArr'. Make sure the 'candidate' field exactly matches the names provided.`,
        },
      ],
    });

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

    return NextResponse.json({
      questions: formattedQuestions,
      eliminatedTopics: object.eliminatedTopics || []
    });
  } catch (error: any) {
    console.error("Alignment API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate alignment questions: " + (error.message || error) },
      { status: 500 }
    );
  }
}
