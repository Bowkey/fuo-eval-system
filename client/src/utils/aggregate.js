// Aggregation helpers used by Lecturer and HOD dashboards.
// Individual evaluation responses are never exposed here — only computed summaries.

export function summarizeEvaluations(evaluationsObj, questions) {
  const entries = evaluationsObj ? Object.values(evaluationsObj) : [];
  const responseCount = entries.length;

  const totals = {};
  questions.forEach((q) => {
    totals[q.id] = 0;
  });

  let overallSum = 0;
  let overallCount = 0;

  entries.forEach((entry) => {
    const ratings = entry.ratings || {};
    let entrySum = 0;
    let entryN = 0;
    questions.forEach((q) => {
      const v = ratings[q.id];
      if (typeof v === "number") {
        totals[q.id] += v;
        entrySum += v;
        entryN += 1;
      }
    });
    if (entryN > 0) {
      overallSum += entrySum / entryN;
      overallCount += 1;
    }
  });

  const perQuestionAverage = {};
  questions.forEach((q) => {
    perQuestionAverage[q.id] = responseCount > 0 ? totals[q.id] / responseCount : 0;
  });

  const overallAverage = overallCount > 0 ? overallSum / overallCount : 0;

  const comments = entries
    .map((e) => e.comment)
    .filter((c) => c && c.trim().length > 0);

  return { responseCount, perQuestionAverage, overallAverage, comments };
}
