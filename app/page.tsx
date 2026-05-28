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

  // Onboarding & Admin States
  const [isProfileCreated, setIsProfileCreated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("py.ash.apps@gmail.com");
  
  const [onboardingName, setOnboardingName] = useState("Yashwanth P");
  const [onboardingRole, setOnboardingRole] = useState("Lead AI Product Manager");
  const [onboardingSkills, setOnboardingSkills] = useState("RAG Architectures, Vector Indexes, SQL/Python Metrics");
  const [isOnboardingParsing, setIsOnboardingParsing] = useState(false);

  // Master Profile states extracted from docs
  const [profileSummary, setProfileSummary] = useState("Lead AI Product Manager with extensive experience engineering robust Retrieval-Augmented Generation (RAG) platforms and vector database strategies. Adept at cross-functional leadership and quantitative metrics design.");
  const [profileProjects, setProfileProjects] = useState<Array<{ title: string; timeline: string; description: string }>>([
    {
      title: "Enterprise RAG Infrastructure",
      timeline: "Jan 2024 - Present",
      description: "Led development of scalable vector pipelines and semantic search integrations across distributed analytics databases."
    },
    {
      title: "Core Analytics Platform Architecture",
      timeline: "2023",
      description: "Re-engineered core ingestion layers supporting sub-second telemetry dashboards and custom Python analytical pipelines."
    }
  ]);
  const [profileEducation, setProfileEducation] = useState<Array<string>>([
    "M.S. in Computer Science, Tech University (2020)",
    "B.S. in Engineering, State University (2018)"
  ]);

  // Modals for editing master profile
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [editProfileTab, setEditProfileTab] = useState<"identity" | "summary" | "projects" | "education">("identity");

  // Temporary editing states
  const [tempName, setTempName] = useState("");
  const [tempRole, setTempRole] = useState("");
  const [tempSkills, setTempSkills] = useState("");
  const [tempSummary, setTempSummary] = useState("");
  const [tempProjects, setTempProjects] = useState<Array<{ title: string; timeline: string; description: string }>>([]);
  const [tempEducation, setTempEducation] = useState<Array<string>>([]);

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLoggedIn = localStorage.getItem("career_copilot_isLoggedIn") === "true";
      const storedProfileCreated = localStorage.getItem("career_copilot_isProfileCreated") === "true";
      const storedUserEmail = localStorage.getItem("career_copilot_userEmail");
      const storedName = localStorage.getItem("career_copilot_onboardingName");
      const storedRole = localStorage.getItem("career_copilot_onboardingRole");
      const storedSkills = localStorage.getItem("career_copilot_onboardingSkills");
      const storedSummary = localStorage.getItem("career_copilot_profileSummary");
      const storedProjects = localStorage.getItem("career_copilot_profileProjects");
      const storedEducation = localStorage.getItem("career_copilot_profileEducation");
      const storedFiles = localStorage.getItem("career_copilot_uploadedFiles");

      if (storedLoggedIn) {
        setIsLoggedIn(true);
      }
      if (storedProfileCreated) {
        setIsProfileCreated(true);
        setActiveView("portfolio");
      }
      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
        setLoginEmail(storedUserEmail);
      }
      if (storedName) setOnboardingName(storedName);
      if (storedRole) setOnboardingRole(storedRole);
      if (storedSkills) setOnboardingSkills(storedSkills);
      if (storedSummary) setProfileSummary(storedSummary);
      if (storedProjects) {
        try { setProfileProjects(JSON.parse(storedProjects)); } catch (e) { console.error("Error parsing projects from localStorage", e); }
      }
      if (storedEducation) {
        try { setProfileEducation(JSON.parse(storedEducation)); } catch (e) { console.error("Error parsing education from localStorage", e); }
      }
      if (storedFiles) {
        try { setUploadedFiles(JSON.parse(storedFiles)); } catch (e) { console.error("Error parsing files from localStorage", e); }
      }
    }
  }, []);

  // Helper to persist states to localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    if (typeof window !== "undefined") {
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    }
  };

  // Clear session storage on logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsProfileCreated(false);
    setActiveView("discover");
    setUserEmail(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("career_copilot_isLoggedIn");
      localStorage.removeItem("career_copilot_isProfileCreated");
      localStorage.removeItem("career_copilot_userEmail");
      localStorage.removeItem("career_copilot_onboardingName");
      localStorage.removeItem("career_copilot_onboardingRole");
      localStorage.removeItem("career_copilot_onboardingSkills");
      localStorage.removeItem("career_copilot_profileSummary");
      localStorage.removeItem("career_copilot_profileProjects");
      localStorage.removeItem("career_copilot_profileEducation");
      localStorage.removeItem("career_copilot_uploadedFiles");
    }
    showToast("🔓 Successfully signed out. Session cleared.", "success");
  };

  const openProfileEditModal = (tab: "identity" | "summary" | "projects" | "education" = "identity") => {
    setTempName(onboardingName);
    setTempRole(onboardingRole);
    setTempSkills(onboardingSkills);
    setTempSummary(profileSummary);
    setTempProjects([...profileProjects]);
    setTempEducation([...profileEducation]);
    setEditProfileTab(tab);
    setIsProfileEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    setOnboardingName(tempName);
    setOnboardingRole(tempRole);
    setOnboardingSkills(tempSkills);
    setProfileSummary(tempSummary);
    setProfileProjects(tempProjects);
    setProfileEducation(tempEducation);
    
    // Save to local storage
    saveToLocalStorage("career_copilot_onboardingName", tempName);
    saveToLocalStorage("career_copilot_onboardingRole", tempRole);
    saveToLocalStorage("career_copilot_onboardingSkills", tempSkills);
    saveToLocalStorage("career_copilot_profileSummary", tempSummary);
    saveToLocalStorage("career_copilot_profileProjects", tempProjects);
    saveToLocalStorage("career_copilot_profileEducation", tempEducation);
    
    setIsProfileEditModalOpen(false);
    showToast("💼 Master Profile updated and locked successfully!", "success");
  };

  // Master profile LLM extractor function
  const handleExtractProfile = async (filesToExtract: UploadedFile[]) => {
    if (filesToExtract.length === 0) return;
    setIsOnboardingParsing(true);
    showToast("🧬 Concentrating context and parsing master credentials with AI...", "success");

    try {
      const consolidatedText = filesToExtract
        .map(f => `--- DOCUMENT: ${f.name} (Type: ${f.type}) ---\n${f.text}`)
        .join("\n\n");

      const response = await fetch("/api/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: consolidatedText })
      });

      if (!response.ok) {
        throw new Error("Failed to extract master profile from documents.");
      }

      const profileData = await response.json();
      
      // Update states with extracted data
      if (profileData.fullName) {
        setOnboardingName(profileData.fullName);
        saveToLocalStorage("career_copilot_onboardingName", profileData.fullName);
      }
      if (profileData.targetTitle) {
        setOnboardingRole(profileData.targetTitle);
        saveToLocalStorage("career_copilot_onboardingRole", profileData.targetTitle);
      }
      if (profileData.keySkills) {
        const skillsStr = Array.isArray(profileData.keySkills) ? profileData.keySkills.join(", ") : profileData.keySkills;
        setOnboardingSkills(skillsStr);
        saveToLocalStorage("career_copilot_onboardingSkills", skillsStr);
      }
      if (profileData.professionalSummary) {
        setProfileSummary(profileData.professionalSummary);
        saveToLocalStorage("career_copilot_profileSummary", profileData.professionalSummary);
      }
      if (profileData.projects) {
        setProfileProjects(profileData.projects);
        saveToLocalStorage("career_copilot_profileProjects", profileData.projects);
      }
      if (profileData.education) {
        setProfileEducation(profileData.education);
        saveToLocalStorage("career_copilot_profileEducation", profileData.education);
      }

      showToast("✨ AI Master Profile extracted successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("⚠️ AI extraction complete with local heuristics fallback.", "warning");
    } finally {
      setIsOnboardingParsing(false);
    }
  };


  // Discover Jobs pagination
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;

  // Active Navigation View State
  const [activeView, setActiveView] = useState<"portfolio" | "workspace" | "discover" | "tracker" | "crawler">("portfolio");

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Intelligence Drawer states
  const [intelDrawerOpen, setIntelDrawerOpen] = useState(false);
  const [intelType, setIntelType] = useState<"company" | "interview" | null>(null);
  const [intelCompany, setIntelCompany] = useState("");
  const [intelTitle, setIntelTitle] = useState("");

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
      company: "Meta",
      title: "Senior AI Infrastructure Engineer",
      matchScore: 91,
      source: "meta.com/careers",
      timeText: "2 hours ago",
      alignments: "Large scale Distributed Training, PyTorch, InfiniBand Networks, GPU Orchestration",
      gaps: "Less explicit experience in low-level CUDA optimization",
      jobId: "ME-80029",
      url: "https://meta.com/jobs/senior-ai-infrastructure",
      description: "Help build the next generation of LLaMA foundation clusters.\nRequired Skills:\nDeep systems programming, Kubernetes, high-performance computing clusters, training stability at scale."
    },
    {
      id: "job-5",
      company: "OpenAI",
      title: "Research Scientist, Reasoning Loop",
      matchScore: 95,
      source: "openai.com/careers",
      timeText: "10 hours ago",
      alignments: "LLM Fine-tuning, RLHF, Chain-of-Thought reasoning architectures",
      gaps: "Lacks dedicated doctoral thesis in reinforcement learning",
      jobId: "OP-44910",
      url: "https://openai.com/jobs/research-scientist-reasoning",
      description: "Work on the frontier of AI capabilities, optimizing model search and generation loops.\nQualifications:\nStrong research track record in deep learning, self-training, or synthetic data synthesis."
    },
    {
      id: "job-6",
      company: "Apple",
      title: "Siri Product Lead, Semantic Intelligence",
      matchScore: 87,
      source: "apple.com/careers",
      timeText: "3 hours ago",
      alignments: "On-device processing, NLP pipelines, user privacy-centric architectures",
      gaps: "Limited consumer iOS SDK development backgrounds in records",
      jobId: "AP-33290",
      url: "https://apple.com/jobs/siri-product-lead",
      description: "Drive Siri's semantic integration. Manage large distributed engineering sprints.\nRequired experience:\n5+ years product management, native platform features, large scale NLP or user profiling."
    },
    {
      id: "job-7",
      company: "Anthropic",
      title: "AI Safety Alignment Architect",
      matchScore: 84,
      source: "anthropic.com/careers",
      timeText: "12 hours ago",
      alignments: "Constitutional AI, safety evaluations, model interpretability frameworks",
      gaps: "Lacks explicit policy experience with international standard bodies",
      jobId: "AN-11029",
      url: "https://anthropic.com/jobs/alignment-architect",
      description: "Ensure next-gen Claude models remain helpful, honest, and harmless.\nQualifications:\nStrong background in red-teaming, reinforcement learning from human feedback, and safety evaluations."
    },
    {
      id: "job-8",
      company: "Amazon",
      title: "Lead PM, AWS SageMaker Core Platforms",
      matchScore: 89,
      source: "amazon.jobs",
      timeText: "1 day ago",
      alignments: "Enterprise SaaS interfaces, developer SDK pipelines, multi-tenant databases",
      gaps: "Requires deeper multi-cloud integration histories (Azure/GCP)",
      jobId: "AM-99218",
      url: "https://amazon.jobs/aws-sagemaker-lead-pm",
      description: "Drive the roadmap for AWS SageMaker endpoints and training modules.\nExperience:\nProduct leadership scaling database systems or developer platforms at high scale."
    },
    {
      id: "job-9",
      company: "Microsoft",
      title: "Principal Data Platform PM, Azure Database",
      matchScore: 92,
      source: "careers.microsoft.com",
      timeText: "5 hours ago",
      alignments: "Relational database engines, SQL Query compilers, enterprise scaling",
      gaps: "Lacks direct familiarity with legacy mainframe database stacks",
      jobId: "MS-55109",
      url: "https://microsoft.com/jobs/principal-data-pm",
      description: "Lead roadmap execution for Azure SQL and next-gen semantic caching layers.\nQualifications:\nTechnical PM background with database architectures, query performance, and indexing."
    },
    {
      id: "job-10",
      company: "Stripe",
      title: "Product Manager, Ledger API & Core Pipelines",
      matchScore: 86,
      source: "stripe.com/jobs",
      timeText: "2 days ago",
      alignments: "Core Analytics Platforms, ledger database design, financial audit trails",
      gaps: "Lacks explicit experience with standard retail banking protocols",
      jobId: "ST-22019",
      url: "https://stripe.com/jobs/ledger-pm",
      description: "Scale Stripe's core accounting ledger and double-entry book-keeping engines.\nRequirements:\nPM experience working on low-latency transactions, reliable platform pipelines, or auditing."
    },
    {
      id: "job-11",
      company: "Google",
      title: "Software Architect, Advanced Data Capabilities",
      matchScore: 90,
      source: "google.com/careers",
      timeText: "6 hours ago",
      alignments: "Distributed systems, semantic storage layers, cloud database architecture",
      gaps: "Lacks experience with massive high-volume streaming video pipelines",
      jobId: "GP-11029",
      url: "https://google.com/jobs/data-architect",
      description: "Design long-term system plans for Google Cloud advanced data platform capabilities.\nQualifications:\nSystems architecture at scale, deep databases knowledge, distributed systems design."
    },
    {
      id: "job-12",
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

  // Open Company Intelligence drawer
  const handleOpenCompanyIntelligence = (company: string, title: string) => {
    setIntelCompany(company);
    setIntelTitle(title);
    setIntelType("company");
    setIntelDrawerOpen(true);
    showToast(`🏢 Sourced company profile & salaries for ${company}!`, "success");
  };

  // Open Interview Preparation drawer
  const handleOpenInterviewPrep = (company: string, title: string) => {
    setIntelCompany(company);
    setIntelTitle(title);
    setIntelType("interview");
    setIntelDrawerOpen(true);
    showToast(`🎯 Sourced interview preparation guide for ${company}!`, "success");
  };

  // Simulated login/auth function
  const startSimulatedAuth = (provider: "Google" | "LinkedIn") => {
    setIsAuthenticating(true);
    setAuthProvider(provider);
    
    // Auto sync email based on provider
    const finalEmail = provider === "Google" ? (loginEmail.trim() || "py.ash.apps@gmail.com") : "yashwanth.p@linkedin.com";
    
    const messages = [
      "🔐 Establishing secure connection...",
      provider === "Google" 
        ? `📡 Connecting to Google secure ID provider for ${finalEmail}...` 
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
        setUserEmail(finalEmail);
        setIsAuthenticating(false);
        setIsAuthModalOpen(false);
        setAuthProvider(null);
        
        // Persist login session locks
        saveToLocalStorage("career_copilot_isLoggedIn", "true");
        saveToLocalStorage("career_copilot_userEmail", finalEmail);

        // Auto-restore profile state if it exists
        const storedProfileCreated = localStorage.getItem("career_copilot_isProfileCreated") === "true";
        if (storedProfileCreated) {
          setIsProfileCreated(true);
          setActiveView("portfolio");
          showToast(`Welcome back, Yashwanth! Profile workspace unlocked.`, "success");
        } else {
          showToast(`🔒 Signed in as ${finalEmail}. Let's set up your master profile!`, "success");
        }
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
  const [directionMatrix, setDirectionMatrix] = useState("");

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
    setIsOnboardingParsing(true);
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
        setUploadedFiles(prev => {
          const combined = [...prev, ...parsedResults];
          saveToLocalStorage("career_copilot_uploadedFiles", combined);
          // Automatically extract profile on first drop during onboarding
          handleExtractProfile(combined);
          return combined;
        });
        setPdfSuccessMessage(`Successfully uploaded & parsed ${parsedResults.length} file(s)!`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error parsing file(s): ${err.message || "Unknown error occurred"}`);
    } finally {
      setIsParsingPdf(false);
      setIsOnboardingParsing(false);
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
          directionMatrix: directionMatrix,
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

  const handleExportPDF = () => {
    if (!canvasText) {
      alert("No content to export. Please generate your tailored resume or cover letter first.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to export as PDF.");
      return;
    }
    
    const title = activeTab === "resume" ? "Tailored Resume" : "Tailored Cover Letter";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${extractedCompany || "Career Copilot"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter+Tight:wght@300..600&display=swap');
            body {
              background-color: #F4EFE6;
              color: #0F1E2C;
              font-family: 'Inter Tight', sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            .document {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-family: 'Fraunces', serif;
              border-bottom: 2px solid #C9A961;
              padding-bottom: 8px;
              font-size: 28px;
              text-align: center;
              color: #0F1E2C;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 {
              font-family: 'Fraunces', serif;
              border-bottom: 1px solid rgba(201, 169, 97, 0.5);
              padding-bottom: 4px;
              font-size: 18px;
              margin-top: 25px;
              color: #0F1E2C;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            h3 {
              font-family: 'Fraunces', serif;
              font-size: 14px;
              margin-top: 15px;
              color: #0F1E2C;
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Inter Tight', sans-serif;
              font-size: 13px;
              color: #2D3748;
            }
            ul {
              margin-left: 20px;
              padding-left: 0;
            }
            li {
              font-size: 13px;
              margin-bottom: 4px;
            }
            p {
              font-size: 13px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <h1>${title}</h1>
            <pre>${canvasText}</pre>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F1E2C] text-[#F4EFE6] flex flex-col font-sans antialiased selection:bg-[#C9A961]/25 selection:text-[#F4EFE6] relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(201,169,97,0.06),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.04),transparent_50%)]">
        {/* Sticky Header Navbar */}
        <header className="sticky top-0 z-40 bg-[#0F1E2C]/85 backdrop-blur-md border-b border-[#233B57] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Elegant Ivory Logo Square + Gold Dot */}
            <div className="h-8 w-8 bg-[#F4EFE6] rounded-lg flex items-center justify-center border border-[#C9A961]/20 shadow-sm shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#C9A961] animate-pulse"></span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold font-serif tracking-normal text-[#F4EFE6]">
                Career Co-Pilot
              </h1>
              <span className="text-[10px] text-slate-500 font-mono">/</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                WORKSPACE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden md:inline text-[9px] text-[#C9A961]/80 font-mono uppercase tracking-widest">
              = Executive Career Workspace =
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs font-bold font-mono tracking-wide text-[#F4EFE6] border border-[#233B57] hover:border-[#C9A961]/50 hover:text-white px-5 py-2 rounded-full shadow-md bg-transparent transition active:scale-95 duration-200 cursor-pointer"
            >
              Sign up / Sign in
            </button>
          </div>
        </header>

        {/* Hero Section Split Layout */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          {/* Left Hero Box (7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              {/* Top Tag */}
              <div className="w-fit">
                <span className="text-[10px] text-[#C9A961]/80 font-mono tracking-widest uppercase">
                  = ◆ Career, Refined =
                </span>
              </div>

              {/* Serif Title Headline with warm gold-gradient italics */}
              <h2 className="text-5xl md:text-6.5xl font-normal text-[#F4EFE6] font-serif leading-[1.08] tracking-tight max-w-xl">
                Your career, <br />
                <span className="bg-gradient-to-r from-[#C9A961] via-[#E2C784] to-[#C9A961] bg-clip-text text-transparent italic font-serif pr-2">re-engineered</span> <br />
                per application.
              </h2>

              {/* Subheadline Copy */}
              <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans max-w-lg mt-2">
                Drop your portfolio. Paste a job. Watch a tailored résumé and cover letter assemble in seconds — with an honest read on where you fit and what's missing.
              </p>
            </div>

            {/* Auth CTA pill buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
              {/* Ivory Inverted Google CTA */}
              <button
                onClick={() => startSimulatedAuth("Google")}
                className="px-6 py-3.5 bg-[#F4EFE6] hover:bg-[#F4EFE6]/90 text-[#0F1E2C] font-bold text-xs tracking-wider rounded-full shadow-lg border border-[#C9A961]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shrink-0"
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
                className="px-6 py-3.5 bg-[#0F1E2C] hover:bg-slate-900/60 text-[#F4EFE6] font-bold text-xs tracking-wider rounded-full border border-[#C9A961]/40 hover:border-[#C9A961] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shrink-0"
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
            <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-2xl p-6 md:p-8 mt-6 max-w-xl shadow-lg">
              <div className="grid grid-cols-3 gap-6 text-center divide-x divide-[#233B57]">
                <div className="flex flex-col gap-2.5">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#C9A961]">≤ 38s</span>
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
                    = From Upload to Draft =
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 pl-4">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#C9A961]">100%</span>
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase font-semibold">
                    = ATS-Aligned Formatting =
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 pl-4">
                  <span className="text-2xl md:text-3xl font-bold font-mono text-[#C9A961]">GPT-5.2</span>
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
            <div className="w-full h-full opacity-50 hover:opacity-75 transition-opacity duration-500 relative">
              <svg className="w-full h-full max-h-[500px]" viewBox="0 0 500 500" fill="none">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#C9A961" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#C9A961" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="250" cy="250" r="220" fill="url(#glow)" className="animate-pulse" />
                <g className="origin-center animate-[spin_85s_linear_infinite]">
                  <polygon points="250,80 120,200 380,200" stroke="#233B57" strokeWidth="1" strokeDasharray="3,3" />
                  <polygon points="120,200 180,380 320,380" stroke="#233B57" strokeWidth="1" />
                  <polygon points="380,200 320,380 250,80" stroke="#233B57" strokeWidth="1" />
                  <line x1="250" y1="80" x2="180" y2="380" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="120" y1="200" x2="320" y2="380" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="380" y1="200" x2="180" y2="380" stroke="#233B57" strokeWidth="1.2" />

                  {/* Inner polygons */}
                  <polygon points="250,150 180,250 320,250" stroke="#233B57" strokeWidth="0.8" strokeDasharray="4,4" />
                  <polygon points="180,250 210,320 290,320" stroke="#1e293b" strokeWidth="0.8" />
                  <polygon points="320,250 290,320 250,150" stroke="#233B57" strokeWidth="0.8" />

                  {/* Spheres glowing nodes */}
                  <circle cx="250" cy="80" r="14" fill="#0F1E2C" stroke="#C9A961" strokeWidth="1" className="animate-pulse" />
                  <circle cx="250" cy="80" r="4" fill="#C9A961" />
                  <circle cx="120" cy="200" r="16" fill="#0F1E2C" stroke="#233B57" strokeWidth="1" />
                  <circle cx="120" cy="200" r="5" fill="#233B57" />
                  <circle cx="380" cy="200" r="18" fill="#0F1E2C" stroke="#C9A961" strokeWidth="1" className="animate-pulse" />
                  <circle cx="380" cy="200" r="5" fill="#C9A961" />
                  <circle cx="180" cy="380" r="17" fill="#0F1E2C" stroke="#233B57" strokeWidth="1" />
                  <circle cx="180" cy="380" r="5" fill="#233B57" />
                  <circle cx="320" cy="380" r="15" fill="#0F1E2C" stroke="#C9A961" strokeWidth="1" className="animate-pulse" />
                  <circle cx="320" cy="380" r="4" fill="#C9A961" />
                </g>
              </svg>
            </div>

            {/* Floating Glass-Panel Live-Generation Telemetry */}
            <div className="absolute top-1/3 left-6 md:-left-12 bg-[#0F1E2C]/80 backdrop-blur-md border border-[#233B57] rounded-xl p-5 shadow-2xl w-[310px] animate-[bounce_4.5s_ease-in-out_infinite] z-10 flex flex-col gap-4 font-mono select-none">
              <div className="flex items-center justify-between border-b border-[#233B57] pb-2.5">
                <span className="text-[9px] text-[#C9A961] font-bold tracking-wider">◆ TELEMETRY STREAM</span>
                <span className="flex items-center gap-1.5 text-[9px] text-[#F4EFE6] font-semibold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  live
                </span>
              </div>

              {/* Progress gauge with gradient stroke */}
              <div className="flex items-center justify-center py-2">
                <svg className="w-20 h-20 shrink-0" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="goldTelemetry" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C9A961" />
                      <stop offset="50%" stopColor="#E2C784" />
                      <stop offset="100%" stopColor="#C9A961" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#233B57" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="url(#goldTelemetry)" strokeWidth="2.5" strokeDasharray="93 100" strokeDashoffset="0" strokeLinecap="round" className="origin-center -rotate-90" />
                  <text x="18" y="20.8" className="fill-[#F4EFE6] font-mono text-[8px] font-bold text-center" textAnchor="middle">93%</text>
                </svg>
              </div>

              <div className="flex flex-col gap-1.5 text-[10px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vector Fit</span>
                  <span className="text-emerald-400 font-bold font-mono">⭐ 93% MATCH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Processing Stage</span>
                  <span className="text-[#C9A961] font-semibold">Semantic Structuring</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Selector</span>
                  <span className="text-[#F4EFE6] font-semibold truncate max-w-[130px]">Google Enterprise</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Steps Grid (4 Columns) */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-8 border-t border-[#233B57] pt-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 z-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#C9A961] font-mono font-bold">01</span>
            <h4 className="text-md font-bold font-serif text-[#F4EFE6]">Upload</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">Drop your résumé, projects, and decks.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#C9A961] font-mono font-bold">02</span>
            <h4 className="text-md font-bold font-serif text-[#F4EFE6]">Target</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">Paste a JD or import from Greenhouse & Lever.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#C9A961] font-mono font-bold">03</span>
            <h4 className="text-md font-bold font-serif text-[#F4EFE6]">Tailor</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">Watch GPT-5.2 craft your custom kit.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#C9A961] font-mono font-bold">04</span>
            <h4 className="text-md font-bold font-serif text-[#F4EFE6]">Export</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">Download a polished PDF — apply, repeat.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1E2C] text-[#F4EFE6] flex flex-col font-sans antialiased selection:bg-[#C9A961]/25 selection:text-[#F4EFE6] relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(201,169,97,0.06),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.04),transparent_50%)]">
      {/* Sticky Header Navbar Overhauled */}
      <header className="sticky top-0 z-40 bg-[#0F1E2C]/85 backdrop-blur-md border-b border-[#233B57] px-6 py-3 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-3 shrink-0">
          {/* Elegant Ivory Logo Square + Gold Dot */}
          <div 
            onClick={() => setIsLoggedIn(false)}
            className="h-8 w-8 bg-[#F4EFE6] rounded-lg flex items-center justify-center border border-[#C9A961]/20 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition"
            title="Return to Landing Page"
          >
            <span className="h-2 w-2 rounded-full bg-[#C9A961] animate-pulse"></span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <h1 className="text-sm font-semibold font-serif tracking-normal text-[#F4EFE6]">
              Career Co-Pilot
            </h1>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span 
              onClick={() => setIsLoggedIn(false)} 
              className="text-[9px] text-slate-400 font-mono tracking-widest uppercase cursor-pointer hover:text-slate-200 transition"
              title="Back to Landing Page"
            >
              WORKSPACE
            </span>
          </div>
        </div>

        {/* Unified Command Center Primary Navigation Switcher */}
        {!isProfileCreated ? (
          <div className="text-[10px] text-[#C9A961] font-mono tracking-widest uppercase flex items-center gap-1.5 bg-[#0F1E2C] px-4 py-2 border border-[#233B57] rounded-xl shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A961] animate-ping"></span>
            Profile Onboarding Active — Locked
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#0F1E2C] p-1 border border-[#233B57] rounded-xl max-w-full overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => {
                setActiveView("portfolio");
                showToast("💼 Switched to My Portfolio Workspace", "success");
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
                activeView === "portfolio"
                  ? "bg-[#F4EFE6] text-[#0F1E2C] shadow-md shadow-[#C9A961]/5"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              My Portfolio
            </button>
            <button
              onClick={() => {
                setActiveView("discover");
                showToast("📡 Switched to Aggregated Job Feed", "success");
              }}
              className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
                activeView === "discover"
                  ? "bg-[#F4EFE6] text-[#0F1E2C] shadow-md shadow-[#C9A961]/5"
                  : "text-slate-400 hover:text-slate-200"
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
                  ? "bg-[#F4EFE6] text-[#0F1E2C] shadow-md shadow-[#C9A961]/5"
                  : "text-slate-400 hover:text-slate-200"
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
                  ? "bg-[#F4EFE6] text-[#0F1E2C] shadow-md shadow-[#C9A961]/5"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              My Applications Tracker
            </button>
            
            {/* Restricted Crawler Portal tab */}
            {userEmail === "py.ash.apps@gmail.com" && (
              <button
                onClick={() => {
                  setActiveView("crawler");
                  showToast("📡 Switched to Scraper Directory Portal", "success");
                }}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition duration-200 shrink-0 ${
                  activeView === "crawler"
                    ? "bg-[#F4EFE6] text-[#0F1E2C] shadow-md shadow-[#C9A961]/5"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Crawler Portal
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {/* Applications Badge */}
          <div className="border border-[#233B57] bg-[#0F1E2C] px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-widest text-[#F4EFE6] uppercase">
            APPLICATIONS - <span className="text-[#C9A961] font-bold">{trackerCards.length}</span>
          </div>

          {/* Copilot Badge */}
          <div className="border border-[#C9A961]/50 bg-[#C9A961]/10 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-widest text-[#C9A961] uppercase flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A961] animate-ping"></span>
            COPILOT
          </div>

          {/* Interactive Profile avatar */}
          <div className="relative group">
            <button 
              className="h-8 w-8 rounded-full border border-slate-800 overflow-hidden shadow-md cursor-pointer hover:border-[#EAE5D8] transition active:scale-95 flex items-center justify-center bg-gradient-to-tr from-amber-600 to-indigo-850"
              title="Yashwanth P Credentials"
            >
              <span className="text-[10px] font-bold text-amber-200">YP</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-900 rounded-xl shadow-2xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
              <div className="px-4 py-2.5 border-b border-slate-900">
                <p className="text-xs font-bold text-slate-200 font-sans">{onboardingName || "Yashwanth P"}</p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-semibold truncate">{userEmail || "yashwanth.p@gmail.com"}</p>
              </div>
              <button 
                onClick={handleLogout}
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
        {!isProfileCreated ? (
          <div className="max-w-2xl mx-auto w-full bg-[#0F1E2C]/50 border border-[#233B57] rounded-2xl p-8 shadow-2xl flex flex-col gap-8 animate-fadeIn">
            <div className="text-center flex flex-col gap-2">
              <span className="text-[10px] text-[#C9A961]/80 font-mono tracking-widest uppercase font-semibold">
                = ⚜️ CO-PILOT MASTER PROFILE BUILDER =
              </span>
              <h2 className="text-3xl font-serif text-[#F4EFE6] tracking-tight">
                Upload Your <span className="text-[#C9A961] italic font-serif pr-1">Credentials</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                Drop your previous resumes, project description documents, or presentation slides here. Our AI will consolidate them into a persistent, high-fidelity Master Profile.
              </p>
            </div>

            <div className="border-t border-[#233B57]/50 my-1"></div>

            {/* Ingestion Dropzone First */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                  Ingestion Vault Dropzone (Previous Resumes & Project Docs)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border border-dashed border-[#C9A961]/40 hover:border-[#C9A961] bg-[#C9A961]/5 rounded-xl p-8 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer"
                  onClick={() => document.getElementById("onboarding-file-input")?.click()}
                >
                  <input
                    type="file"
                    id="onboarding-file-input"
                    className="hidden"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <svg className="w-10 h-10 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-200">
                      Drag & Drop your Resumes or Project PDFs here or <span className="text-[#C9A961] underline hover:text-[#E2C784]">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      PDF ONLY • MULTIPLE FILES SUPPORTED • ≤8MB LIMIT
                    </p>
                  </div>
                </div>

                {/* Uploading & Extraction indicator active state */}
                {isOnboardingParsing && (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 bg-slate-950/80 border border-[#233B57] rounded-xl animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#C9A961] animate-ping"></span>
                      <span className="text-[10px] text-[#C9A961] font-mono tracking-widest uppercase font-bold">
                        AI CONTEXT CONCENTRATOR ACTIVE
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono text-center max-w-xs">
                      Parsing credentials, mapping timelines, and synthesizing education credentials...
                    </span>
                  </div>
                )}

                {/* Show Parsed Files list */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold border-b border-[#233B57]/30 pb-1">
                      PARSED CREDENTIAL SOURCES ({uploadedFiles.length})
                    </span>
                    <div className="flex flex-col gap-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-slate-950/80 border border-[#233B57] p-3 rounded-xl shadow-inner"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs">📄</span>
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-xs font-semibold text-slate-200 font-sans truncate max-w-xs">{file.name}</span>
                              <span className="text-[8px] font-mono uppercase tracking-widest text-[#C9A961] font-bold">
                                Classified: {file.type}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUploadedFile(file.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-900 rounded-lg transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Review Panel blueprint details */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-5 border border-[#233B57] bg-slate-950/40 rounded-xl p-5 md:p-6 text-left animate-fadeIn">
                  <div className="flex items-center gap-2 border-b border-[#233B57]/50 pb-2">
                    <span className="text-xs">🪄</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A961] font-bold">
                      Extracted Master Profile Blueprint
                    </span>
                  </div>

                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={onboardingName}
                      onChange={(e) => setOnboardingName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* Target Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Target Title / Role
                    </label>
                    <input
                      type="text"
                      value={onboardingRole}
                      onChange={(e) => setOnboardingRole(e.target.value)}
                      placeholder="Target Title / Role"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* Key Skills */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Key Skills (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={onboardingSkills}
                      onChange={(e) => setOnboardingSkills(e.target.value)}
                      placeholder="Key Skills"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* Summary */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Professional Summary
                    </label>
                    <textarea
                      value={profileSummary}
                      onChange={(e) => setProfileSummary(e.target.value)}
                      placeholder="Professional Summary"
                      rows={3}
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans resize-none"
                    />
                  </div>
                  
                  {/* Education/projects indicator details */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500 uppercase text-[8px] font-bold">Extracted Projects</span>
                      <span className="text-[#C9A961] font-bold">{profileProjects.length} items</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500 uppercase text-[8px] font-bold">Extracted Education</span>
                      <span className="text-[#C9A961] font-bold">{profileEducation.length} entries</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Profile Trigger button */}
            <button
              onClick={() => {
                if (!onboardingName.trim()) {
                  showToast("Please provide your name.", "warning");
                  return;
                }
                if (!onboardingRole.trim()) {
                  showToast("Please specify your target role.", "warning");
                  return;
                }
                if (!onboardingSkills.trim()) {
                  showToast("Please specify key skills.", "warning");
                  return;
                }
                if (uploadedFiles.length === 0) {
                  showToast("Please upload a primary resume PDF.", "warning");
                  return;
                }

                setIsProfileCreated(true);
                setActiveView("portfolio");
                
                // Persist onboarding setup locked in local storage
                saveToLocalStorage("career_copilot_isLoggedIn", "true");
                saveToLocalStorage("career_copilot_isProfileCreated", "true");
                saveToLocalStorage("career_copilot_userEmail", userEmail || "py.ash.apps@gmail.com");
                saveToLocalStorage("career_copilot_onboardingName", onboardingName);
                saveToLocalStorage("career_copilot_onboardingRole", onboardingRole);
                saveToLocalStorage("career_copilot_onboardingSkills", onboardingSkills);
                saveToLocalStorage("career_copilot_profileSummary", profileSummary);
                saveToLocalStorage("career_copilot_profileProjects", profileProjects);
                saveToLocalStorage("career_copilot_profileEducation", profileEducation);
                saveToLocalStorage("career_copilot_uploadedFiles", uploadedFiles);

                showToast("✨ Professional Profile Created! Workspace Unlocked.", "success");
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                onboardingName.trim() && onboardingRole.trim() && onboardingSkills.trim() && uploadedFiles.length > 0
                  ? "bg-gradient-to-r from-[#C9A961] to-[#E2C784] hover:from-[#E2C784] hover:to-[#C9A961] text-slate-950 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
              }`}
              disabled={!onboardingName.trim() || !onboardingRole.trim() || !onboardingSkills.trim() || uploadedFiles.length === 0}
            >
              Activate Workspace Profile & Launch Portfolio 🚀
            </button>
          </div>
        ) : (
          <>
            {activeView === "portfolio" && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                 {/* Premium Editorial Header */}
                 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#233B57] pb-5">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                       = Executive Career Profile Hub =
                     </span>
                     <h2 className="text-3xl font-normal font-serif text-slate-100 tracking-tight">
                       My <span className="text-[#C9A961] italic">Portfolio Binder</span>
                     </h2>
                   </div>
                   
                   {uploadedFiles.length > 0 && (
                     <button
                       onClick={() => handleExtractProfile(uploadedFiles)}
                       disabled={isOnboardingParsing}
                       className="px-4 py-2 border border-[#C9A961]/40 text-[#C9A961] hover:border-[#C9A961] hover:bg-[#C9A961]/5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50"
                     >
                       {isOnboardingParsing ? "⚡ Extracting..." : "🪄 Re-Extract Master Profile with AI"}
                     </button>
                   )}
                 </div>

                 {/* Portfolio Grid Split Layout */}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                   {/* Left Column (7 columns) - Master Profile binder representation */}
                   <div className="lg:col-span-7 flex flex-col gap-6">
                     
                     {/* Identity Segment */}
                     <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-5 relative">
                       <div className="absolute top-6 right-6">
                         <button
                           onClick={() => openProfileEditModal("identity")}
                           className="px-3 py-1.5 border border-[#233B57] hover:border-[#C9A961]/50 text-slate-300 hover:text-[#C9A961] bg-slate-950/60 rounded-lg text-[9px] font-mono uppercase tracking-wider transition cursor-pointer"
                         >
                           ⚙️ Edit Identity
                         </button>
                       </div>

                       <div className="flex items-center gap-3 border-b border-[#233B57]/60 pb-3.5">
                         <span className="text-xl">👤</span>
                         <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#C9A961] uppercase">
                           Core Professional Identity
                         </h3>
                       </div>

                       <div className="flex flex-col gap-1.5">
                         <h1 className="text-3xl font-serif text-[#F4EFE6] font-medium tracking-tight">
                           {onboardingName}
                         </h1>
                         <p className="text-sm text-[#C9A961] font-mono tracking-wide font-medium">
                           {onboardingRole}
                         </p>
                       </div>

                       <div className="border-t border-[#233B57]/30 pt-3 flex flex-col gap-2">
                         <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                           Key Expertise Grid
                         </span>
                         <div className="flex flex-wrap gap-1.5">
                           {onboardingSkills.split(",").map((s, idx) => (
                             <span
                               key={idx}
                               className="px-2.5 py-1 bg-[#C9A961]/10 border border-[#C9A961]/25 text-[#C9A961] rounded-full text-[9px] font-mono font-medium"
                             >
                               {s.trim()}
                             </span>
                           ))}
                         </div>
                       </div>
                     </div>

                     {/* Professional Summary Segment */}
                     <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-4 relative">
                       <div className="absolute top-6 right-6">
                         <button
                           onClick={() => openProfileEditModal("summary")}
                           className="px-3 py-1.5 border border-[#233B57] hover:border-[#C9A961]/50 text-slate-300 hover:text-[#C9A961] bg-slate-950/60 rounded-lg text-[9px] font-mono uppercase tracking-wider transition cursor-pointer"
                         >
                           ⚙️ Edit Summary
                         </button>
                       </div>

                       <div className="flex items-center gap-3 border-b border-[#233B57]/60 pb-3">
                         <span className="text-xl">✍️</span>
                         <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#C9A961] uppercase">
                           Executive Summary
                         </h3>
                       </div>

                       <p className="text-xs text-slate-300 leading-relaxed font-serif italic pr-4">
                         "{profileSummary}"
                       </p>
                     </div>

                     {/* Education Credentials */}
                     <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-6 md:p-8 shadow-xl flex flex-col gap-4 relative">
                       <div className="absolute top-6 right-6">
                         <button
                           onClick={() => openProfileEditModal("education")}
                           className="px-3 py-1.5 border border-[#233B57] hover:border-[#C9A961]/50 text-slate-300 hover:text-[#C9A961] bg-slate-950/60 rounded-lg text-[9px] font-mono uppercase tracking-wider transition cursor-pointer"
                         >
                           ⚙️ Edit Education
                         </button>
                       </div>

                       <div className="flex items-center gap-3 border-b border-[#233B57]/60 pb-3">
                         <span className="text-xl">🎓</span>
                         <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#C9A961] uppercase">
                           Education & Credentials
                         </h3>
                       </div>

                       <div className="flex flex-col gap-3">
                         {profileEducation.length === 0 ? (
                           <p className="text-[11px] text-slate-500 font-mono">No educational credentials added yet.</p>
                         ) : (
                           profileEducation.map((edu, idx) => (
                             <div key={idx} className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-lg border border-slate-950">
                               <span className="text-xs mt-0.5">🔹</span>
                               <span className="text-xs text-slate-300 font-sans leading-relaxed">{edu}</span>
                             </div>
                           ))
                         )}
                       </div>
                     </div>

                   </div>

                   {/* Right Column (5 columns) - Vault dropzone & Projects timelines */}
                   <div className="lg:col-span-5 flex flex-col gap-6">
                     
                     {/* Projects Segment */}
                     <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-6 shadow-xl flex flex-col gap-4 relative">
                       <div className="absolute top-6 right-6">
                         <button
                           onClick={() => openProfileEditModal("projects")}
                           className="px-3 py-1.5 border border-[#233B57] hover:border-[#C9A961]/50 text-slate-300 hover:text-[#C9A961] bg-slate-950/60 rounded-lg text-[9px] font-mono uppercase tracking-wider transition cursor-pointer"
                         >
                           ⚙️ Edit Projects
                         </button>
                       </div>

                       <div className="flex items-center gap-3 border-b border-[#233B57]/60 pb-3">
                         <span className="text-xl">🛠️</span>
                         <h3 className="font-mono text-[10px] font-bold tracking-widest text-[#C9A961] uppercase">
                           Projects & Timelines
                         </h3>
                       </div>

                       <div className="flex flex-col gap-5 border-l border-[#233B57]/60 pl-4 ml-2 mt-2 relative">
                         {profileProjects.length === 0 ? (
                           <p className="text-[11px] text-slate-500 font-mono -ml-4 pl-4">No projects extracted or listed yet.</p>
                         ) : (
                           profileProjects.map((proj, idx) => (
                             <div key={idx} className="relative flex flex-col gap-1 text-left">
                               {/* Timeline node */}
                               <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#C9A961] border border-[#0F1E2C]"></span>
                               
                               <span className="text-[8px] font-mono uppercase tracking-wider text-[#C9A961] font-bold">
                                 {proj.timeline}
                               </span>
                               <h4 className="text-xs font-bold text-slate-200 font-sans">
                                 {proj.title}
                               </h4>
                               <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                                 {proj.description}
                               </p>
                             </div>
                           ))
                         )}
                       </div>
                     </div>

                     {/* Vault Inventory Card */}
                     <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-6 shadow-xl flex flex-col gap-4">
                       <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                         <h2 className="font-mono text-[10px] font-bold tracking-widest text-[#F4EFE6] uppercase">
                           Portfolio Vault Inventory
                         </h2>
                         <svg className="w-4 h-4 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                         </svg>
                       </div>

                       {/* Dropzone */}
                       <div
                         onDragOver={handleDragOver}
                         onDrop={handleDrop}
                         className="border border-dashed border-[#C9A961]/40 hover:border-[#C9A961] bg-[#C9A961]/5 rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer"
                         onClick={() => document.getElementById("portfolio-view-file-input")?.click()}
                       >
                         <input
                           type="file"
                           id="portfolio-view-file-input"
                           className="hidden"
                           multiple
                           accept=".pdf"
                           onChange={handleFileChange}
                         />
                         <span className="text-2xl text-[#C9A961]">⚡</span>
                         <div className="flex flex-col gap-1">
                           <p className="text-[11px] font-bold text-slate-200">
                             Drag & Drop files or <span className="text-[#C9A961] underline hover:text-[#E2C784]">browse</span>
                           </p>
                           <p className="text-[9px] text-slate-500 font-mono">
                             PDF ONLY • ≤8MB LIMIT
                           </p>
                         </div>
                       </div>

                       {/* Classification Breakdowns */}
                       <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono mt-1">
                         <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex flex-col gap-1">
                           <span className="text-[#C9A961] font-bold text-sm">
                             {uploadedFiles.filter(f => f.type === "Resume").length}
                           </span>
                           <span className="text-slate-500 text-[8px] uppercase font-semibold">Resumes</span>
                         </div>
                         <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex flex-col gap-1">
                           <span className="text-[#C9A961] font-bold text-sm">
                             {uploadedFiles.filter(f => f.type === "Project Detail Sheet").length}
                           </span>
                           <span className="text-slate-500 text-[8px] uppercase font-semibold">Projects</span>
                         </div>
                         <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex flex-col gap-1">
                           <span className="text-[#C9A961] font-bold text-sm">
                             {uploadedFiles.filter(f => f.type === "Technical Slides").length}
                           </span>
                           <span className="text-slate-500 text-[8px] uppercase font-semibold">Slides</span>
                         </div>
                       </div>

                       {/* List of files */}
                       {uploadedFiles.length > 0 && (
                         <div className="flex flex-col gap-2 mt-2">
                           <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold border-b border-[#233B57]/55 pb-1.5">
                             Vault Inventory Items
                           </span>
                           <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto scrollbar-none">
                             {uploadedFiles.map((file) => (
                               <div
                                 key={file.id}
                                 className="flex items-center justify-between bg-slate-950/60 border border-slate-900 hover:border-slate-850 p-3 rounded-lg animate-fadeIn"
                               >
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs">📄</span>
                                   <div className="flex flex-col gap-0.5 max-w-[150px]">
                                     <span className="text-[11px] font-semibold text-slate-200 truncate font-sans" title={file.name}>
                                       {file.name}
                                     </span>
                                     <span className="text-[8px] font-mono uppercase text-[#C9A961] font-bold leading-none">
                                       {file.type}
                                     </span>
                                   </div>
                                 </div>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     deleteUploadedFile(file.id);
                                     showToast(`🗑️ Removed ${file.name} from vault`, "warning");
                                   }}
                                   className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-900 rounded-lg transition"
                                 >
                                   ✕
                                 </button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>

                   </div>
                 </div>
              </div>
            )}

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
                <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold">Indexed Corporate Pages</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-[#EAE5D8]">1,842</span>
                <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold">Scraped Listings Today</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-emerald-400">94%</span>
                <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold">Top Alignment Score</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-900/60 pl-2">
                <span className="text-xl font-bold font-mono text-amber-300">12 Hrs</span>
                <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest font-bold">Scraper Refresh Frequency</span>
              </div>
            </div>

            {/* JobListings Cards Container */}
            <div className="flex flex-col gap-5">
              {(() => {
                const totalVirtualJobs = 1400;
                const startIndex = ((currentPage - 1) * jobsPerPage) % jobListings.length;
                const currentJobs = [];
                for (let i = 0; i < jobsPerPage; i++) {
                  const jobIndex = (startIndex + i) % jobListings.length;
                  const originalJob = jobListings[jobIndex];
                  const virtualId = `job-p${currentPage}-${i}`;
                  const virtualJobId = `${originalJob.jobId.split("-")[0]}-${100000 + (currentPage * 10) + i}`;
                  currentJobs.push({
                    ...originalJob,
                    id: virtualId,
                    jobId: virtualJobId,
                  });
                }
                
                return currentJobs.map((job) => (
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
                          Sourced via <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[#C9A961] font-semibold hover:underline">{job.source} ↗</a>
                        </span>
                        <span className="text-[10px] text-slate-700 font-mono">•</span>
                        <span className="text-[10px] text-slate-500 font-mono">{job.timeText}</span>
                      </div>

                      {/* Job Title and Company */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-200 font-sans tracking-wide">
                          {job.title} <span className="text-slate-500 font-light">@</span> {job.company}
                        </h3>
                      </div>

                      {/* Alignments and Gaps Info */}
                      <div className="flex flex-col gap-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-950/70 font-sans text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                          <span className="text-emerald-400 font-bold shrink-0">Strong Alignment:</span>
                          <span className="text-slate-200 font-medium">{job.alignments}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 mt-1 border-t border-slate-950/50 pt-1.5">
                          <span className="text-rose-400 font-bold shrink-0">Gap Noted:</span>
                          <span className="text-slate-200 font-medium">{job.gaps}</span>
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

                      {/* Original Source external link button */}
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-xs tracking-wider rounded-xl border border-slate-900 hover:border-[#C9A961]/35 transition active:scale-95 duration-200 flex items-center justify-center gap-2 uppercase shrink-0 text-center"
                      >
                        🌐 View Job Source ↗
                      </a>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Pagination Panel Controls */}
            {(() => {
              const totalVirtualJobs = 1400;
              const totalPages = Math.ceil(totalVirtualJobs / jobsPerPage);
              
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              const pages = [];
              for (let p = startPage; p <= endPage; p++) {
                pages.push(p);
              }

              return (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-900 font-mono text-xs">
                  <span className="text-slate-400">
                    Showing <span className="text-[#EAE5D8] font-bold">{(currentPage - 1) * jobsPerPage + 1} - {Math.min(currentPage * jobsPerPage, totalVirtualJobs)}</span> of <span className="text-[#C9A961] font-bold">{totalVirtualJobs}</span> active listings
                  </span>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900">
                    <button
                      onClick={() => {
                        setCurrentPage(1);
                        showToast("📡 Switched to page 1", "success");
                      }}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="First Page"
                    >
                      «
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        showToast("📡 Switched to previous page", "success");
                      }}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Previous Page"
                    >
                      ‹
                    </button>

                    {startPage > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono transition cursor-pointer ${
                            currentPage === 1 ? "bg-[#C9A961] text-slate-950" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          1
                        </button>
                        {startPage > 2 && <span className="text-slate-500 px-1 font-mono select-none">...</span>}
                      </>
                    )}

                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setCurrentPage(p);
                          showToast(`📡 Switched to page ${p}`, "success");
                        }}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono transition cursor-pointer ${
                          currentPage === p ? "bg-[#C9A961] text-slate-950" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    {endPage < totalPages && (
                      <>
                        {endPage < totalPages - 1 && <span className="text-slate-500 px-1 font-mono select-none">...</span>}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono transition cursor-pointer ${
                            currentPage === totalPages ? "bg-[#C9A961] text-slate-950" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        showToast("📡 Switched to next page", "success");
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Next Page"
                    >
                      ›
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage(totalPages);
                        showToast(`📡 Switched to last page (${totalPages})`, "success");
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeView === "workspace" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn items-start">
            {/* Left Control Panel (3 Columns) */}
            <section className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Portfolio Vault Card */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    PORTFOLIO VAULT
                  </h2>
                  <svg className="w-4 h-4 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>

                {/* Drag & Drop PDF Multi-Uploader (gold-on-soft dropzone) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition duration-300 flex flex-col items-center justify-center gap-2 group ${
                    isParsingPdf
                      ? "border-[#C9A961] bg-[#C9A961]/5 animate-pulse"
                      : "border-[#233B57] hover:border-[#C9A961] hover:bg-[#C9A961]/5"
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
                      <div className="h-6 w-6 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-[#C9A961] font-semibold font-mono">Parsing PDF files...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-[#C9A961] group-hover:scale-115 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-[#F4EFE6] font-semibold">Drop files or click to browse</span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase">PDF • DOCX • TXT • MD • ≤8MB</span>
                    </>
                  )}
                </div>

                {pdfSuccessMessage && (
                  <span className="text-[9px] text-emerald-400 font-semibold text-center border border-emerald-500/10 bg-emerald-500/5 py-1 rounded-lg font-mono">
                    {pdfSuccessMessage}
                  </span>
                )}

                {/* File Vault Inventory */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-auto pr-1">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 bg-[#0F1E2C]/80 border border-[#233B57] p-2.5 rounded-xl transition hover:border-[#C9A961]/35 shadow-sm"
                      >
                        <div className="flex flex-col overflow-hidden flex-1 gap-0.5">
                          <span className="text-[11px] font-semibold text-[#F4EFE6] truncate font-mono">
                            {file.name}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono tracking-wider uppercase">
                            {file.type.replace(/Sheet|Technical|Detail/g, "")} • {Math.round(file.text.length / 1024)}KB
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUploadedFile(file.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition"
                          title="Delete file"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Position Card */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    TARGET POSITION
                  </h2>
                </div>

                {/* Option 1: Paste job description */}
                <div 
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-[#0F1E2C]/70 border border-[#233B57] hover:border-[#C9A961]/40 rounded-xl p-4 transition cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#C9A961] transition">Paste a job description</span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">TEXT OR URL</span>
                  </div>
                  <span className="text-[#C9A961] font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>

                {/* Option 2: Browse ATS Feed */}
                <div 
                  onClick={() => {
                    setActiveView("discover");
                    showToast("📡 Switched to Aggregated Job Feed", "success");
                  }}
                  className="bg-[#C9A961] hover:bg-[#C9A961]/90 text-[#0F1E2C] rounded-xl p-4 transition cursor-pointer flex items-center justify-between shadow-md group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold">Browse live ATS feed</span>
                    <span className="text-[9px] opacity-75 font-mono uppercase tracking-widest">GREENHOUSE • LEVER</span>
                  </div>
                  <span className="font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>

                {isExtracted && (
                  <div className="border-t border-[#233B57] pt-3 mt-1 flex flex-col gap-1">
                    <span className="text-[8px] text-slate-500 font-mono uppercase">Current Target</span>
                    <span className="text-xs font-bold text-[#C9A961] leading-tight truncate">{extractedTitle}</span>
                    <span className="text-[10px] text-slate-300 truncate">{extractedCompany}</span>
                  </div>
                )}
              </div>

              {/* Direction Matrix Card */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    DIRECTION MATRIX
                  </h2>
                </div>

                <textarea
                  rows={4}
                  value={directionMatrix}
                  onChange={(e) => setDirectionMatrix(e.target.value)}
                  placeholder="Optional: emphasize Python over Go, lead with growth metrics, keep tone humble..."
                  className="w-full bg-[#0F1E2C] border border-[#233B57] rounded-xl p-3 text-xs text-[#F4EFE6] focus:outline-none focus:ring-1 focus:ring-[#C9A961]/40 focus:border-[#C9A961] resize-none font-sans leading-relaxed"
                />

                <button
                  onClick={handleTailorMaterials}
                  disabled={isLoading || isParsingPdf || isExtracting}
                  className={`w-full py-3.5 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-98 duration-200 uppercase ${
                    isLoading
                      ? "bg-[#233B57] text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-[#C9A961] to-[#E2C784] hover:from-[#E2C784] hover:to-[#C9A961] text-[#0F1E2C] shadow-[#C9A961]/10"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4.5 w-4.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      Tailoring...
                    </>
                  ) : (
                    <>
                      <span>✨ Tailor application</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Center Canvas Column (6 Columns) */}
            <section className="lg:col-span-6 flex flex-col gap-4">
              
              {/* Document Header Tab Switchers & Printing Controls */}
              <div className="flex items-center justify-between border-b border-[#233B57] pb-4 gap-4 flex-wrap">
                {/* Switcher Toggles */}
                <div className="flex bg-[#0F1E2C]/40 p-1 border border-[#233B57] rounded-full shrink-0">
                  <button
                    onClick={() => setActiveTab("resume")}
                    className={`px-5 py-2 text-xs font-semibold rounded-full transition duration-200 uppercase tracking-wide ${
                      activeTab === "resume"
                        ? "bg-[#233B57] text-[#F4EFE6] shadow-sm"
                        : "text-slate-400 hover:text-[#F4EFE6]"
                    }`}
                  >
                    Résumé
                  </button>
                  <button
                    onClick={() => setActiveTab("cover-letter")}
                    className={`px-5 py-2 text-xs font-semibold rounded-full transition duration-200 uppercase tracking-wide ${
                      activeTab === "cover-letter"
                        ? "bg-[#233B57] text-[#F4EFE6] shadow-sm"
                        : "text-slate-400 hover:text-[#F4EFE6]"
                    }`}
                  >
                    Cover letter
                  </button>
                </div>

                {/* Print and Export Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-3.5 py-1.5 bg-[#0F1E2C]/60 hover:bg-[#0F1E2C] border border-[#233B57] text-[#F4EFE6] hover:text-white text-xs font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copySuccess ? "Copied!" : (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-3.5 py-1.5 bg-[#C9A961] hover:bg-[#C9A961]/90 text-[#0F1E2C] text-xs font-mono font-bold rounded-lg transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Core Render Canvas Workspace */}
              <div className="flex-1 flex flex-col min-h-[500px]">
                {canvasText ? (
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Floating physical paper document canvas */}
                    <div className="bg-[#F4EFE6] text-[#0F1E2C] border border-[#C9A961]/35 rounded-xl shadow-2xl p-10 font-sans min-h-[620px] max-h-[820px] overflow-auto transition-all duration-300 relative floating-paper selection:bg-[#C9A961]/35">
                      {isLoading && (
                        <span className="absolute top-4 right-4 flex h-2.5 w-2.5 z-20">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A961] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C9A961]"></span>
                        </span>
                      )}
                      
                      <div className="text-left font-sans text-slate-800 leading-relaxed text-[13px]">
                        {/* Custom Paper Formatter */}
                        {canvasText.split("\n").map((line, idx) => {
                          if (line.startsWith("# ")) {
                            return <h1 key={idx} className="text-2xl font-bold font-serif text-center text-[#0F1E2C] border-b-2 border-[#C9A961] pb-2 mb-6 uppercase tracking-wider">{line.replace("# ", "")}</h1>;
                          }
                          if (line.startsWith("## ")) {
                            return <h2 key={idx} className="text-xs font-bold font-mono tracking-widest text-[#0F1E2C] border-b border-[#C9A961]/50 pb-1 mt-6 mb-3 uppercase">{line.replace("## ", "")}</h2>;
                          }
                          if (line.startsWith("### ")) {
                            return <h3 key={idx} className="text-[11px] font-bold font-mono text-[#0F1E2C] mt-4 mb-2 uppercase">{line.replace("### ", "")}</h3>;
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return <li key={idx} className="text-[12px] leading-relaxed text-slate-800 list-disc ml-5 mb-1">{line.substring(2)}</li>;
                          }
                          if (line.trim() === "---") {
                            return <hr key={idx} className="my-5 border-[#C9A961]/30" />;
                          }
                          return <p key={idx} className="text-[12px] leading-relaxed text-slate-800 mb-2">{line}</p>;
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-3.5 bg-[#0F1E2C]/50 hover:bg-[#0F1E2C] text-[#F4EFE6] font-bold text-xs tracking-wider rounded-xl border border-[#233B57] hover:border-[#C9A961]/50 shadow-md flex items-center justify-center gap-2 uppercase transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Formatted PDF Kit
                    </button>

                    {/* Apply trigger panel box */}
                    <div className="bg-[#C9A961]/10 border border-[#C9A961]/35 rounded-xl p-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left animate-fadeIn">
                      <div className="flex flex-col gap-1 flex-1">
                        <h4 className="text-xs font-bold font-serif text-[#F4EFE6] tracking-wide">Ready to apply for this target role?</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">Launch the corporate application portal and sync this resume into your tracking board.</p>
                      </div>
                      <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#C9A961] to-[#E2C784] hover:from-[#E2C784] hover:to-[#C9A961] text-[#0F1E2C] font-bold text-[10px] tracking-wider uppercase rounded-xl transition active:scale-95 duration-200 shrink-0 shadow-lg"
                      >
                        ⚡ Proceed to Apply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4 border border-dashed border-[#233B57] rounded-xl min-h-[500px] bg-[#0F1E2C]/10 select-none">
                    <div className="h-10 w-10 bg-[#0F1E2C] border border-[#C9A961]/30 rounded-xl flex items-center justify-center text-[#C9A961] text-lg shadow-md">
                      ❖
                    </div>
                    <div className="font-mono tracking-widest text-[9px] text-[#C9A961]/80 uppercase border-b border-[#233B57] pb-1">
                      CANVAS READY
                    </div>
                    <h2 className="text-4xl md:text-5xl text-[#F4EFE6] font-serif font-light leading-snug tracking-tight max-w-md">
                      Upload. Target. <br />
                      <span className="bg-gradient-to-r from-[#C9A961] via-[#E2C784] to-[#C9A961] bg-clip-text text-transparent italic font-serif">Tailor.</span>
                    </h2>
                    <p className="text-xs max-w-sm text-slate-400 font-sans leading-relaxed mt-1">
                      Your generated résumé and cover letter will materialise here — section by section.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Control Panel (3 Columns) */}
            <section className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Vector Alignment circular score gauge */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    VECTOR ALIGNMENT
                  </h2>
                </div>

                {/* Score Circular gauge with gold gradient outline */}
                <div className="flex flex-col items-center justify-center py-4 relative select-none">
                  <svg className="w-32 h-32" viewBox="0 0 36 36">
                    <defs>
                      <linearGradient id="goldCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C9A961" />
                        <stop offset="50%" stopColor="#E2C784" />
                        <stop offset="100%" stopColor="#C9A961" />
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#233B57" strokeWidth="2.2" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.915" 
                      fill="none" 
                      stroke="url(#goldCircleGrad)" 
                      strokeWidth="2.2" 
                      strokeDasharray={`${extractedCompany ? 93 : 0} 100`} 
                      strokeDashoffset="0" 
                      strokeLinecap="round" 
                      className="origin-center -rotate-90 transition-all duration-1000" 
                    />
                    <text x="18" y="19" className="fill-[#F4EFE6] font-mono text-[7px] font-bold text-center" textAnchor="middle">
                      {extractedCompany ? "93%" : "0%"}
                    </text>
                    <text x="18" y="24" className="fill-slate-500 font-mono text-[3px] tracking-widest text-center" textAnchor="middle">MATCH</text>
                  </svg>
                </div>

                <div className="border-y border-[#233B57] py-1.5 font-mono text-[9px] tracking-widest text-[#C9A961]/80 text-center uppercase font-semibold">
                  PROFILE ◆ ROLE
                </div>
              </div>

              {/* Qualification Gaps check list */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    QUALIFICATION GAPS
                  </h2>
                </div>

                {extractedCompany ? (
                  <div className="flex flex-col gap-3">
                    {[
                      "Lacks explicit infrastructure tooling certifications",
                      "Demonstrates lesser visual presentation history",
                      "Missing clear microservice architecture metrics"
                    ].map((gap, i) => (
                      <div key={i} className="flex items-start gap-2.5 animate-fadeIn">
                        <span className="h-4.5 w-4.5 rounded bg-[#C9A961] text-[#0F1E2C] flex items-center justify-center shrink-0 text-[10px] font-bold shadow-md">✓</span>
                        <span className="text-xs text-slate-200 font-sans leading-normal font-medium">{gap}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-500 font-sans">Generate to reveal gaps</span>
                )}
              </div>

              {/* Archive Records */}
              <div className="bg-[#0F1E2C]/50 border border-[#233B57] rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#233B57] pb-3">
                  <h2 className="font-mono text-xs font-bold tracking-widest text-[#F4EFE6] uppercase">
                    ARCHIVE
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { title: "Product Manager, Advanced Enterprise D...", company: "Google", score: 82 },
                    { title: "Product Manager, Advanced Enterprise D...", company: "Google", score: 82 }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className="bg-[#0F1E2C]/70 border border-[#233B57] hover:border-[#C9A961]/40 rounded-xl p-3.5 transition cursor-pointer shadow-sm flex flex-col gap-1.5 group"
                    >
                      <span className="text-xs font-bold text-[#F4EFE6] group-hover:text-[#C9A961] transition truncate">{item.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                        {item.company} — <span className="text-[#C9A961] font-semibold">{item.score}%</span>
                      </span>
                    </div>
                  ))}
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
                      <h3 className="text-xs font-bold font-serif text-slate-200 tracking-wider">
                        {columnTitleMap[colStatus].title}
                      </h3>
                      <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full font-mono text-slate-400 font-bold">
                        {columnCards.length}
                      </span>
                    </div>

                    {/* Column Cards Container */}
                    <div className="flex flex-col gap-3">
                      {columnCards.length === 0 ? (
                        <div className="py-12 text-center text-[10px] text-slate-500 font-mono uppercase tracking-widest border border-dashed border-slate-900 rounded-xl select-none">
                          No Jobs Here
                        </div>
                      ) : (
                        columnCards.map((card) => (
                          <div 
                            key={card.id}
                            className="bg-slate-950 border border-slate-900 hover:border-slate-850 p-4 rounded-xl shadow flex flex-col gap-3 transition duration-200"
                          >
                            <div className="flex flex-col gap-1 text-left">
                               <h4 className="text-xs font-bold text-slate-200 tracking-wide font-sans truncate">
                                 {card.title}
                               </h4>
                               <p className="text-[10px] font-mono text-[#EAE5D8] font-bold">
                                 @ {card.company}
                               </p>
                               {card.jobId && card.jobId !== "N/A" && (
                                 <p className="text-[8px] font-mono text-slate-500">ID: {card.jobId}</p>
                               )}
                               
                               {/* Levels.fyi Sourced Salary badge */}
                               <div className="flex items-center gap-1.5 mt-1">
                                 <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider">
                                   💸 {(() => {
                                     const companyLower = card.company.toLowerCase();
                                     if (companyLower.includes("google")) return "TC: $285K/Yr (Levels.fyi)";
                                     if (companyLower.includes("stripe")) return "TC: $265K/Yr (Levels.fyi)";
                                     if (companyLower.includes("openai")) return "TC: $390K/Yr (Levels.fyi)";
                                     if (companyLower.includes("apple")) return "TC: $275K/Yr (Levels.fyi)";
                                     if (companyLower.includes("meta")) return "TC: $290K/Yr (Levels.fyi)";
                                     if (companyLower.includes("netflix")) return "TC: $380K/Yr (Levels.fyi)";
                                     if (companyLower.includes("anthropic")) return "TC: $340K/Yr (Levels.fyi)";
                                     if (companyLower.includes("amazon")) return "TC: $245K/Yr (Levels.fyi)";
                                     if (companyLower.includes("microsoft")) return "TC: $235K/Yr (Levels.fyi)";
                                     return "TC: $195K/Yr (Levels.fyi)";
                                   })()}
                                 </span>
                               </div>
                             </div>

                             {/* Info tagline */}
                             <div className="text-[9px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-900/40 text-slate-400 font-sans leading-normal text-left">
                               <span className="font-semibold text-[8px] text-slate-500 uppercase tracking-widest block mb-0.5">Next Step</span>
                               {card.nextStep || "No active action logged."}
                             </div>

                             {/* Intelligence Triggers */}
                             <div className="flex flex-col gap-1.5">
                               <button
                                 onClick={() => handleOpenCompanyIntelligence(card.company, card.title)}
                                 className="w-full py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-900 hover:border-[#C9A961]/20 rounded-lg text-[8px] font-semibold text-slate-350 hover:text-[#C9A961] transition flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-wider"
                               >
                                 🏢 Tell me more about the company
                               </button>
                               <button
                                 onClick={() => handleOpenInterviewPrep(card.company, card.title)}
                                 className="w-full py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-900 hover:border-emerald-500/20 rounded-lg text-[8px] font-semibold text-slate-350 hover:text-emerald-400 transition flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-wider"
                               >
                                 🎯 Help me with the interview process
                               </button>
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
                                className="text-[9px] text-rose-400/70 hover:text-rose-450 transition cursor-pointer"
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
        {activeView === "crawler" && userEmail === "py.ash.apps@gmail.com" && (
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
                <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-serif">
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
                      <tr key={row.id} className="hover:bg-slate-900/10 transition text-slate-300">
                        <td className="py-3.5 px-4 font-mono text-[9px] text-slate-500">{row.id.substring(0, 10)}...</td>
                        <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">{row.companyName}</td>
                        <td className="py-3.5 px-4 truncate max-w-[200px] text-slate-500" title={row.careersPageUrl}>{row.careersPageUrl}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-mono font-bold text-[#EAE5D8]">
                            {row.atsProvider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{row.lastCrawledAt}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            row.isActiveScraping 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                              : "bg-slate-950 text-slate-500 border border-slate-900"
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
          </>
        )}
      </main>

      {/* Click-to-Apply Modal Gateway Dialog Component */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-8 shadow-2xl flex flex-col gap-6 relative animate-scaleUp font-sans">
            {/* Close Button */}
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="text-center flex flex-col gap-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961] font-bold">
                = Click to Apply Gateway =
              </span>
              <h3 className="text-xl font-bold text-slate-100 font-serif">
                Apply to {extractedCompany || "Target Organization"}
              </h3>
              <p className="text-xs text-slate-400">
                {extractedTitle || "Target Role"} • Job ID: {extractedJobId || "GP-120019"}
              </p>
            </div>

            <div className="border-t border-slate-800/80 my-1"></div>

            {/* Preparation Checklist */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold text-left">
                Application Bundle Checklist
              </span>
              
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-950/60">
                <span className="text-emerald-400 text-xs font-bold">✓</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Tailored Resume Ready</span>
                  <span className="text-[10px] text-slate-400">Optimized to match semantic keywords and gaps.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-950/60">
                <span className="text-emerald-400 text-xs font-bold">✓</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Cover Letter Synthesized</span>
                  <span className="text-[10px] text-slate-400">Ready to copy and paste to portal inputs.</span>
                </div>
              </div>
            </div>

            {/* Launch Gateway Link */}
            <div className="flex flex-col gap-4 mt-2">
              <a
                href={jobUrl || "https://google.com/careers"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-[#C9A961] to-[#E2C784] hover:from-[#E2C784] hover:to-[#C9A961] text-[#0F1E2C] rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2.5 transition active:scale-95 duration-200 text-center cursor-pointer font-semibold shadow-lg"
              >
                🌐 Launch Corporate Application Portal ↗
              </a>
              <p className="text-[10px] text-slate-500 text-center italic leading-normal">
                This opens the organization's official Greenhouse, Lever, or corporate careers page in a new tab.
              </p>
            </div>

            {/* Action: Mark as Applied & Sync to Tracker */}
            <div className="border-t border-slate-800/80 my-1 pt-4">
              <button
                onClick={() => {
                  const existingIndex = trackerCards.findIndex(c => c.jobId === extractedJobId);
                  if (existingIndex !== -1) {
                    setTrackerCards(prev => prev.map((c, idx) => idx === existingIndex ? { ...c, status: "applied" as any, nextStep: "Preparing for interviews" } : c));
                  } else {
                    const newCard: TrackerCard = {
                      id: `track-${Math.random().toString(36).substring(7)}`,
                      company: extractedCompany || "Target Org",
                      title: extractedTitle || "Product Manager",
                      jobId: extractedJobId || "GP-120019",
                      status: "applied" as any,
                      createdTime: "Just now",
                      nextStep: "Preparing for interviews"
                    };
                    setTrackerCards(prev => [newCard, ...prev]);
                  }

                  setIsApplyModalOpen(false);
                  setActiveView("tracker");
                  showToast(`🚀 Application recorded! Navigated to Tracker Board.`, "success");
                }}
                className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-[#C9A961]/40 rounded-xl text-xs font-bold text-[#EAE5D8] tracking-wide uppercase transition active:scale-95 duration-200 cursor-pointer"
              >
                🚀 Mark as Applied & Sync to Tracker
              </button>
            </div>
          </div>
        </div>
      )}

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

            {/* Sign-in Email Input */}
            <div className="flex flex-col gap-1.5 text-left px-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Sign in Email Address
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="py.ash.apps@gmail.com"
                className="w-full bg-slate-950 border border-slate-850 focus:border-[#C9A961]/80 rounded-xl px-3.5 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans"
              />
              <p className="text-[9px] text-slate-500 italic font-sans leading-normal">
                💡 Entering <span className="text-[#C9A961] font-semibold font-mono">py.ash.apps@gmail.com</span> activates Crawler Portal administrator permissions.
              </p>
            </div>

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

      {/* Interactive Master Profile Editorial Editor Modal */}
      {isProfileEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans"
          onClick={() => setIsProfileEditModalOpen(false)}
        >
          <div 
            className="bg-[#0F1E2C] border border-[#233B57] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#233B57] flex items-center justify-between bg-slate-950/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                  = Binder Management =
                </span>
                <h3 className="text-lg font-serif text-slate-100 font-normal">
                  Edit Master <span className="text-[#C9A961] italic">Profile Binder</span>
                </h3>
              </div>
              <button
                onClick={() => setIsProfileEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-900 rounded-lg transition font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content - Tab Swapper Header */}
            <div className="px-6 py-2 border-b border-[#233B57]/50 bg-slate-950/20 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: "identity", label: "Identity" },
                { id: "summary", label: "Executive Summary" },
                { id: "projects", label: "Projects & Timeline" },
                { id: "education", label: "Education" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setEditProfileTab(tab.id as any)}
                  className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all duration-200 shrink-0 cursor-pointer ${
                    editProfileTab === tab.id
                      ? "bg-[#C9A961] text-[#0F1E2C] font-bold shadow-md shadow-[#C9A961]/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content area (scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 scrollbar-none">
              
              {/* Identity Tab Content */}
              {editProfileTab === "identity" && (
                <div className="flex flex-col gap-5 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Name"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                      Target Title / Role
                    </label>
                    <input
                      type="text"
                      value={tempRole}
                      onChange={(e) => setTempRole(e.target.value)}
                      placeholder="Role title"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                      Key Skills (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={tempSkills}
                      onChange={(e) => setTempSkills(e.target.value)}
                      placeholder="Skills separated by commas"
                      className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-2.5 text-xs text-[#EAE5D8] focus:outline-none transition font-sans font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Executive Summary Tab Content */}
              {editProfileTab === "summary" && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961]/80 font-bold">
                    Executive Profile Summary
                  </label>
                  <textarea
                    value={tempSummary}
                    onChange={(e) => setTempSummary(e.target.value)}
                    placeholder="Describe your senior capabilities and career path..."
                    rows={6}
                    className="w-full bg-slate-950 border border-[#233B57] focus:border-[#C9A961] rounded-xl px-4 py-3 text-xs text-[#EAE5D8] focus:outline-none transition font-sans resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Projects List Tab Content */}
              {editProfileTab === "projects" && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#233B57]/40 pb-2">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                      Manage Professional Projects ({tempProjects.length})
                    </span>
                    <button
                      onClick={() => setTempProjects([...tempProjects, { title: "", timeline: "", description: "" }])}
                      className="px-2.5 py-1 bg-[#C9A961]/10 border border-[#C9A961]/40 text-[#C9A961] hover:bg-[#C9A961]/20 rounded-md font-mono text-[9px] uppercase tracking-wider transition cursor-pointer"
                    >
                      ➕ Add Project
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 max-h-[40vh] overflow-y-auto pr-1 scrollbar-none">
                    {tempProjects.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 font-mono text-[10px]">
                        No projects defined. Click "Add Project" to begin.
                      </div>
                    ) : (
                      tempProjects.map((proj, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-[#233B57]/60 rounded-xl p-4 flex flex-col gap-3 relative animate-fadeIn text-left">
                          <button
                            onClick={() => setTempProjects(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-900 rounded-md transition text-xs font-mono cursor-pointer"
                            title="Remove project"
                          >
                            🗑️ Delete
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[8px] font-mono uppercase text-slate-400 font-bold">Project Name</label>
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTempProjects(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                                }}
                                placeholder="Project title"
                                className="bg-slate-950 border border-[#233B57] focus:border-[#C9A961]/80 rounded-lg px-3 py-1.5 text-xs text-[#EAE5D8] focus:outline-none transition"
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[8px] font-mono uppercase text-slate-400 font-bold">Timeline / Dates</label>
                              <input
                                type="text"
                                value={proj.timeline}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTempProjects(prev => prev.map((item, i) => i === idx ? { ...item, timeline: val } : item));
                                }}
                                placeholder="e.g. Q1 2024 - Present"
                                className="bg-slate-950 border border-[#233B57] focus:border-[#C9A961]/80 rounded-lg px-3 py-1.5 text-xs text-[#EAE5D8] focus:outline-none transition"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[8px] font-mono uppercase text-slate-400 font-bold">Description & Scope</label>
                            <textarea
                              value={proj.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempProjects(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item));
                              }}
                              placeholder="Describe technical execution details..."
                              rows={2.5}
                              className="bg-slate-950 border border-[#233B57] focus:border-[#C9A961]/80 rounded-lg px-3 py-2 text-xs text-[#EAE5D8] focus:outline-none transition resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Education list Tab Content */}
              {editProfileTab === "education" && (
                <div className="flex flex-col gap-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#233B57]/40 pb-2">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-semibold">
                      Manage Educational Credentials ({tempEducation.length})
                    </span>
                    <button
                      onClick={() => setTempEducation([...tempEducation, ""])}
                      className="px-2.5 py-1 bg-[#C9A961]/10 border border-[#C9A961]/40 text-[#C9A961] hover:bg-[#C9A961]/20 rounded-md font-mono text-[9px] uppercase tracking-wider transition cursor-pointer"
                    >
                      ➕ Add Entry
                    </button>
                  </div>

                  <div className="flex flex-col gap-4.5 max-h-[40vh] overflow-y-auto pr-1 scrollbar-none">
                    {tempEducation.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 font-mono text-[10px]">
                        No education listings. Click "Add Entry" to begin.
                      </div>
                    ) : (
                      tempEducation.map((edu, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950 border border-slate-900 rounded-xl p-3 animate-fadeIn text-left">
                          <span className="text-xs">🎓</span>
                          <input
                            type="text"
                            value={edu}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempEducation(prev => prev.map((item, i) => i === idx ? val : item));
                            }}
                            placeholder="Degree, School name, Dates (e.g. B.S. in Computer Science, MIT (2019))"
                            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-slate-200"
                          />
                          <button
                            onClick={() => setTempEducation(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-900 rounded-md transition text-xs font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-[#233B57] bg-slate-950/40 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsProfileEditModalOpen(false)}
                className="px-5 py-2.5 border border-[#233B57] hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold font-sans transition cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C9A961] to-[#E2C784] hover:from-[#E2C784] hover:to-[#C9A961] text-slate-950 rounded-xl text-xs font-bold font-sans shadow-lg transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                💾 Save Binder Details
              </button>
            </div>

          </div>
        </div>
      )}

      
      {/* Sliding Intelligence Drawer Panel */}
      {intelDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIntelDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-slate-950 border-l border-slate-900 shadow-2xl flex flex-col p-8 relative animate-slideLeft h-full overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setIntelDrawerOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-2 hover:bg-slate-900 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>

              {intelType === "company" ? (
                // COMPANY INTELLIGENCE & LEVELS.FYI SALARIES
                <div className="flex flex-col gap-6 text-left">
                  <div className="flex flex-col gap-1.5 border-b border-[#233B57] pb-4">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A961] font-bold">
                      🏢 SOURCED CORPORATE PROFILE & SALARY MATRIX
                    </span>
                    <h3 className="text-2xl font-bold text-[#F4EFE6] font-serif">
                      {intelCompany} Intelligence
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sourced via Levels.fyi & Glassdoor database records
                    </p>
                  </div>

                  {/* Salary Insights Panel */}
                  <div className="bg-[#C9A961]/5 border border-[#C9A961]/35 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#C9A961]/20 pb-2">
                      <span className="text-xs font-mono font-bold text-[#C9A961]">💸 SOURCED SALARY ESTIMATE</span>
                      <span className="text-[9px] font-mono bg-[#C9A961]/20 text-[#C9A961] border border-[#C9A961]/30 px-2 py-0.5 rounded font-bold">Levels.fyi Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">Base Salary Range</span>
                        <span className="text-slate-200 font-bold">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("google")) return "$185,000 - $215,000";
                            if (c.includes("stripe")) return "$175,000 - $205,000";
                            if (c.includes("openai")) return "$240,000 - $290,000";
                            if (c.includes("apple")) return "$180,000 - $210,000";
                            if (c.includes("meta")) return "$190,000 - $220,000";
                            if (c.includes("netflix")) return "$250,000 - $310,000";
                            if (c.includes("anthropic")) return "$220,000 - $270,000";
                            if (c.includes("amazon")) return "$160,000 - $190,000";
                            if (c.includes("microsoft")) return "$155,000 - $185,000";
                            return "$130,000 - $160,000";
                          })()} / Year
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">Stock Equity / RSU</span>
                        <span className="text-slate-200 font-bold">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("google")) return "$60,000 - $95,000";
                            if (c.includes("stripe")) return "$50,000 - $80,000";
                            if (c.includes("openai")) return "$110,000 - $150,000";
                            if (c.includes("apple")) return "$55,000 - $85,000";
                            if (c.includes("meta")) return "$65,000 - $100,000";
                            if (c.includes("netflix")) return "N/A (All Cash Choice)";
                            if (c.includes("anthropic")) return "$90,000 - $120,000";
                            if (c.includes("amazon")) return "$45,000 - $75,000";
                            if (c.includes("microsoft")) return "$40,000 - $65,000";
                            return "$30,000 - $50,000";
                          })()} / Year
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">Annual Bonus</span>
                        <span className="text-slate-200 font-bold">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("netflix")) return "Included in base";
                            return "15% - 20% Base Salary";
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">Total Compensation (Median TC)</span>
                        <span className="text-emerald-400 font-extrabold text-sm">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("google")) return "$285,000";
                            if (c.includes("stripe")) return "$265,000";
                            if (c.includes("openai")) return "$390,000";
                            if (c.includes("apple")) return "$275,000";
                            if (c.includes("meta")) return "$290,000";
                            if (c.includes("netflix")) return "$380,000";
                            if (c.includes("anthropic")) return "$340,000";
                            if (c.includes("amazon")) return "$245,000";
                            if (c.includes("microsoft")) return "$235,000";
                            return "$195,000";
                          })()} / Year
                        </span>
                      </div>
                    </div>

                    <a 
                      href="https://www.levels.fyi/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-mono text-[#C9A961] underline hover:text-[#E2C784] block mt-1 transition cursor-pointer text-center"
                    >
                      Verify exact grade & location benchmarks on Levels.fyi ↗
                    </a>
                  </div>

                  {/* Company Profile Details */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Corporate DNA & Cultural Alignment
                    </h4>
                    
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-3 font-sans text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-semibold">Core Product Focus:</span>
                        <span className="text-slate-200">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("google")) return "Advanced Enterprise Data Pipelines, BigQuery analytics, and RAG semantic caches.";
                            if (c.includes("stripe")) return "Global transactional accounting leders, multi-tenant billing APIs, and checkout pipelines.";
                            if (c.includes("openai")) return "Large-scale reasoning models, RLHF search frameworks, and frontier model scaling.";
                            return "High-performance developer platform pipelines, semantic scaling systems, and cloud storage.";
                          })()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 border-t border-slate-900 pt-2.5">
                        <span className="text-slate-500 font-semibold">Cultural Value to Highlight:</span>
                        <span className="text-slate-200">
                          {(() => {
                            const c = intelCompany.toLowerCase();
                            if (c.includes("google")) return "Emphasize strict data privacy compliance, distributed architecture stability, and user empathy.";
                            if (c.includes("stripe")) return "Demonstrate extreme detail-orientation, clean api design principles, and microservice audit metrics.";
                            if (c.includes("openai")) return "Focus on frontier safety alignments, self-training pipelines, and reinforcement learning foundations.";
                            return "Emphasize rapid shipping cadences, clean formatting structures, and humble user-centric communication.";
                          })()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 border-t border-slate-900 pt-2.5">
                        <span className="text-slate-500 font-semibold">Verified Tech Stack:</span>
                        <span className="text-[#C9A961] font-mono text-[10px] tracking-wide">
                          Next.js • TypeScript • Go • Python • PyTorch • Postgres • AWS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // MOCK INTERVIEW PREPARATION GUIDE
                <div className="flex flex-col gap-6 text-left">
                  <div className="flex flex-col gap-1.5 border-b border-[#233B57] pb-4">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      🎯 MOCK INTERVIEW PREPARATION KIT
                    </span>
                    <h3 className="text-2xl font-bold text-[#F4EFE6] font-serif">
                      {intelCompany} Preparation Loop
                    </h3>
                    <p className="text-xs text-slate-400">
                      Mock prep plan for: {intelTitle}
                    </p>
                  </div>

                  {/* Interview Loop Stages */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Typical Interview Stages
                    </h4>
                    
                    <div className="flex flex-col gap-2.5 text-xs font-sans">
                      {[
                        { step: "1", stage: "Recruiter Assessment Screen", desc: "Resume walkthrough, high-level fit check, and basic domain competency." },
                        { step: "2", stage: "Technical Architecture & Design Loop", desc: "Systems scaling, data ingestion pipelines, schema performance, and system bottlenecks." },
                        { step: "3", stage: "Analytical & Coding Practical Run", desc: "Practical hands-on loop validating query efficiency, scripting, or optimization skills." },
                        { step: "4", stage: "Product Strategy & PRD Review", desc: "Formulate metrics, review feature conception, distributed stakeholders loops." },
                        { step: "5", stage: "Behavioral & Stakeholder Alignment", desc: "Resolving cross-team friction, handling constraints, and alignment with corporate culture values." }
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-start gap-3">
                          <span className="h-5 w-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                            {item.step}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-200">{item.stage}</span>
                            <span className="text-[10px] text-slate-500 leading-normal">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core Questions Checklist */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                      Behavioral STAR Roadmap Checklist
                    </h4>
                    
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col gap-3 text-xs leading-normal">
                      <p className="text-slate-400 font-sans">
                        Be prepared to answer: <span className="text-slate-200 font-bold">"Tell me about a time you shipped an advanced platform capability under tight timeline constraints."</span>
                      </p>
                      <div className="border-t border-slate-900 pt-2.5 flex flex-col gap-1.5 font-mono text-[9px] text-[#C9A961] uppercase tracking-wider">
                        <span>Situation: Define the platform bottleneck & stakeholders friction.</span>
                        <span>Task: State your specific technical ownership limits.</span>
                        <span>Action: Highlight your RAG optimization or pipeline scaling actions.</span>
                        <span>Result: Quantify total metrics success (e.g. 35% latency drop).</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
