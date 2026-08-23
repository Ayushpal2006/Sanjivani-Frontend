def evaluate_safety_red_flags(assessment_data: dict) -> dict:
    """
    Stage 1: Safety & Red-Flag Screening Engine.
    Evaluates assessment input for critical, high-risk non-PCOS or acute clinical emergency red flags.
    Returns:
      {
        'red_flag_triggered': bool,
        'flags': list of string explanations,
        'forced_triage_level': 'LEVEL 3' if red_flag_triggered else None
      }
    """
    flags = []
    
    # 1. Blood in stool (Critical GI Red Flag)
    blood_in_stool = assessment_data.get('blood_in_stool', False)
    if blood_in_stool in [True, 1, 'Yes', 'yes']:
        flags.append("Blood reported in stool (Requires urgent clinical evaluation)")
        
    # 2. Pain Severity 5 (Very Severe Pain)
    pain_severity = assessment_data.get('pain_severity', 1)
    try:
        pain_severity = int(pain_severity)
    except (ValueError, TypeError):
        pain_severity = 1
        
    if pain_severity >= 5:
        pain_loc = assessment_data.get('pain_location', 'Pelvic/Abdominal')
        flags.append(f"Severe, debilitating pain reported (Level 5/5, Location: {pain_loc})")
        
    # 3. Acute Severe GI distress (Vomiting + Severe Abdominal Pain)
    stomach_pain = assessment_data.get('stomach_pain', False) in [True, 1, 'Yes', 'yes']
    vomiting = assessment_data.get('vomiting', False) in [True, 1, 'Yes', 'yes']
    if stomach_pain and vomiting and pain_severity >= 4:
        flags.append("Acute severe abdominal pain accompanied by persistent vomiting")
        
    # 4. Severe mental health distress / suicidal ideation / extreme fear flag
    wellbeing = assessment_data.get('wellbeing', 'Calm / Stable')
    if wellbeing in ['Severe Distress', 'Persistent Severe Anxiety']:
        flags.append("Severe psychological distress requiring immediate professional support")
        
    red_flag_triggered = len(flags) > 0
    
    return {
        'red_flag_triggered': red_flag_triggered,
        'flags': flags,
        'forced_triage_level': 'LEVEL 3' if red_flag_triggered else None
    }
