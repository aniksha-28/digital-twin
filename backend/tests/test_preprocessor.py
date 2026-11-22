"""
Test Preprocessor and Dataset Integrity
"""

import os
import unittest
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed", "shm_cleaned_features.csv")
METADATA_JSON = os.path.join(BASE_DIR, "data", "processed", "feature_metadata.json")

class TestPreprocessor(unittest.TestCase):
    def test_processed_dataset_exists(self):
        self.assertTrue(os.path.exists(PROCESSED_CSV), "Cleaned features CSV should exist")

    def test_metadata_exists(self):
        self.assertTrue(os.path.exists(METADATA_JSON), "Metadata JSON should exist")

    def test_dataset_columns_and_rows(self):
        df = pd.read_csv(PROCESSED_CSV)
        self.assertGreater(len(df), 500, "Dataset should have > 500 records")
        expected_cols = [
            'timestamp', 'vibration_deck_mid_ms2', 'strain_cable_mid_ue',
            'tilt_pier_a_deg', 'temp_deck_asphalt_c', 'humidity_ambient_pct',
            'scenario'
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns, f"Column {col} missing from processed dataset")

    def test_no_null_critical_features(self):
        df = pd.read_csv(PROCESSED_CSV)
        self.assertEqual(df['vibration_deck_mid_ms2'].isnull().sum(), 0)
        self.assertEqual(df['strain_cable_mid_ue'].isnull().sum(), 0)
        self.assertEqual(df['tilt_pier_a_deg'].isnull().sum(), 0)

    def test_metadata_attributes(self):
        with open(METADATA_JSON, 'r') as f:
            meta = json.load(f)
        self.assertEqual(meta['zenodo_record_id'], "20443860")
        self.assertIn("vibration_deck_mid_ms2", meta['features'])
        self.assertFalse(meta['features']['humidity_ambient_pct']['is_real'])

if __name__ == '__main__':
    unittest.main()
