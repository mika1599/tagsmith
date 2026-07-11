import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert Etsy SEO copywriter. Given a rough, informal description of a handmade or vintage product, produce a listing optimized for Etsy search.

Rules:
- Title: under 140 characters, front-load the most important search terms, no ALL CAPS, no keyword stuffing that reads like nonsense to a human.
- Tags: exactly 13 tags, each 20 characters or fewer, all lowercase, no duplicate words across tags, mix of broad and specific/long-tail phrases a buyer would actually search.
- Description: 3-4 short paragraphs. Open with a hook, describe the item and what makes it special, mention materials/size/use if inferable, end with a warm line about the shop. No hashtags, no emoji spam (one or two is fine if it fits naturally).

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"title": "...", "tags": ["...", "... up to 13"], "description": "..."}`;

export async function POST(req) {
  try {
    const { description, category } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it in your hosting provider's environment variables." },
        { status: 500 }
      );
    }

    const userPrompt = `Product description: ${description.trim()}\n${
      category ? `Category: ${category.trim()}` : ""
    }`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json({ error: "The listing generator is having trouble right now. Try again shortly." }, { status: 502 });
    }

    const data = await response.json();
    const textBlock = data.content?.find((b) => b.type === "text");
    if (!textBlock) {
      return NextResponse.json({ error: "No response text from the model." }, { status: 502 });
    }

    let cleaned = textBlock.text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse model output:", cleaned);
      return NextResponse.json({ error: "Couldn't parse the generated listing. Try again." }, { status: 502 });
    }

    if (!parsed.title || !Array.isArray(parsed.tags) || !parsed.description) {
      return NextResponse.json({ error: "The generated listing was incomplete. Try again." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Unexpected error in /api/generate:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
