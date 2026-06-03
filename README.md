# SmartCitySim – React + Flask Edition

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Flask](https://img.shields.io/badge/Backend-Flask-000000?logo=flask)
![ML](https://img.shields.io/badge/ML-RandomForest%20%2B%20LSTM-FF6F00)
![Status](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

SmartCitySim is an interactive web‑based smart city simulation platform that explores how urban planning decisions and IoT policies affect sustainability metrics using **real‑time Machine Learning**.

Users construct a tile‑based city, activate smart‑city interventions, and observe immediate changes in traffic congestion, CO₂ emissions, energy consumption, population, happiness, flood risk, and renewable share.

This project is developed as a **graduation thesis** and serves as:

• an educational sustainability simulator that teaches trade‑offs between transport, climate, and livability  
• a research prototype integrating **Random Forest + LSTM** AI with gamified urban planning  
• a foundation for future IoT‑aware ML and ensemble forecasting  

---

## System Architecture

SmartCitySim follows a **client‑server architecture** with ML inference at the core.

### Frontend – React + Vite + TailwindCSS
- Interactive 40×40 canvas grid (click/drag placement)
- Real‑time sustainability dashboard (8 live metrics)
- IoT policy controls (6 toggles, unlock by scenario)
- 5‑page user manual with Korean zoning rules
- Responsive auth (split‑screen) and save‑slot pages

### Backend – Flask REST API
- `/api/simulate` – Random Forest inference (CO₂, traffic, energy)
- `/predict` – same RF model for frontend predictions
- `/predict_traffic_lstm` – LSTM fine‑tuned on Seoul TOPIS traffic data
- `/log_data` – collect training data (12,824 rows)
- `/auth/*` – JWT signup/login, guest mode
- `/saves` – save/load city states (SQLite)

### Database – SQLite
- `User` – credentials (bcrypt hashed)
- `UserSave` – grid state (JSON), level, tick, IoT flags
- `SimulationLog` – tile counts + metrics for ML training

### ML Models
| Model | Task | Training Data | Performance |
|-------|------|---------------|-------------|
| Random Forest (scikit‑learn) | Predict CO₂, traffic, energy from tile counts | 12,824 rows | R²: CO₂ 0.66, Traffic 0.86, Energy 0.999 |
| LSTM (TensorFlow/Keras) | Predict next traffic value (20‑step lookback) | Seoul TOPIS + fine‑tune | MAE ~5% |
| Client‑side linear regression | 5‑tick extrapolation (baseline) | – | Runs in browser |

**Frontend ML badges:**  
- 🤖 *Trend +5* – client‑side linear regression  
- 🤖 *RF: CO₂ X% / Traffic Y%* – backend Random Forest  
- 🧠 *LSTM next traffic: X%* – backend LSTM (Seoul‑calibrated)

---

## Core Features

### Interactive City Builder
- **40×40 tile grid** (HTML5 Canvas)
- **8 tile types**: residential, commercial, industrial, park, solar, bus stop, road, erase
- **Real‑time Korean zoning validation** – industrial‑residential buffer (NLPUA Art.76), commercial road access (Building Act Art.44), solar glare separation, green space ratio (≥5%), FAR warnings (NLPUA Art.78)
- **Click/drag painting** with red‑flash violation feedback

### Sustainability Dashboard (8 metrics)
| Metric | Unit | Active from |
|--------|------|-------------|
| CO₂ Emissions | % | S1 |
| Traffic Load | % | S1 |
| Energy Demand | MW | S1 |
| Population | count | S1 |
| Renewable Share | % | S1 |
| Happiness | % | S2 |
| Flood Risk | % | S3 |
| Estimated Damage | $M | S3 |

### IoT Policy Simulation – 6 Toggles
| Button | Unlock | Effect |
|--------|--------|--------|
| Eco Mode | S1+ | Energy ×0.85 (−15%) |
| Public Campaign | S1+ | CO₂ ×0.88 (−12%) |
| Traffic Ctrl | S2+ | Traffic ×0.80 (−20%), Happiness +10 |
| Emergency Alert | S3+ | Flood Risk −20 pts, Happiness +8 |
| Smart Energy Grid | S3+ | Energy ×0.90 (−10%) |
| Predictive Optim. | S4 only | Traffic −8%, Energy −5%, CO₂ −7% |

### Scenario Progression (S1–S4)
| Scenario | Pass Conditions | New IoT Unlocked |
|----------|----------------|------------------|
| S1 – Green Mandate | CO₂ ≤60%, Traffic ≤40%, Energy ≤100MW, Pop ≥50 | Eco Mode, Public Campaign |
| S2 – Commuter Crisis | Traffic ≤30%, Happiness ≥70%, Pop ≥500 | + Traffic Ctrl |
| S3 – Resilient City | Flood ≤40%, Happiness ≥75%, Damage ≤$20M, Pop ≥50 | + Emergency Alert, Smart Energy Grid |
| S4 – Predictive Metropolis | CO₂ ≤20%, Traffic ≤25%, Energy ≤180MW, Pop ≥800, Happiness ≥85% | + Predictive Optimization (all 6) |

- **Hard minimum for all scenarios:** Population ≥ 50  
- **S4 completion** shows 🏆 *“You’ve mastered the Predictive Metropolis!”* banner

### Gamification & UX
- **Animated metric chips** – green flash on improvement, red on worsening
- **City Score** (0–100 composite, colour‑coded) – Needs Work / Fair / Good / Excellent
- **Cascade events** (Heat Wave, Storm Warning, etc.) – every 10 ticks, lasts 5 ticks
- **Tile hover tooltips** – show exact metric contribution (e.g., “Park: −5 CO₂, +3 Happiness, −4 Flood Risk”)
- **Context‑sensitive hint ticker** – pinned at bottom of right panel
- **Autosave** every 30 ticks for authenticated users

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18 + Vite + TailwindCSS | Canvas‑based grid, Lucide icons, responsive HUD |
| **Backend** | Python 3 + Flask + Flask‑CORS | REST API, SQLAlchemy ORM |
| **Database** | SQLite (dev) / PostgreSQL (planned) | Tables: User, UserSave, SimulationLog |
| **ML – Tabular** | scikit‑learn (RandomForestRegressor) | Models: `rf_co2.pkl`, `rf_traffic.pkl`, `rf_energy.pkl` |
| **ML – Time Series** | TensorFlow / Keras (LSTM) | 20‑step lookback, 1‑step forecast |
| **ML – Client‑side** | JavaScript least‑squares | 5‑tick linear extrapolation in `SimulationEngine.jsx` |
| **Authentication** | PyJWT + bcrypt | 30‑day JWT tokens, guest mode |
| **Version Control** | Git + GitHub | Private repo |

---

## Project Structure (simplified)
SmartCitySim-React-Flask/
├── backend/
│   ├── __pycache__/
│   ├── instance/
│   │   └── smartcity.db
│   ├── models/
│   │   ├── rf_co2.pkl
│   │   ├── rf_energy.pkl
│   │   ├── rf_traffic.pkl
│   │   ├── traffic_lstm.h5
│   │   └── traffic_scaler.pkl
│   ├── app.py
│   ├── create_db.py
│   ├── model_co2.pkl
│   ├── model_traffic.pkl
│   ├── prepare_lstm_data.py
│   ├── README_BACKEND.md
│   ├── requirements.txt
│   ├── scaler_co2.pkl
│   ├── scaler_traffic.pkl
│   ├── smartcity.db
│   ├── test_requests.py
│   ├── train_lstm_traffic.py
│   ├── train_model.py
│   ├── train_rf_full.py
│   ├── X_traffic.npy
│   └── y_traffic.npy
│
├── frontend/
│   ├── node_modules/
│   ├── src/
│   │   ├── api/
│   │   │   └── smartCityClient.js
│   │   ├── assets/
│   │   │   ├── saveslot_background.png
│   │   │   └── smartcity_app_background.png
│   │   ├── components/
│   │   │   ├── smartcity/
│   │   │   │   ├── BottomBar.jsx
│   │   │   │   ├── BuildToolbar.jsx
│   │   │   │   ├── CarAgents.jsx
│   │   │   │   ├── CityGrid.jsx
│   │   │   │   ├── RightPanel.jsx
│   │   │   │   ├── SimulationEngine.jsx
│   │   │   │   ├── TopHUD.jsx
│   │   │   │   ├── UserManual.jsx
│   │   │   │   └── ZoningRules.jsx
│   │   │   │   └── ZoningToast.jsx
│   │   │   └── ui/
│   │   │       ├── accordion.jsx
│   │   │       ├── alert-dialog.jsx
│   │   │       ├── alert.jsx
│   │   │       ├── aspect-ratio.jsx
│   │   │       ├── avatar.jsx
│   │   │       ├── badge.jsx
│   │   │       ├── breadcrumb.jsx
│   │   │       ├── button.jsx
│   │   │       ├── calendar.jsx
│   │   │       ├── card.jsx
│   │   │       ├── carousel.jsx
│   │   │       ├── chart.jsx
│   │   │       ├── checkbox.jsx
│   │   │       ├── collapsible.jsx
│   │   │       ├── command.jsx
│   │   │       ├── context-menu.jsx
│   │   │       ├── dialog.jsx
│   │   │       ├── drawer.jsx
│   │   │       ├── dropdown-menu.jsx
│   │   │       ├── form.jsx
│   │   │       ├── hover-card.jsx
│   │   │       ├── input-otp.jsx
│   │   │       ├── input.jsx
│   │   │       ├── label.jsx
│   │   │       ├── menubar.jsx
│   │   │       ├── navigation-menu.jsx
│   │   │       ├── pagination.jsx
│   │   │       ├── popover.jsx
│   │   │       ├── progress.jsx
│   │   │       ├── radio-group.jsx
│   │   │       ├── resizable.jsx
│   │   │       ├── scroll-area.jsx
│   │   │       ├── select.jsx
│   │   │       ├── separator.jsx
│   │   │       ├── sheet.jsx
│   │   │       ├── sidebar.jsx
│   │   │       ├── skeleton.jsx
│   │   │       ├── slider.jsx
│   │   │       ├── sonner.jsx
│   │   │       ├── switch.jsx
│   │   │       ├── table.jsx
│   │   │       ├── tabs.jsx
│   │   │       ├── textarea.jsx
│   │   │       ├── toast.jsx
│   │   │       ├── toaster.jsx
│   │   │       ├── toggle-group.jsx
│   │   │       ├── toggle.jsx
│   │   │       ├── tooltip.jsx
│   │   │       └── use-toast.jsx
│   │   ├── hooks/
│   │   │   └── use-mobile.jsx
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── SaveSlotPage.jsx
│   │   │   └── SmartCitySim.jsx
│   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── toaster.jsx
│   └── vite.config.js
│
├── .gitignore
└── README.md


---

## Running the Project Locally

### Requirements
- Node.js (v18+)
- Python (3.10+)
- pip

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python app.py --port 5001
Frontend Setup
bash
cd frontend
npm install
npm run dev
Open http://localhost:5173 – create an account or use guest mode.

Future Work (planned after graduation)
IoT‑aware Random Forest – retrain models with IoT flags (replace hard‑coded multipliers)

Ensemble fusion pipeline – combine RF + LSTM + rules‑based for multi‑model robustness

Deployment – Vercel (frontend) + Render (backend)

PostgreSQL + Redis – production scaling and caching

Public deployment for education and research

Author
Valerie Tan Ying Ying
Dongseo University – Department of Computer Science & Game Development
Graduation Thesis Project – 2026

License
Academic use only – all rights reserved.