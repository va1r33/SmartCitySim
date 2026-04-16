from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json, os, numpy as np, joblib
import bcrypt
import jwt

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Configuration
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), "instance", "smartcity.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# ======================== Database Models ========================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserSave(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    grid_state = db.Column(db.JSON, nullable=False)
    current_level = db.Column(db.Integer, default=1)
    tick_count = db.Column(db.Integer, default=0)
    iot_systems = db.Column(db.JSON, nullable=False)
    city_score = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SimulationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    tick = db.Column(db.Integer)
    co2 = db.Column(db.Float)
    traffic = db.Column(db.Float)
    energy = db.Column(db.Float)
    population = db.Column(db.Integer)
    happiness = db.Column(db.Float)
    flood_risk = db.Column(db.Float)
    res_count = db.Column(db.Integer)
    com_count = db.Column(db.Integer)
    ind_count = db.Column(db.Integer)
    park_count = db.Column(db.Integer)
    solar_count = db.Column(db.Integer)
    road_count = db.Column(db.Integer)

with app.app_context():
    db.create_all()

# ======================== ML Models ========================
rf_co2 = rf_traffic = rf_energy = None
try:
    rf_co2 = joblib.load('models/rf_co2.pkl')
    rf_traffic = joblib.load('models/rf_traffic.pkl')
    rf_energy = joblib.load('models/rf_energy.pkl')
    print("Random Forest models loaded for /api/simulate")
except:
    print("RF models not found, using fallback formulas")

