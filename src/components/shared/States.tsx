import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingPlaceholder({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-fade-in" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  message = "Nada encontrado",
  actionLabel = "Limpar filtros",
  onAction,
}: {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-sm text-muted-foreground flex flex-col items-start gap-2 animate-fade-in" role="status" aria-live="polite">
      <p>{message}</p>
      {onAction && (
        <Button variant="outline" size="sm" onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  message = "Ocorreu um erro.",
  actionLabel = "Tentar novamente",
  onAction,
}: {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-sm text-destructive flex flex-col items-start gap-2 animate-fade-in" role="alert" aria-live="assertive">
      <p>{message}</p>
      {onAction && (
        <Button variant="destructive" size="sm" onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
