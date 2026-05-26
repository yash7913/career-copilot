import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing text or portal link payload." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let textToAnalyze = text;

    // Proactive web scraper fallback if input is a URL
    if (text.trim().startsWith("http://") || text.trim().startsWith("https://")) {
      try {
        const response = await fetch(text.trim(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });
        if (response.ok) {
          const html = await response.text();
          // Strip CSS, JS, and extra tags for cleaner AI extraction context
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
  } catch (error: any) {
    console.error("Error extracting job details:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
