# ENT_Website_NodeJS
# ENT Clinic Management System

A full-stack web application for Ear–Nose–Throat (ENT) practices that streamlines
appointments, prescriptions, diagnostic tests, imaging analysis, and patient
records.  
Built with **Node.js**, **Express**, **MongoDB**, and a lightweight vanilla-JS
front end.

---

## Key Features
| Module | Highlights |
|--------|------------|
| **Authentication** | JWT-based login for doctors & patients |
| **Doctor Dashboard** | Real-time appointment queue, accepted-patients list |
| **Prescription Builder** | Add medicines, dosage, frequency, duration; auto-saves to DB |
| **Diagnostic Tests** | Order tests, add notes, patient can mark *Yes/No* and upload results |
| **Advanced Imaging Analysis** | Client-side X-ray / USG / MRI viewer with grayscale, contrast, edge-detect & Otsu segmentation |
| **PDF Export** | One-click PDF for prescriptions & reports |
| **REST API** | Clean JSON endpoints for all entities |

---

## Quick Start

```bash
# 1. Clone repo
git clone https://github.com/<your-user>/ent-clinic.git
cd ent-clinic

# 2. Install server dependencies
npm i

# 3. Copy env template & fill values
cp .env.example .env
#   MONGO_URI, JWT_SECRET, PORT …

# 4. Run in dev mode
npm run dev   # nodemon

# 5. Open
http://localhost:5000
