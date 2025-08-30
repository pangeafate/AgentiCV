# JDInput Component

## Purpose
Text input component for job descriptions with validation and session storage.

## Props
```typescript
interface JDInputProps {
  onJDReady: (text: string, isValid: boolean) => void;
  sessionId: string;
}
```

## Features
- Large text area for job descriptions
- Character count with 100 char minimum
- Clear button to reset
- Auto-save to session storage
- Sample JD for testing

## State Management
- jobDescription: string
- isValid: boolean (min 100 chars)
- charCount: number

## Usage
```jsx
<JDInput 
  onJDReady={(text, valid) => setJDReady(valid)}
  sessionId={sessionId}
/>
```

## Styling
Terminal theme with green borders and monospace font