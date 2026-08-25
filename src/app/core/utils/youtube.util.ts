// Extrai e valida o identificador de vídeos do YouTube a partir de URLs
// coladas pelo editor no formulário de atualização. Não há upload de vídeo,
// o Firestore guarda só o link informado e essas funções derivam o resto
// (id, embed, miniatura) na hora de exibir.

const REGEX_YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extrairIdYoutube(url: string): string | null {
  const match = url?.trim().match(REGEX_YOUTUBE);
  return match ? match[1] : null;
}

export function ehLinkYoutubeValido(url: string): boolean {
  return extrairIdYoutube(url) !== null;
}

export function urlEmbedYoutube(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

export function urlThumbnailYoutube(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
