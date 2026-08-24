from typing import Dict, Any, List, Optional
from app.schemas import PCOSPredictionRequest, RedFlagItem

# Centralized threshold constants
BLEEDING_NORMAL_MIN = 2
BLEEDING_NORMAL_MAX = 7
BLEEDING_PROLONGED_MIN = 8
BLEEDING_PROLONGED_MAX = 10
BLEEDING_SIGNIFICANT_MIN = 11
BLEEDING_SIGNIFICANT_MAX = 20
BLEEDING_EXTREME_MIN = 21

TRAINING_CYCLE_LENGTH_MIN = 0
TRAINING_CYCLE_LENGTH_MAX = 12

HIGH_ML_PROBABILITY_THRESHOLD = 0.70


def evaluate_safety_and_red_flags(
    data: PCOSPredictionRequest,
    existing_limitations: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates acute clinical safety red flags and out-of-distribution training range limitations.
    Safety symptoms are evaluated deterministically and do NOT alter pure ML model features.
    """
    red_flags: List[RedFlagItem] = []
    clinical_reasons: List[str] = []
    model_limitations: List[str] = list(existing_limitations) if existing_limitations else []

    cycle_len = data.cycle_length

    # 1. Menstrual Bleeding Duration Evaluation (cycle_length represents duration in days)
    if cycle_len <= 1:
        clinical_reasons.append("Unusually short bleeding duration reported.")

    elif BLEEDING_PROLONGED_MIN <= cycle_len <= BLEEDING_PROLONGED_MAX:
        red_flags.append(RedFlagItem(
            severity="medium",
            category="bleeding_duration",
            message=f"Prolonged bleeding duration detected ({cycle_len} days)."
        ))
        clinical_reasons.append(f"Prolonged menstrual bleeding reported ({cycle_len} days).")

    elif BLEEDING_SIGNIFICANT_MIN <= cycle_len <= BLEEDING_SIGNIFICANT_MAX:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding_duration",
            message=f"Significantly prolonged bleeding duration detected ({cycle_len} days)."
        ))
        clinical_reasons.append(f"Significantly prolonged bleeding duration reported ({cycle_len} days).")
        if cycle_len > TRAINING_CYCLE_LENGTH_MAX:
            limitation_msg = (
                f"The provided cycle length ({cycle_len} days) is outside the range "
                f"({TRAINING_CYCLE_LENGTH_MIN}–{TRAINING_CYCLE_LENGTH_MAX} days) observed during ML model training. "
                f"The ML probability was calculated using a capped value ({TRAINING_CYCLE_LENGTH_MAX} days) and may be less reliable for this input."
            )
            if not any(f"{cycle_len} days" in lim and "outside" in lim for lim in model_limitations):
                model_limitations.append(limitation_msg)

    elif cycle_len >= BLEEDING_EXTREME_MIN:
        red_flags.append(RedFlagItem(
            severity="critical",
            category="bleeding_duration",
            message=f"Extremely prolonged bleeding duration detected ({cycle_len} days)."
        ))
        clinical_reasons.append(f"Extremely prolonged bleeding duration reported ({cycle_len} days).")
        limitation_msg = (
            f"The cycle length value ({cycle_len} days) is significantly outside the ML model training range "
            f"({TRAINING_CYCLE_LENGTH_MIN}–{TRAINING_CYCLE_LENGTH_MAX} days). "
            f"The ML probability was calculated using a capped value ({TRAINING_CYCLE_LENGTH_MAX} days) and should not be used as a primary diagnostic indicator."
        )
        if not any(f"{cycle_len} days" in lim and "outside" in lim for lim in model_limitations):
            model_limitations.append(limitation_msg)

    # 2. Bleeding Severity, Flow & Pattern Flags
    if data.heavy_bleeding:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding",
            message="Heavy menstrual bleeding reported."
        ))
        clinical_reasons.append("Heavy menstrual bleeding reported.")

    if data.rapid_pad_saturation:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding",
            message="Rapid pad or tampon saturation (soaking every 1–2 hours or faster) reported."
        ))
        clinical_reasons.append("Rapid pad/tampon saturation reported (soaking every 1–2 hours).")

    if data.flooding_gushing:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding",
            message="Sudden flooding or gushing bleeding reported."
        ))
        clinical_reasons.append("Sudden flooding/gushing bleeding reported.")

    if data.large_blood_clots:
        red_flags.append(RedFlagItem(
            severity="medium",
            category="bleeding",
            message="Passing unusually large blood clots reported."
        ))
        clinical_reasons.append("Large blood clots reported during menstruation.")

    if data.bleeding_between_periods:
        red_flags.append(RedFlagItem(
            severity="medium",
            category="bleeding",
            message="Bleeding or spotting between periods (intermenstrual bleeding) reported."
        ))
        clinical_reasons.append("Bleeding between periods reported.")

    if data.bleeding_after_sex:
        red_flags.append(RedFlagItem(
            severity="medium",
            category="bleeding",
            message="Bleeding after sexual intercourse (postcoital bleeding) reported."
        ))
        clinical_reasons.append("Bleeding after sexual intercourse reported.")

    # 3. Pain Red Flags
    if data.sudden_severe_pelvic_pain or data.severe_pain:
        red_flags.append(RedFlagItem(
            severity="high",
            category="pain",
            message="Severe or sudden pelvic or lower abdominal pain reported."
        ))
        clinical_reasons.append("Severe or sudden pelvic pain reported.")

    if data.one_sided_pelvic_pain:
        red_flags.append(RedFlagItem(
            severity="high" if data.pregnancy_possible else "medium",
            category="pain",
            message="Localized one-sided pelvic pain reported."
        ))
        clinical_reasons.append("One-sided pelvic pain reported.")

    if data.shoulder_tip_pain:
        red_flags.append(RedFlagItem(
            severity="critical" if data.pregnancy_possible else "high",
            category="pain",
            message="Shoulder-tip pain reported (important acute clinical sign)."
        ))
        clinical_reasons.append("Shoulder-tip pain reported.")

    # 4. Gastrointestinal & Infectious Red Flags
    if data.blood_in_stool:
        red_flags.append(RedFlagItem(
            severity="critical",
            category="gastrointestinal",
            message="Blood in stool observed — this is a serious general clinical red flag requiring urgent medical evaluation."
        ))
        clinical_reasons.append("Blood observed in stool (general clinical red flag).")

    if data.unable_to_keep_fluids:
        red_flags.append(RedFlagItem(
            severity="high",
            category="gastrointestinal",
            message="Inability to keep fluids down due to persistent vomiting."
        ))
        clinical_reasons.append("Unable to keep fluids down due to persistent vomiting.")
    elif data.vomiting:
        red_flags.append(RedFlagItem(
            severity="high",
            category="gastrointestinal",
            message="Persistent nausea or vomiting reported."
        ))
        clinical_reasons.append("Persistent vomiting reported.")

    if data.fever_chills:
        red_flags.append(RedFlagItem(
            severity="high" if (data.severe_pain or data.sudden_severe_pelvic_pain or data.one_sided_pelvic_pain) else "medium",
            category="infection",
            message="Fever or chills reported."
        ))
        if data.severe_pain or data.sudden_severe_pelvic_pain or data.one_sided_pelvic_pain:
            clinical_reasons.append("Fever/chills reported with pelvic pain.")
        else:
            clinical_reasons.append("Fever or chills reported.")

    # 5. Hemodynamic & Respiratory Red Flags
    if data.fainting:
        red_flags.append(RedFlagItem(
            severity="critical",
            category="hemodynamic",
            message="Fainting, near-fainting, or loss of consciousness reported."
        ))
        clinical_reasons.append("Fainting or near-fainting reported.")

    if data.dizziness and not data.fainting:
        red_flags.append(RedFlagItem(
            severity="high" if (data.heavy_bleeding or data.rapid_pad_saturation or data.flooding_gushing or data.pregnancy_possible) else "medium",
            category="hemodynamic",
            message="Significant dizziness or light-headedness reported."
        ))
        clinical_reasons.append("Significant dizziness or light-headedness reported.")

    if data.shortness_of_breath:
        red_flags.append(RedFlagItem(
            severity="high",
            category="respiratory",
            message="Shortness of breath or difficulty breathing reported."
        ))
        clinical_reasons.append("Shortness of breath or difficulty breathing reported.")

    # 6. Pregnancy Context
    if data.pregnancy_possible:
        red_flags.append(RedFlagItem(
            severity="high" if (data.heavy_bleeding or data.rapid_pad_saturation or data.flooding_gushing or data.sudden_severe_pelvic_pain or data.one_sided_pelvic_pain or data.shoulder_tip_pain or data.fainting) else "low",
            category="obstetric",
            message="Possible pregnancy reported in screening context."
        ))
        clinical_reasons.append("Possible pregnancy reported.")

    return {
        "red_flags": red_flags,
        "clinical_reasons": clinical_reasons,
        "model_limitations": model_limitations
    }


def evaluate_overall_triage(
    data: PCOSPredictionRequest,
    pcos_probability: float,
    model_prediction: int,
    base_warnings: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Integrates pure ML model inference with deterministic Safety Triage V2 rules.
    Precedence is strictly CRITICAL > HIGH > MODERATE > LOW.
    Pure ML probability is NEVER modified or faked.
    """
    safety_result = evaluate_safety_and_red_flags(data, existing_limitations=base_warnings)
    red_flags: List[RedFlagItem] = safety_result["red_flags"]
    overall_reasons: List[str] = list(safety_result["clinical_reasons"])
    model_limitations: List[str] = safety_result["model_limitations"]

    # Symptom Pattern Evaluation
    cycle_len = data.cycle_length
    if data.cycle_type.lower() == "irregular":
        overall_reasons.append("Irregular menstrual cycle pattern reported.")

    androgenic_symptoms_count = sum([
        data.weight_gain,
        data.hair_growth,
        data.skin_darkening,
        data.hair_loss,
        data.pimples
    ])
    if androgenic_symptoms_count >= 3:
        overall_reasons.append(f"Multiple androgenic/metabolic indicators present ({androgenic_symptoms_count} reported).")

    # Grouped Safety Flags
    is_heavy_or_rapid_bleeding = (
        data.heavy_bleeding
        or data.rapid_pad_saturation
        or data.flooding_gushing
    )
    has_severe_pelvic_pain = (
        data.severe_pain
        or data.sudden_severe_pelvic_pain
    )
    has_pelvic_pain = (
        has_severe_pelvic_pain
        or data.one_sided_pelvic_pain
    )
    has_vaginal_bleeding = (
        is_heavy_or_rapid_bleeding
        or data.bleeding_between_periods
        or data.bleeding_after_sex
        or cycle_len > 0
    )

    high_red_flags_count = sum(1 for rf in red_flags if rf.severity in ("high", "critical"))

    # =========================================================================
    # 1. CRITICAL Triage Evaluation (Immediate / Emergency Evaluation)
    # =========================================================================
    is_critical = (
        # Bleeding duration >= 21 days (preserve existing rule)
        cycle_len >= BLEEDING_EXTREME_MIN
        # General acute GI red flag
        or data.blood_in_stool
        # Heavy/rapid bleeding + fainting / near-fainting
        or (is_heavy_or_rapid_bleeding and data.fainting)
        # Heavy/rapid bleeding + shortness of breath
        or (is_heavy_or_rapid_bleeding and data.shortness_of_breath)
        # Heavy/rapid bleeding + significant dizziness
        or (is_heavy_or_rapid_bleeding and data.dizziness)
        # Possible pregnancy + vaginal bleeding + sudden/severe pelvic pain
        or (data.pregnancy_possible and has_vaginal_bleeding and data.sudden_severe_pelvic_pain)
        # Possible pregnancy + vaginal bleeding + one-sided pelvic pain
        or (data.pregnancy_possible and has_vaginal_bleeding and data.one_sided_pelvic_pain)
        # Possible pregnancy + shoulder-tip pain
        or (data.pregnancy_possible and data.shoulder_tip_pain)
        # Possible pregnancy + fainting
        or (data.pregnancy_possible and data.fainting)
        # Possible pregnancy + severe dizziness
        or (data.pregnancy_possible and data.dizziness)
        # Severe pelvic pain + fainting
        or (has_severe_pelvic_pain and data.fainting)
        # Severe pelvic pain + difficulty breathing / shortness of breath
        or (has_severe_pelvic_pain and data.shortness_of_breath)
        # Severe pelvic pain + heavy/rapid bleeding
        or (has_severe_pelvic_pain and is_heavy_or_rapid_bleeding)
        # Existing critical combination: severe pain + vomiting/inability to keep fluids
        or (data.severe_pain and (data.vomiting or data.unable_to_keep_fluids or cycle_len >= BLEEDING_SIGNIFICANT_MIN))
    )

    # =========================================================================
    # 2. HIGH Triage Evaluation (Prompt Clinical Assessment)
    # =========================================================================
    is_high = (
        # Bleeding duration 11–20 days
        (BLEEDING_SIGNIFICANT_MIN <= cycle_len <= BLEEDING_SIGNIFICANT_MAX)
        # Heavy menstrual bleeding
        or data.heavy_bleeding
        # Pad/tampon soaking every 1–2 hours
        or data.rapid_pad_saturation
        # Flooding/gushing bleeding
        or data.flooding_gushing
        # Vomiting + unable to keep fluids down / persistent vomiting
        or data.unable_to_keep_fluids
        or data.vomiting
        # Fever/chills + pelvic pain
        or (data.fever_chills and has_pelvic_pain)
        # Possible pregnancy + vaginal bleeding
        or (data.pregnancy_possible and has_vaginal_bleeding)
        # Possible pregnancy + pelvic pain
        or (data.pregnancy_possible and has_pelvic_pain)
        # Severe / sudden pelvic pain (without critical combination)
        or data.sudden_severe_pelvic_pain
        or data.severe_pain
        # One-sided pelvic pain
        or data.one_sided_pelvic_pain
        # Existing HIGH rules: multiple high red flags or elevated ML probability
        or (high_red_flags_count >= 2)
        or (pcos_probability >= HIGH_ML_PROBABILITY_THRESHOLD)
    )

    # =========================================================================
    # 3. MODERATE Triage Evaluation (Clinical Consultation Recommended)
    # =========================================================================
    is_moderate = (
        # Bleeding duration 8–10 days
        (BLEEDING_PROLONGED_MIN <= cycle_len <= BLEEDING_PROLONGED_MAX)
        # Bleeding between periods
        or data.bleeding_between_periods
        # Bleeding after sex
        or data.bleeding_after_sex
        # Large clots without severe bleeding/instability
        or data.large_blood_clots
        # Existing moderate rules: ML prediction == 1 or multiple androgenic features
        or (model_prediction == 1)
        or (data.cycle_type.lower() == "irregular" and androgenic_symptoms_count >= 2)
        or (cycle_len <= 1 and androgenic_symptoms_count >= 2)
        or (androgenic_symptoms_count >= 3)
    )

    # =========================================================================
    # Deterministic Precedence Application: CRITICAL > HIGH > MODERATE > LOW
    # =========================================================================
    if is_critical:
        overall_prediction = "CRITICAL"
        recommendation = "Urgent emergency medical evaluation is strongly recommended due to critical clinical safety indicators."

    elif is_high:
        overall_prediction = "HIGH"
        recommendation = "Prompt clinical assessment by a healthcare professional (such as a gynecologist or physician) is recommended."

    elif is_moderate:
        overall_prediction = "MODERATE"
        recommendation = "Clinical consultation is recommended to evaluate your symptoms and menstrual patterns."

    else:
        overall_prediction = "LOW"
        if data.cycle_type.lower() == "irregular" or cycle_len <= 1:
            recommendation = (
                "Monitor menstrual patterns and consider consulting a healthcare professional "
                "if this pattern persists or additional symptoms develop."
            )
        else:
            recommendation = (
                "No immediate high-risk safety patterns detected. Continue routine health monitoring "
                "and consult a doctor if symptoms change."
            )

    return {
        "overall_prediction": overall_prediction,
        "overall_reasons": overall_reasons,
        "red_flags": red_flags,
        "model_limitations": model_limitations,
        "recommendation": recommendation
    }
