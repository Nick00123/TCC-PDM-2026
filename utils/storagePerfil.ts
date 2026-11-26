import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { headersAutenticados, SUPABASE_URL } from './sessao';

const BUCKET_AVATARES = 'avatars';
const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function caminhoCodificado(caminho: string): string {
  return caminho.split('/').map(encodeURIComponent).join('/');
}

async function verificarRespostaStorage(resposta: Response, operacao: string): Promise<void> {
  if (resposta.ok) return;

  const detalheErro = await resposta.text();
  throw new Error(`Não foi possível ${operacao} (${resposta.status}): ${detalheErro}`);
}

export async function enviarFotoPerfil(
  usuarioId: string,
  imagem: ImagePickerAsset
): Promise<string> {
  const extensaoArquivo = (imagem.fileName ?? imagem.uri).split('.').pop()?.toLowerCase();
  const tipoImagem = imagem.mimeType
    ?? (extensaoArquivo === 'png' ? 'image/png' : extensaoArquivo === 'webp' ? 'image/webp' : 'image/jpeg');
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(tipoImagem)) {
    throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
  }
  if (imagem.fileSize !== null && imagem.fileSize !== undefined && imagem.fileSize > TAMANHO_MAXIMO_IMAGEM_BYTES) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }

  const caminho = `${usuarioId}/avatar`;
  const arquivo = new File(imagem.uri);
  const conteudoImagem = await arquivo.arrayBuffer();
  if (conteudoImagem.byteLength > TAMANHO_MAXIMO_IMAGEM_BYTES) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }

  const cabecalhos = await headersAutenticados();
  const respostaDaApi = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET_AVATARES}/${caminhoCodificado(caminho)}`,
    {
      method: 'POST',
      headers: {
        ...cabecalhos,
        'Content-Type': tipoImagem,
        'x-upsert': 'true',
      },
      body: conteudoImagem,
    }
  );
  await verificarRespostaStorage(respostaDaApi, 'enviar a foto de perfil');

  return caminho;
}

export async function obterUrlFotoPerfil(caminho: string): Promise<string> {
  const respostaDaApi = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_AVATARES}/${caminhoCodificado(caminho)}`,
    {
      method: 'POST',
      headers: await headersAutenticados(),
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );
  await verificarRespostaStorage(respostaDaApi, 'carregar a foto de perfil');

  const dadosResposta = (await respostaDaApi.json()) as { signedURL?: unknown };
  if (typeof dadosResposta.signedURL !== 'string' || !dadosResposta.signedURL) {
    throw new Error('O Supabase não retornou uma URL válida para a foto de perfil.');
  }

  const caminhoAssinado = dadosResposta.signedURL.startsWith('/')
    ? dadosResposta.signedURL
    : `/${dadosResposta.signedURL}`;
  return `${SUPABASE_URL}/storage/v1${caminhoAssinado}`;
}
