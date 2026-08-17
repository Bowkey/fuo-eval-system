import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const auth = admin.auth();
const db = admin.database();

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

async function requireAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw { status: 401, message: "Missing authorization token." };
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const snap = await db.ref(`users/${decoded.uid}`).get();
    if (!snap.exists()) {
      throw { status: 403, message: "No profile found for this account." };
    }
    return { uid: decoded.uid, ...snap.val() };
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token." };
  }
}

function requireRole(user, ...roles) {
  if (!user || !roles.includes(user.role)) {
    throw { status: 403, message: "You do not have access to this resource." };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version,Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const user = await requireAuth(req);
    requireRole(user, "hod");

    const department = user.department;

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

    res.status(200).json({ department, generatedAt: Date.now(), courses: report });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || "Failed to generate report.";
    res.status(status).json({ error: message });
  }
}
