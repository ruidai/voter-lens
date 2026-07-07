const { streamText, generateObject } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');
require('@next/env').loadEnvConfig(process.cwd());

async function run() {
  console.log("Testing streamText with googleSearch...");
  try {
    const { textStream } = streamText({
      model: google('gemini-3.5-flash'),
      prompt: "Who is Lisa Askey running for city council in Chandler Arizona?",
      tools: {
        googleSearch: google.tools.googleSearch()
      }
    });
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
    }
    console.log("\n--- streamText Success ---\n");
  } catch (e) {
    console.error("streamText failed:", e.message);
  }

  console.log("Testing generateObject with googleSearch...");
  try {
    const { object } = await generateObject({
      model: google('gemini-3.5-flash'),
      prompt: "Who is Lisa Askey running for city council in Chandler Arizona?",
      schema: z.object({ name: z.string(), status: z.string() }),
      tools: {
        googleSearch: google.tools.googleSearch()
      }
    });
    console.log(object);
    console.log("\n--- generateObject Success ---\n");
  } catch (e) {
    console.error("generateObject failed:", e.message);
  }
}
run();
