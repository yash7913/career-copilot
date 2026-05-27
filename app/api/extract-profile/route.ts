import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing document text payload for extraction." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const docText = text.trim();

    // Deep profile extraction if OpenAI key is present
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: z.object({
            fullName: z.string().describe("The user's full name. If not explicitly found, return a professional placeholder like 'Executive Professional' or guess based on header items."),
            targetTitle: z.string().describe("The professional's current title, target role, or a summary of their senior expertise (e.g. 'Lead AI Product Manager')."),
            keySkills: z.array(z.string()).describe("A list of 6-12 core technical skills, frameworks, platforms, and methodologies (e.g., 'RAG Architectures', 'Semantic Modeling')."),
            professionalSummary: z.string().describe("A beautiful, premium, executive-level professional summary (2-4 sentences) outlining their background, senior impact, and expertise."),
            projects: z.array(
              z.object({
                title: z.string().describe("The project or engagement title."),
                timeline: z.string().describe("The date or timeline for the project (e.g. 'Jan 2024 - Present', 'Q3 2023', '2022 - 2023')."),
                description: z.string().describe("A clean bullet point or summary description of the achievements, systems designed, and technical scope of this project.")
              })
            ).describe("Key projects, slide decks described, or technical milestones."),
            education: z.array(
              z.string().describe("An education entry with degree name, school, and dates if available (e.g. 'B.S. in Computer Science, Stanford University (2018)').")
            ).describe("List of educational qualifications.")
          }),
          prompt: `You are an elite executive career strategist. Your task is to analyze the provided consolidated resume and project text, and synthesize it into a unified, high-integrity 'Master Profile'.

Consolidated Document Context:
=========================================
${docText.substring(0, 15000)}
=========================================

Instructions:
1. Parse and consolidate the text into the requested schema fields.
2. In 'fullName', locate their name at the top of the resume.
3. In 'targetTitle', identify their primary professional designation or senior discipline.
4. In 'keySkills', return high-value, specific skills and tools (comma-separated style elements split into an array).
5. In 'professionalSummary', write a compelling, high-impact overview that highlights advanced architecture, leadership, and technical prowess.
6. In 'projects', identify the most important technical initiatives, slide presentations, or system engineering efforts. Extract their specific timelines (e.g. start-end months/years) and provide a bulleted or clear paragraph description showing impact and technical stacks.
7. In 'education', extract all listed degrees, certifications, and academic details.`,
        });

        return Response.json(result.object);
      } catch (llmError: any) {
        console.error("OpenAI Master Profile extraction failed:", llmError);
        return Response.json({
          error: "AI Master Profile extraction failed",
          details: llmError.message || "Unknown error",
        }, { status: 500 });
      }
    }

    // Heuristic fallback if OpenAI API key is missing
    console.warn("⚠️ OpenAI API Key is missing. Falling back to local heuristic extraction for master profile.");
    
    // Simple heuristic parser
    const lines = docText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const fullName = lines[0] || "Executive Professional";
    const targetTitle = lines[1] || "Lead Software Engineer / PM";
    
    return Response.json({
      fullName,
      targetTitle,
      keySkills: ["RAG Systems", "AI Product Management", "Vector Indexing", "System Architecture"],
      professionalSummary: "A highly accomplished technical professional with deep expertise in designing complex, high-scale software architectures and driving AI product initiatives. Proven track record of spearheading cross-functional teams to build next-generation applications and semantic data models.",
      projects: [
        {
          title: "Enterprise RAG Semantic Search Platform",
          timeline: "Q1 2024 - Present",
          description: "Designed a multi-tier Retrieval-Augmented Generation pipeline using vector storage and hybrid search mechanisms to scale query retrieval speeds by 40%."
        },
        {
          title: "Corporate Data Analytics Integration",
          timeline: "2023",
          description: "Spearheaded the design and deployment of real-time pipeline monitoring architectures handling high-throughput telemetry data."
        }
      ],
      education: [
        "M.S. in Computer Science, Tech University (2020)",
        "B.S. in Software Engineering, State University (2018)"
      ],
      warning: "OpenAI API Key is missing. Local heuristic mock profile returned."
    });
  } catch (error: any) {
    console.error("General error in extract-profile API route:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
