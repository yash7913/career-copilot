"use client";

import React, { useState, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";

export default function WorkspacePage() {
  // Input configuration states
  const [company, setCompany] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [profileText, setProfileText] = useState("");

  // UI States
  const [activeTab, setActiveTab] = useState<"resume" | "cover-letter">("resume");
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Material storage states
  const [tailoredResume, setTailoredResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // Vercel AI SDK completion hook
  const { complete, completion, isLoading, stop } = useCompletion({
    api: "/api/tailor",
    onFinish: (prompt, finalCompletion) => {
      if (activeTab === "resume") {
        setTailoredResume(finalCompletion);
      } else {
        setCoverLetter(finalCompletion);
      }
    },
  });

  // Handle drag-and-drop PDF parsing
  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    setIsParsingPdf(true);
    setPdfSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse PDF resume");
      }

      const data = await response.json();
      if (data.text) {
        setProfileText(data.text);
        setPdfSuccess(`Successfully parsed "${file.name}"!`);
      } else {
        throw new Error("No text content found in PDF");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error parsing PDF: ${err.message || "Unknown error occurred"}`);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfUpload(e.target.files[0]);
    }
  };

  // Trigger streaming completion for active tab
  const handleGenerate = async () => {
    if (!profileText.trim() || !jobDescription.trim()) {
      alert("Please fill in both your Candidate Profile and the Job Description.");
      return;
    }

    // Reset previous tab text when generating
    if (activeTab === "resume") {
      setTailoredResume("");
    } else {
      setCoverLetter("");
    }

    try {
      await complete("", {
        body: {
          profile: profileText,
          jobDescription,
          company,
          jobId,
          mode: activeTab,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Error generating tailored content.");
    }
  };

  // Determine current active content for text canvas
  const getCanvasContent = () => {
    if (isLoading) {
      return completion;
    }
    return activeTab === "resume" ? tailoredResume : coverLetter;
  };

  const canvasText = getCanvasContent();

  // Copy to clipboard utility
  const handleCopyToClipboard = () => {
    if (!canvasText) return;
    navigator.clipboard.writeText(canvasText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Export as Markdown utility
  const handleExportAsMarkdown = () => {
    if (!canvasText) return;
    const blob = new Blob([canvasText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = activeTab === "resume" 
      ? `${company.replace(/\s+/g, "_") || "Tailored"}_Resume.md`
      : `${company.replace(/\s+/g, "_") || "Tailored"}_Cover_Letter.md`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
      {/* Premium Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Career Copilot
            </h1>
            <p className="text-xs text-slate-400 font-medium">AI-Powered Resume & Cover Letter Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GPT-4o-Mini Connected
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Configurations (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="font-semibold text-slate-200">Target Opportunity</h2>
            </div>

            {/* Target Opportunity Input Group */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Company</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Job ID</label>
                <input
                  type="text"
                  placeholder="e.g. #9088"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Job Description</label>
              <textarea
                placeholder="Paste the target job description details and requirements here..."
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 resize-y"
              />
            </div>
          </div>

          {/* Profile / Resume Panel */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="font-semibold text-slate-200">Your Profile & Experience</h2>
              </div>
              {profileText && (
                <button
                  onClick={() => {
                    setProfileText("");
                    setPdfSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Drag and Drop PDF Uploader */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition duration-300 flex flex-col items-center justify-center gap-2 group ${
                isParsingPdf
                  ? "border-amber-500 bg-amber-500/5"
                  : pdfSuccess
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-slate-800 hover:border-indigo-500 hover:bg-slate-900/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              {isParsingPdf ? (
                <>
                  <div className="h-7 w-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-amber-400 font-semibold">Extracting text from PDF resume...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">{pdfSuccess}</span>
                  <span className="text-[10px] text-slate-500">Click to upload another PDF file</span>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7 text-slate-500 group-hover:text-indigo-400 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs text-slate-300 font-semibold">Drag & Drop PDF Resume here</span>
                  <span className="text-[10px] text-slate-500">or click to browse local files</span>
                </>
              )}
            </div>

            {/* Profile Content Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Profile Text Content</label>
              <textarea
                placeholder="Paste your resume details, job history, and skills here..."
                rows={6}
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 resize-y"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || isParsingPdf}
            className={`w-full py-4 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 hover:scale-[1.01] ${
              isLoading
                ? "bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-indigo-600/10 hover:shadow-indigo-500/25"
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Streaming Optimizations...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {activeTab === "resume" ? "Optimize & Tailor Resume" : "Generate Optimized Cover Letter"}
              </>
            )}
          </button>
        </section>

        {/* Right Panel: Tabbed Canvas (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
            {/* Split Tabs & Canvas Control Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                    activeTab === "resume"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tailored Resume Preview
                </button>
                <button
                  onClick={() => setActiveTab("cover-letter")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                    activeTab === "cover-letter"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Cover Letter
                </button>
              </div>

              {/* Utility Canvas controls */}
              {canvasText && (
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <button
                      onClick={stop}
                      className="text-xs bg-slate-950 border border-slate-800 hover:border-rose-800/40 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/20 font-semibold transition"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={handleCopyToClipboard}
                    className="text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-semibold transition flex items-center gap-1.5"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExportAsMarkdown}
                    className="text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-semibold transition flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export .md
                  </button>
                </div>
              )}
            </div>

            {/* Live Streaming Text Canvas */}
            <div className="flex-1 flex flex-col mt-4 min-h-[350px]">
              {canvasText ? (
                <div className="flex-1 bg-slate-950/40 border border-slate-800/60 rounded-xl p-5 overflow-auto max-h-[600px] shadow-inner relative group">
                  {/* Subtle pulsing dot indicating active streaming */}
                  {isLoading && (
                    <span className="absolute top-4 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                  {/* Styled Raw Markdown/Text rendering */}
                  <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap font-sans leading-relaxed selection:bg-indigo-600/40">
                    {canvasText}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 border border-slate-800/40 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                  <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-slate-400 text-sm">No tailored content generated yet</h3>
                  <p className="text-xs max-w-sm">Configure your opportunity inputs and click &quot;Optimize&quot; on the left pane to stream tailored outputs.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
