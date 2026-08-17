import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StarRating from "../components/StarRating";
import { DEFAULT_QUESTIONS } from "../utils/questions";

export default function FeedbackForm() {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [courseSnap, qSnap, recordSnap] = await Promise.all([
        get(ref(db, `courses/${courseId}`)),
        get(ref(db, "evaluationQuestions")),
        get(ref(db, `evalRecords/${currentUser.uid}/${courseId}`)),
      ]);

      setCourse(courseSnap.exists() ? courseSnap.val() : null);

      const qs = qSnap.exists()
        ? Object.entries(qSnap.val())
            .map(([id, q]) => ({ id, ...q }))
            .sort((a, b) => a.order - b.order)
        : DEFAULT_QUESTIONS;
      setQuestions(qs);

      const initial = {};
      qs.forEach((q) => (initial[q.id] = 0));
      setRatings(initial);

      setAlreadyDone(recordSnap.exists() && recordSnap.val() === true);
      setLoading(false);
    }
    load();
  }, [courseId, currentUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const unrated = questions.filter((q) => !ratings[q.id]);
    if (unrated.length > 0) {
      setError("Please rate every question before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // Evaluation payload intentionally contains no student identifier.
      const evalRef = push(ref(db, `evaluations/${courseId}`));
      await set(evalRef, {
        ratings,
        comment: comment.trim(),
        timestamp: Date.now(),
      });
      // Separately record (per-student) that this course was evaluated,
      // purely to block duplicate submissions — never joined with the
      // evaluation content above.
      await set(ref(db, `evalRecords/${currentUser.uid}/${courseId}`), true);

      navigate("/", { replace: true });
    } catch (err) {
      setError("Something went wrong submitting your evaluation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <p className="mx-auto max-w-3xl px-6 py-10 text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-slate-500">This course could not be found.</p>
          <Link to="/" className="mt-4 inline-block text-navy-700 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="card p-8 text-center">
            <p className="text-slate-700">
              You have already submitted an evaluation for <strong>{course.title}</strong>.
            </p>
            <Link to="/" className="btn-primary mt-6 inline-flex">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="label-eyebrow">{course.code}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
          Evaluate {course.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your response is anonymous. Rate each statement from 1 (strongly disagree) to 5 (strongly agree).
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="card mt-6 divide-y divide-slate-100 p-6">
          {questions.map((q) => (
            <StarRating
              key={q.id}
              label={q.text}
              value={ratings[q.id] || 0}
              onChange={(v) => setRatings((r) => ({ ...r, [q.id]: v }))}
            />
          ))}

          <div className="pt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Additional comments (optional)
            </label>
            <textarea
              className="input-field min-h-[100px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share any constructive feedback…"
            />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={submitting} className="btn-gold w-full">
              {submitting ? "Submitting…" : "Submit anonymous evaluation"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
