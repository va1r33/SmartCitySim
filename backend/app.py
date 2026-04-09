from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.get_json()
        print("Received from client:", data)

        buildings = data.get('buildings', [])
        smart_mode = data.get('smartthings_mode', '')

        # Count building types
        r = c = i = 0
        for b in buildings:
            t = b.get('type', '')
            cnt = int(b.get('count', 0))
            if t == 'residential': r += cnt
            elif t == 'commercial': c += cnt
            elif t == 'industrial': i += cnt

        total = r + c + i

        # ---- Dynamic metrics (instant recalculation) ----
        if total == 0:
            traffic = 10.0
            co2 = 20.0
            energy = 25.0
        else:
            # Balanced but punitive for industrial, moderate for commercial
            traffic = min(100.0, 20.0 + c * 2.0 + i * 3.0)
            co2     = min(100.0, 15.0 + i * 7.0 + c * 2.0)
            energy  = min(120.0, 20.0 + r * 2.0 + c * 3.0 + i * 5.0)

        # ---- SmartThings modifiers ----
        if smart_mode == 'eco':
            co2 *= 0.80    # -20%
            energy *= 0.90 # -10%
            status = "Eco Mode Active"
        elif smart_mode == 'traffic_control':
            traffic *= 0.75 # -25%
            energy *= 1.05  # +5%
            status = "Traffic Control Active"
        elif smart_mode == 'alert':
            status = "ALERT" if (traffic > 70 or co2 > 60) else "Normal"
        else:
            status = "Idle"

        # Clamp & round
        traffic = round(max(5.0, traffic), 1)
        co2     = round(max(5.0, co2), 1)
        energy  = round(max(5.0, energy), 1)

        # Success condition 
        if co2 <= 60 and traffic <= 40 and energy <= 100:
            message = "Green Mandate Achieved!"
        else:
            message = f"City Analyzed: {r}R {c}C {i}I | {status}"

        response = {
            "traffic": int(round(traffic)),
            "co2": int(round(co2)),
            "energy": int(round(energy)),
            "message": message
        }

        print("Sending response:", response)
        return jsonify(response)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "SmartCitySim Flask Server is running! Use /api/simulate endpoint."

if __name__ == '__main__':
    print("Starting SmartCitySim Server...")
    app.run(debug=True, host='0.0.0.0', port=5001)
