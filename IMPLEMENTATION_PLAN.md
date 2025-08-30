# Implementation Plan: CV vs Job Description Analysis System

## Executive Summary
Transform the current CV upload system into a comprehensive CV-JD gap analysis tool that processes both CVs and job descriptions through separate n8n workflows, performs intelligent comparison, and displays side-by-side results with color-coded highlighting.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (React)                      │
├──────────────────────────────────────────────────────────┤
│  CV Upload  │  JD Input  │  Analyse Button │  Results    │
└──────────────┬──────────────┬──────────────┬────────────┘
               │              │              │
               ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                    Proxy Server                          │
│               (CORS bypass + orchestration)              │
└──────────────┬──────────────┬──────────────┬────────────┘
               │              │              │
               ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                      n8n Workflows                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│  CV Parser   │  JD Parser   │ Gap Analyzer │            │
│  Workflow    │  Workflow    │  Workflow    │            │
└──────────────┴──────────────┴──────────────┴────────────┘
               │              │              │
               ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                      Supabase                            │
├──────────────────────────────────────────────────────────┤
│  Storage     │  Database    │  Real-time   │            │
│  (CV files)  │  (Analysis)  │  (Updates)   │            │
└──────────────────────────────────────────────────────────┘
```

## Phase 1: Frontend Implementation

### 1.1 Component Structure
```
src/
├── components/
│   ├── cv/
│   │   ├── CVUploader/            # Existing, keep as-is
│   │   │   └── CVUploader.jsx
│   │   └── CVDisplay/              # New: Display parsed CV
│   │       └── CVDisplay.jsx
│   ├── jd/
│   │   ├── JDInput/                # New: Job description input
│   │   │   └── JDInput.jsx
│   │   └── JDDisplay/               # New: Display parsed JD
│   │       └── JDDisplay.jsx
│   ├── analysis/
│   │   ├── AnalysisControl/        # New: Analyse button & status
│   │   │   └── AnalysisControl.jsx
│   │   ├── GapAnalysisResults/     # New: Side-by-side results
│   │   │   └── GapAnalysisResults.jsx
│   │   └── HighlightedContent/     # New: Highlighting renderer
│   │       └── HighlightedContent.jsx
│   └── layout/
│       └── Dashboard/               # Updated: Main container
│           └── Dashboard.jsx
├── services/
│   ├── supabase/
│   │   ├── cv.service.js          # Existing, minor updates
│   │   ├── jd.service.js          # New: JD storage/retrieval
│   │   └── analysis.service.js    # New: Analysis storage
│   └── n8n/
│       ├── cv-parser.service.js   # New: CV parsing workflow
│       ├── jd-parser.service.js   # New: JD parsing workflow
│       └── gap-analysis.service.js # New: Gap analysis workflow
└── utils/
    ├── highlighting/
    │   └── highlighter.js          # New: Apply highlighting
    └── exporters/
        └── pdfExporter.js          # New: Export results as PDF
```

### 1.2 UI Layout Design
```
┌─────────────────────────────────────────────────────────┐
│                    Terminal Header                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │    CV Upload        │  │   JD Input Area     │     │
│  │  ┌─────────────┐    │  │  ┌──────────────┐  │     │
│  │  │ Drop Zone   │    │  │  │              │  │     │
│  │  │             │    │  │  │   Text       │  │     │
│  │  └─────────────┘    │  │  │   Area       │  │     │
│  │  ✓ Uploaded: CV.pdf │  │  │              │  │     │
│  └─────────────────────┘  │  └──────────────┘  │     │
│                           └─────────────────────┘     │
│                                                         │
│              ┌──────────────────────┐                  │
│              │   ANALYSE BUTTON     │                  │
│              └──────────────────────┘                  │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │           Analysis Progress Bar              │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐              │
│  │   CV Results   │  │   JD Results   │              │
│  │                │  │                │              │
│  │  [Highlighted] │  │  [Highlighted] │              │
│  │                │  │                │              │
│  └────────────────┘  └────────────────┘              │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │         Match Scores & Recommendations       │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Component Specifications

#### JDInput Component
```jsx
// Features:
- Large text area for pasting job descriptions
- Character count indicator
- Clear button
- Sample JD button (for testing)
- Validation for minimum content
- Auto-save to session storage

// State:
{
  jobDescription: string,
  isValid: boolean,
  charCount: number
}
```

#### AnalysisControl Component
```jsx
// Features:
- "Analyse" button (disabled until both CV and JD present)
- Progress indicator during analysis
- Status messages
- Retry functionality on failure

// State:
{
  cvReady: boolean,
  jdReady: boolean,
  isAnalyzing: boolean,
  currentStep: 'idle' | 'parsing-cv' | 'parsing-jd' | 'analyzing' | 'complete',
  error: string | null
}
```

