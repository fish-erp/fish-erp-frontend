import { cn } from "@/lib/utils";

export function Page({ title, description, actions, badge, children, className }: { title: string; description?: string; actions?: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <div className={cn("page-enter mx-auto w-full max-w-[1440px] space-y-5 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8", className)}><header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{badge}</div>{description && <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</header>{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed bg-card px-5 py-12 text-center"><h3 className="font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
