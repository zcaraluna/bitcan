import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const icons = {
  error: XCircle,
  warning: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const styles = {
  error: 'alert-error',
  warning: 'alert-warning',
  success: 'alert-success',
  info: 'alert-info',
};

export default function Alert({ type = 'info', title, children, className = '' }: AlertProps) {
  const Icon = icons[type];

  return (
    <div className={`${styles[type]} ${className}`}>
      <div className="flex gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}


