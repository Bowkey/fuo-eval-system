import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLabel = {
  student: "Student",
  lecturer: "Lecturer",
  hod: "Head of Department",
};

export default function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-navy-800 bg-navy-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-white">FUO</span>
          <span className="text-xs uppercase tracking-widest text-gold-500">
            Evaluation System
          </span>
        </Link>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{profile.name}</p>
              <p className="text-xs text-slate-400">{roleLabel[profile.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:border-gold-500 hover:text-gold-400"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
