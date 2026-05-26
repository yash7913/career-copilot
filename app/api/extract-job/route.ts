import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

function heuristicExtractFromUrl(urlStr: string): { companyName: string; jobTitle: string; jobId: string; cleanJobDescription: string } {
  let companyName = "Unknown";
  let jobTitle = "Unknown Position";
  let jobId = "N/A";
  
  try {
    const url = new URL(urlStr.trim());
    const hostParts = url.hostname.split(".");
    const mainDomain = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : hostParts[0];
    companyName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);

    const pathname = decodeURIComponent(url.pathname);
    const pathParts = pathname.split("/").filter(p => p.length > 0);
    
    for (const part of pathParts) {
      const idMatch = part.match(/\b([0-9]{8,20})\b/);
      if (idMatch) {
        jobId = idMatch[1];
      }
    }
    
    if (jobId === "N/A") {
      for (const param of ["jobId", "jk", "job_id", "results"]) {
        const val = url.searchParams.get(param);
        if (val && /^[a-zA-Z0-9_-]+$/.test(val)) {
          jobId = val;
          break;
        }
      }
    }

    let slug = "";
    for (const part of pathParts) {
      if (part.includes("-") && part.length > 10) {
        slug = part;
      }
    }
    if (!slug && pathParts.length > 0) {
      slug = pathParts[pathParts.length - 1];
    }

    if (slug) {
      let cleanSlug = slug.replace(/\b[0-9]{8,20}\b/g, "").replace(/^-+|-+$/g, "");
      const words = cleanSlug.split(/[-_]+/).filter(w => w.length > 0);
      if (words.length > 0) {
        jobTitle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
    }
  } catch (err) {
    console.error("Heuristic URL parsing error:", err);
  }

  const cleanJobDescription = `⚠️ Dynamic Job Portal Detected (Heuristic Fallback): We successfully extracted the company, title, and Job ID from the portal link. However, this portal blocks automatic description scraping or OpenAI key is missing. Please copy-paste the job description text here to complete your optimization.`;

  return { companyName, jobTitle, jobId, cleanJobDescription };
}

function heuristicExtract(text: string): { companyName: string; jobTitle: string; jobId: string; cleanJobDescription: string } {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  
  let companyName = "Unknown";
  let jobTitle = "Unknown Position";
  let jobId = "N/A";
  let cleanJobDescription = text;

  if (lines.length > 0) {
    jobTitle = lines[0];

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (lineLower === "corporate_fare" && i + 1 < lines.length) {
        companyName = lines[i + 1];
      }
      const idMatch = lines[i].match(/(?:job\s*id|req\s*id|requisition\s*(?:number|id)?|position\s*id)[\s-:]*([a-zA-Z0-9_-]+)/i);
      if (idMatch && idMatch[1]) {
        jobId = idMatch[1];
      }
    }

    if (companyName === "Unknown" && lines.length > 1) {
      const secondLine = lines[1];
      if (secondLine.includes("·")) {
        companyName = secondLine.split("·")[0].trim();
      } else if (secondLine.includes(" - ")) {
        companyName = secondLine.split(" - ")[0].trim();
      } else if (secondLine.toLowerCase().startsWith("at ")) {
        companyName = secondLine.substring(3).trim();
      }
    }

    if (companyName === "Unknown") {
      const atMatch = text.match(/At\s+([A-Z][a-zA-Z0-9]+),\s+we/);
      if (atMatch && atMatch[1]) {
        companyName = atMatch[1];
      } else {
        const aboutMatch = text.match(/About\s+([A-Z][a-zA-Z0-9]+)/);
        if (aboutMatch && aboutMatch[1] && aboutMatch[1].toLowerCase() !== "the") {
          companyName = aboutMatch[1];
        }
      }
    }

    if (jobId === "N/A") {
      const numMatch = text.match(/\b([0-9]{8,20})\b/);
      if (numMatch) {
        jobId = numMatch[1];
      }
    }

    const cleanLines = lines.filter((line, index) => {
      if (index === 0) return false;
      if (line.toLowerCase() === "corporate_fare") return false;
      if (index > 0 && lines[index - 1].toLowerCase() === "corporate_fare") return false;
      if (line.toLowerCase() === "place") return false;
      if (index > 0 && lines[index - 1].toLowerCase() === "place") return false;
      return true;
    });

    cleanJobDescription = cleanLines.join("\n\n");
  }

  return { companyName, jobTitle, jobId, cleanJobDescription };
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing text or portal link payload." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isUrl = text.trim().startsWith("http://") || text.trim().startsWith("https://");

    // If OpenAI key is completely missing, immediately run heuristic fallback and avoid failing
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OpenAI API Key is missing. Falling back to local heuristic extraction.");
      const fallbackResult = isUrl ? heuristicExtractFromUrl(text) : heuristicExtract(text);
      return Response.json({
        ...fallbackResult,
        warning: "OpenAI API Key is missing. Active with robust local heuristic extraction fallback. To unlock premium AI-powered deep parsing, configure the key in your .env.local file.",
      });
    }

    let textToAnalyze = text;

    if (isUrl) {
      try {
        const response = await fetch(text.trim(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });
        if (response.ok) {
          const html = await response.text();
          textToAnalyze = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (err) {
        console.error("Direct scraper fetch failed, relying on URL-text LLM extraction:", err);
      }
    }

    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          companyName: z
            .string()
            .describe("The name of the company offering the job. Return 'Unknown' if not found."),
          jobTitle: z
            .string()
            .describe("The official job title for the position. Return 'Unknown' if not found."),
          jobId: z
            .string()
            .default("N/A")
            .describe("The reference number, Job ID, or requisition number. Return 'N/A' if not found."),
          cleanJobDescription: z
            .string()
            .describe(
              "A clean, stripped, highly scannable version of the job description, listing core responsibilities, key requirements, and competencies, free of unrelated platform boilerplate."
            ),
        }),
        prompt: `You are analyzing a job opportunity description or job portal link.
Original Input: ${text}
Scraped Page Content: ${textToAnalyze.substring(0, 12000)}

Instructions:
1. Extract the Company Name, Job Title, Job ID, and the clean stripped Job Description.
2. If the Scraped Page Content is a blank template, contains minimal text, or appears to be a client-side JavaScript Single Page Application (SPA) skeleton or bot-protected page, fall back to analyzing the Original Input URL.
3. In case of a fallback due to an empty or skeleton page:
   - Deduce the Company Name from the domain name (e.g. 'google.com' becomes 'Google').
   - Deduce the Job Title and Job ID from the URL path slug (e.g. '92691969796383430-product-manager' contains Job ID '92691969796383430' and Job Title 'Product Manager').
   - Set cleanJobDescription to the following warning message: "⚠️ Dynamic Job Portal Detected: We successfully extracted the company, title, and Job ID from the portal link. However, this portal blocks automatic description scraping. Please copy-paste the job description text here to complete your optimization."`,
      });

      return Response.json(result.object);
    } catch (llmError: any) {
      console.error("OpenAI Object generation failed, falling back to local heuristics:", llmError);
      const fallbackResult = isUrl ? heuristicExtractFromUrl(text) : heuristicExtract(text);
      return Response.json({
        ...fallbackResult,
        warning: `AI extraction failed: ${llmError.message || "Unknown error"}. Using robust local heuristic fallback instead.`,
      });
    }
  } catch (error: any) {
    console.error("General error in extract-job API route:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
