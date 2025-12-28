import sys
import json
import os
import warnings

# 1. Suppress all warnings to keep the output clean for the Node.js server
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

import numpy as np
import pandas as pd
import pickle

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

THRESHOLD = 0.2671
TIME_STEPS = 15
FEATURES = [
    'Throttle Position (TPS)',
    'Intake Manifold Pressure (MAP)',
    'Engine RPM',
    'Short Term Fuel Trim Bank 1 (STFT)',
    'Long Term Fuel Trim Bank 1 (LTFT)',
    'Lambda Bank 1 Sensor 1 (wideband)'
]

def clean_data(df, cols):
    data = df[cols].copy()
    for col in cols:
        if data[col].dtype == object:
            data[col] = pd.to_numeric(data[col].str.extract(r'([-\d.]+)')[0], errors='coerce')
        else:
            data[col] = pd.to_numeric(data[col], errors='coerce')
    # Modern ffill/bfill to avoid FutureWarnings
    return data.interpolate().bfill().ffill()

def run_inference():
    try:
        model = load_model(MODEL_PATH, custom_objects={'mae': tf.keras.losses.MeanAbsoluteError()}, compile=False)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)

        df = pd.read_csv(DATA_PATH)
        df_clean = clean_data(df, FEATURES)
        
        # Pick random window to simulate real-time variation
        start_idx = np.random.randint(0, len(df_clean) - TIME_STEPS)
        recent_window = df_clean.iloc[start_idx : start_idx + TIME_STEPS].values
        
        scaled_window = scaler.transform(recent_window)
        input_reshaped = scaled_window.reshape(1, TIME_STEPS, len(FEATURES))

        prediction = model.predict(input_reshaped, verbose=0)
        mae_loss = np.mean(np.abs(prediction - input_reshaped))

        latest = df_clean.iloc[start_idx + TIME_STEPS - 1]

        return {
            "anomaly": bool(mae_loss > THRESHOLD),
            "score": float(mae_loss),
            "map": round(float(latest['Intake Manifold Pressure (MAP)']), 2),
            "rpm": int(latest['Engine RPM']),
            "lambda": float(latest['Lambda Bank 1 Sensor 1 (wideband)'])
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Ensure ONLY the JSON is printed to stdout
    print(json.dumps(run_inference()))