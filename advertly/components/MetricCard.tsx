
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info, MoreVertical } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendLabel?: string;
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
  color?: string; // Hex color for the chart and accents
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  trendLabel = "vs. minulé období", 
  icon: Icon,
  description,
  isLoading = false,
  color = "#7c3aed" // Default primary violet
}) => {
  const isPositive = trend >= 0;

  // Generate deterministic mock data based on trend to make the chart look realistic
  const generateData = () => {
    const data = [];
    let current = 50;
    for (let i = 0; i < 15; i++) {
        const randomMove = Math.random() * 40 - 20;
        const trendBias = isPositive ? 5 : -5;
        current = Math.max(10, Math.min(100, current + randomMove + trendBias));
        data.push({ value: current });
    }
    return data;
  };

  const chartData = React.useMemo(() => generateData(), [trend]);
  const gradientId = React.useMemo(() => `gradient-${title.replace(/[^a-zA-Z0-9]/g, '')}`, [title]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 h-32 animate-pulse relative overflow-hidden">
        <div className="flex justify-between">
            <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-14"></div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gray-50"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group h-full flex flex-col justify-between">
      
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700">
            <Icon size={20} style={{ color }} />
        </div>
        
        {description && (
             <div className="group/tooltip relative">
                <Info size={16} className="text-gray-300 cursor-help hover:text-gray-500" />
                <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                    {description}
                </div>
            </div>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-semibold text-gray-900 tracking-tight mb-1">{value}</h3>
        <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isPositive 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-rose-50 text-rose-700'
            }`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{Math.abs(trend)}%</span>
            </div>
             <p className="text-xs text-gray-500 font-medium">{title}</p>
        </div>
      </div>
        
      {/* Absolute Chart in background bottom right */}
      <div className="absolute -bottom-2 -right-2 h-20 w-32 opacity-20 pointer-events-none">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={2} 
                    fill={`url(#${gradientId})`} 
                />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricCard;
