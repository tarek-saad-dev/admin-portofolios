# Canvas AI Integration - Google Gemini

## 🎯 Overview

The Canvas now features an **AI-powered flow generator** that transforms natural language task descriptions into structured, actionable execution flows using Google Gemini.

## ✅ What's Implemented

### 1. Secure API Route (`/api/ai/decompose`)

**Location:** `app/api/ai/decompose/route.ts`

**Features:**
- ✅ Server-side only (API key never exposed to frontend)
- ✅ Google Gemini Pro integration
- ✅ Structured JSON output validation
- ✅ Three generation modes: Quick, Detailed, Checklist
- ✅ Arabic and English support
- ✅ Error handling and response parsing

**Request Format:**
```json
{
  "prompt": "User's task description in Arabic or English",
  "mode": "quick" | "detailed" | "checklist"
}
```

**Response Format:**
```json
{
  "success": true,
  "plan": {
    "planTitle": "Clear title for the plan",
    "estimatedTotalMinutes": 240,
    "nodes": [
      {
        "title": "Action verb + clear step",
        "description": "1-2 sentence explanation",
        "estimateMinutes": 30,
        "effort": 3,
        "impact": 4,
        "tags": ["backend", "api"]
      }
    ]
  }
}
```

### 2. AI Flow Generator Component

**Location:** `components/canvas/ai-flow-generator.tsx`

**Features:**
- ✅ Beautiful search-style input bar
- ✅ Arabic/English placeholder: "اكتب المهمة بشكل تفصيلي… / Describe the task in detail…"
- ✅ Mode selector (Quick/Detailed/Checklist)
- ✅ Generate button with loading state
- ✅ Preview panel showing:
  - Plan title
  - Node count
  - Total estimated time
  - Step-by-step breakdown with effort/impact
- ✅ Action buttons:
  - ✅ Insert into Canvas
  - 🔁 Regenerate
  - ✏️ Edit prompt
- ✅ Smart options:
  - "Make it Smaller" - merge steps
  - "Make it More Detailed" - expand steps

### 3. Canvas Integration

**Location:** `app/admin/os/canvas/[canvasId]/page.tsx`

**Features:**
- ✅ AI bar integrated into Canvas header
- ✅ `handleInsertAIFlow()` function:
  - Creates nodes with proper spacing (250px horizontal)
  - Sets effort/impact/estimateMinutes from AI
  - Auto-connects nodes in sequence (Node1 → Node2 → Node3)
  - Refreshes canvas to show new flow
- ✅ Seamless UX with loading states

## 🔐 Security

**✅ API Key Protection:**
- Stored in `.env.local` (never committed to git)
- Only accessible server-side
- Frontend calls internal API route
- No exposure in browser/network

**Setup:**
1. Copy `.env.local.example` to `.env.local`
2. Get API key from: https://makersuite.google.com/app/apikey
3. Add: `GEMINI_API_KEY=your_key_here`

## 🧠 AI Prompt Engineering

**System Prompt Rules:**
1. Every step title MUST start with action verb
2. NO vague steps (no "Setup" or "Prepare")
3. Steps in logical execution order
4. Last step MUST be clear outcome (Publish/Deploy/Launch)
5. Large tasks split into phases
6. Default structure is LINEAR
7. Effort scale: 1=trivial, 5=very hard
8. Impact scale: 1=minimal, 5=critical
9. Realistic time estimates
10. Arabic or English based on input

**Generation Modes:**

**Quick Plan (5-8 steps):**
- Essential steps only
- Core workflow focus
- Balanced detail

**Detailed Plan (8-15 steps):**
- Thorough breakdown
- Sub-tasks included
- Comprehensive context

**Checklist (4-8 steps):**
- High-level milestones
- Brief descriptions
- Outcome-focused

## 🎨 User Experience Flow

```
1. User types task in Arabic or English
   "عاوز أعمل بورتفوليو جرافيك ديزاين زي Behance…"
   ↓
2. Selects mode (Quick/Detailed/Checklist)
   ↓
3. Clicks "Generate Flow"
   ↓
4. AI processes and returns structured plan
   ↓
5. Preview panel shows:
   - Plan title
   - 8 steps
   - ~4 hours total
   - Effort/Impact for each step
   ↓
6. User reviews and can:
   - Insert into Canvas ✅
   - Regenerate 🔁
   - Edit prompt ✏️
   - Make it Smaller/More Detailed
   ↓
7. On Insert:
   - Creates 8 nodes left → right
   - Auto-connects with edges
   - Sets effort/impact/time on each
   - Canvas updates instantly
```

