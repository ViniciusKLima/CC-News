import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

// Pastas usadas para organizar os uploads no Cloudinary, uma por tipo de imagem da aplicação.
export type PastaCloudinary = 'cc-news/edicoes/capas' | 'cc-news/destaques' | 'cc-news/atualizacoes';

// Tamanhos padrão usados nas telas da aplicação. Cada um vira uma
// transformação diferente em cima da mesma imagem original, sem precisar
// subir o arquivo mais de uma vez.
export type PresetImagem = 'hero' | 'card' | 'detalhe' | 'mobile';

const TRANSFORMACOES_PRESET: Record<PresetImagem, string> = {
  hero: 'w_1600,c_fill,g_auto',
  card: 'w_480,h_480,c_fill,g_auto',
  detalhe: 'w_1024,c_limit',
  mobile: 'w_360,c_fill,g_auto',
};

/**
 * Monta a URL de entrega otimizada de uma imagem do Cloudinary, aplicando
 * f_auto e q_auto (formato e qualidade automáticos) e, opcionalmente, um dos
 * presets de tamanho acima. Se a URL não for do Cloudinary (ex.: campo
 * antigo ou link externo), retorna sem alteração.
 */
export function urlImagemOtimizada(url: string, preset?: PresetImagem): string {
  if (!url || !url.includes('/upload/')) return url;
  const transformacao = preset ? `f_auto,q_auto,${TRANSFORMACOES_PRESET[preset]}` : 'f_auto,q_auto';
  return url.replace('/upload/', `/upload/${transformacao}/`);
}

/**
 * Upload de imagens para o Cloudinary, usado pelo Editor de edições (capa,
 * serviço em destaque e mídia das atualizações) no lugar do Firebase
 * Storage. O upload é "unsigned", direto do navegador, com um preset
 * público configurado no painel do Cloudinary (sem API Secret no frontend).
 * Firestore guarda só a URL retornada, nunca o arquivo em si.
 *
 * Se no futuro o upload passar a ser feito por um backend próprio, só o
 * corpo de enviarImagem muda, o restante da aplicação continua chamando o
 * mesmo método.
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly http = inject(HttpClient);

  enviarImagem(arquivo: File, pasta: PastaCloudinary, aoProgredir?: (percentual: number) => void): Promise<string> {
    const endpoint = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('upload_preset', environment.cloudinary.uploadPreset);
    formData.append('folder', pasta);

    return new Promise((resolve, reject) => {
      this.http.post<{ secure_url: string }>(endpoint, formData, { reportProgress: true, observe: 'events' }).subscribe({
        next: (evento) => {
          if (evento.type === HttpEventType.UploadProgress && evento.total) {
            aoProgredir?.(Math.round((evento.loaded / evento.total) * 100));
          } else if (evento.type === HttpEventType.Response) {
            const secureUrl = evento.body?.secure_url;
            if (secureUrl) {
              resolve(secureUrl);
            } else {
              reject(new Error('Resposta inesperada do Cloudinary.'));
            }
          }
        },
        error: (erro) => reject(erro),
      });
    });
  }
}
