# SmartCitySim – React + Flask Edition

A web-based city simulation game that explores the impact of urban planning and IoT policies on sustainability metrics.

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install flask flask-cors requests
python app.py

The API will run on:

http://localhost:5001

Frontend
cd frontend
npm install
npm run dev

Open in browser:

http://localhost:5173

Project Structure

frontend/ – React + Vite + Tailwind application
backend/ – Flask API with simulation logic

Game Features
40×40 interactive city grid
Real-time metrics (CO₂, traffic, energy, happiness, flood risk)
Four difficulty levels (S1–S4) with unique goals
IoT policy buttons unlocked by level
Car agents and visual feedback
Author

Valerie Tan Ying Ying
Dongseo University