#### GapAnalysisResults Component
```jsx
// Features:
- Side-by-side display
- Synchronized scrolling
- Color legend
- Export to PDF button
- Zoom controls
- Mobile responsive view (stacked)

// Highlighting Classes:
.highlight-match { background: rgba(0, 255, 0, 0.3); }    // Green
.highlight-potential { background: rgba(255, 165, 0, 0.3); } // Orange  
.highlight-gap { background: rgba(255, 0, 0, 0.3); }      // Red
```

## Phase 2: n8n Workflow Architecture

### 2.1 Workflow Structure

#### Workflow 1: CV Parser
```
Webhook → HTTP Request (fetch PDF) → Extract Text → OpenAI (parse) → Format → Store
ID: cv-parser-webhook
URL: https://n8n.lakestrom.com/webhook/cv-parser-[id]
```

#### Workflow 2: JD Parser  
```
Webhook → Validate Text → OpenAI (parse) → Format → Store
ID: jd-parser-webhook
URL: https://n8n.lakestrom.com/webhook/jd-parser-[id]
```

#### Workflow 3: Gap Analyzer
```
Webhook → Fetch CV Data → Fetch JD Data → OpenAI (analyze) → Format → Store
ID: gap-analyzer-webhook
URL: https://n8n.lakestrom.com/webhook/gap-analyzer-[id]
```

### 2.2 n8n Node Configurations

#### CV Parser Workflow Nodes
1. **Webhook Node**
   - Path: `/cv-parser`
   - Method: POST
   - Response: When last node finishes

2. **HTTP Request Node**
   - URL: `{{ $json["publicUrl"] }}`
   - Method: GET
   - Response Format: File

3. **Extract From File Node**
   - Operation: Extract Text from PDF
   - Binary Property: data

4. **OpenAI Node (CV Parser)**
   - Model: gpt-4
   - System Message: [CV Parser Prompt from AGENT-PROMPTS.md]
   - Temperature: 0.1

5. **Code Node (Format Response)**
   ```javascript
   const parsedCV = JSON.parse($input.first().json.message.content);
   return [{
     json: {
       sessionId: $json["sessionId"],
       cvData: parsedCV,
       timestamp: new Date().toISOString()
     }
   }];
   ```

6. **Supabase Node (Store)**
   - Table: cv_analyses
   - Operation: Upsert

#### JD Parser Workflow Nodes
1. **Webhook Node**
   - Path: `/jd-parser`
   - Method: POST

2. **Code Node (Validate)**
   ```javascript
   const text = $json["jobDescription"];
   if (!text || text.length < 100) {
     throw new Error("Job description too short");
   }
   return [{ json: { text, sessionId: $json["sessionId"] } }];
   ```

3. **OpenAI Node (JD Parser)**
   - Model: gpt-3.5-turbo
   - System Message: [JD Parser Prompt from AGENT-PROMPTS.md]
   - Temperature: 0.1

4. **Code Node (Format)**
5. **Supabase Node (Store)**

#### Gap Analyzer Workflow Nodes
1. **Webhook Node**
   - Path: `/gap-analyzer`

2. **Parallel Branches:**
   - Branch 1: Supabase (Fetch CV Data)
   - Branch 2: Supabase (Fetch JD Data)

3. **Merge Node**
   - Mode: Combine by position

4. **OpenAI Node (Gap Analysis)**
   - Model: gpt-4
   - System Message: [Gap Analyst Prompt from AGENT-PROMPTS.md]
   - Temperature: 0.2

5. **Code Node (Format Highlights)**
6. **Supabase Node (Store Results)**

### 2.3 Workflow Orchestration

```javascript
// Frontend orchestration flow
async function performAnalysis(sessionId, cvUrl, jobDescription) {
  // Step 1: Parse CV
  const cvResult = await triggerCVParser(sessionId, cvUrl);
  
  // Step 2: Parse JD (in parallel)
  const jdResult = await triggerJDParser(sessionId, jobDescription);
  
  // Step 3: Wait for both to complete
  await Promise.all([cvResult, jdResult]);
  
  // Step 4: Trigger gap analysis
  const analysisResult = await triggerGapAnalysis(sessionId);
  
  return analysisResult;
}
```

## Phase 3: Supabase Database Design

### 3.1 Database Schema

```sql
-- Sessions table (temporary analysis sessions)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  status VARCHAR(50) DEFAULT 'active'
);

-- CV analyses table
CREATE TABLE cv_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  raw_text TEXT,
  parsed_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id)
);

-- JD analyses table  
CREATE TABLE jd_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Gap analyses table
CREATE TABLE gap_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  cv_highlighting JSONB NOT NULL,
  jd_highlighting JSONB NOT NULL,
  match_scores JSONB NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_cv_session ON cv_analyses(session_id);
CREATE INDEX idx_jd_session ON jd_analyses(session_id);
CREATE INDEX idx_gap_session ON gap_analyses(session_id);
```

