import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const { profile, jobDescription, company, jobId, mode, directionMatrix } = await req.json();

    if (!profile || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Missing candidate profile or job description text." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      const missingKeyMarkdown = `# ⚠️ OpenAI API Key Missing

To start tailoring your resumes and cover letters with state-of-the-art AI, please configure your OpenAI API Key:

1. **Create a file** named \`.env.local\` in the root of your project directory (\`C:\\Users\\yasha\\Documents\\Career Copilot\`).
2. **Add your OpenAI API key** to the file:
   \`\`\`env
   OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
   \`\`\`
3. **Restart your Next.js development server** (stop the current server and run \`npm run dev\` in your terminal).

*Once configured, Career Copilot will automatically optimize your resumes and compose cover letters in real-time!*`;

      return new Response(missingKeyMarkdown, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const systemPrompt = `You are an expert executive resume writer, career strategist, and recruiter. Your objective is to help candidates land interviews by analyzing their background (which may consist of a consolidated portfolio including resumes, project detail sheets, and technical slides) and a target job description, then generating high-impact, professionally tailored materials in well-formatted, clean Markdown.`;

    const userPrompt =
      mode === "cover-letter"
        ? `Generate a compelling, highly tailored, and professional cover letter for this opportunity:
Company Name: ${company || "Target Company"}
Job ID: ${jobId || "N/A"}

Target Job Description:
${jobDescription}

Candidate Consolidated Portfolio (Synthesize achievements and details from these documents):
${profile}

${directionMatrix ? `\n--- CANDIDATE DIRECTION MATRIX INSTRUCTIONS (Follow these strictly):\n${directionMatrix}\n` : ""}

---
Requirements for the Cover Letter:
1. Format as a professional business letter using clean Markdown.
2. Structure:
   - A professional salutation addressing the hiring team at ${company || "the target company"}.
   - Introduction: Mention the position applied for (Job ID: ${jobId || "N/A"}) and hook the reader with immediate value.
   - Body Paragraphs: Draw parallels between candidate achievements across their portfolio and the core requirements of the job description. Emphasize how their experience will solve the company's pain points.
   - Closing: Reiterate enthusiasm, state a proactive call to action for an interview, and use a professional sign-off.
3. Tone: Confident, persuasive, professional, and authentic.`
        : `Optimize and tailor the candidate's resume/profile to align with the target job description:
Company Name: ${company || "Target Company"}
Job ID: ${jobId || "N/A"}

Target Job Description:
${jobDescription}

Candidate Consolidated Portfolio (Synthesize achievements and details from these documents):
${profile}

${directionMatrix ? `\n--- CANDIDATE DIRECTION MATRIX INSTRUCTIONS (Follow these strictly):\n${directionMatrix}\n` : ""}

---
Requirements for the Tailored Resume:
1. Restructure and rephrase the experience sections to maximize alignment with the job description keywords and core expectations, drawing from their entire portfolio.
2. Optimize bullet points using high-impact action verbs (e.g., Spearheaded, Engineered, Accelerated, Designed) and quantify results (e.g., metrics, percentages, dollar figures) based on the candidate's profile.
3. Naturally integrate essential keywords, skills, and methodologies from the job description.
4. Format the output as a beautiful, modern Markdown resume with sections: Professional Summary, Core Competencies (keywords), Professional Experience, Projects (optional), and Education/Certifications.
5. Strictly adhere to facts in the candidate's profile — do not fabricate companies or degrees.`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error tailoring resume:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
