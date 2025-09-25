import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, User, Database, Activity } from "lucide-react";
import { useAuditoria } from "@/integrations/supabase/hooks/useAuditoria";
import { LoadingPlaceholder } from "@/components/shared/States";
import { useMemo } from "react";

export default function SystemLog() {
  const { data: auditLogs = [], isLoading } = useAuditoria();
  
  const stats = useMemo(() => {
    const totalActions = auditLogs.length;
    const uniqueUsers = new Set(auditLogs.map(log => log.usuario)).size;
    const lastLog = auditLogs[0];
    const lastSync = lastLog 
      ? new Date(lastLog.timestamp || '').toLocaleString('pt-BR')
      : 'Nunca';
    
    return {
      totalActions,
      activeUsers: uniqueUsers,
      uptime: "Sistema Online",
      lastSync
    };
  }, [auditLogs]);

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
              {isLoading ? (
                <LoadingPlaceholder rows={5} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.slice(0, 50).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.usuario}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{log.acao}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {log.detalhes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {auditLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
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