### 3.2 RLS Policies

```sql
-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analyses ENABLE ROW LEVEL SECURITY;

-- Public read/write for sessions (with expiry)
CREATE POLICY "Public sessions" ON sessions
  FOR ALL USING (expires_at > NOW());

-- Public read for analyses within valid sessions
CREATE POLICY "Public read analyses" ON cv_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = cv_analyses.session_id 
      AND sessions.expires_at > NOW()
    )
  );

-- Similar policies for jd_analyses and gap_analyses
```

## Phase 4: Highlighting Implementation

### 4.1 Address System

```javascript
// CV Address Format
const cvAddresses = {
  sections: ['cv_section_1', 'cv_section_2', ...],
  items: ['cv_item_1', 'cv_item_2', ...],
  lines: ['cv_line_1', 'cv_line_2', ...]
};

// JD Address Format  
const jdAddresses = {
  requirements: ['jd_requirement_1', 'jd_requirement_2', ...],
  skills: ['jd_skill_1', 'jd_skill_2', ...],
  qualifications: ['jd_qualification_1', 'jd_qualification_2', ...]
};
```

### 4.2 Highlighting Renderer

```javascript
// highlighter.js
export function applyHighlighting(content, highlights, type) {
  let processedContent = content;
  
  // Sort highlights by position (reverse to maintain indices)
  const sortedHighlights = highlights.sort((a, b) => 
    b.position - a.position
  );
  
  sortedHighlights.forEach(highlight => {
    const { address, class: highlightClass, reason } = highlight;
    const element = findElementByAddress(processedContent, address);
    
    if (element) {
      processedContent = wrapWithHighlight(
        processedContent,
        element,
        highlightClass,
        reason
      );
    }
  });
  
  return processedContent;
}

function wrapWithHighlight(content, element, className, tooltip) {
  return `<span class="${className}" title="${tooltip}">${element}</span>`;
}
```

## Phase 5: Implementation Timeline

### Week 1: Foundation
- [ ] Day 1-2: Update frontend components (JD input, Analysis control)
- [ ] Day 3-4: Create Supabase schema and policies
- [ ] Day 5: Set up n8n workflow templates

### Week 2: Integration
- [ ] Day 1-2: Implement CV parser workflow
- [ ] Day 3-4: Implement JD parser workflow  
- [ ] Day 5: Implement gap analyzer workflow

### Week 3: Polish
- [ ] Day 1-2: Highlighting system implementation
- [ ] Day 3: Side-by-side results display
- [ ] Day 4: PDF export functionality
- [ ] Day 5: Testing and bug fixes

## Phase 6: Testing Strategy

### 6.1 Test Cases
1. **CV Upload**: PDF, DOCX, various sizes
2. **JD Input**: Short/long text, special characters
3. **Analysis**: Various skill matches, edge cases
4. **Highlighting**: Correct positioning, tooltips
5. **Export**: PDF generation, formatting

### 6.2 Error Scenarios
- Network failures
- Invalid file formats
- Timeout handling
- Empty results
- Malformed data

## Phase 7: Deployment Checklist

### Pre-deployment
- [ ] All n8n workflows tested
- [ ] Supabase schema deployed
- [ ] Frontend components integrated
- [ ] Proxy server updated
- [ ] Environment variables configured

### Post-deployment
- [ ] Monitor n8n execution logs
- [ ] Check Supabase performance
- [ ] Verify highlighting accuracy
- [ ] Test end-to-end flow
- [ ] Collect user feedback

## Key Considerations

### Performance
- Session-based storage (24hr expiry)
- Parallel processing of CV and JD
- Client-side highlighting for speed
- Caching parsed results

### Security
- No authentication required (MVP)
- Session isolation
- Input sanitization
- File size limits

### User Experience  
- Clear progress indicators
- Informative error messages
- Responsive design
- Intuitive highlighting

### Scalability
- Stateless workflows
- Database indexing
- CDN for static assets
- Rate limiting on webhooks

## Success Metrics

1. **Performance**
   - Total analysis time < 60 seconds
   - Individual parsing < 20 seconds
   - Highlighting render < 1 second

2. **Accuracy**
   - CV parsing accuracy > 95%
   - JD parsing accuracy > 95%
   - Relevant highlighting > 90%

3. **User Satisfaction**
   - Completion rate > 80%
   - Export usage > 50%
   - Return usage > 30%

## Next Steps

1. Review and approve this plan
2. Set up n8n workflow scaffolds
3. Create Supabase schema
4. Begin frontend development
5. Implement workflows sequentially
6. Integrate and test
7. Deploy to production

---

*This implementation plan provides a complete roadmap for transforming the current CV upload system into a comprehensive CV-JD analysis platform with intelligent highlighting and scoring.*