import Link from "next/link";
import React from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Badge({
  children,
  tone = "neutral",
  marker,
  srLabel,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  marker?: string;
  srLabel?: string;
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {marker && <span aria-hidden="true">{marker}</span>}
      {srLabel && <span className="sr-only">{srLabel}: </span>}
      <span>{children}</span>
    </span>
  );
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return <button className={`focus-ring min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const style = variant === "primary"
    ? "bg-blue-600 text-white hover:bg-blue-700"
    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  return <Link href={href} className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${style} ${className}`}>{children}</Link>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...inputProps } = props;
  return <input className={`focus-ring min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 ${className}`} {...inputProps} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...selectProps } = props;
  return <select className={`focus-ring min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm ${className}`} {...selectProps} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...textareaProps } = props;
  return <textarea className={`focus-ring w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm placeholder:text-slate-400 ${className}`} {...textareaProps} />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function LoadingState({ children = "정보를 불러오는 중입니다." }: { children?: ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm text-rose-800">
      <p>{children}</p>
      {onRetry && <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>다시 시도</Button>}
    </div>
  );
}
