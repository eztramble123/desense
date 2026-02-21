"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OutputChartProps {
  data: Array<{
    timestamp: number;
    output: number;
    uptime?: number;
  }>;
  height?: number;
}

export function OutputChart({ data, height = 300 }: OutputChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
            color: "#f1f5f9",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="output"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          name="Output (kWh)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
