import * as React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`animate-spin rounded-full h-5 w-5 border-2 border-indigo-650 border-t-transparent ${className}`}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
