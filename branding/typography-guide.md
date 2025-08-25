# CreatorHub.Brave - Typography Guide

## Font Selection Rationale

### Primary Font: Inter
- **Type**: Sans-serif
- **Designer**: Rasmus Andersson
- **License**: Open Font License (free for commercial use)
- **Strengths**: Excellent screen readability, modern design, comprehensive character set
- **Technical**: Optimized for digital interfaces, high legibility at small sizes

### Secondary Font: JetBrains Mono
- **Type**: Monospace
- **Designer**: JetBrains
- **License**: Open Font License (free for commercial use)  
- **Strengths**: Clear character distinction, excellent for code/addresses
- **Technical**: Perfect for technical data, wallet addresses, transaction hashes

## Font Implementation

### Web Font Loading
```html
<!-- Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Font Stack
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

## Typography Scale

### Headings

#### H1 - Page Titles
- **Font**: Inter Bold (700)
- **Size**: 48px / 3rem
- **Line Height**: 1.1 (52.8px)
- **Letter Spacing**: -0.025em
- **Usage**: Landing page heroes, main page titles
- **Example**: "Secure Your Tomorrow"

#### H2 - Section Headings
- **Font**: Inter SemiBold (600)
- **Size**: 36px / 2.25rem
- **Line Height**: 1.2 (43.2px)
- **Letter Spacing**: -0.02em
- **Usage**: Major section titles, feature headings
- **Example**: "Create Your First Vault"

#### H3 - Subsection Headings
- **Font**: Inter SemiBold (600)
- **Size**: 24px / 1.5rem
- **Line Height**: 1.3 (31.2px)
- **Letter Spacing**: -0.01em
- **Usage**: Card titles, form sections
- **Example**: "Vault Configuration"

#### H4 - Card Headings
- **Font**: Inter Medium (500)
- **Size**: 20px / 1.25rem
- **Line Height**: 1.4 (28px)
- **Letter Spacing**: 0
- **Usage**: Card headers, component titles
- **Example**: "Security Features"

### Body Text

#### Large Body
- **Font**: Inter Regular (400)
- **Size**: 18px / 1.125rem
- **Line Height**: 1.6 (28.8px)
- **Letter Spacing**: 0
- **Usage**: Hero descriptions, important explanations
- **Max Width**: 65ch for optimal readability

#### Regular Body
- **Font**: Inter Regular (400)
- **Size**: 16px / 1rem
- **Line Height**: 1.5 (24px)
- **Letter Spacing**: 0
- **Usage**: Standard content, descriptions
- **Max Width**: 65ch for optimal readability

#### Small Body
- **Font**: Inter Regular (400)
- **Size**: 14px / 0.875rem
- **Line Height**: 1.5 (21px)
- **Letter Spacing**: 0
- **Usage**: Secondary information, captions
- **Max Width**: 60ch for optimal readability

### UI Text

#### Button Text
- **Font**: Inter Medium (500)
- **Size**: 16px / 1rem (large), 14px / 0.875rem (medium)
- **Line Height**: 1 (same as font size)
- **Letter Spacing**: 0.01em
- **Transform**: None
- **Usage**: All button text, CTAs

#### Label Text
- **Font**: Inter Medium (500)
- **Size**: 14px / 0.875rem
- **Line Height**: 1.4 (19.6px)
- **Letter Spacing**: 0
- **Usage**: Form labels, UI labels

#### Caption Text
- **Font**: Inter Regular (400)
- **Size**: 12px / 0.75rem
- **Line Height**: 1.4 (16.8px)
- **Letter Spacing**: 0.02em
- **Usage**: Timestamps, metadata, helper text

### Technical Text

#### Code/Addresses
- **Font**: JetBrains Mono Regular (400)
- **Size**: 14px / 0.875rem
- **Line Height**: 1.5 (21px)
- **Letter Spacing**: 0
- **Usage**: Wallet addresses, transaction hashes, code blocks

#### Inline Code
- **Font**: JetBrains Mono Regular (400)
- **Size**: 14px / 0.875rem (same as surrounding text)
- **Line Height**: Inherit from parent
- **Letter Spacing**: 0
- **Background**: Light gray background
- **Usage**: Inline technical references

## Responsive Typography

### Mobile Scale (< 768px)
- H1: 36px → 32px
- H2: 30px → 28px  
- H3: 22px → 20px
- H4: 18px → 18px
- Large Body: 16px → 16px
- Regular Body: 16px → 15px
- Small Body: 14px → 13px

### Tablet Scale (768px - 1024px)
- Use desktop sizes with adjusted line heights for touch interfaces
- Increase touch target sizes for interactive elements
- Maintain readability at arm's length viewing distance

## Color Applications

### Text Colors
```css
--text-primary: #0f172a;    /* Dark Slate - Main content */
--text-secondary: #6b7280;   /* Steel Gray - Secondary info */
--text-inverse: #ffffff;     /* White - On dark backgrounds */
--text-accent: #1e3a8a;      /* Brave Blue - Links, highlights */
--text-success: #059669;     /* Success Green - Positive states */
--text-warning: #f59e0b;     /* Warning Amber - Cautions */
```

### Link Styling
- **Default**: Brave Blue (#1e3a8a)
- **Hover**: Darker blue (#1e40af)
- **Visited**: Guardian Purple (#7c3aed)
- **Focus**: High contrast outline

## Accessibility Guidelines

### Contrast Requirements
- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text** (18px+ or 14px+ bold): 3:1 minimum
- **UI Elements**: 3:1 minimum for interactive elements

### Reading Experience
- **Optimal Line Length**: 45-75 characters (65ch ideal)
- **Line Height**: 1.4-1.6x font size for body text
- **Paragraph Spacing**: 1em between paragraphs
- **Focus States**: Clear visual indication for keyboard navigation

## Usage Guidelines

### Do's ✅
- Use Inter for all UI text and content
- Use JetBrains Mono for technical data only
- Maintain consistent font weights throughout
- Follow the established type scale
- Ensure proper contrast ratios
- Use appropriate line heights for readability

### Don'ts ❌
- Never mix more than 2 font families
- Don't use decorative fonts for body text
- Avoid using too many font weights
- Don't sacrifice readability for style
- Never use fonts not in the approved list
- Don't ignore accessibility requirements

## Implementation Examples

### React/CSS Implementation
```css
.heading-1 {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 3rem;
  line-height: 1.1;
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

.body-regular {
  font-family: var(--font-primary);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  max-width: 65ch;
}

.code-block {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.5;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
}
```

This typography system ensures CreatorHub.Brave maintains professional, readable, and accessible text across all platforms while supporting both general content and technical crypto-specific information.