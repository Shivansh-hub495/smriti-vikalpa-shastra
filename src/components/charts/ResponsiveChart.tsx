import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface ChartProps {
  data: any[];
  height?: number;
  className?: string;
}

interface LineChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  lineColor?: string;
  title?: string;
}

interface BarChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  barColor?: string;
  title?: string;
}

interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  title?: string;
}

interface AreaChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  areaColor?: string;
  title?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-gray-700">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Responsive Line Chart
export const ResponsiveLineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  lineColor = '#8b5cf6',
  height = 300,
  className = '',
  title
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={lineColor}
            strokeWidth={3}
            dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Responsive Area Chart
export const ResponsiveAreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  yKey,
  areaColor = '#8b5cf6',
  height = 300,
  className = '',
  title
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={areaColor}
            fill={`${areaColor}20`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Responsive Bar Chart
export const ResponsiveBarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  barColor = '#10b981',
  height = 300,
  className = '',
  title
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey} 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={yKey} 
            fill={barColor}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Responsive Pie Chart
export const ResponsivePieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
  height = 300,
  className = '',
  title
}) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Study Streak Heatmap Component
interface StreakHeatmapProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
  title?: string;
}

export const StudyStreakHeatmap: React.FC<StreakHeatmapProps> = ({
  data,
  className = '',
  title = 'Study Activity'
}) => {
  const getIntensityColor = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    if (value <= 2) return 'bg-green-200';
    if (value <= 5) return 'bg-green-400';
    if (value <= 10) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-7 gap-1 max-w-md">
        {data.map((day, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-sm ${getIntensityColor(day.value)} border border-gray-200`}
            title={`${day.date}: ${day.value} reviews`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200" />
          <div className="w-3 h-3 bg-green-200 rounded-sm border border-gray-200" />
          <div className="w-3 h-3 bg-green-400 rounded-sm border border-gray-200" />
          <div className="w-3 h-3 bg-green-600 rounded-sm border border-gray-200" />
          <div className="w-3 h-3 bg-green-800 rounded-sm border border-gray-200" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
