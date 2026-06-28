🏆 SIH 2025 | Team: AyurTech Crew
# AICTE Document Verification Portal

✨ AI-assisted document submission, review, and compliance tracking platform for institutes, evaluators, and administrators.

An enterprise-grade full-stack platform designed to streamline AICTE-related document verification workflows through role-based portals, persistent database workflows, and AI-assisted analysis of uploaded evidence. The system reduces manual coordination, improves transparency, and gives every stakeholder a clear view of verification status from submission to final review.

## 🎯 Problem Statement

Traditional document verification workflows in educational compliance systems often suffer from:

- 📄 Manual processing of forms, documents, and supporting evidence
- ⏳ Delayed approvals caused by fragmented review queues
- 🔍 Limited transparency for institutes and evaluators
- ⚖️ Inefficient workload distribution across reviewers
- 🧾 Weak auditability across submissions and decisions
- 🗂️ Difficulty managing multiple application categories and document types
- 📧 Repetitive coordination through email and spreadsheets

## 🚀 Solution Overview

The AICTE Document Verification Portal addresses these issues with a modern multi-service architecture:

- 🧑‍💼 Role-based dashboards for institutes, evaluators, and administrators
- 🔐 Secure authentication and protected application flows
- 📁 Document upload, storage, and evidence lookup
- 🤖 AI-assisted analysis for research eligibility, faculty validation, image detection, and document comparison
- 🗃️ Persistent workflow tracking with PostgreSQL and Prisma
- 📊 Clean operational dashboards for monitoring submissions and statuses
- ⚡ FastAPI-based AI services connected to the backend through REST APIs

## 🏗️ Architecture

```text
AICTE Document Verification Portal
├── Frontend (React + TypeScript + Vite)
│   ├── Institute Portal
│   ├── Evaluator Dashboard
│   ├── Admin Panel
│   └── Responsive UI with role-based routes
├── Backend API (Node.js + Express)
│   ├── Authentication and authorization
│   ├── Document management
│   ├── Placements and feedback modules
│   ├── Submission tracking
│   └── Admin/evaluator/institute endpoints
├── AI Services (Python + FastAPI)
│   ├── Document comparison
│   ├── Research eligibility checks
│   ├── Faculty validation
│   ├── Blueprint and image analysis
│   └── Chat and legal keyword utilities
├── Database (PostgreSQL + Prisma)
└── File Storage for uploaded documents and evidence
```

## 🛠️ Technology Stack

### 🎨 Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Zustand
- React Router
- Framer Motion
- Capacitor

### 🔧 Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Multer file uploads
- CORS middleware

### 🤖 AI / Automation

- Python 3.9+
- FastAPI
- Uvicorn
- Groq API integration
- YOLOv8-based detection models
- PDF processing and comparison utilities
- Image and document analysis helpers

## ✨ Key Features

### 🔐 Authentication and Security

- 👥 Multi-role login for institute, evaluator, and admin users
- 🔑 JWT-based session handling
- 🛡️ Protected routes and role-aware navigation
- 💾 Persistent auth state using Zustand stores

### 📄 Document Processing

- 📤 Document upload and evidence management
- 🧠 AI-assisted comparison and validation
- 🖼️ PDF and image-related analysis endpoints
- 📈 Submission tracking across the full workflow

### 📋 Workflow Management

- 🏛️ Institute submission lifecycle management
- ✅ Evaluator review and decision workflows
- 🧭 Admin-level operational views
- 📨 Feedback and placements modules for extended institutional workflows

### ⚙️ AI-Powered Services

- 🔬 Research eligibility analysis
- 👨‍🏫 Faculty credential validation
- 🧱 Blueprint and image detection
- 💬 Chat-based document comparison
- ⚖️ Legal keyword analysis

## 🧩 Supported Application Areas

The portal supports several common AICTE-oriented workflows, including:

- 🏫 Institute submissions and compliance evidence
- 🔎 Research and faculty validation checks
- 📊 Placement-related reporting and institutional review
- 🗣️ Feedback and operational review flows
- 🧾 Document comparison and supporting evidence verification

## 🔌 API Surface

### 🖥️ Backend API

- `GET /` - health check
- `POST /api/send-otp` - OTP flow support
- `POST /api/institute/upload-document` - upload institute document
- `GET /api/institute/evidence/:uni_doc_id` - fetch evidence by document id
- `GET /api/admin/data` - admin data access
- `POST /api/feedback` - submit feedback
- `GET /api/placements` - list placement reports
- `POST /api/placements/upload` - upload placement data

### 🤖 AI Service API

- `POST /analyze-research-eligibility`
- `POST /validate_blueprint`
- `POST /detect_institute_image`
- `POST /analyze-legal-keywords`
- `POST /validate-faculty-credentials`
- `POST /chat/comparison`
- `POST /chat-pdf`

## 🚦 Quick Start

### ✅ Prerequisites

- Node.js 18 or later
- npm 9 or later
- Python 3.9 or later
- PostgreSQL 12 or later

### 🌐 Frontend

```bash
cd aicte-frontend
npm install
npm run dev
```

### 🧪 Backend

```bash
cd aicte-backend
npm install
npx prisma migrate dev
npm run dev
```

### 🧠 AI Service

```bash
cd aicte_models
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

## 🔐 Environment Variables

### 🌐 Frontend

```env
VITE_API_URL=http://localhost:3100
```

### 🧪 Backend

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
FASTAPI_URL=http://localhost:8000
EMAIL_USER=your-email@example.com
DEBUG_NIRF_PDF=false
NODE_ENV=development
```

### 🧠 AI Service

```env
GROQ_API_KEY=your-groq-api-key
```

## 🗂️ Project Structure

```text
AICTE-UGC/
├── aicte-frontend/                # React + TypeScript frontend application
├── aicte-backend/                 # Express + Prisma backend application
├── aicte_models/                  # FastAPI-based AI and document analysis service
├── QUICK_START_GUIDE.md           # Quick setup and testing guide
├── INDEX.md                       # Documentation index
├── README.md                      # Main project README
├── 
```

## 💡 Why This Project Matters

This platform demonstrates how modern full-stack engineering can simplify a complex administrative workflow. It combines state management, secure access control, AI-assisted validation, and persistent review tracking in a single system that is easier to operate, easier to extend, and easier to audit.

## 🗺️ Roadmap

- 🧪 Expand end-to-end automated test coverage
- 🚀 Add production deployment pipeline
- 📈 Improve audit logging and observability
- 🎥 Publish live demo and screenshots
- 📱 Strengthen mobile-first UI flows

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test locally.
5. Open a pull request.



## 📬 Contact

Built for the AICTE document verification workflow with a focus on clarity, auditability, and scalable institutional operations.
Build by AyurTech Crew for SIH 2025