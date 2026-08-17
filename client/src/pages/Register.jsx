import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MATRIC_REGEX = /^[A-Za-z]{2,4}\/\d{2,4}\/\d{3,5}$/; // e.g. CSC/2021/0142
const STAFF_REGEX = /^[A-Za-z]{2,5}\/STF\/\d{3,5}$/i; // e.g. FUO/STF/0089

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("100");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (role === "student" && !MATRIC_REGEX.test(identifier.trim())) {
      setError("Enter a valid matriculation number, e.g. CSC/2021/0142.");
      return;
    }
    if (role !== "student" && !STAFF_REGEX.test(identifier.trim())) {
      setError("Enter a valid staff ID, e.g. FUO/STF/0089.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await register({
        email,
        password,
        role,
        name,
        identifier: identifier.trim().toUpperCase(),
        department,
        level: role === "student" ? level : null,
      });
      navigate("/");
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : "Registration failed. Please check your details and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="label-eyebrow">Federal University of Otuoke</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white">
            Create your account
          </h1>
        </div>
        <div className="card p-8">
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["student", "lecturer", "hod"].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-md border px-2 py-2 text-sm font-medium capitalize transition ${
                      role === r
                        ? "border-navy-700 bg-navy-800 text-white"
                        : "border-slate-300 text-slate-600 hover:border-navy-400"
                    }`}
                  >
                    {r === "hod" ? "HOD" : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                required
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {role === "student" ? "Matriculation number" : "Staff ID"}
              </label>
              <input
                required
                className="input-field"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === "student" ? "CSC/2021/0142" : "FUO/STF/0089"}
              />
              <p className="mt-1 text-xs text-slate-400">
                Used only to verify eligibility. It is never attached to any feedback you submit.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Department
              </label>
              <input
                required
                className="input-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science"
              />
            </div>

            {role === "student" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level
                </label>
                <select
                  className="input-field"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {["100", "200", "300", "400", "500"].map((lv) => (
                    <option key={lv} value={lv}>
                      {lv} Level
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fuotuoke.edu.ng"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-navy-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
