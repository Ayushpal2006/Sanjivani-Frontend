def determine_triage_level(safety_result: dict, ml_result: dict, assessment_data: dict) -> dict:
    """
    Two-Stage Decision Triage Engine.
    Stage 1: Safety Layer check. If Red Flag -> Force Level 3 Clinical Referral.
    Stage 2: ML Risk Score evaluation -> Level 1 or Level 2 (or Level 3 if score >= 0.80 + multiple persistent symptoms).
    """
    # 1. Safety Override check
    if safety_result.get('red_flag_triggered', False):
        return {
            'triage_level': 'LEVEL 3',
            'triage_code': 3,
            'title': 'CLINICAL REFERRAL / ESCALATION',
            'title_hindi': 'चिकित्सकीय परामर्श / अति आवश्यक रेफरल',
            'badge_color': 'red',
            'recommended_action': 'Immediate clinical evaluation required at Primary Health Centre (PHC) or Community Health Centre (CHC). Record referral and schedule urgent follow-up.',
            'recommended_action_hindi': 'प्राथमिक स्वास्थ्य केंद्र (PHC) या सामुदायिक स्वास्थ्य केंद्र (CHC) में तत्काल चिकित्सीय मूल्यांकन की आवश्यकता है।',
            'requires_referral': True,
            'requires_followup': True,
            'reason_override': 'Safety Layer Triggered'
        }
        
    prob = ml_result.get('risk_probability', 0.0)
    symptom_duration = str(assessment_data.get('symptom_duration', '')).lower()
    is_persistent = '3-6' in symptom_duration or '>6' in symptom_duration or 'more than' in symptom_duration
    
    # 2. Level 3 High Composite Risk (High ML risk + Persistent Duration)
    if prob >= 0.80 and is_persistent:
        return {
            'triage_level': 'LEVEL 3',
            'triage_code': 3,
            'title': 'CLINICAL REFERRAL / ESCALATION',
            'title_hindi': 'चिकित्सकीय परामर्श / अति आवश्यक रेफरल',
            'badge_color': 'red',
            'recommended_action': 'High clinical concern with persistent symptoms (>3 months). Formal referral to Medical Officer recommended for diagnostic ultrasound and hormonal evaluation.',
            'recommended_action_hindi': 'चिकित्सक परामर्श, सोनोग्राफी (Ultrasound) एवं हार्मोनल परीक्षण हेतु रेफरल आवश्यक।',
            'requires_referral': True,
            'requires_followup': True,
            'reason_override': None
        }

    # 3. Level 2 Further Assessment (Moderate/Elevated ML Risk or Irregular Cycles)
    cycle_reg = str(assessment_data.get('cycle_regularity', '')).lower()
    has_irregular_cycle = 'irregular' in cycle_reg or 'missed' in cycle_reg
    
    if prob >= 0.35 or has_irregular_cycle:
        return {
            'triage_level': 'LEVEL 2',
            'triage_code': 2,
            'title': 'FURTHER ASSESSMENT RECOMMENDED',
            'title_hindi': 'आगे की जांच एवं परामर्श आवश्यक',
            'badge_color': 'yellow',
            'recommended_action': 'Schedule clinical consultation at Ayushman Arogya Mandir / PHC for detailed evaluation. Provide lifestyle and nutritional counseling.',
            'recommended_action_hindi': 'आयुष्मान आरोग्य मंदिर या निकटतम प्राथमिक स्वास्थ्य केंद्र में परामर्श एवं जांच की सलाह दें।',
            'requires_referral': True,
            'requires_followup': True,
            'reason_override': None
        }
        
    # 4. Level 1 Routine Monitoring
    return {
        'triage_level': 'LEVEL 1',
        'triage_code': 1,
        'title': 'ROUTINE MONITORING',
        'title_hindi': 'सामान्य स्वास्थ्य निगरानी',
        'badge_color': 'green',
        'recommended_action': 'Routine health monitoring. Provide guidance on balanced dietary habits, regular physical exercise, and menstrual hygiene tracking.',
        'recommended_action_hindi': 'सामान्य स्वास्थ्य एवं आहार संबंधी मार्गदर्शन प्रदान करें। लक्षणों पर निगरानी रखें।',
        'requires_referral': False,
        'requires_followup': False,
        'reason_override': None
    }
