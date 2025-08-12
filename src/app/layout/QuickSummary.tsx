import { Card, CardContent } from "@/components/ui/card";

export default function QuickSummary({ mini = false }: { mini?: boolean }) {
  const metrics = [
    { label: "Obras Ativas", value: 6 },
    { label: "Pendências", value: 12 },
    { label: "Concluídas Hoje", value: 3 },
    { label: "Em Andamento", value: 9 },
  ];

  if (mini) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <Card key={m.label} className="shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="text-lg font-semibold">{m.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
