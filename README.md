# ShopSee

Assistive PWA for visually impaired users — identifies store department categories via camera with voice narration.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: FastAPI (Python), SQLAlchemy 2.0, SQLite
- **Voice**: Web Speech API (browser-native TTS)
- **Camera**: MediaDevices API (`getUserMedia`)

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
shopsee/
├── frontend/          # Next.js 15 PWA
│   ├── src/
│   │   ├── app/       # Pages (camera, history, settings)
│   │   ├── components # UI components
│   │   ├── hooks/     # useCamera, useSpeech, useSettings
│   │   ├── lib/       # API client, categories
│   │   └── i18n/      # RU/EN translations
│   └── public/        # PWA manifest, icons, service worker
├── backend/           # FastAPI
│   └── app/
│       ├── api/       # REST endpoints
│       ├── core/      # Config, database
│       ├── models/    # SQLAlchemy models
│       ├── schemas/   # Pydantic schemas
│       └── services/  # Mock AI classifier
└── README.md
```

## Features

- Camera-based product category detection (mock AI, replaceable)
- Voice narration via Web Speech API
- Scan history with persistence
- Accessibility: high contrast, large text, WCAG AAA
- Bilingual interface (Russian / English)
- PWA: installable, works offline
