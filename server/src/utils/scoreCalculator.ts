export function calculateMasteryScore(params: {
  quizAccuracies: number[]; // percentage accuracy 0-100 per quiz
  flashcardConfidences: number[]; // scale 1-5 ratings
}): number {
  if (params.quizAccuracies.length === 0 && params.flashcardConfidences.length === 0) {
    return 0;
  }

  const avgQuizAccuracy =
    params.quizAccuracies.length > 0
      ? params.quizAccuracies.reduce((a, b) => a + b, 0) / params.quizAccuracies.length
      : 0;

  const avgFlashcardScore =
    params.flashcardConfidences.length > 0
      ? (params.flashcardConfidences.reduce((a, b) => a + b, 0) /
          (params.flashcardConfidences.length * 5)) *
        100
      : 0;

  if (params.quizAccuracies.length > 0 && params.flashcardConfidences.length > 0) {
    return Math.round(avgQuizAccuracy * 0.7 + avgFlashcardScore * 0.3);
  } else if (params.quizAccuracies.length > 0) {
    return Math.round(avgQuizAccuracy);
  } else {
    return Math.round(avgFlashcardScore);
  }
}
