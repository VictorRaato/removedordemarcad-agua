/* ==========================================================================
   AETIX DESIGN AI · aetix-auth.js  (liga o login do Firebase a todo o site)
   Carregue assim, no fim do <body> de cada página:
     <script src="/js/firebase-config.js"></script>
     <script type="module" src="/js/aetix-auth.js"></script>

   O que ele faz:
   - cria window.AETIX_AUTH (o contrato que o login.js já usa) + logout() e excluir()
   - quando alguém entra/sai, atualiza o site:
       window.AETIX_USER = { nome, email, foto } | null
       aetixSetUser(nome)  -> "Olá, Nome!" no menu
       aetixPerfil.set(..) -> tela de perfil
       evento 'aetix:user' (detail = usuário ou null)
   - guarda um cache (nome/e-mail/foto) no aparelho só para a tela não piscar "visitante" ao abrir
   ========================================================================== */
/* ANIMAÇÕES: botão no menu liga/desliga. Salvo em localStorage 'aetix-anim' ('on'|'off').
   Sem escolha do usuário: computador = ligadas, celular = desligadas. Desligado remove enfeites, animações e desfoques. */
(function () {
  var KEY = 'aetix-anim', d = document.documentElement;
  function celular() { try { return (window.matchMedia && matchMedia('(pointer:coarse)').matches) || Math.min(screen.width, screen.height) < 700; } catch (e) { return false; } }
  function lerPref() { try { var v = localStorage.getItem(KEY); return v === 'on' || v === 'off' ? v : null; } catch (e) { return null; } }
  function ligadas() { var p = lerPref(); return p ? p === 'on' : !celular(); }
  function lang() { var s = document.getElementById('uiLang'), v = s && s.value; if (!v) { try { v = localStorage.getItem('aetix-lang'); } catch (e) {} } return v === 'en' ? 'en' : 'pt'; }
  function aplicar() {
    var on = ligadas();
    d.classList.toggle('sem-anim', !on);
    var rot = lang() === 'en' ? (on ? 'Animations: on' : 'Animations: off') : (on ? 'Animações: ligadas' : 'Animações: desligadas');
    [].forEach.call(document.querySelectorAll('#animToggle'), function (b) { var sp = b.querySelector('span'); if (sp) sp.textContent = rot; b.setAttribute('aria-pressed', String(on)); });
    [].forEach.call(document.querySelectorAll('[data-anim]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-anim') === (on ? 'on' : 'off'))); });
  }
  function definir(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} aplicar(); window.dispatchEvent(new CustomEvent('aetix:anim', { detail: on })); }
  window.aetixAnim = { ligadas: ligadas, definir: definir };
  d.classList.toggle('sem-anim', !ligadas());   /* o mais cedo possível */
  var st = document.createElement('style');
  var X = ':not(#splash):not(#splash *):not(.busy):not([class*="spin"]):not([class*="load"]):not([class*="progress"])';
  st.textContent =
    'html.sem-anim ' + X + ',html.sem-anim ' + X + '::before,html.sem-anim ' + X + '::after{animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;text-shadow:none!important}' +
    'html.sem-anim .deco,html.sem-anim .bat,html.sem-anim .stars,html.sem-anim .moon,html.sem-anim .hill,html.sem-anim .web,html.sem-anim .pumpkin{display:none!important}' +
    'html.sem-anim .card,html.sem-anim .logo,html.sem-anim .avatar{filter:none!important}';
  (document.head || d).appendChild(st);
  function ligarBotoes() {
    aplicar();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('#animToggle,[data-anim]'); if (!t) return;
      definir(t.id === 'animToggle' ? !ligadas() : t.getAttribute('data-anim') === 'on');
    });
    var pb = document.getElementById('profileBtn'); if (pb) pb.addEventListener('click', function () { setTimeout(aplicar, 0); });
    var ul = document.getElementById('uiLang'); if (ul) ul.addEventListener('change', function () { setTimeout(aplicar, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligarBotoes); else ligarBotoes();
})();

const V = '10.14.1';
const CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';
const CACHE = 'aetix-user-cache';
const cfg = window.AETIX_FIREBASE || {};
const ligado = !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

