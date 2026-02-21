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
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
        <XAxis dataKey="time" stroke="#A8A295" fontSize={12} />
        <YAxis stroke="#A8A295" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1A1714",
            border: "1px solid #3D3832",
            borderRadius: "8px",
            color: "#F5F5F0",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="output"
          stroke="#B8860B"
          strokeWidth={2}
          dot={false}
          name="Generation (kWh)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
