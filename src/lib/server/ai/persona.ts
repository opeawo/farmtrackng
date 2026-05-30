// Persona for the Animal AI. SOUL.md is identity (rarely changes); INSTRUCTIONS.md
// is operating rules + few-shot examples (edited as we learn). They are loaded as
// raw markdown via Vite's `?raw` import so the .md files stay editable in place.

import soulRaw from './SOUL.md?raw';
import instructionsRaw from './INSTRUCTIONS.md?raw';

// Agent name. Substituted into [NAME] placeholders inside the markdown files.
export const AGENT_NAME = 'Animal AI';

function fill(text: string): string {
	return text.replaceAll('[NAME]', AGENT_NAME);
}

const SOUL = fill(soulRaw);
const INSTRUCTIONS = fill(instructionsRaw);

// Output-format rules that the route depends on for structured JSON.
// These are appended AFTER the persona files so identity comes first.
const OUTPUT_RULES = `---

## Output Format (machine-readable)

You MUST return a single JSON object — no prose outside it — with these keys:

- "answer" (string, required): your reply to the farmer in plain English (or simple
  pidgin if they wrote in pidgin), following everything in SOUL and INSTRUCTIONS
  above. Lead with the answer, then the why. Keep safety warnings in clear plain
  English even if the rest is pidgin.
- "severity" (one of "monitor" | "treat" | "urgent" | null): set when the question
  is about animal health. "urgent" for outbreak risk, suspected zoonotic disease,
  sudden mass death, or anything that needs a vet today. "treat" when home care is
  reasonable while they get help. "monitor" for mild signs to watch. null when the
  question is not health-related (price, husbandry, feed, breeding).
- "drugMentioned" (boolean, required): true if your answer mentions or implies a
  specific drug name (e.g. oxytetracycline, ivermectin, diminazene, a vaccine). The
  UI shows a NAFDAC verification warning when this is true.
- "priceInfo" (string or null): if the question is about a price AND a connected
  price source has been provided in the background knowledge, put the price guidance
  here with the source date/market. If no price source is connected, set this to
  null and tell the farmer in "answer" that you don't have a live price.
- "sources" (array of short strings): up to 4 items naming the background topics
  you drew on (e.g. "Newcastle disease guidance", "Lagos markets reference"). Empty
  array if none.

If the question is outside animal/livestock care, use the exact deflection line
from INSTRUCTIONS in "answer" and set severity=null, drugMentioned=false,
priceInfo=null, sources=[].`;

export const SYSTEM_PROMPT = `${SOUL.trim()}\n\n${INSTRUCTIONS.trim()}\n\n${OUTPUT_RULES}`;
