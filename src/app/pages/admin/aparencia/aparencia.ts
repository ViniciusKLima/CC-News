import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_ATUALIZACAO, CategoriaAtualizacao, TIPOS_EDICAO, TipoEdicao } from '../../../core/models/edition.model';
import { CorPar, IconeBiblioteca } from '../../../core/models/interface-config.model';
import { InterfaceConfigService } from '../../../core/services/interface-config.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CONFIRMACOES } from '../../../core/services/confirm-dialog.presets';
import { AdminSidebar } from '../../../shared/components/admin-sidebar/admin-sidebar';
import { Icone } from '../../../shared/components/icone/icone';
import { IconePicker } from '../../../shared/components/icone-picker/icone-picker';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Chave de qual seletor de ícone (se algum) está aberto no momento: uma categoria, o banner de transparência, ou nenhum. */
type ChaveSeletorIcone = CategoriaAtualizacao | 'transparencia' | null;

// Aba "Aparência" do admin: personalização visual da plataforma (logo,
// banner e texto do hero, cores dos tipos de edição e das categorias de
// atualização, biblioteca de ícones, rodapé e banner de transparência).
// Restrita a administradores (ver adminRoleGuard em app.routes.ts).
//
// Trabalha sobre um rascunho local (cópia do config atual) em vez de formar
// um FormGroup — o objeto tem vários formatos aninhados diferentes (records
// por tipo/categoria, lista de ícones), o que deixaria um FormGroup mais
// complicado do que o ganho valeria. Só grava no Firestore quando o admin
// clica em "Salvar alterações".
@Component({
  selector: 'app-aparencia',
  imports: [FormsModule, AdminSidebar, Icone, IconePicker],
  templateUrl: './aparencia.html',
  styleUrl: './aparencia.scss',
})
export class Aparencia {
  private readonly interfaceConfig = inject(InterfaceConfigService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly tiposEdicao = TIPOS_EDICAO;
  protected readonly categoriasAtualizacao = CATEGORIAS_ATUALIZACAO;

  protected readonly rascunho = signal<{
    logoUrl: string;
    heroBannerUrl: string;
    heroTexto: string;
    footerTitulo: string;
    footerTexto: string;
    tipos: Record<TipoEdicao, CorPar>;
    categorias: Record<CategoriaAtualizacao, { icone: string; fundo: string; texto: string }>;
    icones: IconeBiblioteca[];
    transparencia: { icone: string; titulo: string; descricao: string; textoBotao: string; linkBotao: string };
  } | null>(null);

  protected readonly carregado = this.interfaceConfig.carregado;
  protected readonly salvando = signal(false);

  protected readonly logoEnviando = signal(false);
  protected readonly logoProgresso = signal(0);
  protected readonly heroEnviando = signal(false);
  protected readonly heroProgresso = signal(0);
  protected readonly iconeEnviando = signal(false);
  protected readonly iconeProgresso = signal(0);

  protected readonly novoIconeNome = signal('');
  protected readonly seletorIconeAberto = signal<ChaveSeletorIcone>(null);

  private inicializado = false;

  constructor() {
    // Inicializa o rascunho uma única vez, assim que a configuração real
    // termina de carregar do Firestore (ver InterfaceConfigService) — evita
    // começar com os valores padrão e "pular" para os salvos um instante
    // depois, ou pior, sobrescrever uma edição em andamento do admin.
    effect(() => {
      if (this.carregado() && !this.inicializado) {
        this.inicializado = true;
        this.rascunho.set(structuredClone(this.interfaceConfig.config()));
      }
    });
  }

  protected corTipo(tipo: TipoEdicao): CorPar {
    return this.rascunho()!.tipos[tipo];
  }

  protected corCategoria(categoria: CategoriaAtualizacao) {
    return this.rascunho()!.categorias[categoria];
  }

  protected atualizarCampo<K extends 'logoUrl' | 'heroBannerUrl' | 'heroTexto' | 'footerTitulo' | 'footerTexto'>(
    campo: K,
    valor: string,
  ): void {
    this.rascunho.update((r) => (r ? { ...r, [campo]: valor } : r));
  }

  protected atualizarCorTipo(tipo: TipoEdicao, campo: keyof CorPar, valor: string): void {
    if (!HEX_PATTERN.test(valor)) return;
    this.rascunho.update((r) => (r ? { ...r, tipos: { ...r.tipos, [tipo]: { ...r.tipos[tipo], [campo]: valor } } } : r));
  }

  protected atualizarCorCategoria(categoria: CategoriaAtualizacao, campo: keyof CorPar, valor: string): void {
    if (!HEX_PATTERN.test(valor)) return;
    this.rascunho.update((r) =>
      r ? { ...r, categorias: { ...r.categorias, [categoria]: { ...r.categorias[categoria], [campo]: valor } } } : r,
    );
  }

  protected atualizarIconeCategoria(categoria: CategoriaAtualizacao, icone: string): void {
    this.rascunho.update((r) =>
      r ? { ...r, categorias: { ...r.categorias, [categoria]: { ...r.categorias[categoria], icone } } } : r,
    );
    this.seletorIconeAberto.set(null);
  }

  protected atualizarTransparencia(campo: 'icone' | 'titulo' | 'descricao' | 'textoBotao' | 'linkBotao', valor: string): void {
    this.rascunho.update((r) => (r ? { ...r, transparencia: { ...r.transparencia, [campo]: valor } } : r));
    if (campo === 'icone') this.seletorIconeAberto.set(null);
  }

  protected alternarSeletorIcone(chave: ChaveSeletorIcone): void {
    this.seletorIconeAberto.update((atual) => (atual === chave ? null : chave));
  }

  protected async onLogoSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.logoEnviando.set(true);
    this.logoProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.logoProgresso.set(p));
      this.atualizarCampo('logoUrl', url);
      this.toastService.sucesso('Logo enviada. Clique em Salvar para aplicar.');
    } catch {
      this.toastService.erro('Não foi possível enviar a logo. Tente novamente.');
    } finally {
      this.logoEnviando.set(false);
    }
  }

  protected async onHeroSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.heroEnviando.set(true);
    this.heroProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.heroProgresso.set(p));
      this.atualizarCampo('heroBannerUrl', url);
      this.toastService.sucesso('Banner enviado. Clique em Salvar para aplicar.');
    } catch {
      this.toastService.erro('Não foi possível enviar o banner. Tente novamente.');
    } finally {
      this.heroEnviando.set(false);
    }
  }

  protected adicionarIconePorNome(): void {
    const nome = this.novoIconeNome().trim();
    if (!nome) return;

    const classe = nome.startsWith('bi-') ? nome : `bi-${nome}`;
    const jaExiste = this.rascunho()!.icones.some((icone) => icone.valor === classe);
    if (jaExiste) {
      this.toastService.erro('Esse ícone já está na biblioteca.');
      return;
    }

    const novoIcone: IconeBiblioteca = { id: crypto.randomUUID(), nome: nome.replace(/^bi-/, '').replace(/-/g, ' '), tipo: 'bootstrap', valor: classe };
    this.rascunho.update((r) => (r ? { ...r, icones: [...r.icones, novoIcone] } : r));
    this.novoIconeNome.set('');
    this.toastService.sucesso('Ícone adicionado à biblioteca. Confira se ele apareceu corretamente antes de salvar.');
  }

  protected async onNovoIconeArquivo(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.iconeEnviando.set(true);
    this.iconeProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.iconeProgresso.set(p));
      const novoIcone: IconeBiblioteca = { id: crypto.randomUUID(), nome: arquivo.name.replace(/\.[^.]+$/, ''), tipo: 'upload', valor: url };
      this.rascunho.update((r) => (r ? { ...r, icones: [...r.icones, novoIcone] } : r));
      this.toastService.sucesso('Ícone enviado. Clique em Salvar para aplicar.');
    } catch {
      this.toastService.erro('Não foi possível enviar o ícone. Tente novamente.');
    } finally {
      this.iconeEnviando.set(false);
    }
  }

  protected async removerIcone(icone: IconeBiblioteca): Promise<void> {
    const confirmado = await this.confirmDialogService.confirmar(CONFIRMACOES.excluirIcone(icone.nome));
    if (!confirmado) return;

    this.rascunho.update((r) => (r ? { ...r, icones: r.icones.filter((item) => item.id !== icone.id) } : r));
  }

  protected async salvar(): Promise<void> {
    const rascunho = this.rascunho();
    if (!rascunho) return;

    this.salvando.set(true);
    try {
      await this.interfaceConfig.salvar(rascunho);
      this.toastService.sucesso('Aparência atualizada com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      this.salvando.set(false);
    }
  }

  private extrairArquivo(evento: Event): File | null {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (arquivo && !arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido.');
      return null;
    }
    return arquivo;
  }
}
