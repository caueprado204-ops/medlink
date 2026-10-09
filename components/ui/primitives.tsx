import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { Tone } from "@/lib/labels";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "navy";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const styles = {
    primary: "bg-teal text-white hover:bg-teal-700 border-transparent",
    navy: "bg-navy text-white hover:bg-navy-900 border-transparent",
    secondary: "bg-white text-ink border-line hover:border-[#C9D2DD] hover:bg-canvas",
    ghost: "bg-transparent text-ink-soft border-transparent hover:bg-navy-100 hover:text-navy",
    danger: "bg-white text-danger border-danger-line hover:bg-danger-bg",
  }[variant];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded border font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-8 px-2.5 text-sm" : "h-10 px-4 text-sm",
        styles,
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

const TONES: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-soft border-line",
  teal: "bg-teal-50 text-teal-700 border-[#BFE5DF]",
  mint: "bg-mint text-teal-700 border-[#A7F0CF]",
  navy: "bg-navy-100 text-navy border-[#CBD7E4]",
  sky: "bg-sky text-[#075985] border-[#BAE0F7]",
  amber: "bg-amber-bg text-amber border-amber-line",
  danger: "bg-danger-bg text-danger border-danger-line",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function DemoBadge() {
  return <Badge tone="sky">Demonstração</Badge>;
}

export function Field({
  label, htmlFor, hint, error, required, children, className,
}: { label: string; htmlFor?: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 className="text-base">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-4 py-10 sm:px-6">
      <p className="font-medium text-navy">{title}</p>
      {children && <p className="max-w-md text-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone, href }: { label: string; value: ReactNode; tone?: "danger" | "amber"; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={cx("mt-1 text-2xl font-semibold", tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber" : "text-navy")}>{value}</p>
    </>
  );
  const cls = "panel block px-4 py-3";
  return href ? <a href={href} className={cx(cls, "transition-colors hover:border-[#C9D2DD]")}>{body}</a> : <div className={cls}>{body}</div>;
}
