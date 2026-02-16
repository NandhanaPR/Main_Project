import sys
import json
import pandas as pd
import joblib
import os
import numpy as np

def predict():
    try:
        # 1. Setup Paths
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        model_path = os.path.join(backend_dir, 'models', 'honda_brio_fuel_model.pkl')
        data_path = os.path.join(backend_dir, 'models', 'car_data1.csv')
        state_path = os.path.join(os.path.dirname(__file__), 'state.txt') # To remember the row
        
        model = joblib.load(model_path)
        df = pd.read_csv(data_path)

        # 2. Sequential Logic: Read current index from state file
        if os.path.exists(state_path):
            with open(state_path, 'r') as f:
                try:
                    current_idx = int(f.read().strip())
                except:
                    current_idx = 2
        else:
            current_idx = 2 # Start at 2 so we have enough rows for Lags (0, 1, 2)

        # 3. Handle End of Data (Reset to beginning if we finish the CSV)
        if current_idx >= len(df):
            current_idx = 2

        # 4. Get the window of 3 rows for Lags
        sample_rows = df.iloc[current_idx-2 : current_idx+1].copy()

        def clean(val):
            return float(str(val).replace('%', '').replace('RPM', '').replace('km/h', '').replace('kPa', '').strip())

        # 5. Build Features (Same logic as before)
        input_row = {
            'RPM': clean(sample_rows.iloc[2]['Engine RPM']),
            'TPS': clean(sample_rows.iloc[2]['Throttle Position (TPS)']),
            'MAP': clean(sample_rows.iloc[2]['Intake Manifold Pressure (MAP)']),
            'Load': clean(sample_rows.iloc[2]['Calculated Engine Load']),
            'Speed': clean(sample_rows.iloc[2]['Vehicle Speed']),
            'TPS_lag_1': clean(sample_rows.iloc[1]['Throttle Position (TPS)']),
            'TPS_lag_2': clean(sample_rows.iloc[0]['Throttle Position (TPS)']),
            'MAP_lag_1': clean(sample_rows.iloc[1]['Intake Manifold Pressure (MAP)']),
            'MAP_lag_2': clean(sample_rows.iloc[0]['Intake Manifold Pressure (MAP)']),
            'Load_lag_1': clean(sample_rows.iloc[1]['Calculated Engine Load']),
            'Load_lag_2': clean(sample_rows.iloc[0]['Calculated Engine Load']),
            'RPM_lag_1': clean(sample_rows.iloc[1]['Engine RPM']),
            'RPM_lag_2': clean(sample_rows.iloc[0]['Engine RPM']),
            'rpm_bin': int(clean(sample_rows.iloc[2]['Engine RPM']) // 500),
            'load_bin': int(clean(sample_rows.iloc[2]['Calculated Engine Load']) // 10),
            'map_zone_enc': 1,
            'cell_change': 0,
            'air_mass_proxy': clean(sample_rows.iloc[2]['Intake Manifold Pressure (MAP)']) * clean(sample_rows.iloc[2]['Engine RPM'])
        }

        expected_features = ['RPM', 'TPS', 'MAP', 'Load', 'Speed', 'rpm_bin', 'load_bin', 
                             'map_zone_enc', 'cell_change', 'TPS_lag_1', 'TPS_lag_2', 
                             'MAP_lag_1', 'MAP_lag_2', 'Load_lag_1', 'Load_lag_2', 
                             'RPM_lag_1', 'RPM_lag_2', 'air_mass_proxy']
        
        input_df = pd.DataFrame([input_row])[expected_features]

        # 6. Predict and Get Actual
        prediction = model.predict(input_df)
        actual_trim = -(clean(sample_rows.iloc[2]['Short Term Fuel Trim Bank 1 (STFT)']) + 
                        clean(sample_rows.iloc[2]['Long Term Fuel Trim Bank 1 (LTFT)']))

        # 7. Save the NEXT index for the next request
        with open(state_path, 'w') as f:
            f.write(str(current_idx + 1))

        print(json.dumps({
            "actual": round(actual_trim, 2),
            "predicted": round(float(prediction[0]), 2)
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    predict()