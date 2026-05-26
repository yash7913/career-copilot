"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";

interface UploadedFile {
  id: string;
  name: string;
  type: "Resume" | "Project Detail Sheet" | "Technical Slides";
  text: string;
}

export default function SaaSWorkspacePage() {
  // Authentication states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Job Auto-Extraction states
  const [jobInput, setJobInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  
  // Extracted Metadata fields (editable)
  const [extractedCompany, setExtractedCompany] = useState("");
  const [extractedTitle, setExtractedTitle] = useState("");
  const [extractedJobId, setExtractedJobId] = useState("");
  const [extractedJd, setExtractedJd] = useState("");

  // Multi-File Portfolio states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI / Tab states
  const [activeTab, setActiveTab] = useState<"resume" | "cover-letter">("resume");
  const [copySuccess, setCopySuccess] = useState(false);

  // Streaming Canvas storage states
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

  // Safe Close Modal on click outside
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const handleModalOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalOverlayRef.current) {
      setIsAuthModalOpen(false);
    }
  };

  // Drag and drop multi-file parser
  const handleMultiFileUpload = async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      alert("Please upload valid PDF files.");
      return;
    }

    setIsParsingPdf(true);
    setPdfSuccessMessage(null);

    try {
      const parsedResults = await Promise.all(
        pdfFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/parse-pdf", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to parse PDF: ${file.name}`);
          }

          const data = await response.json();
          return {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: "Resume" as const, // default type
            text: data.text || "No text extracted.",
          };
        })
      );

      setUploadedFiles(prev => [...prev, ...parsedResults]);
      setPdfSuccessMessage(`Successfully uploaded & parsed ${parsedResults.length} file(s)!`);
    } catch (err: any) {
      console.error(err);
      alert(`Error parsing file(s): ${err.message || "Unknown error occurred"}`);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultiFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultiFileUpload(e.target.files);
    }
  };

  const deleteUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileType = (id: string, type: UploadedFile["type"]) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, type } : f))
    );
  };

  // AI role extraction function
  const handleExtractRole = async () => {
    if (!jobInput.trim()) {
      alert("Please paste the job description or a portal link first.");
      return;
    }

    setIsExtracting(true);
    setIsExtracted(false);
    setExtractionWarning(null);

    try {
      const response = await fetch("/api/extract-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jobInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || "Failed to extract job details."
        );
      }

      const data = await response.json();
      setExtractedCompany(data.companyName || "Unknown");
      setExtractedTitle(data.jobTitle || "Unknown Position");
      setExtractedJobId(data.jobId || "N/A");
      setExtractedJd(data.cleanJobDescription || jobInput);
      
      if (data.warning) {
        setExtractionWarning(data.warning);
      }
      setIsExtracted(true);
    } catch (err: any) {
      console.error(err);
      alert(`Role analysis error: ${err.message || "Failed to parse details."}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit tailoring payload
  const handleTailorMaterials = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one resume or portfolio document in the File Vault.");
      return;
    }

    if (!extractedJd.trim()) {
      alert("Please paste and analyze a target role or input a job description first.");
      return;
    }

    // Reset target tab storage before starting stream
    if (activeTab === "resume") {
      setTailoredResume("");
    } else {
      setCoverLetter("");
    }

    // Consolidate context strings from File Vault array
    const masterPortfolio = uploadedFiles
      .map(file => `--- DOCUMENT: ${file.name} (Document Type: ${file.type}) ---\n${file.text}`)
      .join("\n\n");

    try {
      await complete("", {
        body: {
          profile: masterPortfolio,
          jobDescription: extractedJd,
          company: extractedCompany,
          jobId: extractedJobId,
          mode: activeTab,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Streaming connection failed.");
    }
  };

  const getCanvasText = () => {
    if (isLoading) return completion;
    return activeTab === "resume" ? tailoredResume : coverLetter;
  };

  const canvasText = getCanvasText();

  const handleCopyToClipboard = () => {
    if (!canvasText) return;
    navigator.clipboard.writeText(canvasText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExportAsMarkdown = () => {
    if (!canvasText) return;
    const blob = new Blob([canvasText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = activeTab === "resume"
      ? `${extractedCompany.replace(/\s+/g, "_") || "Tailored"}_Resume.md`
      : `${extractedCompany.replace(/\s+/g, "_") || "Tailored"}_Cover_Letter.md`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Career Copilot
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">WORKSPACE.V1</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium transition duration-200"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main SaaS Dashboard Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Panel (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Master Job Analyzer Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="font-semibold text-sm text-slate-200 tracking-wide uppercase">AI Role Auto-Extractor</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-mono">Job Description Text or Portal Link</label>
              <textarea
                placeholder="Paste the target job description text body or drop a portal link (e.g. https://linkedin.com/jobs/...) here..."
                rows={5}
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-y"
              />
            </div>

            <button
              onClick={handleExtractRole}
              disabled={isExtracting}
              className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 border border-blue-900/30 ${
                isExtracting
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-blue-950/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
              }`}
            >
              {isExtracting ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Role...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Analyze Role
                </>
              )}
            </button>

            {/* Editable Metadata Review Panel */}
            {isExtracted && (
              <div className="mt-2 border-t border-slate-800/80 pt-4 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${extractionWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  <span className={`text-[10px] font-mono tracking-widest uppercase ${extractionWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {extractionWarning ? "Metadata Heuristics Active" : "Metadata Extracted"}
                  </span>
                </div>

                {extractionWarning && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-400 font-sans leading-relaxed flex flex-col gap-1.5">
                    <span className="font-bold flex items-center gap-1">
                      ⚠️ OpenAI API Key Missing / Fallback Active
                    </span>
                    <span>{extractionWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">Company</span>
                    <input
                      type="text"
                      value={extractedCompany}
                      onChange={(e) => setExtractedCompany(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">Job ID</span>
                    <input
                      type="text"
                      value={extractedJobId}
                      onChange={(e) => setExtractedJobId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">Job Title</span>
                  <input
                    type="text"
                    value={extractedTitle}
                    onChange={(e) => setExtractedTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">Clean JD Body</span>
                  <textarea
                    rows={4}
                    value={extractedJd}
                    onChange={(e) => setExtractedJd(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Multi-Document Portfolio Vault Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <h2 className="font-semibold text-sm text-slate-200 tracking-wide uppercase">Portfolio Vault</h2>
              </div>
              {uploadedFiles.length > 0 && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {uploadedFiles.length} File(s)
                </span>
              )}
            </div>

            {/* Drag & Drop PDF Multi-Uploader */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition duration-300 flex flex-col items-center justify-center gap-2 group ${
                isParsingPdf
                  ? "border-amber-500 bg-amber-500/5 animate-pulse"
                  : "border-slate-800 hover:border-blue-500 hover:bg-slate-900/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                multiple
                className="hidden"
              />
              {isParsingPdf ? (
                <>
                  <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-amber-400 font-semibold font-mono">Parsing PDF files...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-500 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-xs text-slate-300 font-semibold">Drop PDF Portfolio Files Here</span>
                  <span className="text-[10px] text-slate-500">Supports concurrent multi-file uploading</span>
                </>
              )}
            </div>

            {pdfSuccessMessage && (
              <span className="text-[10px] text-emerald-400 font-semibold text-center border border-emerald-500/10 bg-emerald-500/5 py-1.5 rounded-lg">
                {pdfSuccessMessage}
              </span>
            )}

            {/* File Vault Inventory */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Active Vault Inventory</span>
                <div className="flex flex-col gap-2.5 max-h-[220px] overflow-auto pr-1">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-900 p-2.5 rounded-xl transition hover:border-slate-800"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-medium text-slate-300 truncate font-mono">
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Drop-down Tag Selector */}
                        <select
                          value={file.type}
                          onChange={(e) => updateFileType(file.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Resume">Resume</option>
                          <option value="Project Detail Sheet">Project Sheet</option>
                          <option value="Technical Slides">Slides</option>
                        </select>

                        {/* Delete Row button */}
                        <button
                          onClick={() => deleteUploadedFile(file.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete file"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleTailorMaterials}
            disabled={isLoading || isParsingPdf || isExtracting}
            className={`w-full py-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 hover:scale-[1.01] uppercase ${
              isLoading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 hover:shadow-blue-500/25 active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4.5 w-4.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                Streaming Optimizations...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {activeTab === "resume" ? "Optimize Portfolio Resume" : "Compose Tailored Cover Letter"}
              </>
            )}
          </button>
        </section>

        {/* Right Preview/Output Panel (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
            
            {/* Split Tabs & Controls Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900">
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                    activeTab === "resume"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tailored Resume Preview
                </button>
                <button
                  onClick={() => setActiveTab("cover-letter")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                    activeTab === "cover-letter"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
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
                      className="text-xs bg-slate-950 border border-slate-800 hover:border-rose-900/40 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/20 font-semibold transition"
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
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-5 overflow-auto max-h-[550px] shadow-inner relative">
                    {/* Active streaming indicators */}
                    {isLoading && (
                      <span className="absolute top-4 right-4 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-blue-600/40">
                      {canvasText}
                    </pre>
                  </div>

                  {/* Premium Download Kit Action Button (Triggers Authentication Modal) */}
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 uppercase transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Formatted PDF Kit
                  </button>
                </div>
              ) : (
                <div className="flex-1 border border-slate-900 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-600">
                  <svg className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">No tailored content generated</h3>
                  <p className="text-xs max-w-xs text-slate-600">Analyze the opportunity and submit your portfolio documents to begin streaming tailored results.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Authentication Modal Dialog Component */}
      {isAuthModalOpen && (
        <div 
          ref={modalOverlayRef}
          onClick={handleModalOverlayClick}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl flex flex-col gap-6 relative animate-scaleUp">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Typography Header */}
            <div className="text-center flex flex-col gap-1.5">
              <h3 className="text-xl font-bold text-slate-100 tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Create Your Command Center
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                Unlock executive PDF downloads, advanced cover letters, and unlimited portfolio syncs. 
                <span className="block mt-1 font-semibold text-emerald-400 text-[10px] tracking-wider uppercase">
                  🎓 Free tier available for academic domains
                </span>
              </p>
            </div>

            <div className="border-t border-slate-800/80 my-1"></div>

            {/* OAuth Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Google Auth */}
              <button
                onClick={() => {
                  alert("Redirecting to Google Secure Authentication...");
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 text-xs font-bold tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01]"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.77 14.93 1 12 1 7.39 1 3.4 3.65 1.48 7.5l3.86 3C6.27 7.62 8.89 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.82-.07-1.6-.21-2.27H12v4.51h6.46c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-1.99 3.71-4.92 3.71-8.69z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.34 14.5A7.16 7.16 0 0 1 5 12c0-.87.15-1.72.43-2.5L1.57 6.5C.57 8.5 0 10.5 0 12c0 1.5.57 3.5 1.57 5.5l3.77-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.11 0-5.73-2.58-6.66-5.46l-3.86 3C3.4 20.35 7.39 23 12 23z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* LinkedIn Auth */}
              <button
                onClick={() => {
                  alert("Redirecting to LinkedIn Secure Authentication...");
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-200 text-xs font-bold tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01]"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                Continue with LinkedIn
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              By proceeding, you agree to our Terms of Service & Privacy Policy. 
              We never share your portfolio data with third-party aggregators.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
