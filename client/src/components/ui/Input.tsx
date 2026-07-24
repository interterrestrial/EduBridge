import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-input border border-border rounded-lg text-foreground px-4 py-3 h-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
            icon ? 'pl-11' : ''
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
