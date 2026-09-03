import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border bg-card p-4 soft-shadow sm:p-6", className)} {...props} />;
}

export function StatCard({ label, value, helper, icon }: { label: string; value: React.ReactNode; helper?: React.ReactNode; icon?: React.ReactNode }) {
  return <Card className="card-hover min-w-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{label}</p><div className="mt-2 text-2xl font-bold tracking-tight tabular">{value}</div>{helper && <div className="mt-2 text-xs text-muted-foreground">{helper}</div>}</div>{icon && <div className="rounded-xl bg-secondary p-2.5 text-primary">{icon}</div>}</div></Card>;
}
