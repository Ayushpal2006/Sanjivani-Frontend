from typing import Dict, Any, List, Optional
from app.schemas import PCOSPredictionRequest, RedFlagItem

# Centralized threshold constants
BLEEDING_NORMAL_MIN = 2
BLEEDING_NORMAL_MAX = 7
BLEEDING_PROLONGED_MIN = 8
BLEEDING_PROLONGED_MAX = 12
BLEEDING_SIGNIFICANT_MIN = 13
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
    Evaluates acute safety red flags and out-of-distribution training range limitations.
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
        clinical_reasons.append(f"Prolonged bleeding duration detected ({cycle_len} days).")

    elif BLEEDING_SIGNIFICANT_MIN <= cycle_len <= BLEEDING_SIGNIFICANT_MAX:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding_duration",
            message=f"Significantly prolonged bleeding duration detected ({cycle_len} days)."
        ))
        clinical_reasons.append(f"Significantly prolonged bleeding duration ({cycle_len} days, outside ML training range).")
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
        clinical_reasons.append(f"Extremely prolonged bleeding duration detected ({cycle_len} days).")
        limitation_msg = (
            f"The cycle length value ({cycle_len} days) is significantly outside the ML model training range "
            f"({TRAINING_CYCLE_LENGTH_MIN}–{TRAINING_CYCLE_LENGTH_MAX} days). "
            f"The ML probability was calculated using a capped value ({TRAINING_CYCLE_LENGTH_MAX} days) and should not be used as a primary diagnostic indicator."
        )
        if not any(f"{cycle_len} days" in lim and "outside" in lim for lim in model_limitations):
            model_limitations.append(limitation_msg)

    # 2. Acute General & Clinical Red Flags (treated as clinical safety concerns, not PCOS symptoms)
    if data.heavy_bleeding:
        red_flags.append(RedFlagItem(
            severity="high",
            category="bleeding",
            message="Heavy menstrual bleeding reported."
        ))
        clinical_reasons.append("Heavy menstrual bleeding reported.")

    if data.severe_pain:
        red_flags.append(RedFlagItem(
            severity="high",
            category="pain",
            message="Severe pelvic or abdominal pain reported."
        ))
        clinical_reasons.append("Severe pelvic or abdominal pain reported.")

    if data.blood_in_stool:
        red_flags.append(RedFlagItem(
            severity="critical",
            category="gastrointestinal",
            message="Blood in stool observed — this is a serious general clinical red flag requiring urgent medical evaluation."
        ))
        clinical_reasons.append("Blood observed in stool (general non-PCOS clinical red flag).")

    if data.vomiting:
        red_flags.append(RedFlagItem(
            severity="high",
            category="gastrointestinal",
            message="Persistent nausea or vomiting reported — evaluated as an acute general symptom."
        ))
        clinical_reasons.append("Persistent nausea or vomiting reported.")

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
    Integrates ML model probability with deterministic clinical safety rules,
    symptom pattern evaluation, and bleeding duration checks to determine
    the overall triage level (LOW, MODERATE, HIGH, CRITICAL).
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

    # Add ML Context to Explanations
    if model_prediction == 1:
        overall_reasons.append(f"ML model detected elevated PCOS-related risk (probability: {pcos_probability:.1%}).")
    else:
        overall_reasons.append(f"ML model detected lower PCOS-related probability (probability: {pcos_probability:.1%}).")

    # Deterministic Triage Priority Evaluation
    high_red_flags_count = sum(1 for rf in red_flags if rf.severity in ("high", "critical"))

    # --- CRITICAL Triage ---
    if (
        cycle_len >= BLEEDING_EXTREME_MIN
        or data.blood_in_stool
        or (data.severe_pain and (data.heavy_bleeding or data.vomiting or cycle_len >= BLEEDING_SIGNIFICANT_MIN))
    ):
        overall_prediction = "CRITICAL"
        recommendation = "Immediate medical evaluation is strongly advised due to critical clinical symptoms or extreme bleeding duration."

    # --- HIGH Triage ---
    elif (
        cycle_len >= BLEEDING_SIGNIFICANT_MIN
        or data.severe_pain
        or data.vomiting
        or (data.heavy_bleeding and (model_prediction == 1 or cycle_len >= BLEEDING_PROLONGED_MIN or data.cycle_type.lower() == "irregular"))
        or high_red_flags_count >= 2
        or pcos_probability >= HIGH_ML_PROBABILITY_THRESHOLD
    ):
        overall_prediction = "HIGH"
        recommendation = "Prompt consultation with a healthcare professional (such as a gynecologist or endocrinologist) is recommended."

    # --- MODERATE Triage ---
    elif (
        model_prediction == 1
        or (BLEEDING_PROLONGED_MIN <= cycle_len <= BLEEDING_PROLONGED_MAX)
        or data.heavy_bleeding
        or (data.cycle_type.lower() == "irregular" and androgenic_symptoms_count >= 2)
        or (cycle_len <= 1 and androgenic_symptoms_count >= 2)
        or androgenic_symptoms_count >= 3
    ):
        overall_prediction = "MODERATE"
        recommendation = "Consider scheduling a clinical consultation to evaluate your symptoms and menstrual patterns."

    # --- LOW Triage ---
    else:
        overall_prediction = "LOW"
        if data.cycle_type.lower() == "irregular" or cycle_len <= 1:
            recommendation = (
                "Monitor menstrual patterns and consider consulting a healthcare professional "
                "if this pattern persists or additional symptoms develop."
            )
        else:
            recommendation = (
                "No immediate high-risk patterns detected. Continue routine health monitoring "
                "and consult a doctor if symptoms change."
            )

    return {
        "overall_prediction": overall_prediction,
        "overall_reasons": overall_reasons,
        "red_flags": red_flags,
        "model_limitations": model_limitations,
        "recommendation": recommendation
    }
