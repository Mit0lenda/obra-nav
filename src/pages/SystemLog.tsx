import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuditLog from "@/components/shared/AuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Database, Activity } from "lucide-react";

export default function SystemLog() {
  const stats = {
    totalActions: 157,
    activeUsers: 8,
    uptime: "7 dias, 12h",
    lastSync: "2 min atrás"
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Registro do Sistema" 
        subtitle="Auditoria e log de ações dos usuários" 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.uptime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Última Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{stats.lastSync}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Log de Auditoria</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLog />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempo médio de resposta</label>
                    <div className="text-lg font-mono">245ms</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Taxa de sucesso</label>
                    <div className="text-lg font-mono">99.2%</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cache hit rate</label>
                    <div className="text-lg font-mono">87.5%</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Memória em uso</label>
                    <div className="text-lg font-mono">2.1MB</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}