# ======================== Helper Functions ========================
def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Token missing"}), 401
        token = token.split(' ')[1]
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({"error": "Invalid token"}), 401
        except:
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ======================== Auth Endpoints ========================
@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username taken"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()
    token = jwt.encode({'user_id': new_user.id, 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({"token": token, "user": {"id": new_user.id, "username": new_user.username, "email": new_user.email}})

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({'user_id': user.id, 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({"token": token, "user": {"id": user.id, "username": user.username, "email": user.email}})

# ======================== Save/Load Endpoints ========================
@app.route('/saves', methods=['GET'])
@token_required
def get_saves(current_user):
    saves = UserSave.query.filter_by(user_id=current_user.id).order_by(UserSave.updated_at.desc()).all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "city_score": s.city_score,
        "current_level": s.current_level,
        "updated_at": s.updated_at.isoformat(),
    } for s in saves])

@app.route('/saves', methods=['POST'])
@token_required
def create_or_update_save(current_user):
    data = request.get_json()
    save_id = data.get('save_id')
    name = data.get('name', f"{current_user.username}'s city")
    grid_state = data.get('grid')
    current_level = data.get('currentLevelId', 1)
    tick_count = data.get('tickCount', 0)
    iot_systems = data.get('iotSystems', {})
    city_score = data.get('cityScore', 0)

    if save_id:
        save = UserSave.query.get(save_id)
        if not save or save.user_id != current_user.id:
            return jsonify({"error": "Save not found"}), 404
        save.name = name
        save.grid_state = grid_state
        save.current_level = current_level
        save.tick_count = tick_count
        save.iot_systems = iot_systems
        save.city_score = city_score
        save.updated_at = datetime.utcnow()
    else:
        save = UserSave(
            user_id=current_user.id,
            name=name,
            grid_state=grid_state,
            current_level=current_level,
            tick_count=tick_count,
            iot_systems=iot_systems,
            city_score=city_score
        )
        db.session.add(save)
    db.session.commit()
    return jsonify({"save_id": save.id})

@app.route('/saves/<int:save_id>', methods=['GET'])
@token_required
def get_save(current_user, save_id):
    save = UserSave.query.get(save_id)
    if not save or save.user_id != current_user.id:
        return jsonify({"error": "Save not found"}), 404
    return jsonify({
        "id": save.id,
        "name": save.name,
        "grid_state": save.grid_state,
        "current_level": save.current_level,
        "tick_count": save.tick_count,
        "iot_systems": save.iot_systems,
        "city_score": save.city_score,
    })

@app.route('/saves/<int:save_id>', methods=['DELETE'])
@token_required
def delete_save(current_user, save_id):
    save = UserSave.query.get(save_id)
    if not save or save.user_id != current_user.id:
        return jsonify({"error": "Save not found"}), 404
    db.session.delete(save)
    db.session.commit()
    return jsonify({"deleted": True})

# ======================== Simulation Endpoints ========================
@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json()
        buildings = data.get('buildings', [])
        smart_mode = data.get('smartthings_mode', '')

        counts = {'residential':0, 'commercial':0, 'industrial':0, 'park':0, 'solar':0, 'road':0}
        for b in buildings:
            t = b.get('type', '')
            cnt = int(b.get('count', 0))
            if t in counts: counts[t] += cnt

        features = [[
            counts['residential'], counts['commercial'], counts['industrial'],
            counts['park'], counts['solar'], counts['road']
        ]]

        if rf_co2 is not None:
            co2 = int(rf_co2.predict(features)[0])
            traffic = int(rf_traffic.predict(features)[0])
            energy = int(rf_energy.predict(features)[0])
        else:
            total = sum(counts.values())
            if total == 0:
                traffic, co2, energy = 10, 20, 25
            else:
                traffic = min(100, 20 + counts['commercial']*2 + counts['industrial']*3)
                co2 = min(100, 15 + counts['industrial']*7 + counts['commercial']*2)
                energy = min(120, 20 + counts['residential']*2 + counts['commercial']*3 + counts['industrial']*5)

        if smart_mode == 'eco':
            co2 = int(co2 * 0.8); energy = int(energy * 0.85); status = "Eco Mode Active"
        elif smart_mode == 'traffic_control':
            traffic = int(traffic * 0.75); energy = int(energy * 1.05); status = "Traffic Control Active"
        elif smart_mode == 'alert':
            status = "ALERT" if (traffic > 70 or co2 > 60) else "Normal"
        else:
            status = "Idle"

        traffic = max(5, min(100, traffic))
        co2 = max(5, min(100, co2))
        energy = max(5, energy)

        if co2 <= 60 and traffic <= 40 and energy <= 100:
            message = "Green Mandate Achieved!"
        else:
            message = f"City Analyzed: {counts['residential']}R {counts['commercial']}C {counts['industrial']}I | {status}"

        return jsonify({"traffic": int(traffic), "co2": int(co2), "energy": int(energy), "message": message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    counts = data.get('grid_counts', {})
    if rf_co2 is not None:
        features = [[
            counts.get('residential', 0), counts.get('commercial', 0),
            counts.get('industrial', 0), counts.get('park', 0),
            counts.get('solar', 0), counts.get('road', 0)
        ]]
        co2_pred = float(rf_co2.predict(features)[0])
        traffic_pred = float(rf_traffic.predict(features)[0])
        return jsonify({"co2": round(max(0, co2_pred), 1), "traffic": round(max(0, traffic_pred), 1), "status": "ok"})
    else:
        return jsonify({"status": "model_not_trained"}), 503

@app.route('/log_data', methods=['POST'])
def log_data():
    data = request.get_json()
    metrics = data.get('metrics', {})
    counts = data.get('grid_counts', {})
    entry = SimulationLog(
        tick=data.get('tick', 0),
        co2=metrics.get('co2', 0), traffic=metrics.get('traffic', 0),
        energy=metrics.get('energy', 0), population=metrics.get('population', 0),
        happiness=metrics.get('happiness', 0), flood_risk=metrics.get('floodRisk', 0),
        res_count=counts.get('residential', 0), com_count=counts.get('commercial', 0),
        ind_count=counts.get('industrial', 0), park_count=counts.get('park', 0),
        solar_count=counts.get('solar', 0), road_count=counts.get('road', 0)
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"saved": True, "id": entry.id})

@app.route('/logs', methods=['GET'])
def get_logs():
    logs = SimulationLog.query.order_by(SimulationLog.timestamp).all()
    return jsonify([{
        "tick": l.tick, "co2": l.co2, "traffic": l.traffic, "energy": l.energy,
        "population": l.population, "res_count": l.res_count, "com_count": l.com_count,
        "ind_count": l.ind_count, "park_count": l.park_count,
        "solar_count": l.solar_count, "road_count": l.road_count
    } for l in logs])

@app.route('/')
def home():
    return "SmartCitySim Flask Server is running!"

if __name__ == '__main__':
    print("Starting SmartCitySim Server...")
    app.run(debug=True, host='0.0.0.0', port=5001)