// @ts-nocheck
/* ==========================================================================
   AETIX DESIGN AI · middleware.ts  (o "porteiro": Vercel Routing Middleware)
   Roda ANTES de qualquer arquivo do site ser entregue.
   1) Sem cookie de sessão válido: páginas -> /login ; outros arquivos -> 401.
   2) COM cookie: arquivos que não são página (script.js, css, imagens...) só são
      entregues quando o próprio app os carrega. Se alguém abrir o arquivo direto
      pela barra de endereço (ou em iframe), responde 403.
   Observação: isso esconde de curiosos, mas quem usa as ferramentas do navegador (F12)
   ainda enxerga o que o navegador baixa. Só o que roda no servidor (api/) fica realmente oculto.
   ========================================================================== */
import { next } from '@vercel/functions';

export const config = { runtime: 'nodejs' };

const COOKIE = '__Host-aetix';

const PUBLICOS = new Set([
  '/login', '/login.js', '/login.css',
  '/js/aetix-auth.js', '/js/firebase-config.js', '/js/aetix-tema.js',
  '/js/aetix-nota.js', '/js/aetix-voltar.js', '/js/aetix-colaboracao.js',
  /* página de confirmação: aberta por link de e-mail, muita vezes sem sessão */
  '/verificar', '/js/verificar.js',
  '/favicon.ico', '/robots.txt', '/sitemap.xml',
  /* imagem de compartilhamento: precisa ser pública, senão o link do site
     aparece sem imagem no WhatsApp, Instagram, Facebook, X e LinkedIn */
  '/logosapresentacao/og-image.png',
  '/logosapresentacao/og-image-halloween.png'
]);
const PAGINAS_PUBLICAS = /^\/(termosprivacidade\/)?(privacidade|termos|sobre|colaboracao)(\.html)?$/;

function publico(caminho) {
  if (/%|\\|\.\.|\/\//.test(caminho)) return false;
  const base = caminho.replace(/\.html$/, '');
  return PUBLICOS.has(caminho) || PUBLICOS.has(base) || PAGINAS_PUBLICAS.test(caminho);
}

function deBase64Url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function cookieValido(cabecalho) {
  try {
    const segredo = (globalThis.process && process.env && process.env.SESSAO_SECRET) || '';
    if (segredo.length < 32) return false;
    const m = cabecalho.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
    if (!m) return false;
    const partes = m[1].split('.');
    if (partes.length !== 2 || !partes[0] || !partes[1]) return false;
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', chave, deBase64Url(partes[1]), new TextEncoder().encode(partes[0]));
    if (!ok) return false;
    const dados = JSON.parse(new TextDecoder().decode(deBase64Url(partes[0])));
    return typeof dados.u === 'string' && dados.u.length > 0 && Number(dados.e) > Date.now() / 1000;
  } catch (e) {
    return false;
  }
}

/* o navegador informa como o arquivo está sendo aberto (Sec-Fetch-Dest) */
const ABERTURA_DIRETA = new Set(['document', 'iframe', 'frame', 'embed', 'object']);

export default async function middleware(request) {
  const caminho = new URL(request.url).pathname;

  if (caminho === '/api' || caminho.startsWith('/api/')) return next();
  if (caminho.startsWith('/_vercel/')) return next();
  if (publico(caminho)) return next();

  const ehPagina = /\.html$/.test(caminho) || !/\.[A-Za-z0-9]+$/.test(caminho);

  if (await cookieValido(request.headers.get('cookie') || '')) {
    if (!ehPagina) {
      const destino = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
      if (ABERTURA_DIRETA.has(destino)) {
        return new Response('Acesso negado.', {
          status: 403,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
    }
    return next();
  }

  if (ehPagina) {
    return new Response(null, { status: 302, headers: { Location: '/login', 'Cache-Control': 'no-store' } });
  }
  return new Response('Login necessário.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
