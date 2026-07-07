import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";
import { createAdminClient } from "../../../utils/supabase/server";

export const maxDuration = 60; // Increased to 60s to accommodate potential research step

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidates, stance, location } = body;

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

          let canonicalLocation = location || '';
          if (location) {
            sendEvent({ type: "status", message: "Resolving geographic context...", progress: 6 });
            try {
              // Check memory (llm_logs) to avoid wasting LLM calls
              const { data: cacheHits, error: cacheError } = await supabase
                .from("llm_logs")
                .select("response")
                .eq("context", "entity_resolution_location")
                .eq("prompt", `Resolve location: ${location}`)
                .order("created_at", { ascending: false })
                .limit(1);

              if (cacheHits && cacheHits.length > 0) {
                canonicalLocation = cacheHits[0].response;
              } else {
                const { object } = await generateObject({
                  model: google("gemini-3.1-flash-lite"),
                  maxRetries: 3,
                  schema: z.object({
                    city: z.string().nullable().describe("The city name, if applicable."),
                    county: z.string().nullable().describe("The county name, if applicable."),
                    state: z.string().nullable().describe("The state abbreviation (e.g., AZ)."),
                    formattedString: z.string().describe("A descriptive string including all extracted geographic levels (e.g., 'City, County, State' or 'County, State'). Empty string if invalid.")
                  }),
                  prompt: `Analyze this location input and extract its multiple geographic levels (city, county, and state). Produce a 'formattedString' that combines all known levels to provide maximum disambiguation context for candidate research. If the input is a zip code, resolve its corresponding city, county, and state. If the input is nonsensical or empty, return an empty formattedString.\n\nUser Input: ${location}`
                });
                
                canonicalLocation = object.formattedString;
                
                await supabase.from("llm_logs").insert({
                  context: "entity_resolution_location",
                  prompt: `Resolve location: ${location}`,
                  response: canonicalLocation
                });
              }
            } catch (e) {
              console.error("Entity resolution failed", e);
            }
          }

          for (let i = 0; i < candidates.length; i++) {
            const candidateName = candidates[i];
            const progressBase = 5 + (i / totalCandidates) * 60; // 5% to 65% for research
            sendEvent({ type: "status", message: `Analyzing ${candidateName}...`, progress: Math.round(progressBase) });

            const { data: profiles, error } = await supabase
              .rpc("match_candidate", { search_name: candidateName, search_location: canonicalLocation, match_threshold: 0.4 });

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
              
              let locationContext = canonicalLocation ? ` running in ${canonicalLocation}` : '';
              let researchPrompt = `Research and compile a highly specific, factual political dossier for the candidate: ${canonicalName}${locationContext}. 
Provide the dossier using the following strict structure:

1. CORE PLATFORM & SPECIFICS: Detail their explicit stances on Economy, Healthcare, Education, and Environment. Cite specific proposals, not generalized values.
2. TRACK RECORD & PAST ACTIONS: Detail specific past votes, sponsored legislation, or executive actions. If none exist (e.g., first-time candidate), state their professional background relevance.
3. FUNDING & ENDORSEMENTS: List major PACs, unions, or notable figures funding or endorsing this candidate.
4. OPPOSING VIEWS & CRITICISMS: Summarize the primary factual criticisms leveled against this candidate by opponents or watchdog groups.

Do not hallucinate. If a section lacks public data, write "Insufficient public data available."`;
              if (existingDossier) {
                 researchPrompt = `Here is the existing dossier for the candidate ${canonicalName}: \n\n"${existingDossier}"\n\nResearch and provide an UPDATED dossier following the exact same 4-part structure (Core Platform, Track Record, Funding, Opposing Views). Keep all accurate historical information, but strictly ADD any new developments, votes, or endorsements from the last 3 months. Do not hallucinate.`;
              }

              const { textStream } = await streamText({
                // @ts-expect-error - useSearchGrounding is supported but not typed in this version
                model: google("gemini-3.5-flash", { useSearchGrounding: true }),
                maxRetries: 3,
                maxTokens: 800,
                system: `You are an elite, non-partisan investigative political researcher. 
Today's date is ${new Date().toLocaleDateString()}. Focus exclusively on current and upcoming elections.
Your mandate is strictly factual accuracy, high specificity, and deep context.
Rules:
1. Do not use generalized political platitudes. 
2. If specific data (like funding sources or past votes) is unknown, explicitly state "Unknown" or "Insufficient public data available" rather than guessing.
3. Maintain rigorous neutrality.`,
                prompt: researchPrompt,
              });

              let newDossier = "";
              for await (const chunk of textStream) {
                newDossier += chunk;
                sendEvent({ type: "research_chunk", chunk });
              }

              await supabase.from("llm_logs").insert({
                context: "research_candidate",
                prompt: researchPrompt,
                response: newDossier
              });

              await supabase
                .from("candidate_profiles")
                .upsert({
                  name: canonicalName,
                  location: canonicalLocation,
                  dossier: newDossier,
                  last_updated_at: new Date().toISOString()
                }, { onConflict: 'name, location' });
                
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

          const generateQuestionsPrompt = `You are an expert non-partisan voter alignment analyst.
We are comparing these candidates: ${canonicalCandidates.join(", ")}.
The voter described themselves politically as: "${stance || "No statement provided"}".

${dossierContextStr}

Task:
1. Identify major policy differences and track records for the listed candidates strictly based on the provided candidate dossiers. Do NOT hallucinate outside information.
2. Formulate a list of up to 4 highly distinguishing multiple-choice questions that can separate their platforms.
3. If the voter provided a political statement, automatically pre-evaluate/filter out questions that their statement already clearly answers. For any question/topic you eliminate this way, document it in the 'eliminatedTopics' array (e.g. topic: "Taxes", reason: "Voter already stated support for lower taxes").
4. For each question generated, indicate which exact option string each candidate aligns with in the 'candidateStancesArr'. Make sure the 'candidate' field exactly matches the names provided.`;

          // Check if we already generated questions for this exact set of candidates and stances
          const { data: qCacheHits } = await supabase
            .from("llm_logs")
            .select("response")
            .eq("context", "generate_questions")
            .eq("prompt", generateQuestionsPrompt)
            .order("created_at", { ascending: false })
            .limit(1);

          let object: any;
          if (qCacheHits && qCacheHits.length > 0) {
            try {
              object = JSON.parse(qCacheHits[0].response);
            } catch (e) {
              console.error("Failed to parse cached questions", e);
            }
          }

          if (!object) {
            const result = await generateObject({
              model: google("gemini-3.1-flash-lite"),
              maxRetries: 3,
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
                  content: generateQuestionsPrompt,
                },
              ],
            });
            object = result.object;

            await supabase.from("llm_logs").insert({
              context: "generate_questions",
              prompt: generateQuestionsPrompt,
              response: JSON.stringify(object)
            });
          }

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
          let cleanMessage = "An unexpected error occurred during processing.";
          if (err?.message?.includes("429")) {
            cleanMessage = "We are currently experiencing high traffic (Rate Limit Exceeded). Please try again in a few moments.";
          } else if (err?.message?.includes("503")) {
            cleanMessage = "The AI service is temporarily unavailable. Please try again.";
          } else if (err?.message) {
            cleanMessage = err.message;
          }
          sendEvent({ type: "error", message: cleanMessage });
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

