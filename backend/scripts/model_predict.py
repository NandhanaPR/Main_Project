import sys
import json
import os
import warnings
import numpy as np
import pandas as pd
import pickle

# 1. Suppress warnings & TF logs
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
except ImportError:
    print(json.dumps({"error": "Tensorflow not found"}))
    sys.exit(1)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
MODEL_PATH = os.path.join(BACKEND_DIR, 'models', 'fuel_leak_model1.h5')
SCALER_PATH = os.path.join(BACKEND_DIR, 'models', 'scaler.pkl')
DATA_PATH = os.path.join(BACKEND_DIR, 'models', 'car_data.csv')
STATE_FILE = os.path.join(SCRIPT_DIR, 'state_leak.txt')

# Parameters
THRESHOLD = 0.1643
TIME_STEPS = 15

def clean_data(df, cols):
    """Ensures data is numeric and handles missing values."""
    data = df[cols].copy()
    for col in cols:
        # Extract numbers in case there are units (like '70 km/h')
        if data[col].dtype == object:
            data[col] = pd.to_numeric(data[col].str.extract(r'([-\d.]+)')[0], errors='coerce')
        else:
            data[col] = pd.to_numeric(data[col], errors='coerce')
    # Interpolate gaps, then fill remaining NaNs with start/end values
    return data.interpolate().bfill().ffill()

def run_inference():
    try:
        # Load Model
        model = load_model(MODEL_PATH, compile=False)
        
        # Load Scaler
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)

        # CRITICAL: Get the exact order the scaler was trained on
        if hasattr(scaler, 'feature_names_in_'):
            FEATURES = list(scaler.feature_names_in_)
        else:
            # Fallback if your sklearn version is old
            FEATURES = [
                'Short Term Fuel Trim Bank 1 (STFT)', 'Long Term Fuel Trim Bank 1 (LTFT)',
                'Calculated Engine Load', 'Engine RPM', 'Vehicle Speed',
                'Throttle Position (TPS)', 'Intake Manifold Pressure (MAP)'
            ]

        # Load and clean full CSV
        df = pd.read_csv(DATA_PATH)
        df_clean = clean_data(df, FEATURES)
        
        # Handle index progression
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                try:
                    start_idx = int(f.read().strip())
                except:
                    start_idx = 100 
        else:
            start_idx = 100

        # Loop back if end reached
        if start_idx >= len(df_clean) - TIME_STEPS:
            start_idx = 100
        
        # --- PREPARE DATA ---
        # 1. Get the 15-row window
        recent_window = df_clean.iloc[start_idx : start_idx + TIME_STEPS]
        
        # 2. Scale it (Must be done before reshaping)
        # We convert to numpy for the scaler
        scaled_data = scaler.transform(recent_window.values) 
        
        # 3. Reshape for LSTM: (1, 15, 7)
        input_reshaped = scaled_data.reshape(1, TIME_STEPS, len(FEATURES))

        # --- PREDICT ---
        prediction = model.predict(input_reshaped, verbose=0)
        
        # --- CALCULATE ERROR ---
        # For Autoencoders, we compare the prediction to the input
        # We ensure they are the same shape to avoid broadcasting errors
        mae_loss = np.mean(np.abs(prediction - input_reshaped))

        # Get display values from the last row of the window
        latest = df_clean.iloc[start_idx + TIME_STEPS - 1]

        # Save next index
        with open(STATE_FILE, 'w') as f:
            f.write(str(start_idx + 1))

        return {
            "index": int(start_idx),
            "anomaly": bool(mae_loss > THRESHOLD),
            "score": round(float(mae_loss), 4),
            "rpm": int(latest['Engine RPM']),
            "speed": int(latest['Vehicle Speed']),
            "map": round(float(latest['Intake Manifold Pressure (MAP)']), 2)
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    result = run_inference()
    print(json.dumps(result))