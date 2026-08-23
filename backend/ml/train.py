import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

from data_loader import load_or_generate_dataset

# Define feature columns (EXCLUDING existing_pcos_diagnosis to prevent Target Leakage)
FEATURE_COLUMNS = [
    'age',
    'bmi',
    'weight_gain',
    'cycle_length',
    'cycle_regularity',
    'symptom_duration',
    'facial_hair',
    'acne',
    'hair_loss',
    'dark_skin',
    'thyroid',
    'diabetes',
    'family_pcos',
    'fast_food',
    'exercise'
]

TARGET_COLUMN = 'pcos_target'

def train_and_evaluate():
    # 1. Load dataset
    df = load_or_generate_dataset()
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    
    # 2. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    # 3. Model Comparisons
    models = {
        'RandomForest': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        'LogisticRegression': LogisticRegression(max_iter=500, random_state=42),
        'DecisionTree': DecisionTreeClassifier(max_depth=5, random_state=42)
    }
    
    metrics = {}
    best_model_name = 'RandomForest'
    best_rf_model = None
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        metrics[name] = {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(auc), 4),
            'confusion_matrix': cm
        }
        
        if name == 'RandomForest':
            best_rf_model = model

    # 4. Feature Importances for Explainable AI
    feature_importances = dict(zip(FEATURE_COLUMNS, np.round(best_rf_model.feature_importances_, 4)))
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    # Save artifact models
    output_dir = "backend/models"
    os.makedirs(output_dir, exist_ok=True)
    
    model_path = os.path.join(output_dir, "sanjivani_pcos_model.pkl")
    joblib.dump({
        'model': best_rf_model,
        'feature_columns': FEATURE_COLUMNS
    }, model_path)
    
    metadata = {
        'model_type': 'RandomForestClassifier',
        'metrics': metrics,
        'feature_importances': sorted_importances,
        'dataset_size': len(df),
        'train_size': len(X_train),
        'test_size': len(X_test),
        'disclaimer': 'Prototype decision-support model trained on Kaggle PCOS dataset format. Requires prospective clinical validation before real-world diagnostic deployment.'
    }
    
    metadata_path = os.path.join(output_dir, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model trained & saved to {model_path}")
    print("Metrics summary:")
    print(json.dumps(metrics['RandomForest'], indent=2))
    print("Top Feature Importances:")
    print(json.dumps(sorted_importances, indent=2))
    
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
