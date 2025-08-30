# AnalysisControl Component

## Purpose
Control center for triggering CV-JD analysis with progress tracking.

## Props
```typescript
interface AnalysisControlProps {
  cvReady: boolean;
  jdReady: boolean;
  sessionId: string;
  cvUrl: string;
  jobDescription: string;
  onAnalysisComplete: (results: any) => void;
}
```

## Features
- Analyse button (disabled until both inputs ready)
- Progress indicator with current step
- Error handling with retry
- Status messages

## States
- idle: Waiting for inputs
- parsing-cv: Processing CV
- parsing-jd: Processing JD
- analyzing: Gap analysis
- complete: Done
- error: Failed

## Usage
```jsx
<AnalysisControl
  cvReady={cvUploaded}
  jdReady={jdValid}
  sessionId={sessionId}
  cvUrl={uploadedCvUrl}
  jobDescription={jdText}
  onAnalysisComplete={setResults}
/>
```