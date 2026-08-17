import React, { useEffect, useState } from "react";
import { ref, get, push, set, remove } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ManageCourses() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [form, setForm] = useState({ code: "", title: "", level: "100", lecturerId: "" });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const [coursesSnap, usersSnap] = await Promise.all([
      get(ref(db, "courses")),
      get(ref(db, "users")),
    ]);

    const allCourses = coursesSnap.exists() ? coursesSnap.val() : {};
    const deptCourses = Object.entries(allCourses)
      .filter(([, c]) => c.department === profile.department)
      .map(([id, c]) => ({ id, ...c }));
    setCourses(deptCourses);

    const allUsers = usersSnap.exists() ? usersSnap.val() : {};
    const deptLecturers = Object.entries(allUsers)
      .filter(([, u]) => u.role === "lecturer" && u.department === profile.department)
      .map(([id, u]) => ({ id, ...u }));
    setLecturers(deptLecturers);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.code || !form.title || !form.lecturerId) return;
    setSaving(true);
    const courseRef = push(ref(db, "courses"));
    await set(courseRef, {
      code: form.code.toUpperCase(),
      title: form.title,
      department: profile.department,
      level: form.level,
      lecturerId: form.lecturerId,
    });
    setForm({ code: "", title: "", level: "100", lecturerId: "" });
    setSaving(false);
    loadAll();
  }

  async function handleDelete(id) {
    if (!confirm("Remove this course? Existing evaluations for it will be kept but orphaned.")) return;
    await remove(ref(db, `courses/${id}`));
    loadAll();
  }

  return (
    <div>
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Add a course
        </h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="input-field"
            placeholder="Course code, e.g. CSC301"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Course title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            {["100", "200", "300", "400", "500"].map((lv) => (
              <option key={lv} value={lv}>
                {lv} Level
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={form.lecturerId}
            onChange={(e) => setForm((f) => ({ ...f, lecturerId: e.target.value }))}
          >
            <option value="">Assign a lecturer…</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">
            {saving ? "Adding…" : "Add course"}
          </button>
        </form>
        {lecturers.length === 0 && (
          <p className="mt-3 text-xs text-amber-600">
            No lecturers are registered in {profile.department} yet — ask a lecturer to
            register before assigning courses.
          </p>
        )}
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{c.code}</td>
                <td className="px-4 py-3 text-slate-600">{c.title}</td>
                <td className="px-4 py-3 text-slate-600">{c.level}</td>
                <td className="px-4 py-3 text-slate-600">
                  {lecturers.find((l) => l.id === c.lecturerId)?.name || "Unassigned"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No courses added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
