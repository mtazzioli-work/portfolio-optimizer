"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type DataPoint = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  data: DataPoint[];
  total: number;
};

export function AllocationDonut({ data, total }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const num = typeof value === "number" ? value : 0;
            return [`$${num.toLocaleString("en-US", { maximumFractionDigits: 0 })} (${total > 0 ? ((num / total) * 100).toFixed(1) : 0}%)`, ""];
          }}
        />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}
