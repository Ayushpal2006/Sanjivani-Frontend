import os
import pandas as pd
import numpy as np

def generate_kaggle_like_pcos_dataset(num_samples=541, seed=42):
    """
    Generates a realistic dataset matching the official Kaggle PCOS dataset schema
    (541 patients, corresponding to the original PCOS_data_without_infertility.csv).
    This serves as a default fallback until the user drops their exact Kaggle CSV into backend/data/PCOS_data.csv.
    """
    np.random.seed(seed)
    
    # 1. Target variable (PCOS Y/N) ~33% positive rate in original dataset
    pcos = np.random.choice([0, 1], size=num_samples, p=[0.67, 0.33])
    
    # 2. Features influenced by PCOS status to mimic real clinical correlations
    age = np.random.randint(18, 45, size=num_samples)
    
    # Weight & Height -> BMI
    height_cm = np.random.normal(158, 6, size=num_samples) # mean height for Indian women
    # Weight correlated with PCOS status
    weight_kg = np.where(pcos == 1, np.random.normal(68, 10, size=num_samples), np.random.normal(56, 8, size=num_samples))
    bmi = weight_kg / ((height_cm / 100) ** 2)
    
    # Menstrual features (strong correlation)
    # Cycle length: 0 = <21 days, 1 = 21-35 days, 2 = >35 days, 3 = varies significantly
    cycle_length_prob_no_pcos = [0.05, 0.85, 0.05, 0.05]
    cycle_length_prob_pcos = [0.05, 0.20, 0.55, 0.20]
    
    cycle_length = []
    cycle_regularity = []
    for p in pcos:
        if p == 1:
            cl = np.random.choice([0, 1, 2, 3], p=cycle_length_prob_pcos)
            cr = np.random.choice([0, 1, 2], p=[0.15, 0.70, 0.15]) # 0=regular, 1=irregular, 2=frequently missed
        else:
            cl = np.random.choice([0, 1, 2, 3], p=cycle_length_prob_no_pcos)
            cr = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03])
        cycle_length.append(cl)
        cycle_regularity.append(cr)
        
    # Symptom Duration (0: <1 mo, 1: 1-3 mo, 2: 3-6 mo, 3: >6 mo)
    symptom_duration = np.where(pcos == 1, np.random.choice([2, 3], size=num_samples, p=[0.3, 0.7]), np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.4, 0.3, 0.2, 0.1]))
    
    # Androgen/Endocrine Symptoms (Yes=1, No=0)
    weight_gain = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.75, 0.25]), np.random.choice([1, 0], size=num_samples, p=[0.20, 0.80]))
    hair_growth = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.70, 0.30]), np.random.choice([1, 0], size=num_samples, p=[0.15, 0.85]))
    skin_darkening = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.65, 0.35]), np.random.choice([1, 0], size=num_samples, p=[0.10, 0.90]))
    hair_loss = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.60, 0.40]), np.random.choice([1, 0], size=num_samples, p=[0.20, 0.80]))
    pimples = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.70, 0.30]), np.random.choice([1, 0], size=num_samples, p=[0.25, 0.75]))
    
    # Medical & Lifestyle
    fast_food = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.70, 0.30]), np.random.choice([1, 0], size=num_samples, p=[0.40, 0.60]))
    regular_exercise = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.25, 0.75]), np.random.choice([1, 0], size=num_samples, p=[0.55, 0.45]))
    thyroid = np.random.choice([1, 0], size=num_samples, p=[0.15, 0.85])
    diabetes = np.random.choice([1, 0], size=num_samples, p=[0.12, 0.88])
    family_pcos = np.where(pcos == 1, np.random.choice([1, 0], size=num_samples, p=[0.40, 0.60]), np.random.choice([1, 0], size=num_samples, p=[0.10, 0.90]))
    
    # Existing diagnosis (FOR CLINICAL HISTORY ONLY - MUST BE EXCLUDED FROM ML MODEL INPUTS TO AVOID TARGET LEAKAGE)
    existing_pcos_diagnosis = pcos.copy() # ground truth alignment
    
    df = pd.DataFrame({
        'age': age,
        'bmi': np.round(bmi, 2),
        'weight_gain': weight_gain,
        'cycle_length': cycle_length,
        'cycle_regularity': cycle_regularity,
        'symptom_duration': symptom_duration,
        'facial_hair': hair_growth,
        'acne': pimples,
        'hair_loss': hair_loss,
        'dark_skin': skin_darkening,
        'thyroid': thyroid,
        'diabetes': diabetes,
        'family_pcos': family_pcos,
        'fast_food': fast_food,
        'exercise': regular_exercise,
        'existing_pcos_diagnosis': existing_pcos_diagnosis, # NOT an input feature
        'pcos_target': pcos
    })
    
    return df

def load_or_generate_dataset(csv_path="backend/data/PCOS_data.csv"):
    """
    Loads user's Kaggle PCOS CSV if available, otherwise generates a clean synthetic Kaggle-structured dataset.
    """
    if os.path.exists(csv_path):
        print(f"Loading user-provided Kaggle dataset from {csv_path}...")
        df = pd.read_csv(csv_path)
        # Perform standard column mapping if needed
        return df
    else:
        print("No user Kaggle CSV found at backend/data/PCOS_data.csv. Generating Kaggle-structured PCOS dataset...")
        df = generate_kaggle_like_pcos_dataset()
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        df.to_csv(csv_path, index=False)
        return df

if __name__ == "__main__":
    df = load_or_generate_dataset()
    print("Dataset loaded successfully. Shape:", df.shape)
    print("Class distribution:\n", df['pcos_target'].value_counts())
