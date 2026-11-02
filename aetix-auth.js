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
const V = '10.14.1';
const CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';
const CACHE = 'aetix-user-cache';
const cfg = window.AETIX_FIREBASE || {};
const ligado = !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

function aplicar(u) {
  window.AETIX_USER = u;
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
  const prov = new A.GoogleAuthProvider();
  prov.setCustomParameters({ prompt: 'select_account' });

  const persist = (lembrar) => A.setPersistence(auth, lembrar === false ? A.browserSessionPersistence : A.browserLocalPersistence);
  const envolve = (fn) => (d) => Promise.resolve().then(() => fn(d || {})).catch((e) => { throw erro(e); });

  window.AETIX_AUTH = {
    ligado: true,
    login: envolve(async (d) => { await persist(d.lembrar); await A.signInWithEmailAndPassword(auth, d.email, d.senha); }),
    cadastro: envolve(async (d) => {
      await persist(true);
      const r = await A.createUserWithEmailAndPassword(auth, d.email, d.senha);
      await A.updateProfile(r.user, { displayName: limpar(d.nome, 60) });
      aplicar(dePerfil(auth.currentUser)); gravarCache(dePerfil(auth.currentUser));
    }),
    /* por segurança, não revela se o e-mail existe */
    recuperar: (d) => Promise.resolve().then(() => A.sendPasswordResetEmail(auth, (d || {}).email)).catch((e) => {
      if (/user-not-found/.test((e && e.code) || '')) return; throw erro(e);
    }),
    google: envolve(async () => { await persist(true); await A.signInWithPopup(auth, prov); }),
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
