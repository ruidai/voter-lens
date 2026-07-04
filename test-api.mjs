import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

async function main() {
  try {
    const result = await generateText({
      model: google("gemini-3.5-flash"),
      prompt: "Reply with exactly: 'Hello world, Gemini is connected!'"
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
