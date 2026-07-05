import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject, generateText, streamText } from "ai";
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

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        try {
          const supabase = createAdminClient();
          const dossiers: Record<string, string> = {};
          const canonicalCandidates: string[] = [];
          
          let totalCandidates = candidates.length;
          
          sendEvent({ type: "status", message: "Initializing alignment check...", progress: 5 });

          for (let i = 0; i < candidates.length; i++) {
            const candidateName = candidates[i];
            const progressBase = 5 + (i / totalCandidates) * 60; // 5% to 65% for research
            sendEvent({ type: "status", message: `Analyzing ${candidateName}...`, progress: Math.round(progressBase) });

            const { data: profiles, error } = await supabase
              .rpc("match_candidate", { search_name: candidateName, match_threshold: 0.4 });

            const profile = profiles && profiles.length > 0 ? profiles[0] : null;
            const now = Date.now();
            let needsResearch = false;
            let existingDossier = "";
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
                needsResearch = true;
              }
            }

            if (needsResearch) {
              sendEvent({ type: "status", message: `Compiling dossier for ${canonicalName}...`, progress: Math.round(progressBase + 5) });
              sendEvent({ type: "research_start", candidate: canonicalName });
              
              let researchPrompt = `Research and provide a detailed, highly factual political platform dossier for the candidate: ${canonicalName}. Include their stances on major issues like Economy, Healthcare, Education, and Environment. Ensure the tone is objective and non-partisan.`;
              if (existingDossier) {
                 researchPrompt = `Here is the existing dossier for the candidate ${canonicalName}: \n\n"${existingDossier}"\n\nResearch and provide an UPDATED dossier. Keep all the accurate historical information, but strictly ADD any new developments or shifts in their platform from the last 3 months.`;
              }

              const { textStream } = await streamText({
                model: google("gemini-3.5-flash"),
                prompt: researchPrompt,
              });

              let newDossier = "";
              for await (const chunk of textStream) {
                newDossier += chunk;
                sendEvent({ type: "research_chunk", chunk });
              }

              await supabase
                .from("candidate_profiles")
                .upsert({
                  name: canonicalName,
                  dossier: newDossier,
                  last_updated_at: new Date().toISOString()
                }, { onConflict: 'name' });
                
              dossiers[canonicalName] = newDossier;
            } else {
              dossiers[canonicalName] = existingDossier;
              sendEvent({ type: "research_start", candidate: canonicalName });
              sendEvent({ type: "research_chunk", chunk: "Found existing dossier in secure database. Skipping active research.\n" });
              await new Promise(r => setTimeout(r, 800));
            }
          }

          sendEvent({ type: "status", message: "Cross-referencing platforms...", progress: 70 });
          
          let dossierContextStr = "Candidate Dossiers (Use strictly for generating questions):\n";
          for (const [name, dossier] of Object.entries(dossiers)) {
            dossierContextStr += `\n--- [ ${name} ] ---\n${dossier}\n`;
          }

          sendEvent({ type: "status", message: "Generating high-signal questions...", progress: 85 });
          sendEvent({ type: "research_start", candidate: "AI Analyst" });
          sendEvent({ type: "research_chunk", chunk: "Formulating unbiased questions based on candidate differences...\n\n" });

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

          sendEvent({ type: "research_chunk", chunk: `Generated ${object.questions.length} questions.` });
          await new Promise(r => setTimeout(r, 600));

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

          sendEvent({ type: "status", message: "Alignment check prepared.", progress: 100 });
          sendEvent({ 
            type: "result", 
            data: {
              questions: formattedQuestions,
              eliminatedTopics: object.eliminatedTopics || []
            }
          });

          controller.close();
        } catch (err: any) {
          console.error(err);
          sendEvent({ type: "error", message: err.message || "An error occurred" });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("Alignment API Error:", error);
    return NextResponse.json(
      { error: "Failed to handle alignment request: " + (error.message || error) },
      { status: 500 }
    );
  }
}

