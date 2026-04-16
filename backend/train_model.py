from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

# Connect to the same SQLite database that app.py uses
app = Flask(__name__)
import os
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "instance", "smartcity.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Define the SimulationLog model (must match the one in app.py)
class SimulationLog(db.Model):
    __tablename__ = 'simulation_log'
    id          = db.Column(db.Integer, primary_key=True)
    res_count   = db.Column(db.Integer)
    com_count   = db.Column(db.Integer)
    ind_count   = db.Column(db.Integer)
    park_count  = db.Column(db.Integer)
    solar_count = db.Column(db.Integer)
    road_count  = db.Column(db.Integer)
    co2         = db.Column(db.Float)
    traffic     = db.Column(db.Float)

with app.app_context():
    # Query all rows
    rows = db.session.query(SimulationLog).all()

print(f"Found {len(rows)} log entries")

if len(rows) < 20:
    print("Need at least 20 entries. Play the game longer and re-run.")
    exit()

# Build feature matrix (X) from tile counts
X = []
y_co2 = []
y_traffic = []

for r in rows:
    X.append([
        r.res_count or 0,
        r.com_count or 0,
        r.ind_count or 0,
        r.park_count or 0,
        r.solar_count or 0,
        r.road_count or 0,
    ])
    y_co2.append(r.co2 or 0)
    y_traffic.append(r.traffic or 0)

X = np.array(X)
y_co2 = np.array(y_co2)
y_traffic = np.array(y_traffic)

# Train CO₂ model
scaler_co2 = StandardScaler()
X_scaled_co2 = scaler_co2.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled_co2, y_co2, test_size=0.2, random_state=42)
model_co2 = LinearRegression().fit(X_train, y_train)
print(f"CO₂  R² score: {r2_score(y_test, model_co2.predict(X_test)):.3f}")

# Train Traffic model
scaler_traffic = StandardScaler()
X_scaled_traffic = scaler_traffic.fit_transform(X)
X_train2, X_test2, y_train2, y_test2 = train_test_split(X_scaled_traffic, y_traffic, test_size=0.2, random_state=42)
model_traffic = LinearRegression().fit(X_train2, y_train2)
print(f"Traffic R² score: {r2_score(y_test2, model_traffic.predict(X_test2)):.3f}")

# Save models and scalers
joblib.dump(model_co2, "model_co2.pkl")
joblib.dump(scaler_co2, "scaler_co2.pkl")
joblib.dump(model_traffic, "model_traffic.pkl")
joblib.dump(scaler_traffic, "scaler_traffic.pkl")

print("Models saved to backend/ folder.")