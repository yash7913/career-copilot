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
    const { url, text } = await req.json();

    const urlPayload = url ? url.trim() : "";
    const textPayload = text ? text.trim() : "";

    if (!urlPayload && !textPayload) {
      return new Response(
        JSON.stringify({ error: "Missing both URL and text payload. Please provide at least one." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let companyName = "Unknown";
    let jobTitle = "Unknown Position";
    let jobId = "N/A";
    let cleanJobDescription = "";

    // 1. Run URL heuristic extraction if URL is present
    let urlHeuristics = null;
    if (urlPayload) {
      urlHeuristics = heuristicExtractFromUrl(urlPayload);
      companyName = urlHeuristics.companyName;
      jobTitle = urlHeuristics.jobTitle;
      jobId = urlHeuristics.jobId;
    }

    // 2. Run Text heuristic extraction if Text is present
    let textHeuristics = null;
    if (textPayload) {
      textHeuristics = heuristicExtract(textPayload);
      if (companyName === "Unknown" || companyName === "Careers") companyName = textHeuristics.companyName;
      if (jobTitle === "Unknown Position" || jobTitle === "Results") jobTitle = textHeuristics.jobTitle;
      if (jobId === "N/A") jobId = textHeuristics.jobId;
      cleanJobDescription = textHeuristics.cleanJobDescription;
    } else if (urlHeuristics) {
      cleanJobDescription = urlHeuristics.cleanJobDescription;
    }

    // 3. LLM AI Deep Extraction (if OpenAI key is configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        let textToAnalyze = textPayload || urlPayload;
        
        // If URL is provided, try to fetch the page content to feed to LLM
        if (urlPayload) {
          try {
            const response = await fetch(urlPayload, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              },
            });
            if (response.ok) {
              const html = await response.text();
              const scraped = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              
              textToAnalyze = `Scraped Portal Content:\n${scraped.substring(0, 8000)}\n\nUser Pasted Description:\n${textPayload}`;
            }
          } catch (err) {
            console.error("Direct scraper fetch failed during LLM prep:", err);
          }
        }

        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: z.object({
            companyName: z.string().describe("The name of the company offering the job. Return 'Unknown' if not found."),
            jobTitle: z.string().describe("The official job title for the position. Return 'Unknown' if not found."),
            jobId: z.string().default("N/A").describe("The reference number, Job ID, or requisition number. Return 'N/A' if not found."),
            cleanJobDescription: z.string().describe("A clean, stripped, highly scannable version of the job description, listing core responsibilities, key requirements, and competencies, free of unrelated platform boilerplate."),
          }),
          prompt: `You are analyzing a job opportunity description or job portal link.
Original URL Input: ${urlPayload || "None"}
Original Text Input: ${textPayload || "None"}
Scraped & Pasted Context: ${textToAnalyze.substring(0, 12000)}

Instructions:
1. Extract the Company Name, Job Title, Job ID, and the clean stripped Job Description.
2. If both URL and text are provided, prioritize using the URL path slug or title for Company and Title, and prioritize using the Pasted Text Input for the cleanJobDescription body.
3. If the scraped portal content is blank or bot-protected and no Paste Text Input is provided, fall back to URL slug extraction. Deduce the Company Name from the domain name (e.g. 'google.com' becomes 'Google'), and deduce the Job Title and Job ID from the URL path slug.`,
        });

        return Response.json(result.object);
      } catch (llmError: any) {
        console.error("OpenAI Object generation failed, falling back to local heuristics:", llmError);
        return Response.json({
          companyName,
          jobTitle,
          jobId,
          cleanJobDescription,
          warning: `AI extraction failed: ${llmError.message || "Unknown error"}. Using robust local heuristic fallback instead.`,
        });
      }
    }

    // 4. Return Heuristics immediately if no OpenAI API Key is configured
    console.warn("⚠️ OpenAI API Key is missing. Falling back to local heuristic extraction.");
    return Response.json({
      companyName,
      jobTitle,
      jobId,
      cleanJobDescription,
      warning: "OpenAI API Key is missing. Active with robust local heuristic extraction fallback. To unlock premium AI-powered deep parsing, configure the key in your .env.local file.",
    });
  } catch (error: any) {
    console.error("General error in extract-job API route:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
