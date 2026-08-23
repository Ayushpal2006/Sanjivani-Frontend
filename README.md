# 🩺 SANJIVANI — AI-Assisted Women's Health Triage Platform

> **Tagline:** *"From Every ASHA, A New Asha."*  
> **Hackathon Prototype** | Ayushman Arogya Mandir & Sub-Center Decision Support System

---

## 📌 Executive Overview

**SANJIVANI** is an AI-assisted women’s health triage, early-risk identification, referral, and follow-up decision support platform designed specifically for Accredited Social Health Activists (**ASHA Workers**) and women in low-resource frontline settings across India.

> ⚠️ **IMPORTANT CLINICAL DISCLAIMER:**  
> SANJIVANI is **NOT a diagnostic application** and does not provide standalone medical diagnoses. The platform provides structured, evidence-based triage recommendations (*Level 1 Routine*, *Level 2 PHC Evaluation*, *Level 3 Urgent Escalation*) to support healthcare workers in making timely clinical referrals.

---

## 🌟 Key Features & Workflow Architecture

### 👩‍⚕️ 1. Role-Based Workflow — ASHA Worker Portal
- **Dedicated Patient Assessment Lookup**: ASHA Workers search existing patient assessments via `Patient ID` (e.g. `PAT-1089`).
- **Structured Clinical Review**: Presents 5 categorized health indicator sections:
  1. *Patient Overview*
  2. *Menstrual Health*
  3. *Endocrine Indicators*
  4. *Medical History*
  5. *Lifestyle & Other Health Indicators*
- **Virtual ASHA-Patient Support Connector**: Encrypted text/voice support modal enabling ASHA Workers to connect with patients prior to clinic visits.
- **Closed-Loop Referral Kanban**: Outcome-tracking board (*Pending*, *Referred*, *Completed*) ensuring zero patient drop-off between sub-centers and district hospitals.

### 👩 2. Patient / Woman Self-Assessment Portal
- **Multilingual Form**: Self-assessment wizard in English and Hindi (`हिंदी`).
- **Patient-Safe Results Page**: Reassuring clinical summary (*"Assessment Completed ✓"*) advising follow-up with ASHA Workers.
- **Permission Scoping**: Clinical action buttons (*Create Referral*, *Schedule Follow-up*, *Close Case*) are strictly hidden from patients and reserved exclusively for authenticated ASHA Workers.

### 🗺️ 3. Google Maps Ayushman Healthcare Center Locator
- **Exclusive Patient Access**: Interactive Google Maps tile interface powered by Leaflet & OpenStreetMap.
- **North Delhi Initial Stage (Pincode 110007)**: Pre-configured over GTB Nagar / Model Town / Timarpur / Civil Lines / Azadpur highlighting registered **Ayushman Arogya Mandirs**.
- **Proximity & Directions**: Displays nearest center badges (⭐ *NEAREST CENTRE*), distance in km, estimated travel time, assigned ASHA details, and direct `[ OPEN IN GOOGLE MAPS DIRECTIONS ]` navigation links.

### 📊 4. Interactive Field Research Analytics
- **Live Survey Insights**: Real-time aggregated visual analytics from 154+ Google Form field responses collected across rural Uttar Pradesh.
- **4 Interactive Recharts Graphs**: Healthcare seeking delays, symptom prevalence, primary care barriers, and survey timeline growth.
- **Live Data Ingestion Simulator**: Allows adding live field survey responses that dynamically update all graphs in real time.

---

## 🛡️ 2-Stage Triage Engine & ML Governance

```
                    ┌─────────────────────────┐
                    │  Patient Screening Data │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ STAGE 1: Safety Engine  │  (Checks acute red flags e.g.,
                    │ (Deterministic Guard)   │   severe pain >= 5, GI bleeding)
                    └────────────┬────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
          [ Red Flag Triggered ]     [ No Red Flag ]
                   │                           │
                   ▼                           ▼
        ┌───────────────────────┐   ┌───────────────────────────┐
        │ FORCE LEVEL 3 CLINICAL│   │ STAGE 2: Machine Learning │ (Random Forest Model
        │    URGENT REFERRAL    │   │  Classification Engine    │  on PCOS dataset)
        └───────────────────────┘   └─────────────┬─────────────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ Level 1 / Level 2 / Level 3│
                                    │   Triage Recommendation   │
                                    └───────────────────────────┘
```

- **Strict ML Privacy**: Raw probabilities, SHAP feature weights, and Random Forest metrics are completely hidden from non-admin roles and secured behind an admin authorization token header (`X-Admin-Token`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Backend REST API** | Python 3.10, FastAPI, SQLAlchemy, SQLite, Pydantic |
| **Machine Learning** | Scikit-Learn (RandomForestClassifier), Joblib, NumPy, Pandas |
| **Frontend Web App** | React 19, Vite, Tailwind CSS, Lucide React Icons |
| **Data Visualization** | Recharts (Responsive SVG Charts) |
| **Geospatial Mapping** | Leaflet JS, OpenStreetMap / CartoDB Voyager tiles, Nominatim Geocoding API |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`

### 1. Clone Repository
```bash
git clone https://github.com/Divi2302/Sanjivani.git
cd Sanjivani
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python database/init_db.py  # Seed initial SQLite database
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev -- --port 3000
```

Access the application in your browser at `http://localhost:3000`.

---

## 📡 Core API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/triage/assess` | `POST` | Process patient screening through Safety & ML 2-stage engine |
| `/api/patients/lookup` | `GET` | Retrieve structured patient assessment review for ASHA Workers |
| `/api/centers/live` | `GET` | Live pincode geocoding and Ayushman Arogya Mandir lookup |
| `/api/dashboard/stats` | `GET` | ASHA operational KPIs and recent case history |
| `/api/research/insights` | `GET` | Aggregated field research survey analytics |
| `/api/research/ingest` | `POST` | Ingest new field survey response and update graphs |
| `/api/ml/metrics` | `GET` | Secured ML model metrics (Requires `X-Admin-Token` header) |

---

## 📜 License & Acknowledgments

Built for Hackathon Prototype — Empowering frontline health workers with human-centered AI decision support.
