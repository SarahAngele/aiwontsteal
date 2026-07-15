import { getStore } from "@netlify/blobs";

const MAX_NOTES = 5000;
const BLOCKED_TERMS = ["porn","xxx","nude","sex","fuck","nigger","faggot"];

function corsHeaders(){
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async (request) => {
  const headers = corsHeaders();
  const store = getStore({ name: "aiwontsteal-notes", consistency: "strong" });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method === "GET") {
    const notes = (await store.get("all", { type: "json" })) || [];
    return new Response(JSON.stringify(notes), { status: 200, headers });
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
    }

    const quote = (body.quote || "").toString().trim().slice(0, 90);
    if (!quote) {
      return new Response(JSON.stringify({ error: "Quote is required" }), { status: 400, headers });
    }
    const lower = quote.toLowerCase();
    if (BLOCKED_TERMS.some((t) => lower.includes(t))) {
      return new Response(JSON.stringify({ error: "Content not allowed" }), { status: 400, headers });
    }

    const name = (body.name || "").toString().trim().slice(0, 30);
    const city = (body.city || "").toString().trim().slice(0, 40);
    const country = (body.country || "").toString().trim().slice(0, 40);

    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      quote,
      name,
      city,
      country,
      createdAt: new Date().toISOString(),
    };

    const notes = (await store.get("all", { type: "json" })) || [];
    notes.push(note);
    if (notes.length > MAX_NOTES) notes.splice(0, notes.length - MAX_NOTES);
    await store.set("all", JSON.stringify(notes));

    return new Response(JSON.stringify(note), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
};
