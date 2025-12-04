import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon: Icon, subtitle, trend }: StatsCardProps) {
  return (
    <div className="card-stats animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className="text-white/70 text-xs">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="opacity-20">
          <Icon className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
}


