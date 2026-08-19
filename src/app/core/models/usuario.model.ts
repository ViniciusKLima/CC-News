export type PerfilAcesso = 'administrador' | 'editor';

export type StatusUsuario = 'pendente' | 'ativo' | 'inativo';

export interface Usuario {
  /** === e-mail normalizado (minúsculas) — mesmo ID do documento no Firestore. */
  id: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
  status: StatusUsuario;
  criadoEm: string;
  /** UID do Firebase Auth — só existe depois que a pessoa faz o Primeiro Acesso. */
  uid?: string;
  ultimoAcesso?: string;
}

export const PERFIS_ACESSO: { valor: PerfilAcesso; label: string }[] = [
  { valor: 'administrador', label: 'Administrador' },
  { valor: 'editor', label: 'Editor' },
];

export const STATUS_USUARIO: { valor: StatusUsuario; label: string }[] = [
  { valor: 'ativo', label: 'Ativo' },
  { valor: 'pendente', label: 'Pendente' },
  { valor: 'inativo', label: 'Inativo' },
];

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function labelPerfil(perfil: PerfilAcesso): string {
  return PERFIS_ACESSO.find((item) => item.valor === perfil)?.label ?? perfil;
}

export function labelStatusUsuario(status: StatusUsuario): string {
  return STATUS_USUARIO.find((item) => item.valor === status)?.label ?? status;
}
