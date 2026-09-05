import { Injectable, effect, inject, signal } from '@angular/core';
import { Firestore, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { TipoEdicao } from '../models/edition.model';
import { INTERFACE_CONFIG_PADRAO, InterfaceConfig } from '../models/interface-config.model';

const CAMINHO_DOCUMENTO = 'configuracao/interface';

/**
 * Fonte única da configuração de aparência da plataforma (ver
 * InterfaceConfig), sincronizada em tempo real com um único documento do
 * Firestore. Enquanto o documento não existe (app ainda sem nenhuma
 * personalização salva), o signal `config` mantém os valores padrão, que
 * refletem exatamente o visual hardcoded original — nada muda até o admin
 * salvar algo na aba Aparência.
 *
 * Além de expor o signal para os componentes lerem diretamente (textos,
 * ícones, URLs, cores por categoria), este serviço também aplica as cores de
 * tipo de edição como variáveis CSS no elemento raiz, para que o SCSS
 * existente (que já lê `--tipo-*-bg`/`--tipo-*-text`) não precise de nenhuma
 * mudança. As cores por categoria de atualização não usam esse mecanismo:
 * como cada categoria tem uma cor livre (não um de 5 acentos fixos), os
 * componentes leem `config().categorias[...]` direto e aplicam via estilo
 * inline (ver AtualizacaoCard, Edition e Editor).
 */
@Injectable({ providedIn: 'root' })
export class InterfaceConfigService {
  private readonly firestore = inject(Firestore);
  private readonly referencia = doc(this.firestore, CAMINHO_DOCUMENTO);

  private readonly _config = signal<InterfaceConfig>(INTERFACE_CONFIG_PADRAO);
  private readonly _carregado = signal(false);

  readonly config = this._config.asReadonly();
  readonly carregado = this._carregado.asReadonly();

  constructor() {
    onSnapshot(
      this.referencia,
      (snapshot) => {
        const dados = snapshot.data();
        this._config.set(dados ? mesclarComPadrao(dados as Partial<InterfaceConfig>) : INTERFACE_CONFIG_PADRAO);
        this._carregado.set(true);
      },
      (erro) => {
        console.error('Erro ao sincronizar configuração de aparência:', erro);
        this._carregado.set(true);
      },
    );

    effect(() => aplicarVariaveisCss(this._config()));
  }

  async salvar(config: InterfaceConfig): Promise<void> {
    await setDoc(this.referencia, config);
  }
}

/** Preenche qualquer campo ausente do documento salvo com o valor padrão correspondente, para tolerar documentos criados antes de um novo campo existir. */
function mesclarComPadrao(dados: Partial<InterfaceConfig>): InterfaceConfig {
  return {
    ...INTERFACE_CONFIG_PADRAO,
    ...dados,
    tipos: { ...INTERFACE_CONFIG_PADRAO.tipos, ...dados.tipos },
    categorias: { ...INTERFACE_CONFIG_PADRAO.categorias, ...dados.categorias },
    transparencia: { ...INTERFACE_CONFIG_PADRAO.transparencia, ...dados.transparencia },
    icones: dados.icones?.length ? dados.icones : INTERFACE_CONFIG_PADRAO.icones,
  };
}

function aplicarVariaveisCss(config: InterfaceConfig): void {
  const raiz = document.documentElement.style;

  (Object.keys(config.tipos) as TipoEdicao[]).forEach((tipo) => {
    raiz.setProperty(`--tipo-${tipo}-bg`, config.tipos[tipo].fundo);
    raiz.setProperty(`--tipo-${tipo}-text`, config.tipos[tipo].texto);
  });
}
