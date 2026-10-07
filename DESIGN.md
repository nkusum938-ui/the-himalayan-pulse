---
name: "Himalayan Pulse"
description: "Lightweight, high-leverage SEO & GEO news coverage dedicated exclusively to the Himalayan region."
colors:
  primary: "#1e3a2b"
  primary-light: "#2d5a40"
  neutral-bg: "#f8fafc"
  neutral-dark: "#0f172a"
  slate: "#1e293b"
  border: "#e2e8f0"
typography:
  display:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "var(--font-geist-mono), monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  card-news:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "20px"
---

# Design System: Himalayan Pulse

## Overview

**Creative North Star: "The High-Altitude Gazette"**

Himalayan Pulse delivers high-density, distraction-free environmental and cultural journalism across the Hindu Kush Himalayan belt (Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Nepal, Bhutan, and the Hindu Kush). Inspired by classic journalistic print typography and alpine field reports, the system rejects commercial web clutter, heavy drop shadows, and viral interface gimmicks in favor of sharp typographic hierarchy, slate tones, and alpine spruce accents.

The aesthetic emphasizes authority, speed, and ecological focus. Designed for sub-100ms static load times and server-first accessibility, every surface serves reader clarity and structured information extraction.

**Key Characteristics:**
- Journalistic print aesthetic with sharp typography and high contrast
- Alpine Spruce (#1e3a2b) primary accent paired with slate gray and crisp dividers
- Zero drop shadows; surface definition relies entirely on 1px borders and tonal contrast
- Dense, structured layout with monospace timestamps and regional badges

## Colors

The palette grounds reader attention in authoritative mountain journalism through dark slate typography, clean snow backgrounds, and deep evergreen accents.

### Primary
- **Alpine Spruce** (#1e3a2b): Reserved for primary editorial actions, category anchors, and focus boundaries.
- **Forest Pine Accent** (#2d5a40): Interactive hover state for spruce actions.

### Neutral
- **Alpine Snow** (#f8fafc): Page and card background tint providing clean, glare-free reading contrast.
- **Glacial Slate** (#0f172a): High-contrast primary body text and main article headlines.
- **Deep Granite** (#1e293b): Secondary text, author attribution, and structural borders.
- **Mist Divider** (#e2e8f0): 1px structural grid lines separating articles, cards, and header feeds.

### Named Rules
**The Spruce Accent Rule.** Alpine Spruce (#1e3a2b) is applied to ≤10% of any given screen area. Its restraint marks editorial importance.

## Typography

**Display Font:** Geist Sans (`var(--font-geist-sans)`, sans-serif)
**Body Font:** Geist Sans (`var(--font-geist-sans)`, sans-serif)
**Label/Mono Font:** Geist Mono (`var(--font-geist-mono)`, monospace)

**Character:** Technical, crisp, and editorial. Geist Sans provides authoritative, modern heading weight, while Geist Mono brings structured precision to timestamps, GPS coordinates, and regional tags.

### Hierarchy
- **Display** (700, clamp(2rem, 5vw, 3.5rem), 1.1): Hero article titles and top-of-page editorial features.
- **Headline** (600, clamp(1.25rem, 3vw, 2rem), 1.25): Article feed titles, section headers, and modal headings.
- **Title** (600, 1.125rem, 1.3): Card titles and sidebar item headings.
- **Body** (400, 1rem, 1.6): Article prose and digest summaries. Max line length: 65–75ch.
- **Label** (400 mono, 0.875rem, uppercase, 0.04em letter-spacing): Metadata, region tags, timestamps, and status indicators.

### Named Rules
**The Monospace Metadata Rule.** Timestamps, location markers, and category tags always use Geist Mono in uppercase with explicit tracking.

## Layout

Layout follows a strict grid inspired by broadsheet newspapers and academic journals:
- **Container Max Width:** 72rem (1152px) for main index, 48rem (768px) for single article reading flow.
- **Grid Structure:** 12-column responsive layout transitioning to 1-column on mobile viewports (<640px).
- **Rhythm:** Spacing follows 8px increments (8px, 16px, 24px, 32px, 48px).
- **Density:** Compact padding on lists and feeds to maximize visible stories per fold.

## Elevation & Depth

Himalayan Pulse is strictly flat. The system eliminates ambient soft shadows, floating cards, and volumetric gradients.

### Named Rules
**The Zero-Shadow Rule.** Surfaces are 100% flat at rest and in interactive states. Spatial separation is created exclusively via 1px Mist Dividers (#e2e8f0) and subtle background color shifts.

## Shapes

Form language is sharp, angular, and disciplined:
- **Border Radius:** 2px (`rounded-sm`) on buttons, inputs, and chips. 0px (`rounded-none`) on main containers and structural dividers.
- **Borders:** Crisp 1px solid borders using Mist Divider (#e2e8f0) or Slate (#1e293b).

## Components

### Buttons
- **Shape:** 2px radius (`rounded-sm`)
- **Primary:** Background Alpine Spruce (#1e3a2b), Text Alpine Snow (#f8fafc), Padding 10px 20px, Uppercase 0.05em tracking.
- **Hover / Focus:** Transitions to Forest Pine Accent (#2d5a40) with 2px offset focus ring.
- **Secondary / Outline:** Background transparent, Border 1px Slate (#1e293b), Text Slate (#1e293b).

### Category Chips & Badges
- **Style:** Background #f1f5f9, Border 1px solid #cbd5e1, Text #1e3a2b, 0.75rem Geist Mono uppercase.
- **State:** Active region tags invert to Alpine Spruce background with white text.

### News Cards
- **Corner Style:** 2px radius
- **Background:** White (#ffffff) or Alpine Snow (#f8fafc)
- **Shadow Strategy:** Zero shadows. 1px Mist Divider border.
- **Hover Treatment:** Border shifts to Alpine Spruce (#1e3a2b).

### Navigation & Header
- **Style:** Minimalist top bar with broadsheet masthead, clean 1px bottom border, high contrast navigation links with active Spruce indicator line.

## Do's and Don'ts

### Do:
- **Do** use 1px solid borders (#e2e8f0) for all section and card separations.
- **Do** enforce strict line-length caps (65-75ch) on article body text for optimal readability.
- **Do** format all dates, locations, and topic tags in tracked Geist Mono (`font-mono`).

### Don't:
- **Don't** add box-shadows or floating elevation effects to any UI element.
- **Don't** use generic rounded pill tags (radius > 4px).
- **Don't** introduce non-Himalayan decorative elements, ambient colorful glows, or viral news tickers.
