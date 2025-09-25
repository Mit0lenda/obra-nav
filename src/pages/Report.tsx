import PageHeader from "@/components/shared/PageHeader";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRelatorio } from "@/integrations/supabase/hooks/useRelatorios";
import { LoadingPlaceholder } from "@/components/shared/States";
import { FileText, Calendar, MapPin } from "lucide-react";

export default function Report() {
  const { id } = useParams();
  const { data: relatorio, isLoading, error } = useRelatorio(id || '');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Carregando relatório..." subtitle="" action={<Button asChild><Link to="/feed">Voltar</Link></Button>} />
        <LoadingPlaceholder rows={4} />
      </div>
    );
  }

  if (error || !relatorio) {
    return (
      <div className="space-y-4">
        <PageHeader title="Relatório não encontrado" subtitle="" action={<Button asChild><Link to="/feed">Voltar</Link></Button>} />
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">O relatório solicitado não foi encontrado.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={relatorio.titulo} 
        subtitle="Detalhes do relatório" 
        action={<Button asChild><Link to="/feed">Voltar</Link></Button>} 
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
              <Badge variant={relatorio.status === 'ativo' ? 'default' : 'secondary'}>
                {relatorio.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Resumo</label>
              <p className="mt-1">{relatorio.resumo || 'Sem resumo disponível'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Data de publicação:</span>
                <span>{relatorio.data_publicacao ? new Date(relatorio.data_publicacao).toLocaleDateString('pt-BR') : '-'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Obra ID:</span>
                <span>{relatorio.obra_id || 'Não especificada'}</span>
              </div>
            </div>

            {relatorio.caracteristicas && relatorio.caracteristicas.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Características</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {relatorio.caracteristicas.map((caracteristica, index) => (
                    <Badge key={index} variant="outline">
                      {caracteristica}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-muted-foreground">
                O conteúdo detalhado do relatório será implementado conforme necessário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
