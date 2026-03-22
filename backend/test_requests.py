import requests
import json

url = "http://localhost:5001/api/simulate"

sample_city_data = {
    "layout": "basic_grid",
    "buildings": [
        {"type": "residential", "count": 10},
        {"type": "commercial", "count": 3},
        {"type": "industrial", "count": 1}
    ]
}

headers = {"Content-Type": "application/json"}

try:
    print("Sending test request to Flask server...")
    print(f"Data: {json.dumps(sample_city_data, indent=2)}")
    print("---")
    
    response = requests.post(url, json=sample_city_data, headers=headers)
    
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("SUCCESS! Response:")
        print(json.dumps(result, indent=2))
        
        print("\n Simulation Results:")
        print(f"   Traffic: {result.get('traffic', 'N/A')}%")
        print(f"   Energy: {result.get('energy', 'N/A')} MW")
        print(f"   CO2: {result.get('co2', 'N/A')}%")
        print(f"   Message: {result.get('message', 'N/A')}")
    else:
        print(f"ERROR: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("Connection failed! Is the server running?")
    print("   Run: python app.py")
except Exception as e:
    print(f"Unexpected error: {e}")