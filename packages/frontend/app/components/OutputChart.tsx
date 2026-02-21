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
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: "#4b4b58", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#4b4b58", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#111115",
            border: "1px solid #1f1f27",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          cursor={{ stroke: "#1f1f27", strokeWidth: 1 }}
          itemStyle={{ color: "#f59e0b" }}
        />
        <Area
          type="monotone"
          dataKey="output"
          stroke="#f59e0b"
          strokeWidth={1.5}
          fill="url(#gold-grad)"
          dot={false}
          name="kWh"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
