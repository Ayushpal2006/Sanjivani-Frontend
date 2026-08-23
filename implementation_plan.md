# Implementation Plan - SANJIVANI: "From Every ASHA, A New Asha."

SANJIVANI is a complete, production-style hackathon prototype designed to empower ASHA (Accredited Social Health Activist) frontline health workers and women/patients in low-resource settings. It combines a **Rule-Based Red-Flag Safety Engine** with an **Interpretable ML Endocrine Risk Engine** to deliver a 3-level triage recommendation (Level 1, Level 2, Level 3), explainable indicators, referral creation, follow-up tracking, patient portal with Ayushman Arogya Mandir center finder, and ASHA operations management.

---

## User Approved Updates & New Features

> [!IMPORTANT]
> **Key Architecture & Interface Additions**
> 1. **Role-Based Login & Portals (ASHA Worker vs. Patient Portal)**:
>    - **ASHA Worker Portal**: Complete ASHA Assessment, Operational KPI Dashboard, Referral & Follow-Up Kanban, Field Research Insights, and Model Governance & Diagnostics.
>    - **Patient Portal**: Self-Assessment Form, Digital Health Report & Triage Summary, Assigned ASHA Worker Connection, and Interactive **Ayushman Arogya Mandir / PHC Map & Location Search**.
> 2. **Kaggle Dataset CSV Integration**: Robust dataset loader configured for real Kaggle PCOS CSV files (`PCOS_data.csv`).
> 3. **Field Research Data Schema Specification**: Clear field definitions for external survey CSV validation.

---

## Proposed System Architecture & Modules

```
                        [ Role-Based Login Screen ]
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
  [ ASHA Worker Portal ]                             [ Patient Portal ]
  - Operational Dashboard                            - Self-Assessment Form
  - Assisted Assessment                              - My Health Report & Triage
  - Referral Kanban & Follow-up                      - Interactive Map Locator
  - Field Research & ML Metrics                        (Ayushman Arogya Mandir)
           │                                                   │
           └─────────────────────────┬─────────────────────────┘
                                     ▼
                          [ FastAPI REST Backend ]
                                     ▼
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 [ Safety/Red-Flag Engine ]                              [ ML Risk Engine ]
 (Rule-based escalation)                                 (Random Forest / Kaggle Data)
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                          [ 3-Level Triage Engine ]
                      Level 1 | Level 2 | Level 3 Escalation
                                     ▼
                  [ Explainable Reason Generator (XAI) ]
                                     ▼
                 [ SQLite DB & Healthcare Center Index ]
```

---

## Proposed Implementation Steps

### Component 1: Dataset Pipeline & Field Survey Schema Definition
- **Kaggle PCOS Dataset Loader**: Clean data processing pipeline accepting Kaggle PCOS dataset CSV (mapping age, BMI, cycle length, cycle irregularity, hair growth, acne, skin darkening, weight gain, hair loss, thyroid, diabetes, exercise, fast food). Exclude `PCOS (Y/N)` from input features to avoid target leakage.
- **Field Survey Schema Specification**: Document precise fields for Google Form / field survey validation.
- Train Random Forest, Logistic Regression, and Decision Tree baseline models, saving model weights (`sanjivani_pcos_model.pkl`) and metrics.

### Component 2: FastAPI Backend Core (`backend/`)
- Setup FastAPI web application with SQLite database (SQLAlchemy models for Patients, Assessments, Referrals, Followups, Healthcare Centers / Ayushman Arogya Mandirs, ASHAs).
- Core Logic Engines:
  - `safety_engine.py`: Scans for critical red flags (severe abdominal pain, blood in stool, acute GI distress).
  - `ml_engine.py`: Evaluates endocrine/PCOS risk probability using trained ML model.
  - `triage_engine.py`: Maps inputs to Level 1 (Routine Monitoring), Level 2 (Further Assessment), Level 3 (Clinical Referral).
  - `explainability_engine.py`: Generates plain-language reason cards.
- API Endpoints:
  - `POST /api/auth/login`: Role-based authentication (ASHA vs. Patient).
  - `POST /api/predict`: Real-time safety + ML risk triage.
  - `POST /api/assessments`: Save assessment & trigger referral/follow-up workflow.
  - `GET /api/assessments/patient/{id}`: Patient digital report view.
  - `GET /api/centers/nearby`: Location/PIN code search for Ayushman Arogya Mandirs, CHCs, and PHCs with distance and contact info.
  - `GET /api/dashboard/stats` & `GET /api/referrals`: ASHA dashboard and referral metrics.
  - `GET /api/ml/metrics`: Model performance metrics.

### Component 3: Role-Based Frontend Application (`frontend/`)
- React + Vite + Tailwind CSS + Lucide Icons + Recharts + Leaflet / Interactive Map UI.
- Dual Language Toggle (English / हिंदी).
- **Role-Based Landing / Login**:
  - Role selection card: **ASHA Worker** vs. **Patient / Woman**.
- **Patient Portal**:
  - **Self-Assessment Form**: Simple step-by-step form with auto-BMI calculator, visual pain scale, and minimal text entry.
  - **My Health Report Screen**: Patient-friendly triage badge, plain-language indicators, downloadable/printable summary.
  - **Ayushman Arogya Mandir Locator (Map Feature)**: Interactive map displaying nearest government Health & Wellness Centers, PHCs, CHCs, search by Pincode/Location, and option to connect with assigned village ASHA worker.
- **ASHA Worker Portal**:
  - **Operational Dashboard**: KPI metric cards, urgent follow-ups due today, pending referrals.
  - **Assisted Assessment Wizard**: Complete structured digital assessment with ASHA verification.
  - **Referral & Follow-Up Kanban**: Pipeline view of patient referrals through completion.
  - **Field Research Insights Tab**: Graphical summary of field research survey data.
  - **Model Governance & Transparency Tab**: Live evaluation matrix (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix) and safety disclaimers.

### Component 4: Hackathon Pitch & Presentation Masterclass Artifact
- `pitch_deck_and_hackathon_strategy.md`: 10-slide winning presentation deck, verbal pitch script, and comprehensive technical Q&A preparation guide explaining concepts to win 1st place.

---

## Verification Plan

### Automated Tests & Verification
- Train model on Kaggle PCOS dataset structure, verify metrics.
- Execute backend tests via Python test script checking API endpoints (`/api/predict`, `/api/assessments`, `/api/centers/nearby`).

### Manual Verification
- Test Patient Role Flow: Fill self-assessment -> View result -> Search nearby Ayushman Arogya Mandir on map -> Connect with ASHA worker.
- Test ASHA Role Flow: Review pending patient assessments -> Manage referrals in Kanban -> Check follow-up alerts -> View analytics dashboard.
- Verify Red-Flag Safety Override (e.g. blood in stool or severe pain level 5 forces Level 3 referral).

