import { z } from "zod";

// Obra Schemas
export const obraInsertSchema = z.object({
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  endereco: z.string()
    .max(500, "Endereço deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  
  status: z.string()
    .max(50, "Status deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),
  
  responsavel: z.string().uuid("ID de responsável inválido").optional().nullable(),
  
  data_inicio: z.string().datetime().optional().nullable(),
  
  previsao_conclusao: z.string().datetime().optional().nullable(),
  
  latitude: z.number()
    .min(-90, "Latitude deve estar entre -90 e 90")
    .max(90, "Latitude deve estar entre -90 e 90")
    .optional()
    .nullable(),
  
  longitude: z.number()
    .min(-180, "Longitude deve estar entre -180 e 180")
    .max(180, "Longitude deve estar entre -180 e 180")
    .optional()
    .nullable(),
});

export const obraUpdateSchema = obraInsertSchema.partial();

// Task Schemas
export const taskInsertSchema = z.object({
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  
  descricao: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  
  tipo: z.enum(["problema", "solicitacao_material", "manutencao", "outros"], {
    errorMap: () => ({ message: "Tipo inválido" }),
  }).optional().nullable(),
  
  prioridade: z.enum(["baixa", "media", "alta"], {
    errorMap: () => ({ message: "Prioridade inválida" }),
  }).optional().nullable(),
  
  status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"], {
    errorMap: () => ({ message: "Status inválido" }),
  }).optional().nullable(),
  
  obra_id: z.string().uuid("ID de obra inválido").optional().nullable(),
  
  responsavel: z.string().uuid("ID de responsável inválido").optional().nullable(),
  
  solicitante: z.string().uuid("ID de solicitante inválido").optional().nullable(),
  
  prazo: z.string().datetime().optional().nullable(),
  
  area: z.string()
    .max(100, "Área deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  
  quantidade: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .optional()
    .nullable(),
});

export const taskUpdateSchema = taskInsertSchema.partial();

// Material Schemas
export const materialInsertSchema = z.object({
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  descricao: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  
  quantidade: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .default(0),
  
  unidade: z.string()
    .max(20, "Unidade deve ter no máximo 20 caracteres")
    .optional()
    .nullable(),
  
  obra_id: z.string().uuid("ID de obra inválido").optional().nullable(),
});

export const materialUpdateSchema = materialInsertSchema.partial();

// Notificação Schemas
export const notificacaoInsertSchema = z.object({
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  
  descricao: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  
  categoria: z.string()
    .max(50, "Categoria deve ter no máximo 50 caracteres")
    .default("geral"),
  
  prioridade: z.enum(["baixa", "media", "alta"], {
    errorMap: () => ({ message: "Prioridade inválida" }),
  }).default("media"),
  
  status: z.string()
    .max(50, "Status deve ter no máximo 50 caracteres")
    .default("pendente"),
  
  remetente: z.string()
    .max(200, "Remetente deve ter no máximo 200 caracteres")
    .optional()
    .nullable(),
  
  obra_id: z.string().uuid("ID de obra inválido").optional().nullable(),
});

export const notificacaoUpdateSchema = notificacaoInsertSchema.partial();

// Movimentação Schemas
export const movimentacaoInsertSchema = z.object({
  tipo: z.enum(["entrada", "saida"], {
    errorMap: () => ({ message: "Tipo deve ser 'entrada' ou 'saida'" }),
  }),
  
  quantidade: z.number()
    .min(0.01, "Quantidade deve ser maior que zero"),
  
  material_id: z.string().uuid("ID de material inválido").optional().nullable(),
  
  usuario: z.string()
    .max(200, "Usuário deve ter no máximo 200 caracteres")
    .optional()
    .nullable(),
  
  motivo: z.string()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

export const movimentacaoUpdateSchema = movimentacaoInsertSchema.partial();

// Relatório Schemas
export const relatorioInsertSchema = z.object({
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  
  resumo: z.string()
    .max(2000, "Resumo deve ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  
  status: z.enum(["rascunho", "aprovado", "publicado"], {
    errorMap: () => ({ message: "Status inválido" }),
  }).default("rascunho"),
  
  obra_id: z.string().uuid("ID de obra inválido").optional().nullable(),
  
  caracteristicas: z.array(z.string()).default([]),
  
  data_publicacao: z.string().datetime().optional().nullable(),
});

export const relatorioUpdateSchema = relatorioInsertSchema.partial();

// Auth Schemas
export const signUpSchema = z.object({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  
  password: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(72, "Senha deve ter no máximo 72 caracteres"),
  
  display_name: z.string()
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
});

export const signInSchema = z.object({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  
  password: z.string()
    .min(1, "Senha é obrigatória"),
});

// Profile Schemas
export const profileUpdateSchema = z.object({
  display_name: z.string()
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  
  bio: z.string()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  
  avatar_url: z.string()
    .url("URL inválida")
    .max(500, "URL deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

// Export type helpers
export type ObraInsert = z.infer<typeof obraInsertSchema>;
export type ObraUpdate = z.infer<typeof obraUpdateSchema>;
export type TaskInsert = z.infer<typeof taskInsertSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type MaterialInsert = z.infer<typeof materialInsertSchema>;
export type MaterialUpdate = z.infer<typeof materialUpdateSchema>;
export type NotificacaoInsert = z.infer<typeof notificacaoInsertSchema>;
export type NotificacaoUpdate = z.infer<typeof notificacaoUpdateSchema>;
export type MovimentacaoInsert = z.infer<typeof movimentacaoInsertSchema>;
export type RelatorioInsert = z.infer<typeof relatorioInsertSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
