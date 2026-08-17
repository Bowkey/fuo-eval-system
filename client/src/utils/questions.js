// Default evaluation metrics used until a HOD customizes the question bank
// in the "Manage Questions" panel. Stored/read from evaluationQuestions/ in
// the database once customized, keyed by id so historical data stays valid.

export const DEFAULT_QUESTIONS = [
  { id: "clarity", text: "Explains course content clearly", order: 1 },
  { id: "punctuality", text: "Punctual and consistent with class schedule", order: 2 },
  { id: "engagement", text: "Encourages questions and student participation", order: 3 },
  { id: "materials", text: "Provides useful, up-to-date course materials", order: 4 },
  { id: "fairness", text: "Grades and assesses students fairly", order: 5 },
  { id: "overall", text: "Overall teaching effectiveness", order: 6 },
];
