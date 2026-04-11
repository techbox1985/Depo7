import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  debugInput?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    // Log props before rendering input
    console.log('[INPUT PROPS REAL]', {
      dataDebug: props['data-debug'],
      className: props.className,
      value: props.value,
      placeholder: props.placeholder,
    });
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
          data-debug-probe={props['data-debug']}
          title={props['data-debug'] ? `DEBUG:${props['data-debug']}` : props.title}
          onKeyDownCapture={(e) => {
            if (props['data-debug'] === 'real-search-input' && e.key === 'Enter') {
              console.log('[REAL INPUT CAPTURE]');
            }
          }}
          onKeyDown={(e) => {
            if (props['data-debug'] === 'real-search-input' && e.key === 'Enter') {
              console.log('[REAL INPUT ENTER]');
            }
            props.onKeyDown?.(e);
          }}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
