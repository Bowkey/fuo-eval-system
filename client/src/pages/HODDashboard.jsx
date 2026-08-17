import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ManageCourses from "./ManageCourses";
import ManageQuestions from "./ManageQuestions";
import { summarizeEvaluations } from "../utils/aggregate";
import { DEFAULT_QUESTIONS } from "../utils/questions";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses & lecturers" },
  { id: "questions", label: "Evaluation questions" },
];

export default function HODDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("overview");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab !== "overview") return;
    async function load() {
      setLoading(true);
      const [coursesSnap, usersSnap, qSnap] = await Promise.all([
        get(ref(db, "courses")),
        get(ref(db, "users")),
        get(ref(db, "evaluationQuestions")),
      ]);

      const qs = qSnap.exists()
        ? Object.entries(qSnap.val())
            .map(([id, q]) => ({ id, ...q }))
            .sort((a, b) => a.order - b.order)
        : DEFAULT_QUESTIONS;

      const allCourses = coursesSnap.exists() ? coursesSnap.val() : {};
      const allUsers = usersSnap.exists() ? usersSnap.val() : {};

      const deptCourses = Object.entries(allCourses).filter(
        ([, c]) => c.department === profile.department
      );

      // Evaluations are fetched one course at a time to match the security
      // rules, which only grant a HOD read access to evaluations for
      // courses in their own department.
      const computed = await Promise.all(
        deptCourses.map(async ([id, c]) => {
          const evalSnap = await get(ref(db, `evaluations/${id}`));
          const summary = summarizeEvaluations(evalSnap.val(), qs);
          const lecturerName = allUsers[c.lecturerId]?.name || "Unassigned";
          return { id, ...c, lecturerName, summary };
        })
      );

      computed.sort((a, b) => b.summary.overallAverage - a.summary.overallAverage);
      setRows(computed);
      setLoading(false);
    }
    load();
  }, [tab, profile]);

  const deptAverage =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.summary.overallAverage, 0) / rows.length
      : 0;
  const totalResponses = rows.reduce((s, r) => s + r.summary.responseCount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="label-eyebrow">{profile.department} · Head of Department</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
          Department evaluation reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          All figures are aggregated summaries. No individual student response is
          ever exposed here — only computed averages and anonymous comments.
        </p>

        <div className="mt-6 flex gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "border-navy-800 text-navy-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="card p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Department average
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-navy-800">
                    {deptAverage.toFixed(1)} <span className="text-base text-slate-400">/ 5</span>
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Courses tracked
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-navy-800">
                    {rows.length}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total responses
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-navy-800">
                    {totalResponses}
                  </p>
                </div>
              </div>

              <div className="card mt-6 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Lecturer</th>
                      <th className="px-4 py-3">Responses</th>
                      <th className="px-4 py-3">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          Loading…
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No courses in this department yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{r.code}</p>
                            <p className="text-xs text-slate-500">{r.title}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{r.lecturerName}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {r.summary.responseCount}
                          </td>
                          <td className="px-4 py-3 font-medium text-navy-800">
                            {r.summary.responseCount > 0
                              ? r.summary.overallAverage.toFixed(1)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "courses" && <ManageCourses />}
          {tab === "questions" && <ManageQuestions />}
        </div>
      </main>
    </div>
  );
}