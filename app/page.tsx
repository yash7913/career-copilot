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
  // Interfaces
  interface JobListing {
    id: string;
    company: string;
    title: string;
    matchScore: number;
    source: string;
    timeText: string;
    alignments: string;
    gaps: string;
    description: string;
    jobId: string;
    url: string;
  }

  interface TrackerCard {
    id: string;
    company: string;
    title: string;
    jobId: string;
    status: "draft" | "applied" | "interviewing" | "closed";
    createdTime: string;
    nextStep?: string;
  }

  interface CompanyCrawler {
    id: string;
    companyName: string;
    careersPageUrl: string;
    atsProvider: "Greenhouse" | "Lever" | "Workday" | "Custom";
    targetSelectors: string;
    lastCrawledAt: string;
    isActiveScraping: boolean;
  }

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authProvider, setAuthProvider] = useState<"Google" | "LinkedIn" | null>(null);

  // Active Navigation View State
  const [activeView, setActiveView] = useState<"workspace" | "discover" | "tracker" | "crawler">("discover");

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warning">("success");

  const showToast = (message: string, type: "success" | "warning" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Aggregated Job Feed state
  const [jobListings, setJobListings] = useState<JobListing[]>([
    {
      id: "job-1",
      company: "Google",
      title: "Lead AI Product Manager",
      matchScore: 94,
      source: "google.com/careers",
      timeText: "4 hours ago",
      alignments: "RAG Architectures, Core Analytics Platforms, Semantic Modeling",
      gaps: "Lacks explicit infrastructure tooling certifications",
      jobId: "GP-926919",
      url: "https://www.google.com/about/careers/applications/jobs/results/92691969796383430-lead-ai-product-manager",
      description: "Minimum qualifications:\nBachelor's degree or equivalent practical experience.\n6 years of experience in product management or related technical roles.\nDeep knowledge of AI/ML foundations, RAG, and semantic modeling.\nPreferred qualifications:\nMaster's degree in technology or business.\nExperience managing complex data platforms and executing long-term roadmaps."
    },
    {
      id: "job-2",
      company: "Stripe",
      title: "Senior Product Manager, Data",
      matchScore: 88,
      source: "stripe.com/jobs",
      timeText: "1 day ago",
      alignments: "Core Analytics Platforms, Enterprise Databases, SQL/Python Metrics",
      gaps: "Lacks explicit financial infrastructure or ledger metrics",
      jobId: "ST-81045",
      url: "https://stripe.com/jobs/results/81045-senior-product-manager-data",
      description: "About the role:\nWe are looking for a Senior Product Manager to lead our Core Data Platform analytics loops.\nQualifications:\n5+ years of PM experience working on platforms, data ingestion, or analytics pipelines.\nStrong user empathy and ability to draft detail-oriented PRDs."
    },
    {
      id: "job-3",
      company: "Netflix",
      title: "Principal Machine Learning Engineer",
      matchScore: 85,
      source: "LinkedIn API",
      timeText: "6 hours ago",
      alignments: "RAG Architectures, Vector Indexes, PyTorch & TensorFlow foundations",
      gaps: "Requires deeper systems engineering backgrounds than present in project logs",
      jobId: "NX-77192",
      url: "https://netflix.com/jobs/principal-ml-engineer",
      description: "Netflix ML platform is scaling up our personalized content suggestions systems.\nKey requirements:\nAdvanced background in large-scale ML systems, semantic representations, and recommendation frameworks."
    },
    {
      id: "job-4",
      company: "Instahyre",
      title: "Data Platform Architect",
      matchScore: 81,
      source: "Instahyre.com",
      timeText: "2 days ago",
      alignments: "Kubernetes, Terraform, Core Analytics Systems scaling",
      gaps: "Lacks domain familiarity with retail recommendation loops",
      jobId: "IH-44021",
      url: "https://instahyre.com/jobs/data-platform-architect",
      description: "Ingest and scale enterprise-grade data platform infrastructures.\nQualifications:\nExperience scaling distributed systems, Spark, Hadoop, Terraform, AWS configurations."
    }
  ]);

  // Unified Application Tracker state
  const [trackerCards, setTrackerCards] = useState<TrackerCard[]>([
    {
      id: "track-1",
      company: "Stripe",
      title: "Staff Product Manager",
      jobId: "ST-88125",
      status: "applied",
      createdTime: "2 days ago",
      nextStep: "Awaiting HR review"
    },
    {
      id: "track-2",
      company: "Apple",
      title: "Sr. Product Manager",
      jobId: "AP-99210",
      status: "interviewing",
      createdTime: "1 week ago",
      nextStep: "Technical Loop: Wednesday 3:00 PM"
    },
    {
      id: "track-3",
      company: "Google",
      title: "Lead AI Product Manager",
      jobId: "GP-926919",
      status: "draft",
      createdTime: "4 hours ago",
      nextStep: "Open Scorecard / Edit Tailored Materials"
    }
  ]);

  // Careers Scraper Directory state
  const [crawlerDirectories, setCrawlerDirectories] = useState<CompanyCrawler[]>([
    {
      id: "crawl-1",
      companyName: "Google",
      careersPageUrl: "https://www.google.com/about/careers/applications/jobs/",
      atsProvider: "Custom",
      targetSelectors: "{\"title\": \".job-title\", \"desc\": \".job-desc\"}",
      lastCrawledAt: "4 hours ago",
      isActiveScraping: true
    },
    {
      id: "crawl-2",
      companyName: "Stripe",
      careersPageUrl: "https://stripe.com/jobs/",
      atsProvider: "Greenhouse",
      targetSelectors: "{\"title\": \".greenhouse-title\", \"desc\": \".greenhouse-desc\"}",
      lastCrawledAt: "12 hours ago",
      isActiveScraping: true
    },
    {
      id: "crawl-3",
      companyName: "Netflix",
      careersPageUrl: "https://netflix.com/jobs/",
      atsProvider: "Lever",
      targetSelectors: "{\"title\": \".lever-title\", \"desc\": \".lever-desc\"}",
      lastCrawledAt: "1 day ago",
      isActiveScraping: false
    },
    {
      id: "crawl-4",
      companyName: "Microsoft",
      careersPageUrl: "https://careers.microsoft.com/",
      atsProvider: "Custom",
      targetSelectors: "{\"title\": \".ms-title\", \"desc\": \".ms-desc\"}",
      lastCrawledAt: "2 hours ago",
      isActiveScraping: true
    }
  ]);

  // Simulated login/auth function
  const startSimulatedAuth = (provider: "Google" | "LinkedIn") => {
    setIsAuthenticating(true);
    setAuthProvider(provider);
    
    const messages = [
      "🔐 Establishing secure connection...",
      provider === "Google" 
        ? "📡 Connecting to Google secure identity provider..." 
        : "📡 Connecting to LinkedIn secure identity provider...",
      "⚡ Retrieving authenticated profile data...",
      "📡 Syncing Yashwanth's profile...",
      "✨ Initializing personalized workspace..."
    ];

    let currentStep = 0;
    setAuthMessage(messages[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < messages.length) {
        setAuthMessage(messages[currentStep]);
      } else {
        clearInterval(interval);
        setIsLoggedIn(true);
        setIsAuthenticating(false);
        setIsAuthModalOpen(false);
        setAuthProvider(null);
      }
    }, 600); // 5 steps * 600ms = 3.0 seconds total
  };

  // Job Auto-Extraction states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
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
      let hasIrrelevant = false;
      const parsedResults: UploadedFile[] = [];

      for (const file of pdfFiles) {
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
        const text = data.text || "";
        // Heuristic relevance analysis
        const lowercaseText = text.toLowerCase();
        const keywords = ["experience", "education", "resume", "skills", "cv", "projects", "work", "presentation", "slide", "portfolio", "sheet"];
        const isProfileRelated = keywords.some(kw => lowercaseText.includes(kw));

        if (!isProfileRelated) {
          hasIrrelevant = true;
          continue; // skip irrelevant document
        }

        // Deep classification evaluation to determine if it is a Resume, Project Detail Sheet, or Technical Slides
        let fileType: "Resume" | "Project Detail Sheet" | "Technical Slides" = "Resume";
        
        const slideIndicators = ["slide", "presentation", "deck", "slide 1", "agenda", "key takeaways", "bullet point", "powerpoint", "ppt", "speaker notes"];
        const resumeIndicators = ["curriculum vitae", "education background", "professional experience", "work experience", "skills summary", "employment history", "certificates", "languages spoken"];
        const projectIndicators = ["technical specification", "system design", "architecture diagram", "database schema", "api routes", "repo", "github", "milestone", "implementation plan", "project details", "technical details"];

        // Score based on occurrences
        let slideScore = slideIndicators.reduce((count, kw) => count + (lowercaseText.split(kw).length - 1), 0);
        let resumeScore = resumeIndicators.reduce((count, kw) => count + (lowercaseText.split(kw).length - 1), 0);
        let projectScore = projectIndicators.reduce((count, kw) => count + (lowercaseText.split(kw).length - 1), 0);

        // Standard keyword presence boosts
        if (lowercaseText.includes("resume") || lowercaseText.includes("cv")) resumeScore += 5;
        if (lowercaseText.includes("experience") && lowercaseText.includes("education")) resumeScore += 5;
        if (lowercaseText.includes("slide") || lowercaseText.includes("deck") || lowercaseText.includes("presentation")) slideScore += 5;
        if (lowercaseText.includes("project") || lowercaseText.includes("technical") || lowercaseText.includes("architecture")) projectScore += 3;

        if (slideScore > resumeScore && slideScore > projectScore) {
          fileType = "Technical Slides";
        } else if (projectScore > resumeScore && projectScore > slideScore) {
          fileType = "Project Detail Sheet";
        } else {
          fileType = "Resume";
        }

        parsedResults.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: fileType,
          text: text,
        });
      }

      if (hasIrrelevant) {
        showToast("unknownn file discovered and disregarded", "warning");
      }

      if (parsedResults.length > 0) {
        setUploadedFiles(prev => [...prev, ...parsedResults]);
        setPdfSuccessMessage(`Successfully uploaded & parsed ${parsedResults.length} file(s)!`);
      }
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
    if (!jobUrl.trim() && !jobDescription.trim()) {
      alert("Please provide either a Job URL or a Job Description text.");
      return;
    }

    setIsExtracting(true);
    setIsExtracted(false);
    setExtractionWarning(null);

    try {
      const response = await fetch("/api/extract-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl, text: jobDescription }),
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
      setExtractedJd(data.cleanJobDescription || jobDescription || jobUrl);
      
      if (data.warning) {
        setExtractionWarning(data.warning);
      }
      setIsExtracted(true);
      setIsDrawerOpen(false); // Close drawer on success
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

    // Auto-inject into My Applications Tracker
    if (extractedCompany && extractedTitle) {
      const existing = trackerCards.find(c => c.company.toLowerCase() === extractedCompany.toLowerCase() && c.title.toLowerCase() === extractedTitle.toLowerCase());
      if (!existing) {
        const newCard: TrackerCard = {
          id: `track-${Math.random().toString(36).substring(7)}`,
          company: extractedCompany,
          title: extractedTitle,
          jobId: extractedJobId || "N/A",
          status: "draft",
          createdTime: "Just now",
          nextStep: "Optimized materials drafted"
        };
        setTrackerCards(prev => [newCard, ...prev]);
        showToast(`✨ Saved ${extractedCompany} to My Applications Tracker!`, "success");
      }
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/25 selection:text-amber-200">
        {/* Sticky Header Navbar */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo circle matching the screenshot */}
            <div className="h-7 w-7 rounded-full bg-[#EAE5D8] flex items-center justify-center shadow-inner relative">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold tracking-widest text-[#EAE5D8] uppercase font-mono">
                Career Co-Pilot
              </h1>
              <span className="text-[10px] text-slate-700 font-mono">/</span>
              <span className="text-[8px] text-[#EAE5D8] font-mono tracking-widest uppercase font-semibold">
                Landing Page
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden md:inline text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              = Powered by GPT-5.2 =
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs font-bold font-mono tracking-wide text-slate-200 border border-slate-800 hover:border-slate-600 hover:text-white px-5 py-2 rounded-full shadow-md bg-transparent transition active:scale-95 duration-200 cursor-pointer"
            >
              Sign up / Sign in
            </button>
          </div>
        </header>

        {/* Hero Section Split Layout */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Box (7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              {/* Top Tag */}
              <div className="w-fit">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  = ◆ Career, Refined =
                </span>
              </div>

              {/* Serif Title Headline with warm italics */}
              <h2 className="text-5xl md:text-6.5xl font-normal text-slate-100 font-serif leading-[1.08] tracking-tight max-w-xl">
                Your career, <br />
                <span className="text-[#EAE5D8] italic font-serif pr-2">re-engineered</span> <br />
                per application.
              </h2>

              {/* Subheadline Copy */}
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-sans max-w-lg mt-2">
                Drop your portfolio. Paste a job. Watch a tailored résumé and cover letter assemble in seconds — with an honest read on where you fit and what's missing.
              </p>
            </div>

            {/* Auth CTA pill buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
              <button
                onClick={() => startSimulatedAuth("Google")}
                className="px-6 py-3.5 bg-[#EAE5D8] hover:bg-[#F3EFE6] text-slate-950 font-bold text-xs tracking-wider rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

              <button
                onClick={() => startSimulatedAuth("LinkedIn")}
                className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-[#EAE5D8] font-bold text-xs tracking-wider rounded-full border border-[#EAE5D8]/50 hover:border-[#EAE5D8] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                Continue with LinkedIn
              </button>

              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase sm:ml-2">
                = 7-Day Session · No Card Required =
              </span>
            </div>

            {/* Bottom Statistics Row */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 md:p-8 mt-6 max-w-xl shadow-lg">
              <div className="grid grid-cols-3 gap-6 text-center divide-x divide-slate-900">
                <div className="flex flex-col gap-2.5">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#EAE5D8]">≤ 38s</span>
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
                    = From Upload to Draft =
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 pl-4">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#EAE5D8]">100%</span>
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
                    = ATS-Aligned Formatting =
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 pl-4">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#EAE5D8]">GPT-5.2</span>
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
                    = Latest OpenAI Reasoning =
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Image / Vector geometric canvas (5 columns) */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center min-h-[400px]">
            {/* SVG Geometric Node Network */}
            <div className="w-full h-full opacity-60 hover:opacity-85 transition-opacity duration-500 relative">
              <svg className="w-full h-full max-h-[500px]" viewBox="0 0 500 500" fill="none">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="250" cy="250" r="220" fill="url(#glow)" className="animate-pulse" />
                <g className="origin-center animate-[spin_85s_linear_infinite]">
                  {/* Nodes wireframe lines */}
                  <polygon points="250,80 120,200 380,200" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                  <polygon points="120,200 180,380 320,380" stroke="#334155" strokeWidth="1" />
                  <polygon points="380,200 320,380 250,80" stroke="#475569" strokeWidth="1" />
                  <line x1="250" y1="80" x2="180" y2="380" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="120" y1="200" x2="320" y2="380" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="380" y1="200" x2="180" y2="380" stroke="#334155" strokeWidth="1.2" />

                  {/* Inner polygons */}
                  <polygon points="250,150 180,250 320,250" stroke="#334155" strokeWidth="0.8" strokeDasharray="4,4" />
                  <polygon points="180,250 210,320 290,320" stroke="#1e293b" strokeWidth="0.8" />
                  <polygon points="320,250 290,320 250,150" stroke="#334155" strokeWidth="0.8" />

                  {/* Spheres glowing nodes */}
                  <circle cx="250" cy="80" r="14" fill="#991b1b" className="animate-pulse" />
                  <circle cx="250" cy="80" r="6" fill="#ef4444" />
                  <circle cx="120" cy="200" r="16" fill="#991b1b" />
                  <circle cx="120" cy="200" r="7" fill="#dc2626" />
                  <circle cx="380" cy="200" r="18" fill="#991b1b" className="animate-pulse" />
                  <circle cx="380" cy="200" r="8" fill="#f87171" />
                  <circle cx="180" cy="380" r="17" fill="#991b1b" />
                  <circle cx="180" cy="380" r="7.5" fill="#dc2626" />
                  <circle cx="320" cy="380" r="15" fill="#991b1b" className="animate-pulse" />
                  <circle cx="320" cy="380" r="6" fill="#ef4444" />
                </g>
              </svg>
            </div>

            {/* Floating Glassmorphism Generation Card */}
            <div className="absolute top-1/3 left-6 md:-left-12 bg-slate-950/75 backdrop-blur-md border border-slate-900 rounded-xl p-5 shadow-2xl w-[310px] animate-[bounce_4.5s_ease-in-out_infinite] z-10 flex flex-col gap-4 font-mono select-none">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">◆ LIVE GENERATION</span>
                <span className="flex items-center gap-1.5 text-[9px] text-[#EAE5D8] font-semibold uppercase font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  streaming
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-mono">match</span>
                  <span className="text-emerald-400 font-bold font-mono">93%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-650 font-mono">writing experience</span>
                  <span className="flex items-center gap-0.5">
                    <span className="h-3 w-1.5 bg-[#EAE5D8] animate-[pulse_0.8s_infinite]"></span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-650 font-mono">gaps</span>
                  <span className="text-amber-200/90 font-semibold text-right">kubernetes, terraform</span>
                </div>
              </div>

              {/* Triple slider metrics */}
              <div className="flex gap-1.5 mt-1">
                <div className="h-1 flex-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/80 w-[40%] rounded-full"></div>
                </div>
                <div className="h-1 flex-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/80 w-[65%] rounded-full"></div>
                </div>
                <div className="h-full bg-[#EAE5D8] w-[90%] rounded-full"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Steps Grid (4 Columns) */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-8 border-t border-slate-900/60 pt-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-amber-200/80 font-mono">01</span>
            <h4 className="text-md font-bold font-serif text-slate-200">Upload</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">Drop your résumé, projects, and decks.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-amber-200/80 font-mono">02</span>
            <h4 className="text-md font-bold font-serif text-slate-200">Target</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">Paste a JD or import from Greenhouse & Lever.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-amber-200/80 font-mono">03</span>
            <h4 className="text-md font-bold font-serif text-slate-200">Tailor</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">Watch GPT-5.2 craft your custom kit.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-amber-200/80 font-mono">04</span>
            <h4 className="text-md font-bold font-serif text-slate-200">Export</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">Download a polished PDF — apply, repeat.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/25 selection:text-amber-200">
      {/* Sticky Header Navbar Overhauled for Yashwanth P */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-900/80 px-6 py-3 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-3 shrink-0">
          {/* Circular beige logo matching screenshot */}
          <div 
            onClick={() => setIsLoggedIn(false)}
            className="h-7 w-7 rounded-full bg-[#EAE5D8] flex items-center justify-center shadow-inner relative group cursor-pointer"
            title="Return to Landing Page"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-950 group-hover:scale-125 transition"></span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <h1 className="text-xs font-bold tracking-widest text-[#EAE5D8] uppercase">
              Career Co-Pilot
            </h1>
            <span className="text-[10px] text-slate-700">/</span>
            <span 
              onClick={() => setIsLoggedIn(false)} 
              className="text-[10px] text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition"
              title="Back to Landing Page"
            >
              Landing Page
            </span>
            <span className="text-[10px] text-slate-700">/</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Workspace</span>
            <span className="text-[10px] text-slate-700">/</span>
            <span className="text-[10px] text-slate-350 uppercase tracking-wider font-semibold">Yashwanth P</span>
          </div>
        </div>

        {/* Unified Command Center Primary Navigation Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl max-w-full overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              setActiveView("discover");
              showToast("📡 Switched to Aggregated Job Feed", "success");
            }}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
              activeView === "discover"
                ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Discover Jobs
          </button>
          <button
            onClick={() => {
              setActiveView("workspace");
              showToast("🛠️ Switched to Resume Tailoring Hub", "success");
            }}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
              activeView === "workspace"
                ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Workspace Hub
          </button>
          <button
            onClick={() => {
              setActiveView("tracker");
              showToast("📋 Switched to Applications Tracker Board", "success");
            }}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
              activeView === "tracker"
                ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            My Applications Tracker
          </button>
          <button
            onClick={() => {
              setActiveView("crawler");
              showToast("📡 Switched to Scraper Directory Portal", "success");
            }}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
              activeView === "crawler"
                ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Crawler Portal
          </button>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex flex-col text-right font-mono">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">
              Applications: {trackerCards.length}
            </span>
            <span className="text-[8px] text-slate-650 uppercase tracking-widest mt-1">
              — Unlimited Tier —
            </span>
          </div>

          {/* Interactive Profile avatar dropdown */}
          <div className="relative group">
            <button 
              className="h-8 w-8 rounded-full border border-slate-800 overflow-hidden shadow-md cursor-pointer hover:border-[#EAE5D8] transition active:scale-95 flex items-center justify-center bg-gradient-to-tr from-amber-600 to-indigo-850"
              title="Yashwanth P Credentials"
            >
              <span className="text-[10px] font-bold text-amber-200">YP</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-900 rounded-xl shadow-2xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
              <div className="px-4 py-2.5 border-b border-slate-900">
                <p className="text-xs font-bold text-slate-200 font-sans">Yashwanth P</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-semibold">yashwanth.p@gmail.com</p>
              </div>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer font-sans"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Dashboard Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* 1. Discover Jobs Feed View (Module 5) */}
        {activeView === "discover" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header / Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  = Multi-Source Ingestion Feed =
                </span>
                <h2 className="text-3xl font-normal font-serif text-slate-100 tracking-tight">
                  Discover <span className="text-[#EAE5D8] italic">Jobs</span>
                </h2>
              </div>

              {/* Sorting and Filtering UI */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Sorted By:</span>
                  <select className="bg-transparent border-none text-xs text-[#EAE5D8] font-semibold focus:outline-none cursor-pointer">
                    <option value="best">Best Match For Your Profile</option>
                    <option value="recent">Most Recent Postings</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Workplace:</span>
                  <select className="bg-transparent border-none text-xs text-[#EAE5D8] font-semibold focus:outline-none cursor-pointer">
                    <option value="all">All Locations</option>
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ingestion Feed Stat Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/20 border border-slate-900 p-4 rounded-xl text-center">
              <div className="flex flex-col gap-1.5">
                <span className="text-xl font-bold font-mono text-[#EAE5D8]">250+</span>
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-semibold">Indexed Corporate Pages</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-[#EAE5D8]">1,842</span>
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-semibold">Scraped Listings Today</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-emerald-400">94%</span>
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-semibold">Top Alignment Score</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-amber-300">12 Hrs</span>
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-semibold">Scraper Refresh Frequency</span>
              </div>
            </div>

            {/* JobListings Cards Container */}
            <div className="flex flex-col gap-5">
              {jobListings.map((job) => (
                <div 
                  key={job.id}
                  className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-6 rounded-2xl shadow-lg transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Top Row: Match percentage and Meta info */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[9px] font-mono border px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                        job.matchScore >= 90 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/35"
                          : "bg-amber-400/10 text-amber-300 border-amber-400/35"
                      }`}>
                        ⭐ {job.matchScore}% Match
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Sourced via <span className="text-slate-400 font-semibold">{job.source}</span>
                      </span>
                      <span className="text-[10px] text-slate-700 font-mono">•</span>
                      <span className="text-[10px] text-slate-500 font-mono">{job.timeText}</span>
                    </div>

                    {/* Job Title and Company */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-200 font-sans tracking-wide">
                        {job.title} <span className="text-slate-650 font-light">@</span> {job.company}
                      </h3>
                    </div>

                    {/* Alignments and Gaps Info */}
                    <div className="flex flex-col gap-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-950/70 font-sans text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                        <span className="text-emerald-400 font-bold shrink-0">Strong Alignment:</span>
                        <span className="text-slate-350">{job.alignments}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 mt-1 border-t border-slate-950/50 pt-1.5">
                        <span className="text-rose-400 font-bold shrink-0">Gap Noted:</span>
                        <span className="text-slate-400">{job.gaps}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => {
                        setExtractedCompany(job.company);
                        setExtractedTitle(job.title);
                        setExtractedJobId(job.jobId);
                        setExtractedJd(job.description);
                        setJobUrl(job.url);
                        setJobDescription(job.description);
                        setIsExtracted(true);
                        setActiveView("workspace");
                        showToast(`⚡ Loaded ${job.company} - Pre-filled & Workspace Active!`, "success");
                      }}
                      className="px-5 py-3 bg-[#EAE5D8] hover:bg-[#F3EFE6] text-slate-950 font-bold text-xs tracking-wider rounded-xl shadow-lg transition active:scale-95 duration-200 flex items-center justify-center gap-2 uppercase shrink-0"
                    >
                      ⚡ 1-Click Tailor App Kit
                    </button>
                    <button
                      onClick={() => {
                        if (trackerCards.some(card => card.jobId === job.jobId)) {
                          showToast("Already tracked in My Applications!", "warning");
                          return;
                        }
                        const newCard: TrackerCard = {
                          id: `track-${Math.random().toString(36).substring(7)}`,
                          company: job.company,
                          title: job.title,
                          jobId: job.jobId,
                          status: "draft",
                          createdTime: "Just now",
                          nextStep: "Drafting optimization kit"
                        };
                        setTrackerCards(prev => [newCard, ...prev]);
                        showToast(`📂 Added ${job.company} to Applications Tracker!`, "success");
                      }}
                      className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-[#EAE5D8] font-bold text-xs tracking-wider rounded-xl border border-[#EAE5D8]/50 hover:border-[#EAE5D8] transition active:scale-95 duration-200 flex items-center justify-center gap-2 uppercase shrink-0"
                    >
                      📂 Track / Save Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Workspace Hub View (Polish Document Generator Canvas) */}
        {activeView === "workspace" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Left Control Panel (5 Columns) */}
            <section className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Target Position Summary Card */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#EAE5D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h2 className="font-serif font-normal text-base text-[#EAE5D8] tracking-wide">
                      Target <span className="italic">Position</span>
                    </h2>
                  </div>
                  {isExtracted && (
                    <span className="text-[9px] bg-[#EAE5D8]/10 text-[#EAE5D8] font-mono border border-[#EAE5D8]/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                      {extractionWarning ? "✨ AI MAP" : "MANUAL"}
                    </span>
                  )}
                </div>

                {isExtracted ? (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-slate-100 leading-snug">
                      {extractedTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium font-sans">
                      {extractedCompany} {extractedJobId && extractedJobId !== "N/A" && `· ID: ${extractedJobId}`}
                    </p>
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="text-xs text-[#EAE5D8] hover:text-[#F3EFE6] hover:underline font-semibold text-left mt-2 flex items-center gap-1 transition w-fit"
                    >
                      Change target →
                    </button>

                    {/* Collapsible Metadata Editor */}
                    <details className="group mt-2 border-t border-slate-850 pt-3">
                      <summary className="text-[10px] text-slate-500 hover:text-slate-300 font-mono tracking-widest uppercase cursor-pointer list-none flex items-center justify-between transition">
                        <span>⚙️ Review / Edit Metadata</span>
                        <span className="group-open:rotate-180 transition-transform duration-200 text-[8px]">▼</span>
                      </summary>

                      <div className="flex flex-col gap-4 mt-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-mono">Company</span>
                            <input
                              type="text"
                              value={extractedCompany}
                              onChange={(e) => setExtractedCompany(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#EAE5D8] focus:ring-1 focus:ring-[#EAE5D8]/10"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 font-mono">Job ID</span>
                            <input
                              type="text"
                              value={extractedJobId}
                              onChange={(e) => setExtractedJobId(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#EAE5D8] focus:ring-1 focus:ring-[#EAE5D8]/10"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-500 font-mono">Job Title</span>
                          <input
                            type="text"
                            value={extractedTitle}
                            onChange={(e) => setExtractedTitle(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#EAE5D8] focus:ring-1 focus:ring-[#EAE5D8]/10 font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-500 font-mono">Clean JD Body</span>
                          <textarea
                            rows={5}
                            value={extractedJd}
                            onChange={(e) => setExtractedJd(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#EAE5D8] focus:ring-1 focus:ring-[#EAE5D8]/10 resize-y font-sans leading-relaxed"
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 py-2 text-center items-center">
                    <svg className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                      No role targeted yet. Connect a job link or copy-paste the description.
                    </p>
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="text-xs bg-[#EAE5D8]/10 hover:bg-[#EAE5D8]/20 text-[#EAE5D8] font-bold border border-[#EAE5D8]/20 px-4 py-2 rounded-lg transition active:scale-95 duration-200 cursor-pointer"
                    >
                      ✨ Map a Role
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-Document Portfolio Vault Card */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#EAE5D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <h2 className="font-serif font-normal text-base text-[#EAE5D8] tracking-wide">
                      Portfolio <span className="italic">Vault</span>
                    </h2>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <span className="text-[10px] bg-[#EAE5D8]/10 text-[#EAE5D8] font-mono border border-[#EAE5D8]/20 px-2 py-0.5 rounded-full font-semibold">
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
                      : "border-slate-800 hover:border-[#EAE5D8] hover:bg-[#EAE5D8]/5"
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
                      <svg className="w-6 h-6 text-slate-600 group-hover:text-[#EAE5D8] transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-slate-300 font-semibold">Drop PDF Portfolio Files Here</span>
                      <span className="text-[10px] text-slate-500">Supports concurrent multi-file uploading</span>
                    </>
                  )}
                </div>

                {pdfSuccessMessage && (
                  <span className="text-[10px] text-emerald-400 font-semibold text-center border border-emerald-500/10 bg-emerald-500/5 py-1.5 rounded-lg font-mono">
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
                            <svg className="w-4 h-4 text-[#EAE5D8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                              className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#EAE5D8]"
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
                    : "bg-[#EAE5D8] hover:bg-[#F3EFE6] text-slate-950 shadow-[#EAE5D8]/5 hover:shadow-[#EAE5D8]/10 active:scale-[0.99]"
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
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                        activeTab === "resume"
                          ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                          : "text-slate-400 hover:text-slate-250"
                      }`}
                    >
                      Tailored Resume Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("cover-letter")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                        activeTab === "cover-letter"
                          ? "bg-[#EAE5D8] text-slate-950 shadow-md shadow-[#EAE5D8]/5"
                          : "text-slate-400 hover:text-slate-250"
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
                          className="text-xs bg-slate-950 border border-slate-800 hover:border-rose-900/40 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/20 font-semibold transition animate-fadeIn"
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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-amber-500/20">
                          {canvasText}
                        </pre>
                      </div>

                      {/* Premium Download Kit Action Button (Triggers Authentication Modal) */}
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-[#EAE5D8] font-bold text-xs tracking-wider rounded-xl border border-[#EAE5D8]/50 hover:border-[#EAE5D8] shadow-lg shadow-white/5 flex items-center justify-center gap-2 uppercase transition-all duration-200"
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
          </div>
        )}

        {/* 3. My Applications Tracker Board View (Module 3) */}
        {activeView === "tracker" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header row with manual addition button */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  = Personal Job Funnel Matrix =
                </span>
                <h2 className="text-3xl font-normal font-serif text-slate-100 tracking-tight">
                  My Applications <span className="text-[#EAE5D8] italic">Tracker</span>
                </h2>
              </div>

              {/* Add Custom Loop button */}
              <button
                onClick={() => {
                  const company = prompt("Enter Company Name:");
                  const title = prompt("Enter Job Title:");
                  const jobId = prompt("Enter Job ID (Optional):") || "N/A";
                  if (company && title) {
                    const newCard: TrackerCard = {
                      id: `track-${Math.random().toString(36).substring(7)}`,
                      company,
                      title,
                      jobId,
                      status: "draft",
                      createdTime: "Just now",
                      nextStep: "Add portfolio documents"
                    };
                    setTrackerCards(prev => [newCard, ...prev]);
                    showToast(`✨ Saved ${company} to Draft funnel!`, "success");
                  }
                }}
                className="px-4 py-2.5 bg-[#EAE5D8]/10 hover:bg-[#EAE5D8]/20 border border-[#EAE5D8]/30 text-[#EAE5D8] font-bold text-[11px] tracking-widest uppercase rounded-lg transition active:scale-95 duration-200"
              >
                ➕ Add Custom Loop
              </button>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(["draft", "applied", "interviewing", "closed"] as const).map((colStatus) => {
                const columnTitleMap = {
                  draft: { title: "Draft / Tailored", color: "border-slate-800 bg-slate-900/10 text-slate-400" },
                  applied: { title: "Applied", color: "border-amber-500/20 bg-amber-500/5 text-amber-200" },
                  interviewing: { title: "Interviewing", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
                  closed: { title: "Offer / Closed", color: "border-slate-900 bg-slate-900/5 text-slate-500" }
                };

                const columnCards = trackerCards.filter(c => c.status === colStatus);

                return (
                  <div key={colStatus} className="flex flex-col gap-4 bg-slate-900/20 border border-slate-900 p-4 rounded-2xl min-h-[450px]">
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h3 className="text-xs font-bold font-serif text-slate-350 tracking-wider">
                        {columnTitleMap[colStatus].title}
                      </h3>
                      <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full font-mono text-slate-400 font-bold">
                        {columnCards.length}
                      </span>
                    </div>

                    {/* Column Cards Container */}
                    <div className="flex flex-col gap-3">
                      {columnCards.length === 0 ? (
                        <div className="py-12 text-center text-[10px] text-slate-650 font-mono uppercase tracking-widest border border-dashed border-slate-900 rounded-xl select-none">
                          No Jobs Here
                        </div>
                      ) : (
                        columnCards.map((card) => (
                          <div 
                            key={card.id}
                            className="bg-slate-950 border border-slate-900 hover:border-slate-850 p-4 rounded-xl shadow flex flex-col gap-3 transition duration-200"
                          >
                            <div className="flex flex-col gap-1">
                              <h4 className="text-xs font-bold text-slate-200 tracking-wide font-sans truncate">
                                {card.title}
                              </h4>
                              <p className="text-[10px] font-mono text-[#EAE5D8] font-bold">
                                @ {card.company}
                              </p>
                              {card.jobId && card.jobId !== "N/A" && (
                                <p className="text-[8px] font-mono text-slate-650">ID: {card.jobId}</p>
                              )}
                            </div>

                            {/* Info tagline */}
                            <div className="text-[9px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-900/40 text-slate-400 font-sans leading-normal">
                              <span className="font-semibold text-[8px] text-slate-500 uppercase tracking-widest block mb-0.5">Next Step</span>
                              {card.nextStep || "No active action logged."}
                            </div>

                            {/* Quick status state transitions */}
                            <div className="flex flex-wrap items-center justify-between border-t border-slate-900 pt-2.5 gap-2 mt-1">
                              <select
                                value={card.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as any;
                                  setTrackerCards(prev => prev.map(c => c.id === card.id ? { ...c, status: newStatus } : c));
                                  showToast(`📂 Updated ${card.company} status to ${newStatus}!`, "success");
                                }}
                                className="bg-slate-900 border border-slate-850 text-[9px] text-[#EAE5D8] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="draft">Draft / Tailored</option>
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="closed">Offer / Closed</option>
                              </select>

                              {/* Delete Card */}
                              <button
                                onClick={() => {
                                  setTrackerCards(prev => prev.filter(c => c.id !== card.id));
                                  showToast(`🗑️ Removed ${card.company} tracker entry`, "warning");
                                }}
                                className="text-[9px] text-rose-400/70 hover:text-rose-450 transition"
                                title="Remove tracker loop"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Careers Scraper Portal Crawler View (Module 5 Scraper DB Index) */}
        {activeView === "crawler" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header row with manual addition */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  = Relational Crawler Database Index =
                </span>
                <h2 className="text-3xl font-normal font-serif text-slate-100 tracking-tight">
                  Crawler <span className="text-[#EAE5D8] italic">Portal</span>
                </h2>
              </div>

              {/* Add index form triggers */}
              <button
                onClick={() => {
                  const companyName = prompt("Enter Organization Name:");
                  const careersPageUrl = prompt("Enter Careers URL:") || "";
                  const atsProvider = (prompt("Enter ATS Provider ('Greenhouse', 'Lever', 'Workday', 'Custom'):") || "Custom") as any;
                  if (companyName && careersPageUrl) {
                    const newCrawler: CompanyCrawler = {
                      id: `crawl-${Math.random().toString(36).substring(7)}`,
                      companyName,
                      careersPageUrl,
                      atsProvider,
                      targetSelectors: "{\"title\": \".title\", \"desc\": \".description\"}",
                      lastCrawledAt: "Never crawled",
                      isActiveScraping: true
                    };
                    setCrawlerDirectories(prev => [...prev, newCrawler]);
                    showToast(`✨ Registered ${companyName} to crawled crawler index!`, "success");
                  }
                }}
                className="px-4 py-2.5 bg-[#EAE5D8]/10 hover:bg-[#EAE5D8]/20 border border-[#EAE5D8]/30 text-[#EAE5D8] font-bold text-[11px] tracking-widest uppercase rounded-lg transition active:scale-95 duration-200"
              >
                ➕ Add Careers Portal Index
              </button>
            </div>

            {/* SQL Table Representation */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl p-6 flex flex-col gap-4 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-serif">
                  company_career_directories index (active rows)
                </h3>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest leading-none font-semibold">
                  SQL Table Matrix Representation
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-[10px] tracking-wider uppercase">
                      <th className="py-3 px-4 font-semibold font-mono">Company ID</th>
                      <th className="py-3 px-4 font-semibold font-mono">Company</th>
                      <th className="py-3 px-4 font-semibold font-mono">Portal URL</th>
                      <th className="py-3 px-4 font-semibold font-mono">ATS Crawler</th>
                      <th className="py-3 px-4 font-semibold font-mono">Last Ingested</th>
                      <th className="py-3 px-4 font-semibold font-mono">Status</th>
                      <th className="py-3 px-4 font-semibold font-mono text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {crawlerDirectories.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/10 transition text-slate-350">
                        <td className="py-3.5 px-4 font-mono text-[9px] text-slate-650">{row.id.substring(0, 10)}...</td>
                        <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">{row.companyName}</td>
                        <td className="py-3.5 px-4 truncate max-w-[200px] text-slate-500" title={row.careersPageUrl}>{row.careersPageUrl}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-mono font-bold text-[#EAE5D8]">
                            {row.atsProvider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-550">{row.lastCrawledAt}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            row.isActiveScraping 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                              : "bg-slate-950 text-slate-650 border border-slate-900"
                          }`}>
                            {row.isActiveScraping ? "CRAWLING" : "STOPPED"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-sans">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                setCrawlerDirectories(prev => prev.map(c => c.id === row.id ? { ...c, isActiveScraping: !c.isActiveScraping } : c));
                                showToast(`⚡ Scraping state toggled for ${row.companyName}`, "success");
                              }}
                              className="text-[10px] text-amber-300 hover:text-amber-250 transition font-bold"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => {
                                setCrawlerDirectories(prev => prev.filter(c => c.id !== row.id));
                                showToast(`🗑️ Scraper portal entry deleted`, "warning");
                              }}
                              className="text-[10px] text-rose-400/80 hover:text-rose-400 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
              <h3 className="text-xl font-bold text-slate-100 tracking-tight bg-gradient-to-r from-amber-200 to-[#EAE5D8] bg-clip-text text-transparent">
                Create Your Command Center
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                Unlock executive PDF downloads, advanced cover letters, and unlimited portfolio syncs. 
                <span className="block mt-1 font-semibold text-emerald-400 text-[10px] tracking-wider uppercase font-mono">
                  🎓 Free tier available for academic domains
                </span>
              </p>
            </div>

            <div className="border-t border-slate-800/80 my-1"></div>

            {/* OAuth Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Google Auth */}
              <button
                onClick={() => startSimulatedAuth("Google")}
                className="w-full py-3 px-4 bg-[#EAE5D8] hover:bg-[#F3EFE6] text-slate-950 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01]"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
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
                onClick={() => startSimulatedAuth("LinkedIn")}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-[#EAE5D8] border border-[#EAE5D8]/55 hover:border-[#EAE5D8] rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01]"
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
      
      {/* Sliding Map-the-Role Drawer Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Blur Backdrop overlay with slow fade-in */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          />

          {/* Sliding Panel Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-slate-950 border-l border-slate-800/80 shadow-2xl flex flex-col p-8 relative animate-slideLeft h-full">
              
              {/* Close Button */}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition hover:bg-slate-900/60 cursor-pointer"
                title="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Drawer Content Body */}
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
                {/* Header Typography */}
                <div className="flex flex-col gap-2 border-b border-slate-800/60 pb-5">
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Target Position Profile</span>
                  <h3 className="text-2xl font-normal text-slate-100 font-serif tracking-tight">
                    Map the <span className="text-[#EAE5D8] italic">Role</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                    Paste anything — messy job posts, LinkedIn dumps, careers-page text. We'll structure it.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-5">
                  {/* Job URL Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400 font-mono tracking-wide uppercase">Job URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://careers.example.com/role"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="bg-slate-900/40 border border-slate-800 focus:border-[#EAE5D8] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EAE5D8]/10 transition-all duration-200 font-mono"
                    />
                  </div>

                  {/* Job Description Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400 font-mono tracking-wide uppercase">Or Paste Job Description</label>
                    <textarea
                      placeholder="Paste the full job description here..."
                      rows={14}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="bg-slate-900/40 border border-slate-800 focus:border-[#EAE5D8] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#EAE5D8]/10 transition-all duration-200 font-sans resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Heuristic Notice in Drawer (Optional review) */}
                {isExtracted && extractionWarning && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-400 font-sans leading-relaxed flex flex-col gap-1.5">
                    <span className="font-bold flex items-center gap-1">
                      ⚠️ Heuristic Fallback Active
                    </span>
                    <span>{extractionWarning}</span>
                  </div>
                )}
              </div>

              {/* Fixed Footer with Map Action Button */}
              <div className="border-t border-slate-800/60 pt-6 mt-4 flex flex-col gap-3">
                <button
                  onClick={handleExtractRole}
                  disabled={isExtracting}
                  className={`w-full py-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 uppercase cursor-pointer ${
                    isExtracting
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-[#EAE5D8] hover:bg-[#F3EFE6] text-slate-950 shadow-[#EAE5D8]/5 active:scale-[0.99]"
                  }`}
                >
                  {isExtracting ? (
                    <>
                      <div className="h-4.5 w-4.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                      Structuring Role...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Analyze & Map Role
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Alerts Panel */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-200 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 animate-fadeIn">
          <span className={`h-2 w-2 rounded-full ${
            toastType === "success" ? "bg-emerald-500 animate-ping" : "bg-rose-500 animate-pulse"
          }`}></span>
          <span className="text-xs font-bold font-mono uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Full-Screen Simulated OAuth Loader Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="flex flex-col items-center justify-center max-w-sm text-center gap-8 animate-scaleUp">
            {/* Spinning orbital loader */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-[#EAE5D8]/10 border-t-[#EAE5D8] animate-spin"></div>
              {/* Inner pulsing logo circle */}
              <div className="h-10 w-10 rounded-full bg-[#EAE5D8] flex items-center justify-center shadow-inner relative animate-pulse">
                <span className="h-2 w-2 rounded-full bg-slate-950"></span>
              </div>
            </div>

            {/* Credential retrieval status message */}
            <div className="flex flex-col gap-3 font-mono">
              <span className="text-[10px] text-slate-500 tracking-widest uppercase">
                = Identity Verification =
              </span>
              <p className="text-sm font-semibold text-slate-200 tracking-wide transition-all duration-300 min-h-[40px] flex items-center justify-center">
                {authMessage}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-[9px] text-[#EAE5D8] tracking-widest uppercase font-semibold">
                  Authenticating via {authProvider}...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
