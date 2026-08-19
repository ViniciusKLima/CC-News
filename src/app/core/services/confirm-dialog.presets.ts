import { ConfirmacaoOpcoes } from './confirm-dialog.service';

/**
 * Catálogo de confirmações reutilizáveis pelo app. Adicionar uma nova
 * entrada aqui em vez de escrever o texto solto no componente que chama.
 */
export const CONFIRMACOES = {
  excluirEdicao: (titulo: string, periodo?: string): ConfirmacaoOpcoes => ({
    titulo: 'Excluir edição',
    descricao: `Tem certeza que deseja excluir a edição "${titulo}"${periodo ? ` (${periodo})` : ''}? Essa ação não pode ser desfeita.`,
    rotuloConfirmar: 'Excluir',
    variante: 'perigo',
  }),
  excluirAtualizacao: (titulo: string): ConfirmacaoOpcoes => ({
    titulo: 'Excluir atualização',
    descricao: `Excluir a atualização "${titulo}"? Essa ação não pode ser desfeita.`,
    rotuloConfirmar: 'Excluir',
    variante: 'perigo',
  }),
  excluirUsuario: (nome: string, contaJaAtivada: boolean): ConfirmacaoOpcoes => ({
    titulo: 'Excluir usuário',
    descricao: contaJaAtivada
      ? `Tem certeza que deseja excluir "${nome}"? O acesso dele ao admin é bloqueado imediatamente. Mas o login (Firebase Authentication) dele não é apagado junto — se cadastrar esse mesmo e-mail de novo no futuro, o Primeiro Acesso vai falhar dizendo que o e-mail já existe. Pra liberar o e-mail de vez, apague a conta também em Authentication > Users no console do Firebase.`
      : `Tem certeza que deseja excluir "${nome}"? Essa ação não pode ser desfeita.`,
    rotuloConfirmar: 'Excluir',
    variante: 'perigo',
  }),
};
