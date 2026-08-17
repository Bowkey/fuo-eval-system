import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { summarizeEvaluations } from "../utils/aggregate";
import { DEFAULT_QUESTIONS } from "../utils/questions";

export default function LecturerDashboard() {
  const { currentUser, profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [coursesSnap, qSnap] = await Promise.all([
        get(ref(db, "courses")),
        get(ref(db, "evaluationQuestions")),
      ]);

      const qs = qSnap.exists()
        ? Object.entries(qSnap.val())
            .map(([id, q]) => ({ id, ...q }))
            .sort((a, b) => a.order - b.order)
        : DEFAULT_QUESTIONS;
      setQuestions(qs);

      const allCourses = coursesSnap.exists() ? coursesSnap.val() : {};
      const myCourses = Object.entries(allCourses).filter(
        ([, c]) => c.lecturerId === currentUser.uid
      );

      // Evaluations are fetched one course at a time: the security rules
      // only grant read access to a course's evaluations to that course's
      // own lecturer (or their HOD), so a single whole-node read isn't
      // permitted — and this way a lecturer can never see another
      // lecturer's data even by accident.
      const computed = await Promise.all(
        myCourses.map(async ([id, c]) => {
          const evalSnap = await get(ref(db, `evaluations/${id}`));
          const summary = summarizeEvaluations(evalSnap.val(), qs);
          return { id, ...c, summary };
        })
      );

      setRows(computed);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="label-eyebrow">{profile.department}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
          Your evaluation summary
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Figures below are aggregated across all responses. Individual student
          submissions are never shown or stored with any identifying information.
        </p>

        {loading ? (
          <p className="mt-10 text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card mt-8 p-8 text-center text-slate-500">
            No courses are currently assigned to you.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {rows.map((c) => (
              <div key={c.id} className="card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">
                      {c.code}
                    </p>
                    <h2 className="font-display text-lg font-semibold text-slate-900">
                      {c.title}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-semibold text-navy-800">
                      {c.summary.overallAverage.toFixed(1)}
                      <span className="text-sm text-slate-400"> / 5</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.summary.responseCount} response
                      {c.summary.responseCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {c.summary.responseCount > 0 && (
                  <div className="mt-5 space-y-2">
                    {questions.map((q) => (
                      <div key={q.id} className="flex items-center gap-3">
                        <span className="w-64 shrink-0 text-sm text-slate-600">
                          {q.text}
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-gold-500"
                            style={{
                              width: `${(c.summary.perQuestionAverage[q.id] / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-medium text-slate-700">
                          {c.summary.perQuestionAverage[q.id].toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {c.summary.comments.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Anonymous comments
                    </p>
                    <ul className="space-y-2">
                      {c.summary.comments.map((cm, i) => (
                        <li
                          key={i}
                          className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600"
                        >
                          “{cm}”
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}