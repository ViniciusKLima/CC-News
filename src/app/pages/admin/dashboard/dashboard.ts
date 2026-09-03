import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  anoAgrupamento,
  COR_PADRAO_PLATAFORMA,
  dataOrdenacaoAgrupamento,
  Edicao,
  mesAgrupamento,
  MESES_NOMES,
  formatarPeriodo,
  labelTipo,
} from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CONFIRMACOES } from '../../../core/services/confirm-dialog.presets';
import { urlImagemOtimizada } from '../../../core/services/cloudinary.service';
import { gradienteCapa } from '../../../core/utils/cor.util';
import { AdminSidebar } from '../../../shared/components/admin-sidebar/admin-sidebar';

interface GrupoMensal {
  chave: string;
  nome: string;
  edicoes: Edicao[];
}

// Tela inicial do admin: lista de edições agrupadas por mês, com busca,
// filtros e as ações de publicar/arquivar, editar e excluir.
@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink, AdminSidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly editionService = inject(EditionService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly edicoes = this.editionService.edicoes;
  readonly loading = this.editionService.loading;

  readonly skeletonGrupos = Array.from({ length: 2 });
  readonly skeletonLinhas = Array.from({ length: 3 });

  protected readonly formatarPeriodo = formatarPeriodo;
  protected readonly labelTipo = labelTipo;
  protected readonly urlImagemOtimizada = urlImagemOtimizada;
  protected readonly corPadrao = COR_PADRAO_PLATAFORMA;
  protected readonly gradienteCapa = gradienteCapa;

  termoBusca = signal('');
  filtroMes = signal('');
  filtroAno = signal('');
  gruposAbertos = signal<Set<string>>(new Set());
  menuAbertoId = signal<string | null>(null);

  private primeiroGrupoJaAberto = false;

  readonly anosDisponiveis = computed(() => {
    const anos = new Set(this.edicoes().map((edicao) => anoAgrupamento(edicao)));
    return Array.from(anos).sort((a, b) => b - a);
  });

  readonly mesesDisponiveis = computed(() => {
    const indices = new Set(this.edicoes().map((edicao) => mesAgrupamento(edicao)));
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((mes) => ({ valor: mes, nome: MESES_NOMES[mes - 1] }));
  });

  readonly temFiltrosAtivos = computed(
    () => !!this.termoBusca() || !!this.filtroMes() || !!this.filtroAno(),
  );

  readonly edicoesFiltradas = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    const mes = this.filtroMes();
    const ano = this.filtroAno();

    return this.edicoes().filter((edicao) => {
      if (mes && mesAgrupamento(edicao) !== Number(mes)) return false;
      if (ano && anoAgrupamento(edicao) !== Number(ano)) return false;
      if (!termo) return true;

      return (
        edicao.titulo.toLowerCase().includes(termo) ||
        edicao.resumo.toLowerCase().includes(termo) ||
        formatarPeriodo(edicao.periodo).toLowerCase().includes(termo)
      );
    });
  });

  // Os grupos e a contagem por mês são derivados das edições filtradas,
  // nunca armazenados manualmente, evitando divergência entre a contagem
  // exibida e a lista real de edições.
  readonly gruposMensais = computed<GrupoMensal[]>(() => {
    const mapa = new Map<string, GrupoMensal>();

    for (const edicao of this.edicoesFiltradas()) {
      const ano = anoAgrupamento(edicao);
      const mes = mesAgrupamento(edicao);
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      let grupo = mapa.get(chave);
      if (!grupo) {
        grupo = { chave, nome: `${MESES_NOMES[mes - 1]} de ${ano}`, edicoes: [] };
        mapa.set(chave, grupo);
      }
      grupo.edicoes.push(edicao);
    }

    for (const grupo of mapa.values()) {
      grupo.edicoes.sort((a, b) => dataOrdenacaoAgrupamento(b).localeCompare(dataOrdenacaoAgrupamento(a)));
    }

    return Array.from(mapa.values()).sort((a, b) => b.chave.localeCompare(a.chave));
  });

  constructor() {
    // Abre o mês mais recente automaticamente assim que os dados chegam,
    // sem reabrir sempre que o usuário filtrar ou pesquisar depois.
    effect(() => {
      const grupos = this.gruposMensais();
      if (!this.primeiroGrupoJaAberto && grupos.length > 0) {
        this.primeiroGrupoJaAberto = true;
        this.gruposAbertos.set(new Set([grupos[0].chave]));
      }
    });
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroMes.set('');
    this.filtroAno.set('');
  }

  grupoEstaAberto(chave: string): boolean {
    return this.gruposAbertos().has(chave);
  }

  alternarGrupo(chave: string): void {
    this.gruposAbertos.update((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  }

  alternarMenu(id: string, evento: Event): void {
    evento.stopPropagation();
    this.menuAbertoId.set(this.menuAbertoId() === id ? null : id);
  }

  fecharMenu(): void {
    this.menuAbertoId.set(null);
  }

  @HostListener('document:click')
  onCliqueForaDoMenu(): void {
    this.fecharMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fecharMenu();
  }

  // Fixa/desafixa a edição na seção de destaques do topo da home pública.
  // Continua aparecendo normalmente no mês dela no histórico também.
  async alternarFixada(edicao: Edicao): Promise<void> {
    try {
      await this.editionService.atualizarFixada(edicao.id, !edicao.fixada);
      this.toastService.sucesso(
        edicao.fixada ? 'Edição desafixada da home.' : 'Edição fixada no topo da home.',
      );
    } catch {
      this.toastService.erro('Não foi possível atualizar. Tente novamente em instantes.');
    }
  }

  // Ações sobre uma edição: publicar/arquivar e excluir (com confirmação)
  async alternarStatus(edicao: Edicao): Promise<void> {
    const novoStatus = edicao.status === 'publico' ? 'arquivado' : 'publico';
    this.fecharMenu();
    try {
      await this.editionService.atualizarStatus(edicao.id, novoStatus);
      this.toastService.sucesso(
        novoStatus === 'publico' ? 'Edição publicada com sucesso.' : 'Edição arquivada com sucesso.',
      );
    } catch {
      this.toastService.erro('Não foi possível atualizar o status. Tente novamente em instantes.');
    }
  }

  async excluir(edicao: Edicao): Promise<void> {
    this.fecharMenu();
    const confirmado = await this.confirmDialogService.confirmar(
      CONFIRMACOES.excluirEdicao(edicao.titulo, formatarPeriodo(edicao.periodo)),
    );
    if (!confirmado) return;

    try {
      await this.editionService.remover(edicao.id);
      this.toastService.sucesso('Edição excluída com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível excluir a edição. Tente novamente em instantes.');
    }
  }

}
