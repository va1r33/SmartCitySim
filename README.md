# SmartCitySim – React + Flask Edition

![React](https://img.shields.io/badge/Frontend-React-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-green)
![Status](https://img.shields.io/badge/Status-Prototype-orange)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

SmartCitySim is an interactive web-based smart city simulation platform designed to explore how urban planning decisions and IoT policies affect sustainability metrics.

Users construct a tile-based city, activate smart-city interventions, and observe real-time changes in traffic congestion, CO₂ emissions, energy consumption, population growth, and citizen happiness.

This project is developed as a **graduation project** and serves as both:

• an educational sustainability simulator that helps users understand trade-offs between transport, climate, and livability
• a research foundation for future AI-driven urban simulation, integrating IoT + AI + gamification in urban planning

---

# System Architecture

SmartCitySim follows a **client-server architecture**.

### Frontend
React + Vite single-page application responsible for:

- interactive city building interface
- 40×40 tile grid rendering
- real-time sustainability dashboard
- IoT policy controls
- scenario progression system

### Backend
Flask REST API responsible for:

- receiving city layout data
- computing sustainability metrics
- returning simulation results as JSON

### Communication
Frontend → POST /api/simulate → Backend
Backend → JSON metrics → Frontend    

Frontend runs on:
http://localhost:5173

Backend runs on:
http://localhost:5001


---

# Core Features

## Interactive City Builder

- 40×40 tile grid rendered with HTML5 Canvas
- Eight tile types:
residential
commercial
industrial
park
solar
bus stop
road
erase

Users can place and remove tiles using click-and-drag interactions.

---

## Sustainability Dashboard

Real-time metrics displayed to the player:

- CO₂ emissions (%)
- traffic congestion (%)
- energy consumption (MW)
- population
- happiness (%)
- flood risk (%)
- renewable energy share (%)

---

## IoT Policy Simulation

Players can activate smart-city interventions:

- Eco Mode
- Public Campaign
- Traffic Control
- Emergency Alert
- Smart Energy Grid
- Predictive Optimization

These policies dynamically modify sustainability metrics.

---

## Scenario Progression

The simulation includes four progressive scenarios:

| Scenario | Goal |
|--------|------|
| S1 – Green Mandate | Reduce CO₂ and traffic while supporting population |
| S2 – Commuter Crisis | Solve heavy traffic and increase happiness |
| S3 – Resilient City | Minimize flood risk and infrastructure damage |
| S4 – Predictive Metropolis | Achieve optimal sustainability targets |

---

# Technology Stack

### Frontend

- React 18
- Vite
- TailwindCSS
- HTML5 Canvas
- React Hooks

### Backend

- Python 3
- Flask
- Flask-CORS

### Development Tools

- Git
- GitHub
- VS Code
- npm
- pip

---

# Project Structure


SmartCitySim/
│
├── frontend/
│ ├── components/
│ │ └── smartcity/
│ │ ├── TopHUD.jsx
│ │ ├── BuildToolbar.jsx
│ │ ├── CityGrid.jsx
│ │ ├── RightPanel.jsx
│ │ └── BottomBar.jsx
│ │
│ └── SmartCityApp.js
│
├── backend/
│ └── app.py
│
└── README.md


---

# Future Work

The current prototype uses simple mathematical formulas to simulate sustainability metrics.

Future work will include:

- Machine learning models for traffic prediction
- regression models for CO₂ emission forecasting
- integration with real urban datasets
- PostgreSQL + PostGIS spatial database
- public deployment for education and research

---

# Author

Valerie Tan Ying Ying   
Dongseo University  

Graduation Thesis Project – 2026

