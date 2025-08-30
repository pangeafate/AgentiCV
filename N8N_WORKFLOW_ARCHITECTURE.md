# n8n Workflow Architecture for CV-JD Analysis

## Overview
Three separate n8n workflows working together to provide comprehensive CV vs Job Description analysis with intelligent highlighting.

## Workflow URLs
```
CV Parser:    https://n8n.lakestrom.com/webhook/cv-parser-[id]
JD Parser:    https://n8n.lakestrom.com/webhook/jd-parser-[id]
Gap Analyzer: https://n8n.lakestrom.com/webhook/gap-analyzer-[id]
```

## Workflow 1: CV Parser

### Trigger Payload
```json
{
  "sessionId": "uuid-v4",
  "publicUrl": "https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/file.pdf",
  "filename": "cv-file.pdf",
  "fileType": "application/pdf"
}
```

### Node Configuration
```
[Webhook] 
    ↓
[HTTP Request] - Fetch PDF from {{ $json["publicUrl"] }}
    ↓
[Extract From File] - Extract text from PDF
    ↓
[OpenAI] - Parse CV with structured prompt
    Model: gpt-4
    Temperature: 0.1
    System: [CV Parser Prompt - extracts exact quotes only]
    ↓
[Code] - Format and validate JSON response
    ↓
[Supabase] - Store in cv_analyses table
    ↓
[Response] - Return parsed CV data
```

### Expected Output
```json
{
  "success": true,
  "sessionId": "uuid-v4",
  "cvData": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "skills": ["Python", "React", "AWS"],
    "experience": [...],
    "education": [...]
  }
}
```

## Workflow 2: JD Parser

### Trigger Payload
```json
{
  "sessionId": "uuid-v4",
  "jobDescription": "Full job description text...",
  "source": "manual_input"
}
```

### Node Configuration
```
[Webhook]
    ↓
[Code] - Validate input (min 100 chars)
    ↓
[OpenAI] - Parse JD with structured prompt
    Model: gpt-3.5-turbo
    Temperature: 0.1
    System: [JD Parser Prompt - extracts requirements]
    ↓
[Code] - Format and validate JSON response
    ↓
[Supabase] - Store in jd_analyses table
    ↓
[Response] - Return parsed JD data
```

### Expected Output
```json
{
  "success": true,
  "sessionId": "uuid-v4",
  "jdData": {
    "job_title": "Senior Software Engineer",
    "required_skills": ["Python", "Docker", "AWS"],
    "required_experience": ["5+ years"],
    "required_education": ["BS in Computer Science"],
    "key_responsibilities": [...]
  }
}
```

## Workflow 3: Gap Analyzer

### Trigger Payload
```json
{
  "sessionId": "uuid-v4"
}
```

### Node Configuration
```
[Webhook]
    ↓
    ├─[Supabase] - Fetch CV data by sessionId
    │
    └─[Supabase] - Fetch JD data by sessionId
    ↓
[Merge] - Combine both datasets
    ↓
[OpenAI] - Perform gap analysis
    Model: gpt-4
    Temperature: 0.2
    System: [Gap Analyst Prompt - generates highlights]
    ↓
[Code] - Process highlighting addresses
    ↓
[Supabase] - Store in gap_analyses table
    ↓
[Response] - Return analysis results
```

### Expected Output
```json
{
  "success": true,
  "sessionId": "uuid-v4",
  "analysis": {
    "cv_highlighting": [
      {
        "address": "cv_skill_1",
        "class": "highlight-match",
        "reason": "Python skill matches requirement"
      },
      {
        "address": "cv_skill_5",
        "class": "highlight-gap",
        "reason": "Missing Docker experience"
      }
    ],
    "jd_highlighting": [
      {
        "address": "jd_requirement_2",
        "class": "highlight-gap",
        "reason": "Docker requirement not found in CV"
      }
    ],
    "match_score": {
      "overall_score": 75.0,
      "skills_score": 65.0,
      "experience_score": 80.0,
      "recommendations": [
        "Add Docker/containerization experience",
        "Emphasize cloud architecture work"
      ]
    }
  }
}
```

## Frontend Orchestration

### Parallel Processing Flow
```javascript
async function analyzeCV(sessionId, cvUrl, jobDescription) {
  // Show progress: "Analyzing CV and Job Description..."
  
  // Trigger both parsers in parallel
  const [cvResult, jdResult] = await Promise.all([
    fetch('/api/n8n/cv-parser', {
      method: 'POST',
      body: JSON.stringify({ sessionId, publicUrl: cvUrl })
    }),
    fetch('/api/n8n/jd-parser', {
      method: 'POST',
      body: JSON.stringify({ sessionId, jobDescription })
    })
  ]);
  
  // Show progress: "Comparing CV to Job Requirements..."
  
  // Trigger gap analysis
  const analysisResult = await fetch('/api/n8n/gap-analyzer', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
  
  // Show progress: "Analysis Complete!"
  
  return analysisResult.json();
}
```

## Error Handling

### Retry Logic
```javascript
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function callWithRetry(url, payload, retries = 0) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok && retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callWithRetry(url, payload, retries + 1);
    }
    
    return response.json();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callWithRetry(url, payload, retries + 1);
    }
    throw error;
  }
}
```

## Webhook Security

### Add API Key Authentication (Optional)
```javascript
// In n8n Webhook node:
Authentication: Header Auth
Header Name: X-API-Key
Header Value: [generated-key]

// In frontend:
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.VITE_N8N_API_KEY
}
```

## Performance Optimization

### Caching Strategy
```javascript
// Cache parsed results in Supabase for 24 hours
// Check cache before re-parsing identical content

const checkCache = async (contentHash, type) => {
  const { data } = await supabase
    .from(`${type}_analyses`)
    .select('*')
    .eq('content_hash', contentHash)
    .gte('created_at', new Date(Date.now() - 24*60*60*1000))
    .single();
  
  return data;
};
```

## Monitoring & Logging

### Key Metrics
- CV parsing time (target: < 15s)
- JD parsing time (target: < 10s)
- Gap analysis time (target: < 15s)
- Total analysis time (target: < 45s)
- Success rate (target: > 95%)

### Error Tracking
```javascript
// Log to Supabase error table
const logError = async (workflow, error, context) => {
  await supabase.from('workflow_errors').insert({
    workflow,
    error_message: error.message,
    context,
    timestamp: new Date()
  });
};
```

## Testing Webhooks

### Test CV Parser
```bash
curl -X POST https://n8n.lakestrom.com/webhook/cv-parser-[id] \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "publicUrl": "https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test.pdf"
  }'
```

### Test JD Parser
```bash
curl -X POST https://n8n.lakestrom.com/webhook/jd-parser-[id] \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "jobDescription": "We are looking for a Senior Software Engineer..."
  }'
```

### Test Gap Analyzer
```bash
curl -X POST https://n8n.lakestrom.com/webhook/gap-analyzer-[id] \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123"
  }'
```

## Deployment Checklist

- [ ] Create all three workflows in n8n
- [ ] Test each workflow individually
- [ ] Configure Supabase tables and policies
- [ ] Update proxy server with new endpoints
- [ ] Set webhook URLs in environment variables
- [ ] Test end-to-end flow
- [ ] Monitor execution logs
- [ ] Set up error alerts

---

*This architecture enables parallel processing of CV and JD with intelligent gap analysis, providing fast and accurate results with visual highlighting.*