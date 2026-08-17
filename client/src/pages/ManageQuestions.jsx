import React, { useEffect, useState } from "react";
import { ref, get, set, push, remove } from "firebase/database";
import { db } from "../firebase";
import { DEFAULT_QUESTIONS } from "../utils/questions";

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(true);

  async function load() {
    const snap = await get(ref(db, "evaluationQuestions"));
    if (snap.exists()) {
      const qs = Object.entries(snap.val())
        .map(([id, q]) => ({ id, ...q }))
        .sort((a, b) => a.order - b.order);
      setQuestions(qs);
      setSeeded(true);
    } else {
      setQuestions(DEFAULT_QUESTIONS);
      setSeeded(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function ensureSeeded() {
    if (seeded) return;
    const updates = {};
    DEFAULT_QUESTIONS.forEach((q) => {
      updates[q.id] = { text: q.text, order: q.order };
    });
    await set(ref(db, "evaluationQuestions"), updates);
    setSeeded(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    setSaving(true);
    await ensureSeeded();
    const qRef = push(ref(db, "evaluationQuestions"));
    await set(qRef, { text: newText.trim(), order: questions.length + 1 });
    setNewText("");
    setSaving(false);
    load();
  }

  async function handleRemove(id) {
    if (!confirm("Remove this question from the evaluation form?")) return;
    await ensureSeeded();
    await remove(ref(db, `evaluationQuestions/${id}`));
    load();
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-semibold text-slate-900">
        Evaluation questions
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        These statements appear on every student's evaluation form, rated 1–5.
      </p>

      <ul className="mt-5 divide-y divide-slate-100">
        {questions.map((q, i) => (
          <li key={q.id} className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-700">
              <span className="mr-2 text-slate-400">{i + 1}.</span>
              {q.text}
            </span>
            <button
              onClick={() => handleRemove(q.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-5 flex gap-2">
        <input
          className="input-field"
          placeholder="Add a new evaluation statement…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button type="submit" disabled={saving} className="btn-primary shrink-0">
          {saving ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
