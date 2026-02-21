"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface OutputChartProps {
  data: Array<{ timestamp: number; output: number }>;
  height?: number;
}

export function OutputChart({ data, height = 280 }: OutputChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0a1530",
            border: "1px solid #152046",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          cursor={{ stroke: "#152046", strokeWidth: 1 }}
          itemStyle={{ color: "#2563eb" }}
        />
        <Area
          type="monotone"
          dataKey="output"
          stroke="#2563eb"
          strokeWidth={1.5}
          fill="url(#gold-grad)"
          dot={false}
          name="kWh"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
