import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function StudentDashboard() {
  const { currentUser, profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [done, setDone] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [coursesSnap, usersSnap, recordsSnap] = await Promise.all([
        get(ref(db, "courses")),
        get(ref(db, "users")),
        get(ref(db, `evalRecords/${currentUser.uid}`)),
      ]);

      const allCourses = coursesSnap.exists() ? coursesSnap.val() : {};
      const myCourses = Object.entries(allCourses)
        .filter(
          ([, c]) =>
            c.department === profile.department &&
            String(c.level) === String(profile.level)
        )
        .map(([id, c]) => ({ id, ...c }));

      const allUsers = usersSnap.exists() ? usersSnap.val() : {};
      const lecturerMap = {};
      Object.entries(allUsers).forEach(([uid, u]) => {
        if (u.role === "lecturer") lecturerMap[uid] = u.name;
      });

      setCourses(myCourses);
      setLecturers(lecturerMap);
      setDone(recordsSnap.exists() ? recordsSnap.val() : {});
      setLoading(false);
    }
    load();
  }, [currentUser, profile]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="label-eyebrow">{profile.department} · {profile.level} Level</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
          Your courses this semester
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Ratings and comments are submitted without any link to your identity.
          Once you submit an evaluation for a course, it cannot be traced back to you.
        </p>

        {loading ? (
          <p className="mt-10 text-slate-400">Loading your courses…</p>
        ) : courses.length === 0 ? (
          <div className="card mt-8 p-8 text-center text-slate-500">
            No courses have been allocated to your department and level yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {courses.map((c) => {
              const isDone = !!done[c.id];
              return (
                <div key={c.id} className="card flex flex-col justify-between p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">
                      {c.code}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {c.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Lecturer: {lecturers[c.lecturerId] || "Unassigned"}
                    </p>
                  </div>
                  <div className="mt-5">
                    {isDone ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Evaluation submitted
                      </span>
                    ) : (
                      <Link to={`/evaluate/${c.id}`} className="btn-gold w-full">
                        Evaluate this course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
