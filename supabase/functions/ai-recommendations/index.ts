import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[ai-recommendations] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's collection from DB
    const { data: collection, error: dbError } = await supabase
      .from("user_collections")
      .select("tmdb_id, item_type, data")
      .eq("user_id", user.id);

    if (dbError) {
      console.error("[ai-recommendations] DB error:", dbError.message);
      return new Response(JSON.stringify({ error: "Failed to load collection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a concise summary of the user's taste
    const items = (collection || []).map((row) => {
      const d = row.data as Record<string, unknown>;
      return {
        title: d.title as string,
        type: row.item_type,
        genre: d.genre as string || "",
        userRating: d.userRating as string || "",
        year: d.year as string || "",
      };
    });

    const collectionSummary = items.length > 0
      ? items.slice(0, 30).map((i) =>
          `${i.title} (${i.type}, ${i.year}, genre: ${i.genre}${i.userRating ? `, rated: ${i.userRating}/10` : ""})`
        ).join("\n")
      : "Empty collection - suggest popular critically acclaimed titles across genres.";

    const systemPrompt = `You are an expert movie and TV series recommendation engine. Based on the user's watch history and ratings, suggest 8 personalized recommendations they haven't watched yet.

For each recommendation, respond using the suggest_recommendations tool with:
- title: exact movie/series title
- type: "movie" or "series"
- year: release year
- genre: primary genre
- reason: 1-sentence personalized explanation of why they'd enjoy it (reference specific items from their collection)
- confidence: "high", "medium", or "low" based on match strength

Mix movies and series. Prioritize variety in genres while staying true to their taste. Include 1-2 "stretch" picks from genres they might not expect but could enjoy.`;

    const userPrompt = `Here is my watch history:\n${collectionSummary}\n\nGive me personalized recommendations.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recommendations",
              description: "Return personalized movie/series recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        type: { type: "string", enum: ["movie", "series"] },
                        year: { type: "string" },
                        genre: { type: "string" },
                        reason: { type: "string" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "type", "year", "genre", "reason", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_recommendations" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("[ai-recommendations] AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate recommendations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let recommendations = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        recommendations = parsed.recommendations || [];
      } catch {
        console.error("[ai-recommendations] Failed to parse tool call arguments");
      }
    }

    // If tool calling didn't work, try parsing content directly
    if (recommendations.length === 0 && aiData.choices?.[0]?.message?.content) {
      try {
        const content = aiData.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback failed
      }
    }

    return new Response(JSON.stringify({ recommendations, collectionSize: items.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-recommendations] Error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
