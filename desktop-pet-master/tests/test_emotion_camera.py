import unittest

import numpy as np

from moodpet.emotion_camera import output_to_scores


class EmotionCameraTest(unittest.TestCase):
    def test_output_to_scores_returns_normalized_ferplus_labels(self):
        scores = output_to_scores(np.array([[0, 1, 2, 3, 4, 5, 6, 7]], dtype="float32"))

        self.assertIn("neutral", scores)
        self.assertIn("contempt", scores)
        self.assertAlmostEqual(sum(scores.values()), 1.0, places=5)
        self.assertGreater(scores["contempt"], scores["neutral"])


if __name__ == "__main__":
    unittest.main()
