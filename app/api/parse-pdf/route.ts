import { NextResponse } from "next/server";
import pdf from "pdf-parse-fork";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error("Error parsing PDF resume:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF file", details: error.message },
      { status: 500 }
    );
  }
}
