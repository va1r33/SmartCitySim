# SmartCitySim – React + Flask Edition

A web‑based city simulation game that explores the impact of urban planning and IoT policies on sustainability metrics.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install flask flask-cors requests
python app.py
cd frontend
npm install
npm run dev
cat > .gitignore << 'EOF'
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
.venv
*.so
*.egg
*.egg-info/
dist/
build/
*.log
*.pkl

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Build outputs
dist/
build/
