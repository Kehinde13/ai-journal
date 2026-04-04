# AI Journal

A cross-platform mobile journaling app powered by AI. Write your thoughts, and the app automatically detects your mood, scores your emotional state, and delivers weekly insights — all in a clean dark/light interface.

## Features

- **AI Mood Analysis** — Every entry is analyzed by an AI backend that returns a mood label, sentiment score (0–10), and personalized insight
- **Mood Trend Charts** — Bar chart of your last 14 entries with color-coded emotional scores
- **Weekly Summaries** — AI-generated weekly recap with dominant mood and key emotional insights
- **Search & Filter** — Full-text search across title and content; filter by mood tag
- **Google & Email Auth** — Sign in with Google OAuth or email/password via Supabase
- **Onboarding** — 3-slide intro carousel shown once on first launch
- **Offline Detection** — Banner notification when the device loses connectivity
- **Dark / Light Theme** — System-aware theming with a manual toggle
- **Haptic Feedback** — Tactile responses on key interactions

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo 54 |
| Router | Expo Router 6 (file-based) |
| Language | TypeScript 5.9 |
| Auth | Supabase Auth + Google OAuth (Expo Auth Session) |
| Database | Supabase (PostgreSQL with Row-Level Security) |
| Local Storage | AsyncStorage |
| AI Backend | Custom REST API deployed on Render |
| Testing | Vitest 4 |

## Project Structure

```
ai-journal/
├── app/
│   ├── _layout.tsx          # Root layout — OnboardingGate + AuthProvider
│   ├── onboarding.tsx       # First-launch intro slides
│   ├── (app)/               # Protected routes (requires auth)
│   │   ├── index.tsx        # Home — journal entries list
│   │   ├── new-entry.tsx    # Create entry
│   │   ├── entry/[id].tsx   # View / edit / delete entry
│   │   ├── charts.tsx       # Mood trends chart
│   │   └── summary.tsx      # Weekly AI summary
│   └── (auth)/              # Public routes
│       ├── login.tsx
│       └── signup.tsx
├── config/supabase.ts       # Supabase client
├── context/AuthContext.tsx  # Auth state
├── services/ai.ts           # AI backend API calls
├── utils/time.ts            # Relative time formatting
├── constants/colors.ts      # Theme palettes
└── __tests__/               # Vitest test suites
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for physical device testing)

### Installation

```bash
git clone https://github.com/Kehinde13/ai-journal.git
cd ai-journal
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_BACKEND_URL=https://ai-journal-backend-wqsi.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
```

### Running the App

```bash
npx expo start          # Opens Expo dev tools (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Running Tests

```bash
npx vitest
npx vitest --coverage
```

## AI Backend

The app connects to a separate backend for all AI processing.

**Base URL:** `https://ai-journal-backend-wqsi.onrender.com`

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/analyse-entry` | POST | Mood label, score (0–10), and insight for a single entry |
| `/api/weekly-summary` | POST | Dominant mood, summary text, and insights for the week |

All requests are authenticated with the user's Supabase Bearer token.

## Database Schema

The `entries` table in Supabase stores all journal data:

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to Supabase auth user |
| `title` | text | Optional entry title |
| `content` | text | Entry body |
| `mood` | text | AI-detected mood label |
| `mood_score` | numeric | Sentiment score from 0–10 |
| `insights` | text | AI-generated insight for the entry |
| `created_at` | timestamp | Creation time |

Row-Level Security ensures users can only read and write their own entries.
