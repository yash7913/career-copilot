# Product Requirements Document (PRD)
## Project Name: Career Co Pilot

## 1. Product Overview
Career Co Pilot is a document-driven, AI-first career management platform designed to help users build a unified professional identity, discover tailored job opportunities, and seamlessly generate tailored resumes and track applications. The product distinguishes itself through its visually stunning, premium aesthetics and deeply integrated AI capabilities.

## 2. Target Audience
- Professionals seeking to organize their career artifacts (resumes, project docs).
- Job seekers looking for tailored opportunities and optimized application materials.
- Users who value premium, state-of-the-art UI/UX.

## 3. Core Features & User Journey

### 3.1 Authentication & Onboarding
- **OAuth Login**: Users can sign up or log in using Google or LinkedIn.
- **Session Persistence**: Login states (`career_copilot_isLoggedIn`) and profile creation states (`career_copilot_isProfileCreated`) are persisted (e.g., via `localStorage`) to ensure returning users bypass the onboarding wizard and go straight to their workspace.

### 3.2 The Master Profile Setup (Document Ingestion)
- **Document Drop**: After first login, users drop their existing documents (previous resumes, project specs, etc.) into an ingestion portal.
- **AI Extraction**: An LLM (Claude or OpenAI via structured output) parses the unstructured documents to extract skills, summary, projects (with timelines), and education.
- **Creation of Base Profile**: This extraction builds a comprehensive "Master Profile" which serves as the foundational source of truth for the user's career. This profile is rarely completely overhauled but serves as the base for all subsequent actions.

### 3.3 The Master Profile Binder (Portfolio View)
- **Visibility & Editing**: The user's master profile is presented in an editorial, high-end "Binder" format. 
- **Modifiability**: Users can view and edit the extracted information (skills, timelines, summaries) at any time.

### 3.4 Job Discovery & Matching
- **Discover Jobs Feed**: Based on the Master Profile, users are presented with tailored job opportunities.
- **Pagination over Infinite Scroll**: The UI displays job listings (e.g., 1400+ listings) using a paginated pattern rather than an infinite scroll for better legibility and navigation.
- **Original Sourcing**: Every job listing includes an external link directly to the original source/URL of the job posting.

### 3.5 Resume Generation & Application
- **One-Click Tailoring**: Users can generate a tailored resume for a specific job using the "Generation Canvas" with a single click.
- **Application Routing**: Users proceed via a "Click to Apply" action which navigates them to the job's source URL.

### 3.6 Application Tracker & Interview Intelligence
- **Tracking Dashboard**: Applied jobs are logged in the "My Applications Tracker".
- **Deep Insights**: For each tracked application, users can trigger tools like:
  - "Tell me more about the company"
  - "Help me with the interview process"
- **Salary Intelligence**: Sourcing and displaying salary estimates from platforms like Levels.fyi for context.

### 3.7 Admin Features (Crawler Portal)
- **Role-Based Access**: The Crawler Portal is strictly restricted to admin users (specifically, when Google Sign-In matches `py.ash.apps@gmail.com`).
- **Data Management**: Allows admins to manage the underlying job data ingestion.

## 4. Design & Aesthetics Requirements
The application MUST strictly adhere to a high-end, premium aesthetic, avoiding generic or basic web app looks.

### 4.1 Color Palette & Tokens
- **Base Background**: Midnight `#0F1E2C`
- **Surface Gradients**: Radial gold and forest atmospheric gradients.
- **Text & Core Surfaces**: Ivory `#F4EFE6` (especially for text and "paper" canvas surfaces).
- **Accents**: Antique Gold `#C9A961` (with gradient stops).
- **Borders**: Subtle Navy hairlines `#233B57`.

### 4.2 Typography
- **Display/Headlines**: Fraunces (italicized for emphasis).
- **Body Text**: Inter Tight.
- **Labels/Data**: JetBrains Mono.
- **Legibility**: Text size and contrast must be high enough to ensure complete readability (avoiding text fading into the background).

### 4.3 UI Components & Micro-interactions
- **Buttons (CTAs)**: Ivory inverted buttons for primary actions (e.g., "Continue with Google"), Gold pill CTAs for actions like Tailor/Import/Export.
- **Generation Canvas**: Styled as a "paper-effect resume canvas" (ivory document floating on the midnight workspace).
- **Telemetry & Gauges**: Glass-panel live-generation telemetry, gold progress gauges with gradient strokes, and gold gradient rings for Alignment Gauges.
- **Navigation**: TopNav featuring an ivory logo square with a gold dot. Tabs order should prioritize: "My Portfolio", "Discover Jobs", "Workspace Hub", "My Applications Tracker".

## 5. Technical Architecture
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS (with highly customized design tokens reflecting the custom palette).
- **Backend/API**: Next.js Route Handlers (e.g., `/api/extract-profile`).
- **AI Integration**: AI SDK (e.g., Vercel AI SDK) utilizing Zod for structured data parsing and fallback mechanisms.

## 6. Success Metrics
- Seamless extraction of complex user histories into structured data.
- User retention post-onboarding.
- Visual wow-factor and lack of UX friction during resume generation.
