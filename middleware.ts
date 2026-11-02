// @ts-nocheck
/* ==========================================================================
   AETIX DESIGN AI · middleware.ts  (o "porteiro": Vercel Routing Middleware)
   Roda ANTES de qualquer arquivo do site ser entregue (páginas, script.js, imagens...).
   Só deixa passar quem tiver o cookie de sessão válido, criado por api/sessao.js
   (conta logada + Termos aceitos). Sem cookie:
     - páginas (HTML)  -> redireciona para /login
     - outros arquivos -> responde 401 "Login necessário." (o conteúdo nem é enviado)

   PÚBLICO (não exige login): a tela de login e os arquivos que ela precisa,
   as páginas de termos/privacidade/sobre/colaboração e as rotas /api/ (que têm login próprio).
   Para liberar mais algum arquivo, acrescente o caminho EXATO na lista PUBLICOS abaixo.
   ========================================================================== */
import { next } from '@vercel/functions';

export const config = { runtime: 'nodejs' };

const COOKIE = '__Host-aetix';

const PUBLICOS = new Set([
  '/login', '/login.js', '/login.css',
  '/aetix-auth.js', '/firebase-config.js',
  '/favicon.ico', '/robots.txt', '/sitemap.xml'
]);
const PAGINAS_PUBLICAS = /^\/(termosprivacidade\/)?(privacidade|termos|sobre|colaboracao)(\.html)?$/;

function publico(caminho) {
  /* qualquer truque de caminho (%, \, .., //) é tratado como NÃO público */
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
    if (segredo.length < 32) return false;                       // sem a chave, ninguém passa
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

export default async function middleware(request) {
  const caminho = new URL(request.url).pathname;

  if (caminho === '/api' || caminho.startsWith('/api/')) return next();   // as rotas da API têm o login delas
  if (caminho.startsWith('/_vercel/')) return next();                     // arquivos internos da Vercel
  if (publico(caminho)) return next();
  if (await cookieValido(request.headers.get('cookie') || '')) return next();

  const ehPagina = /\.html$/.test(caminho) || !/\.[A-Za-z0-9]+$/.test(caminho);
  if (ehPagina) {
    return new Response(null, { status: 302, headers: { Location: '/login', 'Cache-Control': 'no-store' } });
  }
  return new Response('Login necessário.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
