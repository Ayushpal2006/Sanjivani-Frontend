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

    # ---------------- Endpoint & Scenario Tests ----------------

    def test_root_endpoint(self):
        res = root()
        self.assertEqual(res["service"], "Sanjivani ML Prediction API")
        self.assertEqual(res["status"], "online")

    def test_health_endpoint(self):
        res = health_check()
        self.assertIsInstance(res, HealthCheckResponse)
        self.assertEqual(res.status, "healthy")
        self.assertTrue(res.model_loaded)

    def test_scenario_1_normal_low_risk_input(self):
        req = PCOSPredictionRequest(
            age=25,
            weight=55.0,
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
        response = predict(req)
        self.assertIsInstance(response, PCOSPredictionResponse)
        self.assertEqual(response.model_prediction, 0)
        self.assertEqual(response.model_prediction_label, "Lower PCOS-related risk")
        self.assertEqual(response.overall_prediction, "LOW")
        self.assertEqual(response.triage_level, "low")
        self.assertEqual(len(response.red_flags), 0)
        self.assertEqual(len(response.model_limitations), 0)

    def test_scenario_2_high_ml_risk_input(self):
        req = PCOSPredictionRequest(
            age=28,
            weight=82.0,
            height=155.0,
            cycle_type="irregular",
            cycle_length=6,
            weight_gain=True,
            hair_growth=True,
            skin_darkening=True,
            hair_loss=True,
            pimples=True,
            fast_food=True,
            regular_exercise=False,
            heavy_bleeding=False,
            severe_pain=False,
            blood_in_stool=False,
            vomiting=False
        )
        response = predict(req)
        self.assertIsInstance(response, PCOSPredictionResponse)
        self.assertEqual(response.model_prediction, 1)
        self.assertEqual(response.model_prediction_label, "Higher PCOS-related risk")
        self.assertGreater(response.pcos_probability, 0.40)
        self.assertIn(response.overall_prediction, ["HIGH", "MODERATE"])

    def test_scenario_3_severe_pain_overrides_triage(self):
        # Low ML probability input, but severe pain present
        req = PCOSPredictionRequest(
            age=25,
            weight=55.0,
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
            severe_pain=True,
            blood_in_stool=False,
            vomiting=False
        )
        response = predict(req)
        # ML model prediction remains 0 (separate)
        self.assertEqual(response.model_prediction, 0)
        # Overall triage escalates to HIGH due to severe pain safety red flag
        self.assertEqual(response.overall_prediction, "HIGH")
        pain_flags = [rf for rf in response.red_flags if rf.category == "pain"]
        self.assertEqual(len(pain_flags), 1)

    def test_scenario_4_heavy_bleeding_isolated_and_combined(self):
        # Isolated heavy bleeding on normal profile
        req_isolated = PCOSPredictionRequest(
            age=25,
            weight=55.0,
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
            heavy_bleeding=True,
            severe_pain=False,
            blood_in_stool=False,
            vomiting=False
        )
        response_iso = predict(req_isolated)
        self.assertEqual(response_iso.overall_prediction, "MODERATE")
        bleeding_flags = [rf for rf in response_iso.red_flags if rf.category == "bleeding"]
        self.assertEqual(len(bleeding_flags), 1)

        # Combined heavy bleeding with irregular cycle -> HIGH
        req_combined = PCOSPredictionRequest(
            age=25,
            weight=55.0,
            height=165.0,
            cycle_type="irregular",
            cycle_length=5,
            weight_gain=False,
            hair_growth=False,
            skin_darkening=False,
            hair_loss=False,
            pimples=False,
            fast_food=False,
            regular_exercise=True,
            heavy_bleeding=True,
            severe_pain=False,
            blood_in_stool=False,
            vomiting=False
        )
        response_comb = predict(req_combined)
        self.assertEqual(response_comb.overall_prediction, "HIGH")

    def test_scenario_5_multiple_red_flags_and_critical_gi(self):
        # Non-PCOS critical red flag: blood in stool
        req = PCOSPredictionRequest(
            age=25,
            weight=55.0,
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
            blood_in_stool=True,
            vomiting=False
        )
        response = predict(req)
        self.assertEqual(response.model_prediction, 0)
        self.assertEqual(response.overall_prediction, "CRITICAL")
        gi_flags = [rf for rf in response.red_flags if rf.category == "gastrointestinal"]
        self.assertEqual(len(gi_flags), 1)
        self.assertEqual(gi_flags[0].severity, "critical")

    def test_scenario_6_input_outside_training_range(self):
        # Bleeding duration = 18 days (outside 0-12 training range)
        req = PCOSPredictionRequest(
            age=25,
            weight=55.0,
            height=165.0,
            cycle_type="regular",
            cycle_length=18,
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
        response = predict(req)
        self.assertEqual(response.overall_prediction, "HIGH")
        self.assertGreater(len(response.model_limitations), 0)
        self.assertIn("18 days", response.model_limitations[0])

        # Bleeding duration = 30 days (extreme -> CRITICAL)
        req_extreme = PCOSPredictionRequest(
            age=25,
            weight=55.0,
            height=165.0,
            cycle_type="regular",
            cycle_length=30,
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
        response_ext = predict(req_extreme)
        self.assertEqual(response_ext.overall_prediction, "CRITICAL")
        self.assertGreater(len(response_ext.model_limitations), 0)

    def test_scenario_7_invalid_input_validation_errors(self):
        # Invalid cycle_type
        with self.assertRaises(ValidationError):
            PCOSPredictionRequest(
                age=25,
                weight=60.0,
                height=165.0,
                cycle_type="unknown_type",
                cycle_length=5,
                weight_gain=False,
                hair_growth=False,
                skin_darkening=False,
                hair_loss=False,
                pimples=False,
                fast_food=False,
                regular_exercise=True
            )

        # Invalid age (< 10)
        with self.assertRaises(ValidationError):
            PCOSPredictionRequest(
                age=5,
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

        # Negative weight
        with self.assertRaises(ValidationError):
            PCOSPredictionRequest(
                age=25,
                weight=-10.0,
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


if __name__ == "__main__":
    unittest.main()
