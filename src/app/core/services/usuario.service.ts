import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { PerfilAcesso, StatusUsuario, Usuario, normalizarEmail } from '../models/usuario.model';
import { usuarioConverter } from '../models/usuario.converter';

/**
 * Fonte dos dados da coleção `usuarios`. O ID do documento é o próprio
 * e-mail normalizado (minúsculas) — ver decisão no plano de "Gestão de
 * usuários internos". Isso permite `getDoc` direto por e-mail (usado no
 * login e no fluxo de Primeiro Acesso) em vez de uma query.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly colecao = collection(this.firestore, 'usuarios').withConverter(usuarioConverter);

  private readonly _usuarios = signal<Usuario[]>([]);
  private readonly _loading = signal(true);

  readonly usuarios = this._usuarios.asReadonly();
  readonly loading = this._loading.asReadonly();

  private pararListaAtual: (() => void) | null = null;

  constructor() {
    // Reabre a assinatura da coleção sempre que o estado de autenticação
    // muda (login/logout). Necessário porque um erro de permissão (ex.:
    // a assinatura abrindo antes da sessão do Firebase terminar de
    // restaurar, ou um Editor sem acesso à coleção inteira) encerra o
    // listener do Firestore de forma definitiva — ele não se reconecta
    // sozinho quando o usuário loga depois.
    onAuthStateChanged(this.auth, () => {
      this.pararListaAtual?.();
      this._loading.set(true);

      this.pararListaAtual = onSnapshot(
        this.colecao,
        (snapshot) => {
          this._usuarios.set(snapshot.docs.map((documento) => documento.data()));
          this._loading.set(false);
        },
        () => {
          // Sem permissão de listar a coleção inteira (deslogado, ou
          // logado como Editor) — não é um erro real de UI.
          this._usuarios.set([]);
          this._loading.set(false);
        },
      );
    });
  }

  obterPorId(id: string): Usuario | undefined {
    return this._usuarios().find((usuario) => usuario.id === id);
  }

  async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    const referencia = doc(this.colecao, normalizarEmail(email));
    const snapshot = await getDoc(referencia);
    return snapshot.exists() ? snapshot.data() : undefined;
  }

  /** Assina o doc de um único e-mail em tempo real; retorna a função pra cancelar a assinatura. */
  observarPorEmail(email: string, aoAtualizar: (usuario: Usuario | undefined) => void): () => void {
    const referencia = doc(this.colecao, normalizarEmail(email));
    return onSnapshot(
      referencia,
      (snapshot) => aoAtualizar(snapshot.exists() ? snapshot.data() : undefined),
      () => aoAtualizar(undefined),
    );
  }

  async criar(dados: { nome: string; email: string; perfil: PerfilAcesso }): Promise<Usuario> {
    const email = normalizarEmail(dados.email);
    const existente = await this.buscarPorEmail(email);
    if (existente) {
      throw new Error('email-ja-cadastrado');
    }

    const novoUsuario: Usuario = {
      id: email,
      nome: dados.nome,
      email,
      perfil: dados.perfil,
      status: 'pendente',
      criadoEm: new Date().toISOString().slice(0, 10),
    };
    await setDoc(doc(this.colecao, email), novoUsuario);
    return novoUsuario;
  }

  /**
   * `email` só pode mudar enquanto o usuário está pendente (sem `uid`,
   * ou seja, sem conta criada no Firebase Auth ainda) — como o ID do
   * documento é o próprio e-mail, mudar o e-mail move o documento pra um
   * novo ID (create + delete em lote) em vez de um update no lugar.
   *
   * Lê o documento direto do Firestore (não confia no signal local em
   * cache) antes de escrever: se o cache local estiver desatualizado (ex.:
   * o registro acabou de ser apagado em outra aba/sessão e a lista ainda
   * não reagiu), um `setDoc` sobre um doc que não existe mais recriaria o
   * usuário do zero em vez de simplesmente falhar — evita esse fantasma.
   */
  async atualizar(id: string, dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'status' | 'email'>>): Promise<void> {
    const atual = await this.buscarPorEmail(id);
    if (!atual) {
      throw new Error('usuario-nao-encontrado');
    }

    const novoEmail = dados.email ? normalizarEmail(dados.email) : atual.id;
    const atualizado: Usuario = { ...atual, ...dados, id: novoEmail, email: novoEmail };

    if (novoEmail === atual.id) {
      await setDoc(doc(this.colecao, id), atualizado);
      return;
    }

    if (atual.uid) {
      throw new Error('email-nao-editavel');
    }

    const existente = await this.buscarPorEmail(novoEmail);
    if (existente) {
      throw new Error('email-ja-cadastrado');
    }

    const lote = writeBatch(this.firestore);
    lote.set(doc(this.colecao, novoEmail), atualizado);
    lote.delete(doc(this.colecao, atual.id));
    await lote.commit();
  }

  async ativar(email: string, uid: string): Promise<void> {
    await updateDoc(doc(this.colecao, normalizarEmail(email)), {
      status: 'ativo' as StatusUsuario,
      uid,
      ultimoAcesso: new Date().toISOString(),
    });
  }

  async registrarAcesso(email: string): Promise<void> {
    await updateDoc(doc(this.colecao, normalizarEmail(email)), {
      ultimoAcesso: new Date().toISOString(),
    });
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(this.colecao, id));
  }
}
