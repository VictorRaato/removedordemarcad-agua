/* ==========================================================================
   AETIX DESIGN AI · aetix-auth.js  (liga o login do Firebase a todo o site)
   Carregue assim, no fim do <body> de cada página:
     <script src="/firebase-config.js"></script>
     <script type="module" src="/aetix-auth.js"></script>

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
  return fu ? { nome: limpar(fu.displayName, 60), email: limpar(fu.email, 120), foto: /^https:\/\//i.test(fu.photoURL || '') ? fu.photoURL : '' } : null;
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

  window.AETIX_AUTH = {
    ligado: true,
    login: envolve(async (d) => { await persist(d.lembrar); await A.signInWithEmailAndPassword(auth, d.email, d.senha); }),
    cadastro: envolve(async (d) => {
      if (!d.aceitou) throw { codigo: 'termos' };
      await persist(true);
      const r = await A.createUserWithEmailAndPassword(auth, d.email, d.senha);
      await A.updateProfile(r.user, { displayName: limpar(d.nome, 60) });
      aplicar(dePerfil(auth.currentUser)); gravarCache(dePerfil(auth.currentUser));
    }),
    /* por segurança, não revela se o e-mail existe */
    recuperar: (d) => Promise.resolve().then(() => A.sendPasswordResetEmail(auth, (d || {}).email)).catch((e) => {
      if (/user-not-found/.test((e && e.code) || '')) return; throw erro(e);
    }),
    google: envolve(async (d) => {
      await persist(true);
      const r = await A.signInWithPopup(auth, prov);
      /* conta nova só vale se os Termos foram aceitos; senão a conta recém-criada é apagada */
      const nova = A.getAdditionalUserInfo(r) && A.getAdditionalUserInfo(r).isNewUser;
      if (nova && !d.aceitou) { try { await A.deleteUser(r.user); } catch (e) { await A.signOut(auth); } throw { codigo: 'termos' }; }
    }),
    logout: envolve(async () => { await A.signOut(auth); }),
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
    if (!u && protegida) irLogin();
    /* quem já chega logado na tela de login vai direto ao app; quem acabou de entrar vê a tela "Bem-vindo" do login.js */
    else if (u && naLogin && primeira) location.replace(APP);
    primeira = false;
  });
}