/* ENVIA O TOKEN DE LOGIN nas chamadas a /api/ (o script.js continua igual).
   Fica antes do login carregar de propósito: a chamada espera o Firebase ficar pronto. */
let _resolverAuth;
const authPronta = new Promise((r) => { _resolverAuth = r; });
const fetchOriginal = window.fetch.bind(window);
window.fetch = async function (entrada, opcoes) {
  let eApi = false;
  try {
    const alvo = (typeof entrada === 'string' || entrada instanceof URL) ? String(entrada) : (entrada && entrada.url);
    const u = new URL(alvo, location.href);
    eApi = ligado && u.origin === location.origin && u.pathname.indexOf('/api/') === 0;
  } catch (e) {}
  if (!eApi) return fetchOriginal(entrada, opcoes);
  let token = '';
  try {
    const pronta = authPronta.then((a) => (a && a.authStateReady ? a.authStateReady().then(() => a) : a));
    const auth = await Promise.race([pronta, new Promise((r) => setTimeout(() => r(null), 10000))]);
    if (auth && auth.currentUser) token = await auth.currentUser.getIdToken();
  } catch (e) {}
  if (!token) return fetchOriginal(entrada, opcoes);   // sem sessão: o servidor responde 401
  const req = new Request(entrada, opcoes);
  req.headers.set('Authorization', 'Bearer ' + token);
  return fetchOriginal(req);
};

/* foto (ou inicial) do usuário no botão de conta do menu, igual ao avatar do perfil */
let btnOriginal = null, btnChave = null;
function avatarMenu(u) {
  const b = document.getElementById('profileBtn'); if (!b) return;
  if (btnOriginal === null) {
    btnOriginal = b.innerHTML;
    const st = document.createElement('style');
    st.textContent = '#profileBtn{overflow:hidden}#profileBtn img{width:100%;height:100%;object-fit:cover;display:block}#profileBtn b{font:800 .95rem/1 Inter,system-ui,sans-serif;color:var(--ink,#fff)}';
    document.head.appendChild(st);
  }
  const foto = u && /^https:\/\//i.test(u.foto || '') ? u.foto : '';
  const ini = u ? String(u.nome || u.email || '').trim().charAt(0).toUpperCase() : '';
  const chave = foto + '|' + ini;
  if (chave === btnChave) return;
  btnChave = chave;
  if (foto) {
    b.textContent = '';
    const img = new Image(); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = foto;
    img.onerror = () => { b.textContent = ''; const t = document.createElement('b'); t.textContent = ini; b.appendChild(t); };
    b.appendChild(img);
  } else if (ini) { b.textContent = ''; const t = document.createElement('b'); t.textContent = ini; b.appendChild(t); }
  else b.innerHTML = btnOriginal;
}
function aplicar(u) {
  window.AETIX_USER = u;
  try { avatarMenu(u); } catch (e) {}
  try { if (typeof window.aetixSetUser === 'function') window.aetixSetUser(u ? (u.nome || u.email || '') : ''); } catch (e) {}
  try { if (window.aetixPerfil) window.aetixPerfil.set(u); } catch (e) {}
  window.dispatchEvent(new CustomEvent('aetix:user', { detail: u }));
}
function lerCache() { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) { return null; } }
function gravarCache(u) { try { u ? localStorage.setItem(CACHE, JSON.stringify(u)) : localStorage.removeItem(CACHE); } catch (e) {} }
function limpar(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n || 120); }
function dePerfil(fu) {
  return fu ? { nome: limpar(fu.displayName, 60), email: limpar(fu.email, 120), foto: /^https:\/\//i.test(fu.photoURL || '') ? fu.photoURL : '', verificado: !!fu.emailVerified } : null;
}

/* ===== E-MAIL CONFIRMADO =====
   Contas criadas a partir de 05/11/2026 precisam confirmar o e-mail antes de usar
   IA, Pix e avaliação. Contas anteriores seguem liberadas (mesma data usada em api/_auth.js). */
const CORTE_EMAIL = Date.parse('2026-11-04T00:00:00Z');
function precisaVerificar(fu) {
  if (!fu || fu.emailVerified) return false;
  const criada = Date.parse(String((fu.metadata && fu.metadata.creationTime) || ''));
  return !(Number.isFinite(criada) && criada < CORTE_EMAIL);
}
function erro(e) {
  const c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|user-disabled|missing-password/.test(c)) return { codigo: 'credenciais' };
  if (/email-already-in-use/.test(c)) return { codigo: 'email_em_uso' };
  if (/too-many-requests/.test(c)) return { codigo: 'limite' };
  if (e && e.codigo === 'termos') return { codigo: 'termos' };
  if (/network-request-failed/.test(c)) return { codigo: 'rede' };
  return { codigo: 'outro', original: c };
}

