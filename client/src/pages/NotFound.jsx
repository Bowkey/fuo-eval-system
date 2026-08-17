import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-4 text-center">
      <p className="label-eyebrow">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white">
        Page not found
      </h1>
      <p className="mt-2 text-slate-400">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-gold mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
