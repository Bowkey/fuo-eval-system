import React from "react";

export default function StarRating({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            aria-label={`${label}: ${star} of 5`}
            className={`h-8 w-8 rounded-md text-lg font-semibold transition ${
              star <= value
                ? "bg-gold-500 text-navy-950"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );
}
