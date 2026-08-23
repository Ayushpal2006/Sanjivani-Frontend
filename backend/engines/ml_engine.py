import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = "backend/models/sanjivani_pcos_model.pkl"

def load_ml_model():
    if not os.path.exists(MODEL_PATH):
        # Fallback if model hasn't been saved yet
        return None, None
    try:
        artifact = joblib.load(MODEL_PATH)
        return artifact['model'], artifact['feature_columns']
    except Exception as e:
        print(f"Error loading model: {e}")
        return None, None

def evaluate_ml_endocrine_risk(assessment_data: dict) -> dict:
    """
    Stage 2: ML Endocrine Risk Engine.
    Executes trained Random Forest Classifier on validated input features.
    Output: Endocrine / PCOS Risk Probability (0.0 to 1.0) and Risk Category (Low, Moderate, Elevated).
    """
    model, feature_cols = load_ml_model()
    
    # Calculate BMI if height and weight provided
    height_cm = float(assessment_data.get('height_cm', 158.0))
    weight_kg = float(assessment_data.get('weight_kg', 55.0))
    if height_cm > 0:
        calculated_bmi = weight_kg / ((height_cm / 100) ** 2)
    else:
        calculated_bmi = float(assessment_data.get('bmi', 22.0))
        
    # Helper to convert binary Yes/No
    def to_binary(val):
        return 1 if str(val).strip().lower() in ['yes', '1', 'true', 'frequently', 'regularly', 'irregular', 'missed'] else 0

    # Helper for cycle length mapping (0: <21, 1: 21-35, 2: >35, 3: varies)
    def map_cycle_length(val):
        v = str(val).lower()
        if 'less' in v or '<21' in v or 'short' in v:
            return 0
        elif 'more' in v or '>35' in v or 'long' in v:
            return 2
        elif 'varies' in v or 'significant' in v:
            return 3
        return 1 # 21-35 default

    # Helper for cycle regularity mapping (0: Regular, 1: Irregular, 2: Frequently Missed)
    def map_cycle_regularity(val):
        v = str(val).lower()
        if 'frequently' in v or 'missed' in v or 'amenorrhea' in v:
            return 2
        elif 'irregular' in v:
            return 1
        return 0

    # Helper for symptom duration mapping (0: <1mo, 1: 1-3mo, 2: 3-6mo, 3: >6mo)
    def map_symptom_duration(val):
        v = str(val).lower()
        if '>6' in v or 'more than 6' in v:
            return 3
        elif '3-6' in v:
            return 2
        elif '1-3' in v:
            return 1
        return 0

    input_row = {
        'age': int(assessment_data.get('age', 25)),
        'bmi': round(calculated_bmi, 2),
        'weight_gain': to_binary(assessment_data.get('weight_gain')),
        'cycle_length': map_cycle_length(assessment_data.get('cycle_length')),
        'cycle_regularity': map_cycle_regularity(assessment_data.get('cycle_regularity')),
        'symptom_duration': map_symptom_duration(assessment_data.get('symptom_duration')),
        'facial_hair': to_binary(assessment_data.get('facial_hair')),
        'acne': to_binary(assessment_data.get('acne')),
        'hair_loss': to_binary(assessment_data.get('hair_loss')),
        'dark_skin': to_binary(assessment_data.get('dark_skin')),
        'thyroid': to_binary(assessment_data.get('thyroid')),
        'diabetes': to_binary(assessment_data.get('diabetes')),
        'family_pcos': to_binary(assessment_data.get('family_pcos')),
        'fast_food': to_binary(assessment_data.get('fast_food')),
        'exercise': 1 if to_binary(assessment_data.get('exercise')) else 0
    }
    
    if model is not None and feature_cols is not None:
        df_in = pd.DataFrame([input_row])[feature_cols]
        prob = float(model.predict_proba(df_in)[0, 1])
    else:
        # Heuristic fallback if model is compiling
        score = 0.0
        if input_row['cycle_regularity'] > 0: score += 0.35
        if input_row['cycle_length'] in [2, 3]: score += 0.25
        if input_row['facial_hair']: score += 0.15
        if input_row['acne']: score += 0.10
        if input_row['dark_skin']: score += 0.10
        if input_row['weight_gain']: score += 0.10
        prob = min(round(score, 4), 0.95)

    # Categorize Risk
    if prob < 0.35:
        risk_category = "Low Risk"
    elif prob < 0.65:
        risk_category = "Moderate Risk"
    else:
        risk_category = "Elevated Risk"

    return {
        'risk_probability': round(prob, 4),
        'risk_category': risk_category,
        'calculated_bmi': round(calculated_bmi, 2),
        'processed_input': input_row
    }
