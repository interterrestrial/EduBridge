import React from 'react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-card rounded-xl border border-border p-6 shadow-sm ${className}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';
