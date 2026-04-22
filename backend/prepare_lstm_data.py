import sqlite3
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib

# Connect to database
conn = sqlite3.connect('instance/smartcity.db')
df = pd.read_sql_query("SELECT tick, traffic FROM simulation_log ORDER BY tick", conn)
conn.close()

traffic = df['traffic'].values.reshape(-1, 1)

# Scale to [0,1]
scaler = MinMaxScaler()
traffic_scaled = scaler.fit_transform(traffic)

# Create sequences (lookback = 20)
lookback = 20
X, y = [], []
for i in range(lookback, len(traffic_scaled)):
    X.append(traffic_scaled[i-lookback:i, 0])
    y.append(traffic_scaled[i, 0])

X = np.array(X)
y = np.array(y)

# Reshape X for LSTM: (samples, timesteps, features)
X = X.reshape((X.shape[0], X.shape[1], 1))

# Save arrays and scaler
np.save('X_traffic.npy', X)
np.save('y_traffic.npy', y)
joblib.dump(scaler, 'models/traffic_scaler.pkl')

print(f"Saved {len(X)} sequences, lookback={lookback}")