/* LOGIN OBRIGATÓRIO: páginas do app só abrem com conta; termos/privacidade/sobre continuam públicos */
const LOGIN = '/login';
const APP = '/inicial/';
const caminho = location.pathname.replace(/\/+$/, '') || '/';
const naLogin = /^\/login(\.html)?$/.test(caminho);
const protegida = caminho === '/' || /^\/(inicial|index|perfil)(\.html)?(\/|$)/.test(caminho);
function irLogin() { if (!naLogin) location.replace(LOGIN); }

/* o cache só vale se o login estiver ligado; se estiver desligado, o site segue como visitante */
if (!ligado) {
  window.AETIX_AUTH = { login: off, cadastro: off, recuperar: off, google: off, logout: off, excluir: off, ligado: false };
  function off() { return Promise.reject({ codigo: 'outro', original: 'firebase-nao-configurado' }); }
  aplicar(null);
} else {
  const cacheado = lerCache();
  if (cacheado) aplicar(cacheado);
  else if (protegida) irLogin();

  const [{ initializeApp }, A] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js')]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  _resolverAuth(auth);
  const prov = new A.GoogleAuthProvider();
  prov.setCustomParameters({ prompt: 'select_account' });

  const persist = (lembrar) => A.setPersistence(auth, lembrar === false ? A.browserSessionPersistence : A.browserLocalPersistence);
  const envolve = (fn) => (d) => Promise.resolve().then(() => fn(d || {})).catch((e) => { throw erro(e); });

  /* ===== ACEITE DOS TERMOS =====
     O aceite é gravado no servidor (api/aceite.js). Aqui só pedimos e mostramos a tela.
     Contas que ainda não aceitaram a versão atual veem a tela abaixo antes de usar o site. */
  const TXT_ACEITE = {
    pt: { t: 'Aceite os Termos para continuar', p: 'Para usar o AETIX DESIGN AI, leia e aceite os Termos de Uso e a Política de Privacidade.', a: 'Li e aceito os ', termos: 'Termos de Uso', e: ' e a ', priv: 'Política de Privacidade', ok: 'Aceitar e continuar', sair: 'Sair da conta', erro: 'Não foi possível salvar agora. Tente de novo.', v: 'Versão dos termos: ' },
    en: { t: 'Accept the Terms to continue', p: 'To use AETIX DESIGN AI, please read and accept the Terms of Use and the Privacy Policy.', a: 'I have read and accept the ', termos: 'Terms of Use', e: ' and the ', priv: 'Privacy Policy', ok: 'Accept and continue', sair: 'Sign out', erro: 'Could not save right now. Please try again.', v: 'Terms version: ' }
  };
  function idiomaAceite() {
    let v = null;
    try { v = localStorage.getItem('aetix-lang'); } catch (e) {}
    const s = document.getElementById('uiLang'); if (s && s.value) v = s.value;
    return v === 'en' ? 'en' : 'pt';
  }
  async function statusAceite() {
    const r = await fetch('/api/aceite', { cache: 'no-store' });
    if (!r.ok) throw new Error('aceite ' + r.status);
    return r.json();
  }
  async function enviarAceite(s, origem) {
    return fetch('/api/aceite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aceitou: true, termos: s.termos, privacidade: s.privacidade, origem: origem })
    });
  }
  /* usado no cadastro e no Google: o usuário acabou de marcar a caixa, então grava na hora */
  async function gravarAceite(origem) {
    const s = await statusAceite();
    if (s && s.ok && !s.aceito) await enviarAceite(s, origem);
  }

  /* estilo comum aos dois avisos: aceite dos Termos e confirmação de e-mail */
  function cssModais() {
    if (document.getElementById('aetixAceiteCss')) return;
    const R = (sel) => '#aetixAceite' + sel + ',#aetixEmail' + sel;   // mesma regra nos dois avisos
    const st = document.createElement('style'); st.id = 'aetixAceiteCss';
    st.textContent =
      R('') + '{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(5,6,10,.94)}' +
      R(' .ax-box') + '{width:min(100%,440px);padding:24px 22px 20px;border-radius:22px;border:1px solid rgba(255,255,255,.14);background:#0E0F16;color:#F2F4F8;font:400 15px/1.55 Inter,system-ui,sans-serif;box-shadow:0 40px 90px -30px rgba(0,0,0,.9),0 0 40px -18px rgba(124,140,255,.6)}' +
      R(' h2') + '{margin:0 0 8px;font:800 1.3rem/1.2 Inter,system-ui,sans-serif}' +
      R(' p') + '{margin:0 0 14px;color:#98A1B3}' +
      R(' .ax-chk') + '{display:flex;gap:10px;align-items:flex-start;cursor:pointer;color:#D6DAE6;font-size:.92rem;margin:0 0 6px}' +
      R(' .ax-chk input') + '{width:18px;height:18px;margin:2px 0 0;flex:none;accent-color:#7C8CFF}' +
      R(' a') + '{color:#6FB6FF}' +
      R(' .ax-msg') + '{min-height:1.2em;margin:4px 0 10px;color:#FF6B83;font-size:.82rem}' +
      R(' .ax-ok') + '{width:100%;height:50px;border:0;border-radius:14px;cursor:pointer;font:800 1rem Inter,system-ui,sans-serif;letter-spacing:.03em;color:#04101A;background:linear-gradient(135deg,#2EE6FF,#7C8CFF 70%,#9B6BFF)}' +
      R(' .ax-ok:disabled') + '{opacity:.45;cursor:not-allowed}' +
      R(' .ax-alt') + '{width:100%;height:46px;margin:10px 0 0;border:1px solid rgba(255,255,255,.18);border-radius:14px;cursor:pointer;background:none;color:#E6E9F2;font:700 .95rem Inter,system-ui,sans-serif}' +
      R(' .ax-alt:disabled') + '{opacity:.45;cursor:not-allowed}' +
      R(' .ax-sair') + '{display:block;margin:12px auto 0;padding:0;background:none;border:0;color:#98A1B3;cursor:pointer;font:inherit;font-size:.86rem;text-decoration:underline}' +
      R(' .ax-v') + '{margin:12px 0 0;text-align:center;color:#6B7385;font-size:.72rem}';
    document.head.appendChild(st);
  }

  let aceiteAberto = false;
  function mostrarAceite(s, aoConcluir) {
    if (aceiteAberto) return;
    aceiteAberto = true;
    const T = TXT_ACEITE[idiomaAceite()];
    cssModais();
    const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };
    const link = (href, txt) => { const a = el('a', '', txt); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; };

    const ov = el('div'); ov.id = 'aetixAceite'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'axT');
    const box = el('div', 'ax-box');
    const h = el('h2', '', T.t); h.id = 'axT';
    const chk = el('label', 'ax-chk');
    const cb = document.createElement('input'); cb.type = 'checkbox';
    const sp = el('span');
    sp.appendChild(document.createTextNode(T.a));
    sp.appendChild(link('/termosprivacidade/termos', T.termos));
    sp.appendChild(document.createTextNode(T.e));
    sp.appendChild(link('/termosprivacidade/privacidade', T.priv));
    sp.appendChild(document.createTextNode('.'));
    chk.appendChild(cb); chk.appendChild(sp);
    const msg = el('p', 'ax-msg'); msg.setAttribute('role', 'alert');
    const ok = el('button', 'ax-ok', T.ok); ok.type = 'button'; ok.disabled = true;
    const sair = el('button', 'ax-sair', T.sair); sair.type = 'button';
    const ver = el('p', 'ax-v', T.v + String(s.termos || ''));
    box.appendChild(h); box.appendChild(el('p', '', T.p)); box.appendChild(chk); box.appendChild(msg);
    box.appendChild(ok); box.appendChild(sair); box.appendChild(ver);
    ov.appendChild(box);
    document.body.appendChild(ov);
    const overflowAntes = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    cb.focus();

    const fechar = () => { ov.remove(); document.documentElement.style.overflow = overflowAntes; aceiteAberto = false; };
    cb.addEventListener('change', () => { ok.disabled = !cb.checked; });
    box.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = [].slice.call(box.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)'));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    ok.addEventListener('click', async () => {
      if (!cb.checked) return;
      ok.disabled = true; msg.textContent = '';
      try {
        const r = await enviarAceite(s, 'tela');
        if (r.ok) { fechar(); if (typeof aoConcluir === 'function') aoConcluir(); return; }
        if (r.status === 409) { fechar(); verificarAceite(); return; }   // a versão mudou enquanto a tela estava aberta
        msg.textContent = T.erro;
      } catch (e) { msg.textContent = T.erro; }
      ok.disabled = !cb.checked;
    });
    sair.addEventListener('click', async () => {
      sair.disabled = true;
      try { await window.AETIX_AUTH.logout(); } catch (e) {}
      fechar();
      irLogin();
    });
  }
  async function verificarAceite() {
    if (aceiteAberto) return;
    try {
      const s = await statusAceite();
      if (s && s.ok && s.aceito === false) mostrarAceite(s);
    } catch (e) { /* sem rede ou sessão expirada: o servidor continua barrando as rotas protegidas */ }
  }

  /* ===== CONFIRMAÇÃO DE E-MAIL =====
     Contas novas ficam sem IA, Pix e avaliação até confirmar o e-mail (api/_auth.js).
     Aqui só explicamos, reenviamos o link e conferimos se já foi confirmado. */
  const TXT_EMAIL = {
    pt: { t: 'Confirme seu e-mail', p: 'Enviamos um link de confirmação para ', p2: '. Abra sua caixa de entrada — se não encontrar, olhe o spam — e clique no link para usar as ferramentas da plataforma.', ok: 'Já confirmei', reenviar: 'Reenviar e-mail', sair: 'Sair da conta', enviado: 'E-mail enviado. Confira a caixa de entrada e o spam.', nao: 'Ainda não confirmado. Abra o link do e-mail e toque em “Já confirmei”.', limite: 'Muitos envios em pouco tempo. Aguarde alguns minutos.', erro: 'Não foi possível agora. Tente de novo em instantes.' },
    en: { t: 'Confirm your email', p: 'We sent a confirmation link to ', p2: '. Open your inbox — check the spam folder if you can’t find it — and click the link to use the platform tools.', ok: 'I already confirmed', reenviar: 'Resend email', sair: 'Sign out', enviado: 'Email sent. Check your inbox and spam folder.', nao: 'Not confirmed yet. Open the email link and tap “I already confirmed”.', limite: 'Too many sends in a short time. Wait a few minutes.', erro: 'Could not do that right now. Please try again in a moment.' }
  };
  /* Envia e-mails do Firebase com a página do site (/verificar) como destino.
     Se o projeto recusar a URL, repete sem ela: melhor um e-mail sem o destino
     no fim do que nenhum e-mail chegando. */
  async function enviarComDestino(envio) {
    const url = location.origin + '/verificar';
    try {
      return await envio(url);
    } catch (e) {
      if (!/unauthorized-continue-uri|invalid-continue-uri/.test((e && e.code) || '')) throw e;
      return await envio(null);
    }
  }
  function enviarVerificacao(fu) {
    return enviarComDestino((url) => (url ? A.sendEmailVerification(fu, { url }) : A.sendEmailVerification(fu)));
  }
  let emailAberto = false;
  function mostrarVerificacao(fu, aoConfirmar) {
    if (emailAberto || !fu) return;
    emailAberto = true;
    const T = TXT_EMAIL[idiomaAceite()];
    cssModais();
    const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };

    const ov = el('div'); ov.id = 'aetixEmail'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'axE');
    const box = el('div', 'ax-box');
    const h = el('h2', '', T.t); h.id = 'axE';
    const p = el('p');
    p.appendChild(document.createTextNode(T.p));
    const b = el('strong', '', String(fu.email || ''));
    p.appendChild(b);
    p.appendChild(document.createTextNode(T.p2));
    const msg = el('p', 'ax-msg'); msg.setAttribute('role', 'alert'); msg.setAttribute('aria-live', 'polite');
    const ok = el('button', 'ax-ok', T.ok); ok.type = 'button';
    const reenviar = el('button', 'ax-alt', T.reenviar); reenviar.type = 'button';
    const sair = el('button', 'ax-sair', T.sair); sair.type = 'button';
    box.appendChild(h); box.appendChild(p); box.appendChild(msg);
    box.appendChild(ok); box.appendChild(reenviar); box.appendChild(sair);
    ov.appendChild(box);
    document.body.appendChild(ov);
    const overflowAntes = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    ok.focus();

    const fechar = () => { ov.remove(); document.documentElement.style.overflow = overflowAntes; emailAberto = false; };
    const aviso = (texto, bom) => { msg.textContent = texto; msg.style.color = bom ? '#41D6A0' : ''; };
    box.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = [].slice.call(box.querySelectorAll('button:not(:disabled),a[href]'));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    reenviar.addEventListener('click', async () => {
      reenviar.disabled = true; aviso('');
      try { await enviarVerificacao(fu); aviso(T.enviado, true); }
      catch (e) {
        try { console.warn('[auth] reenvio da verificacao falhou:', e && e.code); } catch (x) {}
        aviso(/too-many-requests/.test((e && e.code) || '') ? T.limite : T.erro, false);
      }
      reenviar.disabled = false;
    });
    ok.addEventListener('click', async () => {
      ok.disabled = true; aviso('');
      try {
        await fu.reload();
        if (fu.emailVerified) {
          try { await fu.getIdToken(true); } catch (e) {}
          fechar();
          if (typeof aoConfirmar === 'function') aoConfirmar();
          return;
        }
        aviso(T.nao, false);
      } catch (e) { aviso(T.erro, false); }
      ok.disabled = false;
    });
    sair.addEventListener('click', async () => {
      sair.disabled = true;
      try { await window.AETIX_AUTH.logout(); } catch (e) {}
      fechar();
      irLogin();
    });
  }

  /* ===== SESSÃO DO SITE (cookie do "porteiro") =====
     Depois do login e do aceite, o servidor grava um cookie assinado (api/sessao.js).
     Sem ele, a Vercel não entrega páginas, scripts nem imagens do app. */
  function lerLembrar() { try { return localStorage.getItem('aetix-lembrar') !== '0'; } catch (e) { return true; } }
  function guardarLembrar(v) { try { localStorage.setItem('aetix-lembrar', v ? '1' : '0'); } catch (e) {} }
  async function criarSessao(lembrar) {
    const r = await fetch('/api/sessao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lembrar: lembrar !== false })
    });
    return r.ok ? r.json() : null;   // { ok, aceito }
  }
  function limparSessao() {
    return fetch('/api/sessao', { method: 'DELETE', keepalive: true }).catch(() => {});
  }
  /* trava anti-loop: se o app já nos mandou de volta ao login 3 vezes em 60 s, para de redirecionar */
  function loopDetectado() {
    try {
      const agora = Date.now();
      let d = JSON.parse(sessionStorage.getItem('aetix-vai') || 'null');
      if (!d || agora - d.t > 60000) d = { t: agora, n: 0 };
      d.n++;
      sessionStorage.setItem('aetix-vai', JSON.stringify(d));
      return d.n > 3;
    } catch (e) { return false; }
  }
  function avisoLoop() {
    if (document.getElementById('aetixLoop')) return;
    const d = document.createElement('div'); d.id = 'aetixLoop';
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483500;padding:12px 14px;border-radius:12px;background:#3a1218;color:#fff;font:14px system-ui,sans-serif;text-align:center';
    d.textContent = 'Não foi possível abrir o app agora. Recarregue a página em alguns instantes.';
    document.body.appendChild(d);
  }
  /* já logado ao abrir a tela de login: cria o cookie e entra no app (ou pede o aceite dos Termos) */
  async function entrarNoApp() {
    try {
      if (loopDetectado()) { avisoLoop(); return; }
      const s = await criarSessao(lerLembrar());
      if (!s) return;
      if (precisaVerificar(auth.currentUser)) { mostrarVerificacao(auth.currentUser, () => entrarNoApp()); return; }
      if (s.aceito) { location.replace(APP); return; }
      const st = await statusAceite();
      if (st && st.ok && !st.aceito) {
        mostrarAceite(st, async () => {
          const s2 = await criarSessao(lerLembrar());
          if (s2 && s2.aceito) location.replace(APP);
        });
      }
    } catch (e) { /* fica na tela de login */ }
  }
  /* páginas do app: renova o cookie a cada visita (24 h a partir do último uso) */
  function renovarSessao() { criarSessao(lerLembrar()).catch(() => {}); }

  window.AETIX_AUTH = {
    ligado: true,
    login: envolve(async (d) => {
      await persist(d.lembrar);
      await A.signInWithEmailAndPassword(auth, d.email, d.senha);
      guardarLembrar(d.lembrar !== false);
      try { await criarSessao(d.lembrar !== false); } catch (e) { /* sem cookie, o porteiro manda de volta ao login */ }
    }),
    cadastro: envolve(async (d) => {
      if (!d.aceitou) throw { codigo: 'termos' };
      await persist(true);
      const r = await A.createUserWithEmailAndPassword(auth, d.email, d.senha);
      await A.updateProfile(r.user, { displayName: limpar(d.nome, 60) });
      /* manda o link de confirmação; se falhar, a tela de confirmação oferece reenviar */
      try { await enviarVerificacao(r.user); }
      catch (e) { try { console.warn('[auth] envio da verificacao falhou:', e && e.code); } catch (x) {} }
      try { await gravarAceite('cadastro'); } catch (e) { /* se falhar, a tela de aceite aparece ao entrar */ }
      guardarLembrar(true);
      try { await criarSessao(true); } catch (e) {}
      aplicar(dePerfil(auth.currentUser)); gravarCache(dePerfil(auth.currentUser));
    }),
    /* por segurança, não revela se o e-mail existe */
    recuperar: (d) => Promise.resolve()
      .then(() => enviarComDestino((url) => (url
        ? A.sendPasswordResetEmail(auth, (d || {}).email, { url })
        : A.sendPasswordResetEmail(auth, (d || {}).email))))
      .catch((e) => {
        if (/user-not-found/.test((e && e.code) || '')) return; throw erro(e);
      }),
    google: envolve(async (d) => {
      await persist(true);
      const r = await A.signInWithPopup(auth, prov);
      /* conta nova só vale se os Termos foram aceitos; senão a conta recém-criada é apagada */
      const nova = A.getAdditionalUserInfo(r) && A.getAdditionalUserInfo(r).isNewUser;
      if (nova && !d.aceitou) { try { await A.deleteUser(r.user); } catch (e) { await A.signOut(auth); } throw { codigo: 'termos' }; }
      if (nova && d.aceitou) { try { await gravarAceite('google'); } catch (e) { /* idem */ } }
      guardarLembrar(true);
      try { await criarSessao(true); } catch (e) {}
    }),
    logout: envolve(async () => { await limparSessao(); await A.signOut(auth); }),
    excluir: envolve(async () => {
      const u = auth.currentUser; if (!u) return;
      try { await A.deleteUser(u); }
      catch (e) {
        if (!/requires-recent-login/.test((e && e.code) || '')) throw e;
        const usaGoogle = u.providerData.some((p) => p.providerId === 'google.com');
        if (!usaGoogle) throw { codigo: 'outro', original: 'auth/requires-recent-login' };
        await A.reauthenticateWithPopup(u, prov); await A.deleteUser(u);
      }
    })
  };

  let primeira = true;
  A.onAuthStateChanged(auth, (fu) => {
    const u = dePerfil(fu); gravarCache(u); aplicar(u);
    if (!u) limparSessao();   /* sem conta: apaga qualquer cookie antigo do porteiro */
    if (!u && protegida) irLogin();
    /* quem já chega logado na tela de login vai direto ao app; quem acabou de entrar vê a tela "Bem-vindo" do login.js */
    else if (u && naLogin && primeira) entrarNoApp();
    primeira = false;
    if (u && protegida) {
      renovarSessao();   /* renova o cookie */
      if (precisaVerificar(fu)) mostrarVerificacao(fu, () => location.reload());
      else verificarAceite();   /* conta sem aceite da versão atual vê a tela de aceite */
    }
  });
}
