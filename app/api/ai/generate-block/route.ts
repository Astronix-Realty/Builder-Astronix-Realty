import { checkRBAC } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face client inside POST for fresh env vars

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await checkRBAC(req, ["builder", "mandate", "admin"]);
    if (errorResponse) return errorResponse;

    const { blockType, contextText } = await req.json();

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey || apiKey === 'hf_...') {
      return NextResponse.json({ error: "Hugging Face API key not configured. Please add it to .env.local" }, { status: 500 });
    }

    // Initialize client inside handler to ensure fresh env vars
    const hf = new HfInference(apiKey);

    if (!blockType) {
      return NextResponse.json({ error: "blockType is required" }, { status: 400 });
    }

    const safeContext = contextText?.trim() || 'real estate property in India';

    let prompt = "";
    if (blockType === "faq") {
      prompt = `Generate 3 Frequently Asked Questions and answers based on this text. Return ONLY a valid JSON array of objects with "question" and "answer" keys. Text: "${safeContext}"`;
    } else if (blockType === "pros-cons") {
      prompt = `Identify 3 pros and 2 cons from this text. Return ONLY a valid JSON object with "pros" (array of strings) and "cons" (array of strings) keys. Text: "${safeContext}"`;
    } else if (blockType === "seo") {
      prompt = `Generate SEO meta title, description, and 5 keywords. Return ONLY a valid JSON object with "metaTitle", "metaDescription", and "keywords" (array of strings) keys. Text: "${safeContext}"`;
    }

    // Using chatCompletion for better provider compatibility (Mistral/Llama/etc)
    const response = await hf.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        { role: "system", content: "You are a real estate content assistant. Return ONLY valid raw JSON without any markdown formatting or explanations." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.1,
    });

    const generatedText = response.choices[0].message.content || "";
    
    try {
      // Clean up markdown code blocks if the model adds them
      const cleanJsonStr = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonStart = cleanJsonStr.indexOf('{') !== -1 ? cleanJsonStr.indexOf('{') : cleanJsonStr.indexOf('[');
      const jsonEnd = cleanJsonStr.lastIndexOf('}') !== -1 ? cleanJsonStr.lastIndexOf('}') : cleanJsonStr.lastIndexOf(']');
      
      let finalJson = cleanJsonStr;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        finalJson = cleanJsonStr.substring(jsonStart, jsonEnd + 1);
      }

      const parsedData = JSON.parse(finalJson);
      return NextResponse.json({ data: parsedData }, { status: 200 });
    } catch (parseError) {
      console.error("AI parse error:", generatedText);
      return NextResponse.json({ error: "AI response was not in valid JSON format", raw: generatedText }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Generation error:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to generate block content";
    return NextResponse.json({ error: message }, { status });
  }
}
