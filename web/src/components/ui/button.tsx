import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 card-elevated",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent border",
  ghost: "bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}