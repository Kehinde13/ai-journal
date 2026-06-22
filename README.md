# AI Journal

An AI-powered journaling platform that transforms personal reflections into actionable emotional insights using AI sentiment analysis, secure cloud infrastructure, and real-time analytics.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React Native](https://img.shields.io/badge/React%20Native-Mobile-green)
![Supabase](https://img.shields.io/badge/Supabase-Backend-success)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

Rather than acting as a simple digital diary, AI Journal processes journal entries through an AI analysis pipeline that detects mood patterns, generates psychological insights, and produces weekly emotional summaries using structured data aggregation and large language models.

---

## The Problem

Traditional journaling apps only store text without providing meaningful interpretation.

AI Journal solves this by introducing an AI-driven emotional intelligence layer that:
- Converts unstructured reflections into structured emotional data
- Tracks mood progression over time
- Generates actionable psychological insights
- Aggregates weekly emotional patterns using deterministic time windows

---

## Key Outcomes

- AI-powered mood classification
- Sentiment scoring system (0–10 scale)
- Weekly emotional trend aggregation
- Secure multi-user authentication system
- Offline-first mobile experience
- Cross-platform deployment (iOS, Android, Web)
- Real-time analytics and visualization

---

## Key Technical Achievements

- Built full-stack AI journaling system using React Native + Node.js
- Sliding window weekly aggregation (Monday–Sunday boundary enforcement)
- Supabase Auth + Google OAuth integration
- Row-Level Security (RLS) for per-user isolation
- Claude Sonnet 4.6 powered sentiment analysis engine
- Structured JSON prompt engineering for deterministic AI outputs
- Offline-first architecture using AsyncStorage + NetInfo
- Modular service-layer API design

---

## System Architecture

```
React Native App (Expo)
        ↓
Supabase (Auth + PostgreSQL + RLS)
        ↓
Node.js AI Backend (Express)
        ↓
Claude AI (Sentiment + Insights)
```

---

## Core Feature System

### AI Mood Analysis
Each entry is processed through:
- Mood classification
- Sentiment scoring (0–10)
- Psychological insight generation

---

### Sliding Window Week System

Ensures strict Monday–Sunday grouping with no overlap.

```ts
const now = new Date();
const dayOfWeek = now.getDay();
const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

const monday = new Date(now);
monday.setDate(now.getDate() - diff);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);
```

---

## Backend API

### POST /api/analyse-entry
Returns mood + sentiment + insight.

### POST /api/weekly-summary
Aggregates entries into weekly emotional report.

---

## Authentication & Security

- Supabase Auth (Google OAuth + email/password)
- JWT-based API authentication
- Row-Level Security (RLS)
- User-scoped data isolation

---

## Database Schema

| Field | Type | Description |
|------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Auth reference |
| content | TEXT | Journal entry |
| mood | TEXT | AI-generated label |
| mood_score | NUMERIC | Sentiment score |
| insights | TEXT | AI-generated insight |
| created_at | TIMESTAMP | Entry timestamp |

---

## Screenshots

### Authentication
![Login Screen](./assets/screenshots/login-page.jpeg)

### Dashboard
![Dashboard](./assets/screenshots/dashboard.jpeg)

### Mood Insights
![Insights](./assets/screenshots/insights.jpeg)

### Mood Analytics
![Charts](./assets/screenshots/mood-trends.jpeg)

### Weekly Summary
![Weekly Summary](./assets/screenshots/weekly-summary.jpeg)

---

## Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React Native + Expo |
| Backend | Node.js + Express |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI | Claude Sonnet 4.6 |
| Testing | Vitest |

---

## Challenges Solved

- Preventing weekly overlap using sliding window logic
- Structuring unstructured journal text with AI prompts
- Ensuring user privacy with RLS policies
- Offline-first mobile architecture
- Cross-platform UI consistency

---

## Future Enhancements

- Voice journaling
- AI conversational companion
- Predictive emotional trends
- Calendar-based mood tracking
- Exportable wellness reports

---

## Status

Production-ready AI-powered journaling system with full-stack architecture and AI integration.
