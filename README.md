# 🛡️ CyberSieve

CyberSieve is a full-stack cybersecurity web application for file threat scanning, AI-powered security recommendations, user account management, and analytics.

## 🌐 Live Project

[View the live web application](https://cybersieve-se.vercel.app/)

## 🎞️ Project Presentation

[View the Canva presentation](https://canva.link/0q9xptnymbdxzbw)

## 🧰 Tech Stack

- 🖥️ Frontend: React, TypeScript, Vite, Tailwind CSS, Axios, Supabase JS
- ⚙️ Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- 🗄️ Data and Auth: PostgreSQL + Supabase Auth (JWT validation)
- 🔐 Security and Intelligence APIs: VirusTotal, Groq LLM (via LangChain)
- ✅ Testing: Pytest (backend), Vitest + Testing Library (frontend)

## ✨ Core Features

- 👤 User registration and profile management
- 🔑 Secure authentication using Supabase tokens
- 📤 File upload and malware scan workflow with VirusTotal
- 🧠 Cached report retrieval by file hash to reduce duplicate external API calls
- 🤖 AI-generated security recommendations from scan results
- 📊 Scan statistics dashboard and risk breakdown by file type

## 🏗️ Architecture Overview

CyberSieve follows a layered architecture:

- API Layer: FastAPI routers under backend/app/api
- Service Layer: Business logic under backend/app/services
- Data Layer: SQLAlchemy models and database session management under backend/app/db
- Models and Contracts: Request/response and domain models under backend/app/models
- Frontend UI Layer: React pages/components and context-driven state management under frontend/src

This separation keeps routing, business rules, and persistence concerns clear and maintainable.

## 🧩 Design Patterns Used

The project uses several concrete design patterns:

Reference: [Design Patterns - Refactoring.Guru](https://refactoring.guru/design-patterns)

1. Proxy Pattern
- Implemented in VirusTotal integration with VirusTotalCacheProxy.
- The proxy checks local cache first, then delegates to the real API client when needed.
- Benefit: reduces duplicate API requests, improves response time, and limits external API usage.

2. Singleton Pattern
- Implemented in LLMService using a singleton-style __new__ method.
- Ensures a single shared LLM client instance is created and reused.
- Benefit: lowers repeated client initialization overhead and centralizes LLM configuration.

3. Dependency Injection Pattern
- Used throughout FastAPI endpoints with Depends(get_db) and injected services.
- Benefit: better testability, loose coupling, and cleaner endpoint logic.

4. Layered (N-tier) Architecture Pattern
- API, service, and data concerns are separated into dedicated modules.
- Benefit: easier maintenance, extension, and team collaboration.

5. Context Provider Pattern (Frontend)
- Implemented with React AuthContext/AuthProvider for global auth state.
- Benefit: centralized auth session handling and consistent route protection behavior.

## 🗂️ Repository Structure

```
SE-Cybercieve-Project/
	backend/
		app/
			api/          # FastAPI routes
			services/     # Business logic and external service integration
			db/           # SQLAlchemy models and session utilities
			models/       # Data models and exceptions
			core/         # Environment/configuration
		tests/          # Backend test suite
	frontend/
		src/
			api/          # Axios/Supabase clients
			components/   # Reusable UI components
			context/      # React context providers
			pages/        # Route-level screens
		tests/          # Frontend test suite
```

## 🔧 Environment Variables

### Backend (.env)

- DB_USER
- DB_PASSWORD
- DB_HOST
- DB_PORT
- DB_NAME
- SUPABASE_URL
- SUPABASE_KEY
- JWKS_URL
- AUDIENCE
- ALGORITHM
- VIRUS_TOTAL_API_KEY
- GROQ_API_KEY

### Frontend (.env)

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY

## 🚀 Local Development

### Prerequisites

- Python 3.13+
- Node.js 24.x
- npm
- uv (Python package manager used by backend tasks)

### 1) Run Backend

From the backend directory:

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend base URL: http://127.0.0.1:8000

### 2) Run Frontend

From the frontend directory:

```bash
npm install
npm run dev
```

Frontend URL (default Vite): http://localhost:5173

## 🧪 Testing

### Backend Tests

From the backend directory:

```bash
uv run python -m pytest
```

### Frontend Tests

From the frontend directory:

```bash
npm run test
```

## 📡 Backend API Overview

Main route groups:

- /api
	- GET /me
	- PUT /me
	- POST /register
- /api/files
	- POST /upload-to-vt
	- GET /vt-analysis/{analysis_id}
	- GET /vt-report
	- GET /stats
- /api/recommend
	- POST /recommendation

## ☁️ Deployment Notes

- Frontend is configured for Vercel deployment.
- Backend includes Docker and Fly.io configuration files.
- Update frontend API base URL configuration for production environments.

## 👥 Team Notes

- Keep environment variables out of source control.
- Prefer service-layer logic for external API orchestration and business rules.
- Keep endpoints thin and focused on validation/input-output handling.

## 📄 License

This project is licensed under the KMUTNB Academic Project License for Software Engineering coursework. See [LICENSE](LICENSE) for details.
