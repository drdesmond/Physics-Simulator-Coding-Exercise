import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export type ChartPanelProps = {
  data: { time: number; tankTemp: number; panelTemp?: number; Q?: number; Q_loss?: number }[];
};

export const ChartPanel: React.FC<ChartPanelProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-auto mt-4">
      <h2 className="text-xl font-medium mb-2 text-center">Tank Temperature Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="tankTemp"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            name="Tank Temp"
          />
          {data[0]?.panelTemp !== undefined && (
            <Line
              type="monotone"
              dataKey="panelTemp"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              name="Panel Temp"
            />
          )}
          {data[0]?.Q !== undefined && (
            <Line
              type="monotone"
              dataKey="Q"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              name="Heat Input (Q)"
            />
          )}
          {data[0]?.Q_loss !== undefined && (
            <Line
              type="monotone"
              dataKey="Q_loss"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              name="Heat Loss (Q_loss)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
