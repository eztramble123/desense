"use client";

import clsx from "clsx";

interface SLAGaugeProps {
  value: number; // 0-100
  label: string;
  size?: "sm" | "md" | "lg";
}

export function SLAGauge({ value, label, size = "md" }: SLAGaugeProps) {
  const dimensions = { sm: 80, md: 120, lg: 160 };
  const dim = dimensions[size];
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  const color =
    value >= 95 ? "text-green-500" :
    value >= 80 ? "text-blue-500" :
    value >= 60 ? "text-yellow-500" :
    "text-red-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="transform -rotate-90" width={dim} height={dim}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-slate-100"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={clsx(color, "transition-all duration-700")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx(
            "font-bold text-slate-900",
            size === "sm" ? "text-sm" : size === "md" ? "text-xl" : "text-3xl"
          )}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-500 mt-2">{label}</span>
    </div>
  );
}
