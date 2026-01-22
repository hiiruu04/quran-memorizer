# Quran Memorizer Web Application - Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Vision
A web application to help individual Hifz students memorize the Holy Quran through interactive tools including text display, audio recitation, progress tracking, and self-testing features.

### 1.1 Target Audience
- **Primary**: Individual Hifz students (personal use)
- **Secondary**: Future consideration for teachers/institutes

### 1.3 Platform
- Web application (responsive design for desktop and mobile)

---

## 2. Core Features (MVP)

### 2.1 Quran Text Display & Reading
- Display Quranic text in Arabic with proper typography
- Show surah names, ayah numbers, and juz indicators
- Clean, distraction-free reading interface
- Ability to navigate to specific surah/ayah

### 2.2 Audio Recitation & Repetition
- Integrated audio playback of Quran recitation
- Select reciters (start with 1-2 popular options)
- Repeat functionality:
  - Repeat single ayah
  - Repeat range of ayahs
  - Custom repeat count
- Playback controls (play, pause, seek)

### 2.3 Progress Tracking
- Track memorization status per ayah:
  - Not started
  - In progress
  - Memorized
  - Revised
- Visual progress indicators (progress bars, color coding)
- Dashboard showing overall progress
- Track which Surahs/Juz are completed

### 2.4 Testing/Quiz Mode
- Self-testing functionality to verify memorization:
  - Hide text option (test from memory)
  - Hint system (reveal first letter/word)
  - Record self-assessment (correct/incorrect/needs review)
- Flashcard-style testing interface
- Test by surah, juz, or custom range

### 2.5 User Accounts & Authentication
- User registration and login
- Secure password handling
- Email verification (optional)
- Password reset functionality
- Progress synchronization across devices

---

## 3. Data Sources & APIs

### 3.1 Quran Data
Consider using existing Quran APIs:
- **Quran.com API** - Comprehensive, includes text, audio, translations
- **Alquran.cloud API** - Simple, reliable
- **Tanzil.net** - Pure text source

### 3.2 Required Data
- Quranic text (Uthmani script)
- Audio files from reputable reciters
- Surah/Juz metadata

---

## 4. User Flow Examples

### 4.1 New User Onboarding
1. User lands on homepage → Clicks "Get Started"
2. Creates account → Verifies email (optional)
3. Sees welcome tutorial → Selects preferred reciter
4. Directed to dashboard → Starts memorizing Surah Al-Fatiha

### 4.2 Daily Memorization Session
1. User logs in → Views dashboard
2. Selects surah to memorize → Opens reading view
3. Plays audio with repetition → Reads along
4. Practices without audio → Tests memory (quiz mode)
5. Marks ayah as "Memorized" → Progress saved

### 4.3 Self-Testing
1. User selects "Quiz Mode"
2. Chooses range (Surah/Juz/custom)
3. Text hidden → Recites from memory
4. Uses hint if needed → Reveals answer
5. Self-assesses → System tracks weak areas

---

## 5. Technical Considerations

### 5.1 Proposed Tech Stack
- **Framework**: TanStack Start (full-stack React framework)
  - Includes TanStack Router (file-based routing, data loading, SEO)
  - Includes TanStack Query (server functions, caching)
  - Built on Vite for fast dev experience
  - SSR/SSG support for performance
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui or Headless UI
- **Database**: PostgreSQL or SQLite (for simpler MVP)
- **ORM**: Prisma or Drizzle ORM
- **Authentication**: TanStack Start auth utilities or Lucia
- **State Management**: Built-in TanStack Query (server state) + Zustand (client state)

### 5.2 Data Storage Requirements
| Data Type | Storage Location |
|-----------|------------------|
| User accounts | Database |
| Progress tracking | Database |
| Quran text | External API (cache optionally) |
| Audio files | External API or CDN |

---

## 6. Future Enhancements (Post-MVP)

- Revision scheduler (Murmaja system)
- Translation in multiple languages
- Tafsir/explanation notes
- Teacher dashboard (for tracking students)
- Social features (study groups, leaderboards)
- Offline mode (PWA)
- Mobile apps (iOS/Android)
- Advanced analytics (streak tracking, weak areas)

---

## 7. Success Metrics

- User engagement (daily/weekly active users)
- Memorization progress per user
- Quiz completion rates
- User retention (30-day, 90-day)
- Feature usage analytics

---

## 8. Implementation Priority

| Priority | Feature | Notes |
|----------|---------|-------|
| P0 | User Authentication | Foundation for all features |
| P0 | Quran Text Display | Core reading experience |
| P0 | Basic Progress Tracking | Store user progress |
| P1 | Audio Playback | Enhances learning experience |
| P1 | Quiz Mode | Self-assessment capability |
| P2 | Advanced Progress Features | Dashboard, analytics |
| P2 | Multiple Reciters | User preference options |

---

## 9. Design Considerations

### 9.1 UX Principles
- **Minimal & distraction-free**: Focus on the Quran text
- **Accessible**: Large fonts, high contrast options
- **Responsive**: Works seamlessly on mobile and desktop
- **Fast**: Quick load times, smooth transitions

### 9.2 Islamic/Ethical Considerations
- Respectful handling of Quranic text
- Proper wudu reminder (optional)
- Reciters should be reputable and authentic
- No inappropriate ads or content

---

## 10. Critical Files/Structure (For Implementation)

When ready to implement, the project will need:

```
memorizer/
├── src/
│   ├── routes/              # TanStack Start file-based routing
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Home page
│   │   ├── dashboard.tsx    # User dashboard
│   │   ├── quran/
│   │   │   ├── $surah.tsx   # Surah reading view
│   │   │   └── quiz.tsx     # Quiz mode
│   │   └── auth/
│   │       ├── login.tsx
│   │       └── register.tsx
│   ├── components/          # React components
│   │   ├── QuranDisplay.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── QuizMode.tsx
│   │   └── ProgressBar.tsx
│   ├── lib/                 # Utilities & API clients
│   │   ├── quran-api.ts     # Quran API client
│   │   └── utils.ts         # Helper functions
│   ├── db/                  # Database schema & queries
│   │   ├── schema.ts        # Drizzle/Prisma schema
│   │   └── queries.ts       # Database queries
│   └── server/              # Server functions (TanStack Start)
│       └── auth.ts          # Auth server functions
├── public/                  # Static assets
└── vite.config.ts           # Vite config with TanStack Router plugin
```

---

## Verification

After implementation, verify:
1. Users can register and login
2. Quran text displays correctly for multiple surahs
3. Audio plays with repeat functionality
4. Progress is tracked and persisted
5. Quiz mode works with hint/reveal features
6. Data syncs across devices
7. Application is responsive on mobile
