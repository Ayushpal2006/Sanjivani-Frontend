import unittest
from pydantic import ValidationError

from app.schemas import (
    PCOSPredictionRequest,
    PCOSPredictionResponse,
    HealthCheckResponse
)
from app.preprocessing import (
    preprocess_input,
    calculate_bmi,
    encode_cycle_type,
    EXPECTED_FEATURES
)
from app.prediction import predictor
from app.safety_rules import evaluate_safety_and_red_flags, evaluate_overall_triage
try:
    from app.main import predict, health_check, root
except ImportError:
    from main import predict, health_check, root


class TestSanjivaniPredictionService(unittest.TestCase):

    # ---------------- Preprocessing & Feature Tests ----------------

    def test_bmi_calculation(self):
        bmi = calculate_bmi(60.0, 165.0)
        expected = 60.0 / ((165.0 / 100.0) ** 2)
        self.assertAlmostEqual(bmi, expected, places=4)

    def test_cycle_encoding(self):
        self.assertEqual(encode_cycle_type("regular"), 2)
        self.assertEqual(encode_cycle_type("Regular"), 2)
        self.assertEqual(encode_cycle_type("irregular"), 4)
        self.assertEqual(encode_cycle_type("Irregular"), 4)
        with self.assertRaises(ValueError):
            encode_cycle_type("unknown")

    def test_feature_names_and_exact_order(self):
        req = PCOSPredictionRequest(
            age=25,
            weight=60.0,
            height=165.0,
            cycle_type="regular",
            cycle_length=5,
            weight_gain=False,
            hair_growth=False,
            skin_darkening=False,
            hair_loss=False,
            pimples=False,
            fast_food=False,
            regular_exercise=True,
            heavy_bleeding=False,
            severe_pain=False,
            blood_in_stool=False,
            vomiting=False
        )
        preprocessed = preprocess_input(req)
        features_df = preprocessed["features_df"]
        self.assertEqual(list(features_df.columns), EXPECTED_FEATURES)
        self.assertEqual(features_df['Cycle(R/I)'].iloc[0], 2)
        self.assertEqual(features_df['Cycle length(days)'].iloc[0], 5)

    # ---------------- ML Predictor Inference Tests ----------------

    def test_ml_predictor_inference(self):
        req = PCOSPredictionRequest(
            age=25,
            weight=60.0,
            height=165.0,
            cycle_type="regular",
            cycle_length=5,
            weight_gain=False,
            hair_growth=False,
            skin_darkening=False,
            hair_loss=False,
            pimples=False,
            fast_food=False,
            regular_exercise=True
        )
        preprocessed = preprocess_input(req)
        ml_res = predictor.predict(preprocessed["features_df"])
        self.assertIn("risk_probability", ml_res)
        self.assertIn("prediction", ml_res)
        self.assertIsInstance(ml_res["risk_probability"], float)
        self.assertIn(ml_res["prediction"], [0, 1])

    # ---------------- Endpoint & Status Tests ----------------

    def test_root_endpoint(self):
        res = root()
        self.assertEqual(res["service"], "Sanjivani ML Prediction API")
        self.assertEqual(res["status"], "online")

    def test_health_endpoint(self):
        res = health_check()
        self.assertIsInstance(res, HealthCheckResponse)
        self.assertEqual(res.status, "healthy")
        self.assertTrue(res.model_loaded)

    # ---------------- Safety Triage V2 Specific Deterministic Cases (Cases 1 - 15) ----------------

    def _base_req(self, **overrides):
        data = {
            "age": 25,
            "weight": 55.0,
            "height": 165.0,
            "cycle_type": "regular",
            "cycle_length": 5,
            "weight_gain": False,
            "hair_growth": False,
            "skin_darkening": False,
            "hair_loss": False,
            "pimples": False,
            "fast_food": False,
            "regular_exercise": True,
            "heavy_bleeding": False,
            "severe_pain": False,
            "blood_in_stool": False,
            "vomiting": False,
            "dizziness": False,
            "fainting": False,
            "shortness_of_breath": False,
            "rapid_pad_saturation": False,
            "flooding_gushing": False,
            "large_blood_clots": False,
            "pregnancy_possible": False,
            "sudden_severe_pelvic_pain": False,
            "one_sided_pelvic_pain": False,
            "shoulder_tip_pain": False,
            "fever_chills": False,
            "unable_to_keep_fluids": False,
            "bleeding_between_periods": False,
            "bleeding_after_sex": False
        }
        data.update(overrides)
        return PCOSPredictionRequest(**data)

    def test_case_1_bleeding_duration_6_days_no_escalation(self):
        """CASE 1: bleeding_duration_days = 6, no red flags -> LOW (no duration escalation)"""
        req = self._base_req(cycle_length=6)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "LOW")
        self.assertEqual(len(res.red_flags), 0)

    def test_case_2_bleeding_duration_9_days_moderate(self):
        """CASE 2: bleeding_duration_days = 9 -> at least MODERATE"""
        req = self._base_req(cycle_length=9)
        res = predict(req)
        self.assertIn(res.overall_prediction, ["MODERATE", "HIGH", "CRITICAL"])
        self.assertEqual(res.overall_prediction, "MODERATE")
        flag_cats = [rf.category for rf in res.red_flags]
        self.assertIn("bleeding_duration", flag_cats)

    def test_case_3_bleeding_duration_12_days_high_probability_unfaked(self):
        """CASE 3: bleeding_duration_days = 12 -> at least HIGH -> pcos_probability remains actual model value, NOT 1.0"""
        req = self._base_req(cycle_length=12)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "HIGH")
        # Probability must remain the legitimate ML model output (< 0.5 for this negative profile)
        self.assertNotEqual(res.pcos_probability, 1.0)
        self.assertLess(res.pcos_probability, 0.40)
        self.assertEqual(res.model_prediction, 0)

    def test_case_4_bleeding_duration_21_days_critical(self):
        """CASE 4: bleeding_duration_days = 21 -> CRITICAL"""
        req = self._base_req(cycle_length=21)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")
        crit_flags = [rf for rf in res.red_flags if rf.severity == "critical"]
        self.assertGreater(len(crit_flags), 0)

    def test_case_5_heavy_bleeding_alone_at_least_high(self):
        """CASE 5: heavy_bleeding = true -> at least HIGH"""
        req = self._base_req(heavy_bleeding=True)
        res = predict(req)
        self.assertIn(res.overall_prediction, ["HIGH", "CRITICAL"])
        self.assertEqual(res.overall_prediction, "HIGH")

    def test_case_6_heavy_bleeding_plus_fainting_critical(self):
        """CASE 6: heavy_bleeding = true + fainting = true -> CRITICAL"""
        req = self._base_req(heavy_bleeding=True, fainting=True)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")
        self.assertEqual(res.model_prediction, 0)
        self.assertLess(res.pcos_probability, 0.40)

    def test_case_7_rapid_pad_saturation_plus_shortness_of_breath_critical(self):
        """CASE 7: rapid_pad_saturation = true + shortness_of_breath = true -> CRITICAL"""
        req = self._base_req(rapid_pad_saturation=True, shortness_of_breath=True)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")

    def test_case_8_pregnancy_possible_plus_vaginal_bleeding_high(self):
        """CASE 8: pregnancy_possible = true + vaginal bleeding = true -> at least HIGH"""
        req = self._base_req(pregnancy_possible=True, bleeding_between_periods=True)
        res = predict(req)
        self.assertIn(res.overall_prediction, ["HIGH", "CRITICAL"])
        self.assertEqual(res.overall_prediction, "HIGH")

    def test_case_9_pregnancy_possible_plus_bleeding_plus_one_sided_pain_critical(self):
        """CASE 9: pregnancy_possible = true + vaginal bleeding = true + one_sided_pelvic_pain = true -> CRITICAL"""
        req = self._base_req(
            pregnancy_possible=True,
            heavy_bleeding=True,
            one_sided_pelvic_pain=True
        )
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")

    def test_case_10_pregnancy_possible_plus_shoulder_tip_pain_critical(self):
        """CASE 10: pregnancy_possible = true + shoulder_tip_pain = true -> CRITICAL"""
        req = self._base_req(pregnancy_possible=True, shoulder_tip_pain=True)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")

    def test_case_11_fever_chills_plus_pelvic_pain_high(self):
        """CASE 11: fever_chills = true + pelvic pain = true -> HIGH"""
        req = self._base_req(fever_chills=True, severe_pain=True)
        res = predict(req)
        self.assertIn(res.overall_prediction, ["HIGH", "CRITICAL"])
        self.assertEqual(res.overall_prediction, "HIGH")

    def test_case_12_unable_to_keep_fluids_high(self):
        """CASE 12: unable_to_keep_fluids = true -> HIGH"""
        req = self._base_req(unable_to_keep_fluids=True)
        res = predict(req)
        self.assertEqual(res.overall_prediction, "HIGH")

    def test_case_13_low_ml_probability_with_critical_safety_remains_unfaked(self):
        """CASE 13: model probability = low, but CRITICAL safety rule triggers -> probability remains unchanged, overall_prediction = CRITICAL"""
        req = self._base_req(
            flooding_gushing=True,
            dizziness=True
        )
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")
        self.assertEqual(res.model_prediction, 0)
        self.assertLess(res.pcos_probability, 0.40)
        self.assertNotEqual(res.pcos_probability, 1.0)

    def test_case_14_high_ml_probability_no_safety_red_flags_preserved(self):
        """CASE 14: model probability = high, but no safety red flags -> preserve existing model-driven triage behavior"""
        req = self._base_req(
            age=28,
            weight=85.0,
            height=152.0,
            cycle_type="irregular",
            cycle_length=6,
            weight_gain=True,
            hair_growth=True,
            skin_darkening=True,
            hair_loss=True,
            pimples=True,
            fast_food=True,
            regular_exercise=False
        )
        res = predict(req)
        self.assertEqual(res.model_prediction, 1)
        self.assertGreater(res.pcos_probability, 0.40)
        self.assertIn(res.overall_prediction, ["HIGH", "MODERATE"])

    def test_case_15_critical_plus_lower_rules_critical_remains_critical(self):
        """CASE 15: CRITICAL condition plus other lower rules -> CRITICAL remains CRITICAL"""
        req = self._base_req(
            cycle_length=22,           # CRITICAL
            bleeding_between_periods=True, # MODERATE
            large_blood_clots=True,        # MODERATE
            heavy_bleeding=True            # HIGH
        )
        res = predict(req)
        self.assertEqual(res.overall_prediction, "CRITICAL")

    def test_case_moderate_bleeding_after_sex_and_between_periods(self):
        """Additional MODERATE rule verification for postcoital / intermenstrual bleeding"""
        req1 = self._base_req(bleeding_between_periods=True)
        res1 = predict(req1)
        self.assertEqual(res1.overall_prediction, "MODERATE")

        req2 = self._base_req(bleeding_after_sex=True)
        res2 = predict(req2)
        self.assertEqual(res2.overall_prediction, "MODERATE")

        req3 = self._base_req(large_blood_clots=True)
        res3 = predict(req3)
        self.assertEqual(res3.overall_prediction, "MODERATE")

    def test_no_model_text_in_reasons(self):
        """Verify that overall_reasons does not contain algorithmic text like 'ML model detected'"""
        req = self._base_req(heavy_bleeding=True, cycle_length=9)
        res = predict(req)
        for reason in res.overall_reasons:
            self.assertNotIn("ML model", reason)
            self.assertNotIn("probability:", reason)
            self.assertNotIn("model predicted", reason.lower())


if __name__ == "__main__":
    unittest.main()
