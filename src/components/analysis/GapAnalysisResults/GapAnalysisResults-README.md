# GapAnalysisResults Component

## Purpose
Side-by-side display of CV and JD with color-coded highlighting.

## Props
```typescript
interface GapAnalysisResultsProps {
  cvData: any;
  jdData: any;
  cvHighlighting: Array<{address, class, reason}>;
  jdHighlighting: Array<{address, class, reason}>;
  matchScores: any;
}
```

## Features
- Side-by-side panels (CV left, JD right)
- Color-coded highlights:
  - Green: Direct matches
  - Orange: Partial matches
  - Red: Gaps/missing
- Synchronized scrolling
- Match scores display
- Responsive (stacked on mobile)

## Highlight Classes
- highlight-match (green)
- highlight-potential (orange)
- highlight-gap (red)

## Usage
```jsx
<GapAnalysisResults
  cvData={parsedCV}
  jdData={parsedJD}
  cvHighlighting={cvHighlights}
  jdHighlighting={jdHighlights}
  matchScores={scores}
/>
```