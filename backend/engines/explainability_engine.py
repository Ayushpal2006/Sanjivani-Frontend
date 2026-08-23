def generate_explainable_reasons(assessment_data: dict, safety_result: dict, ml_result: dict) -> list:
    """
    Converts ML model inputs and safety findings into clear, plain-language contributing indicators.
    Converts technical machine learning outputs into simple ASHA & Patient-friendly reason codes.
    """
    reasons = []
    
    # 1. Safety Red Flags (if triggered)
    if safety_result.get('red_flag_triggered', False):
        for flag in safety_result.get('flags', []):
            reasons.append({
                'category': 'SAFETY_RED_FLAG',
                'title': flag,
                'title_hindi': f"सुरक्षा चेतावनी: {flag}",
                'severity': 'high'
            })
            
    # 2. Menstrual Pattern Indicators
    cycle_reg = str(assessment_data.get('cycle_regularity', '')).lower()
    if 'irregular' in cycle_reg or 'missed' in cycle_reg:
        reasons.append({
            'category': 'MENSTRUAL',
            'title': 'Persistent Menstrual Irregularity or Missed Periods',
            'title_hindi': 'अनियमित या बार-बार छूटने वाले मासिक धर्म',
            'severity': 'medium'
        })
        
    cycle_len = str(assessment_data.get('cycle_length', '')).lower()
    if 'more than' in cycle_len or '>35' in cycle_len or 'varies' in cycle_len:
        reasons.append({
            'category': 'MENSTRUAL',
            'title': 'Extended Cycle Length (>35 Days or Significantly Varying)',
            'title_hindi': 'मासिक चक्र की अवधि 35 दिनों से अधिक या अत्यधिक परिवर्तनशील होना',
            'severity': 'medium'
        })
        
    # 3. Hyperandrogenism / Skin & Hair Symptoms
    if assessment_data.get('facial_hair') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'ENDOCRINE_SYMPTOM',
            'title': 'Reported Excess Facial or Body Hair (Hirsutism)',
            'title_hindi': 'चेहरे या शरीर पर अतिरिक्त बालों की वृद्धि',
            'severity': 'medium'
        })
        
    if assessment_data.get('acne') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'ENDOCRINE_SYMPTOM',
            'title': 'Persistent or Recurrent Acne / Skin Breakouts',
            'title_hindi': 'चेहरे या त्वचा पर लगातार मुहांसे (Acne)',
            'severity': 'low'
        })
        
    if assessment_data.get('dark_skin') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'ENDOCRINE_SYMPTOM',
            'title': 'Skin Darkening in Skin Folds (Acanthosis Nigricans Indicator)',
            'title_hindi': 'गर्दन या त्वचा की परतों में कालापन (Skin Darkening)',
            'severity': 'medium'
        })
        
    if assessment_data.get('hair_loss') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'ENDOCRINE_SYMPTOM',
            'title': 'Scalp Hair Loss or Thinning',
            'title_hindi': 'सिर के बालों का पतला होना या झड़ना',
            'severity': 'low'
        })

    # 4. Metabolic / Weight Indicators
    if assessment_data.get('weight_gain') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'METABOLIC',
            'title': 'Unexplained Recent Weight Gain',
            'title_hindi': 'अचानक या अकारण वजन में वृद्धि',
            'severity': 'low'
        })
        
    calculated_bmi = ml_result.get('calculated_bmi', 22.0)
    if calculated_bmi >= 25.0:
        reasons.append({
            'category': 'METABOLIC',
            'title': f'Elevated Body Mass Index (BMI: {calculated_bmi})',
            'title_hindi': f'बीएमआई (BMI) में वृद्धि ({calculated_bmi})',
            'severity': 'low'
        })

    # 5. History Indicators
    if assessment_data.get('family_pcos') in [True, 1, 'Yes', 'yes']:
        reasons.append({
            'category': 'HISTORY',
            'title': 'Reported Family History of Endocrine / PCOS Health Issues',
            'title_hindi': 'परिवार में पीसीओएस या अंतःस्रावी (Endocrine) समस्याओं का इतिहास',
            'severity': 'low'
        })
        
    if len(reasons) == 0:
        reasons.append({
            'category': 'ROUTINE',
            'title': 'No Significant Endocrine or Red-Flag Indicators Detected',
            'title_hindi': 'कोई प्रमुख जोखिम लक्षण दर्ज नहीं हुआ',
            'severity': 'low'
        })
        
    return reasons
