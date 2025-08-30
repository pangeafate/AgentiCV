# HighlightedContent

## Purpose
Displays CV or JD content with intelligent highlighting based on gap analysis results.

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| type | 'cv' \| 'jd' | Yes | Type of content to display |
| data | Object | Yes | Parsed CV or JD data to display |
| highlighting | Array | No | Array of highlighting instructions |

## Dependencies
- Internal: None (pure component)
- External: React

## State Management
Stateless component - receives all data through props.

## Performance
- Memoizes highlight lookups for efficient rendering
- Uses inline styles for immediate visual feedback
- Optimized for large content with many highlights

## Highlighting Classes
- `highlight-match`: Green highlighting for exact matches
- `highlight-potential`: Orange highlighting for potential matches
- `highlight-gap`: Red highlighting for gaps/missing elements

## Data Structure Expected

### CV Data
```javascript
{
  personal: { name, email, phone, location },
  summary: String,
  skills: Array<String>,
  experience: Array<{ company, position, duration, responsibilities }>,
  education: Array<{ degree, field, institution, graduation }>
}
```

### JD Data
```javascript
{
  job_title: String,
  company_name: String,
  location: String,
  required_skills: Array<String>,
  preferred_skills: Array<String>,
  required_experience: Array<String>,
  required_education: Array<String>,
  key_responsibilities: Array<String>
}
```

### Highlighting Format
```javascript
[{
  address: String,  // e.g., "skills[0]", "experience[1]"
  class: String,    // "highlight-match", "highlight-potential", "highlight-gap"
  reason: String    // Explanation for the highlight
}]
```

## Refactoring Note
This component exceeds the 150-line limit (currently 324 lines) and should be refactored into smaller sub-components:
- PersonalInfoSection
- SkillsSection
- ExperienceSection
- EducationSection
- RequirementsSection