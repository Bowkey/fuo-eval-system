import { Router } from "express";
import { db } from "../config/firebaseAdmin.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function summarize(evaluationsObj, questionIds) {
  const entries = evaluationsObj ? Object.values(evaluationsObj) : [];
  const responseCount = entries.length;
  const totals = {};
  questionIds.forEach((id) => (totals[id] = 0));

  let overallSum = 0;
  let overallCount = 0;

  entries.forEach((entry) => {
    const ratings = entry.ratings || {};
    let entrySum = 0;
    let entryN = 0;
    questionIds.forEach((id) => {
      const v = ratings[id];
      if (typeof v === "number") {
        totals[id] += v;
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
  questionIds.forEach((id) => {
    perQuestionAverage[id] = responseCount > 0 ? totals[id] / responseCount : 0;
  });

  return {
    responseCount,
    perQuestionAverage,
    overallAverage: overallCount > 0 ? overallSum / overallCount : 0,
  };
}

// GET /api/reports/department
// Returns an aggregated, anonymized evaluation report for the calling
// HOD's own department. Individual student responses are never returned —
// only per-course averages and response counts, computed server-side.
router.get("/department", requireAuth, requireRole("hod"), async (req, res) => {
  try {
    const department = req.user.department;

    const [coursesSnap, usersSnap, questionsSnap, evaluationsSnap] = await Promise.all([
      db.ref("courses").get(),
      db.ref("users").get(),
      db.ref("evaluationQuestions").get(),
      db.ref("evaluations").get(),
    ]);

    const allCourses = coursesSnap.val() || {};
    const allUsers = usersSnap.val() || {};
    const allEvaluations = evaluationsSnap.val() || {};
    const questionIds = questionsSnap.exists()
      ? Object.keys(questionsSnap.val())
      : ["clarity", "punctuality", "engagement", "materials", "fairness", "overall"];

    const report = Object.entries(allCourses)
      .filter(([, c]) => c.department === department)
      .map(([courseId, c]) => ({
        courseId,
        code: c.code,
        title: c.title,
        level: c.level,
        lecturer: allUsers[c.lecturerId]?.name || "Unassigned",
        ...summarize(allEvaluations[courseId], questionIds),
      }));

    res.json({ department, generatedAt: Date.now(), courses: report });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report." });
  }
});

export default router;
