import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  imports: [Header, Footer, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  edicoesPorMes: Mes[] = [];

  readonly skeletonMeses = Array.from({ length: 2 });
  readonly skeletonCards = Array.from({ length: 3 });

  @ViewChildren('slide') private slides!: QueryList<ElementRef<HTMLElement>>;
  private slidesChangesSub?: Subscription;

  ngOnInit(): void {
    // TODO: substituir pelo carregamento real assim que o service de edições existir.
    setTimeout(() => {
      this.edicoesPorMes = edicoesPorMes;
      this.loading = false;
    }, 700);
  }

  ngAfterViewInit(): void {
    this.slides.forEach((ref) => this.updateNavState(ref.nativeElement));

    this.slidesChangesSub = this.slides.changes.subscribe((list: QueryList<ElementRef<HTMLElement>>) => {
      setTimeout(() => list.forEach((ref) => this.updateNavState(ref.nativeElement)));
    });
  }

  ngOnDestroy(): void {
    this.slidesChangesSub?.unsubscribe();
  }

  scrollSlide(container: HTMLElement, direction: number): void {
    const card = container.querySelector<HTMLElement>('.card-edicao');
    if (!card) return;

    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    container.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  updateNavState(container: HTMLElement): void {
    const wrapper = container.closest<HTMLElement>('.slide-wrapper');
    if (!wrapper) return;

    const prevBtn = wrapper.querySelector<HTMLButtonElement>('.slide-nav.prev');
    const nextBtn = wrapper.querySelector<HTMLButtonElement>('.slide-nav.next');
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (prevBtn) prevBtn.disabled = container.scrollLeft <= 1;
    if (nextBtn) nextBtn.disabled = container.scrollLeft >= maxScroll - 1;
  }
}
export interface Edicao {
  id: string;
  periodo: string;
  tipo: 'Diária' | 'Semanal' | 'Mensal' | 'Especial';
  titulo: string;
  descricao: string;
  totalNovidades: number;
}

export interface Mes {
  id: string;
  nome: string;
  edicoes: Edicao[];
}

export const edicoesPorMes: Mes[] = [
  {
    id: '2026-08',
    nome: 'Agosto de 2026',
    edicoes: [
      {
        id: 'edicao-2026-08-14',
        periodo: '11 a 14 de agosto',
        tipo: 'Semanal',
        titulo: 'Mais estabilidade e novos recursos na plataforma',
        descricao:
          'Confira as principais correções, melhorias e novidades que chegaram ao Conecta Cidades nesta semana.',
        totalNovidades: 12,
      },
      {
        id: 'edicao-2026-08-07',
        periodo: '4 a 7 de agosto',
        tipo: 'Semanal',
        titulo: 'Novas melhorias nos serviços digitais',
        descricao:
          'Atualizações importantes foram implementadas para tornar os fluxos mais rápidos, estáveis e eficientes.',
        totalNovidades: 8,
      },
      {
        id: 'edicao-2026-08-07',
        periodo: '4 a 7 de agosto',
        tipo: 'Semanal',
        titulo: 'Novas melhorias nos serviços digitais',
        descricao:
          'Atualizações importantes foram implementadas para tornar os fluxos mais rápidos, estáveis e eficientes.',
        totalNovidades: 8,
      },
      {
        id: 'edicao-2026-08-07',
        periodo: '4 a 7 de agosto',
        tipo: 'Semanal',
        titulo: 'Novas melhorias nos serviços digitais',
        descricao:
          'Atualizações importantes foram implementadas para tornar os fluxos mais rápidos, estáveis e eficientes.',
        totalNovidades: 8,
      },
      {
        id: 'edicao-2026-08-01',
        periodo: '1 de agosto',
        tipo: 'Especial',
        titulo: 'Uma nova fase para o Conecta Cidades',
        descricao:
          'Uma edição especial com os principais destaques e próximos passos da plataforma para os municípios.',
        totalNovidades: 15,
      },
    ],
  },

  {
    id: '2026-07',
    nome: 'Julho de 2026',
    edicoes: [
      {
        id: 'edicao-2026-07-24',
        periodo: '21 a 24 de julho',
        tipo: 'Semanal',
        titulo: 'Aprimoramentos nos fluxos de atendimento',
        descricao:
          'Veja as melhorias realizadas nos processos de atendimento e as novidades que estão chegando à plataforma.',
        totalNovidades: 10,
      },
      {
        id: 'edicao-2026-07-15',
        periodo: '15 de julho',
        tipo: 'Mensal',
        titulo: 'Resumo das principais atualizações de julho',
        descricao:
          'Um panorama das principais entregas, correções e funcionalidades trabalhadas durante o mês.',
        totalNovidades: 18,
      },
      {
        id: 'edicao-2026-07-08',
        periodo: '7 a 8 de julho',
        tipo: 'Semanal',
        titulo: 'Correções e melhorias de desempenho',
        descricao:
          'A equipe trabalhou em ajustes para melhorar o desempenho e a estabilidade de diferentes áreas da plataforma.',
        totalNovidades: 7,
      },
    ],
  },

  {
    id: '2026-06',
    nome: 'Junho de 2026',
    edicoes: [
      {
        id: 'edicao-2026-06-26',
        periodo: '23 a 26 de junho',
        tipo: 'Semanal',
        titulo: 'Mais praticidade para gestores municipais',
        descricao:
          'Novas melhorias tornam a gestão dos serviços municipais mais simples e proporcionam uma experiência melhor para os usuários.',
        totalNovidades: 9,
      },
      {
        id: 'edicao-2026-06-15',
        periodo: '15 de junho',
        tipo: 'Especial',
        titulo: 'Destaques do primeiro semestre',
        descricao:
          'Confira os principais avanços da plataforma Conecta Cidades durante os primeiros meses do ano.',
        totalNovidades: 21,
      },
      {
        id: 'edicao-2026-06-05',
        periodo: '2 a 5 de junho',
        tipo: 'Semanal',
        titulo: 'Novos ajustes chegam à plataforma',
        descricao:
          'Correções e melhorias foram disponibilizadas para deixar os serviços mais consistentes e confiáveis.',
        totalNovidades: 6,
      },
    ],
  },
];