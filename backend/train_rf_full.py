import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Connect to your SQLite database (the one with 12k rows)
conn = sqlite3.connect('instance/smartcity.db')
df = pd.read_sql_query("""
    SELECT 
        res_count, com_count, ind_count, park_count, solar_count, road_count,
        co2, traffic, energy
    FROM simulation_log
""", conn)
conn.close()
print(f"Loaded {len(df)} rows")

# Features: all tile counts
feature_cols = ['res_count', 'com_count', 'ind_count', 'park_count', 'solar_count', 'road_count']
X = df[feature_cols]
y_co2 = df['co2']
y_traffic = df['traffic']
y_energy = df['energy']

# Split
X_train, X_test, y_co2_train, y_co2_test = train_test_split(X, y_co2, test_size=0.2, random_state=42)
_, _, y_traffic_train, y_traffic_test = train_test_split(X, y_traffic, test_size=0.2, random_state=42)
_, _, y_energy_train, y_energy_test = train_test_split(X, y_energy, test_size=0.2, random_state=42)

# Random Forest models
rf_co2 = RandomForestRegressor(n_estimators=100, random_state=42)
rf_traffic = RandomForestRegressor(n_estimators=100, random_state=42)
rf_energy = RandomForestRegressor(n_estimators=100, random_state=42)

rf_co2.fit(X_train, y_co2_train)
rf_traffic.fit(X_train, y_traffic_train)
rf_energy.fit(X_train, y_energy_train)

# Evaluate
print("\n--- Random Forest Performance ---")
print(f"CO₂     MAE: {mean_absolute_error(y_co2_test, rf_co2.predict(X_test)):.2f}   R²: {r2_score(y_co2_test, rf_co2.predict(X_test)):.3f}")
print(f"Traffic MAE: {mean_absolute_error(y_traffic_test, rf_traffic.predict(X_test)):.2f}   R²: {r2_score(y_traffic_test, rf_traffic.predict(X_test)):.3f}")
print(f"Energy  MAE: {mean_absolute_error(y_energy_test, rf_energy.predict(X_test)):.2f}   R²: {r2_score(y_energy_test, rf_energy.predict(X_test)):.3f}")

# Save models
os.makedirs('models', exist_ok=True)
joblib.dump(rf_co2, 'models/rf_co2.pkl')
joblib.dump(rf_traffic, 'models/rf_traffic.pkl')
joblib.dump(rf_energy, 'models/rf_energy.pkl')
print("\n Models saved to backend/models/")