## 📊 Example Outputs

**Input (Arabic):**
```
عاوز أعمل بورتفوليو جرافيك ديزاين زي Behance… 
فيه projects cards, filters, admin CRUD…
```

**AI Output:**
```json
{
  "planTitle": "Build Graphic Design Portfolio (Behance-style)",
  "estimatedTotalMinutes": 480,
  "nodes": [
    {
      "title": "Define Project Structure & Fields",
      "description": "Determine data model for projects: title, images, tags, category, date",
      "estimateMinutes": 45,
      "effort": 2,
      "impact": 5
    },
    {
      "title": "Design UI Wireframe",
      "description": "Create mockups for grid layout, project cards, and detail modal",
      "estimateMinutes": 60,
      "effort": 3,
      "impact": 4
    },
    {
      "title": "Build Projects Grid Component",
      "description": "Implement responsive grid with project cards showing thumbnails",
      "estimateMinutes": 90,
      "effort": 3,
      "impact": 5
    },
    {
      "title": "Build Project Details Modal",
      "description": "Create modal to display full project with image gallery",
      "estimateMinutes": 60,
      "effort": 3,
      "impact": 4
    },
    {
      "title": "Implement Filters & Tags",
      "description": "Add category filters and tag-based search functionality",
      "estimateMinutes": 75,
      "effort": 4,
      "impact": 3
    },
    {
      "title": "Build Admin CRUD Interface",
      "description": "Create admin panel for adding/editing/deleting projects",
      "estimateMinutes": 90,
      "effort": 4,
      "impact": 5
    },
    {
      "title": "Connect API & Database",
      "description": "Set up backend API routes and MongoDB collections",
      "estimateMinutes": 60,
      "effort": 3,
      "impact": 5
    },
    {
      "title": "Test & Publish Portfolio",
      "description": "QA testing, fix bugs, deploy to production",
      "estimateMinutes": 45,
      "effort": 2,
      "impact": 5
    }
  ]
}
```

**Canvas Result:**
- 8 nodes created horizontally
- Each connected: Node1 → Node2 → Node3 → ... → Node8
- Clean spacing (250px between nodes)
- All metadata (effort/impact/time) preserved

## 🚀 Installation & Setup

### 1. Install Google Generative AI Package

```bash
npm install @google/generative-ai
```

### 2. Configure Environment

Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Restart Dev Server

```bash
npm run dev
```

## 🧪 Testing

**Test Cases:**

1. **Arabic Input:**
   - "عاوز أعمل موقع إيكومرس كامل"
   - Should return structured e-commerce steps

2. **English Input:**
   - "Build a full-stack blog with authentication"
   - Should return blog development steps

3. **Complex Task:**
   - "Create a SaaS platform with user management, billing, and analytics"
   - Should split into phases

4. **Mode Variations:**
   - Quick: 5-8 steps
   - Detailed: 8-15 steps
   - Checklist: 4-8 high-level steps

5. **Smart Options:**
   - "Make it Smaller" should merge steps
   - "Make it More Detailed" should expand

## 📝 API Response Validation

The system validates:
- ✅ `planTitle` exists and is string
- ✅ `nodes` is array with at least 1 item
- ✅ Each node has required fields
- ✅ JSON is properly formatted
- ✅ Extracts JSON from markdown code blocks if needed

## 🎯 Benefits

**For Users:**
- ⚡ Instant structured plans from vague ideas
- 🧠 AI-powered task decomposition
- 🌍 Arabic and English support
- 🎨 Beautiful, intuitive UI
- ⚙️ Customizable detail level
- 🔗 Auto-connected execution flows

**For System:**
- 🔐 Secure API key management
- 📊 Structured data output
- 🎯 Consistent quality
- 🔄 Easy to extend
- 📈 Scalable architecture

## 🔮 Future Enhancements

**Potential additions:**
- Branch detection for parallel workflows
- Dependency analysis
- Resource estimation
- Team assignment suggestions
- Risk assessment
- Alternative path generation
- Multi-language support expansion
- Custom prompt templates
- Learning from user edits

---

## ✅ Acceptance Criteria Met

- ✅ User types task in Arabic or English
- ✅ Click Generate → Gemini returns structured JSON
- ✅ Preview displays plan with all details
- ✅ Insert creates connected nodes in Canvas
- ✅ Output is clean, actionable, structured
- ✅ API key stored securely server-side
- ✅ No exposure in frontend code
- ✅ Smart options (Smaller/Detailed) work
- ✅ Error handling for API failures
- ✅ Loading states and user feedback

**The AI integration is complete and production-ready!** 🎉
