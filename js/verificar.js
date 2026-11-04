'use strict';
/* ==========================================================================
   AETIX DESIGN AI · js/verificar.js
   Página /verificar: recebe os links que o Firebase manda por e-mail.
     ?mode=verifyEmail     -> confirma o e-mail
     ?mode=resetPassword   -> pede a senha nova e salva
     ?mode=recoverEmail    -> desfaz a troca de e-mail
   Ao terminar, manda a pessoa direto para /login.
   Sem ?mode e ?oobCode: mostra um estado neutro com o botão de entrada.
   ========================================================================== */

const V = '10.14.1';
const CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';

const qs = new URLSearchParams(location.search);
const modo = (qs.get('mode') || '').trim();
const codigo = (qs.get('oobCode') || '').trim();

const idioma = (() => {
  const l = (qs.get('lang') || '').toLowerCase();
  if (l) return l.indexOf('pt') === 0 ? 'pt' : 'en';
  return (navigator.language || 'pt').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
})();
document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR';

const TXT = {
  pt: {
    confT: 'Confirmando seu link', confS: 'Só um instante.',
    emailT: 'E-mail confirmado', emailS: 'Sua conta está ativa. Estamos te levando para a tela de entrada.',
    senhaT: 'Criar nova senha', senhaS: 'Escolha uma senha nova para a sua conta.',
    senhaOkT: 'Senha atualizada', senhaOkS: 'Pronto. Use a nova senha para entrar.',
    recT: 'E-mail restaurado', recS: 'Seu endereço de e-mail voltou a ser o anterior.',
    prontoT: 'Tudo pronto', prontoS: 'Sua conta já pode ser usada. Estamos te levando para a tela de entrada.',
    erroT: 'Link inválido ou expirado', entrar: 'IR PARA A ENTRADA',
    nova: 'Nova senha', rep: 'Confirmar senha', ph: 'Mínimo 8 caracteres', ph2: 'Digite a senha de novo',
    salvar: 'SALVAR NOVA SENHA', para: 'Para',
    vazia: 'Digite a sua senha.', curta: 'A senha precisa ter pelo menos 8 caracteres.',
    difere: 'As senhas não são iguais. Confira e tente de novo.',
    errExp: 'Este link expirou. Peça um novo na tela de entrada.',
    errInv: 'Este link não vale mais. Ele já foi usado ou foi substituído por outro.',
    errUser: 'Não encontramos uma conta para este link.',
    errDis: 'Esta conta está desativada.',
    errRede: 'Sem conexão agora. Confira a internet e tente de novo.',
    errMuitas: 'Muitas tentativas em pouco tempo. Espere alguns minutos.',
    errGeral: 'Não foi possível concluir agora. Tente de novo em instantes.'
  },
  en: {
    confT: 'Confirming your link', confS: 'Just a moment.',
    emailT: 'Email confirmed', emailS: 'Your account is active. Taking you to the sign-in screen.',
    senhaT: 'Create a new password', senhaS: 'Choose a new password for your account.',
    senhaOkT: 'Password updated', senhaOkS: 'All set. Use your new password to sign in.',
    recT: 'Email restored', recS: 'Your email address is back to the previous one.',
    prontoT: 'All set', prontoS: 'Your account is ready to use. Taking you to the sign-in screen.',
    erroT: 'Invalid or expired link', entrar: 'GO TO SIGN IN',
    nova: 'New password', rep: 'Confirm password', ph: 'At least 8 characters', ph2: 'Type the password again',
    salvar: 'SAVE NEW PASSWORD', para: 'For',
    vazia: 'Enter your password.', curta: 'The password must have at least 8 characters.',
    difere: 'The passwords do not match. Check and try again.',
    errExp: 'This link has expired. Request a new one on the sign-in screen.',
    errInv: 'This link is no longer valid. It was already used or replaced by another one.',
    errUser: 'We could not find an account for this link.',
    errDis: 'This account is disabled.',
    errRede: 'No connection right now. Check your internet and try again.',
    errMuitas: 'Too many attempts in a short time. Wait a few minutes.',
    errGeral: 'We could not finish right now. Please try again in a moment.'
  }
}[idioma];

const ICONE = {
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.6 7 8.4 6 8.4-6"/>',
  lock: '<rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.4v.2"/>'
};

const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const view = document.getElementById('view');
const IR_ENTRAR = '<a class="cta" href="/login"><span>' + esc(TXT.entrar) + '</span></a>';

function tela(opt) {
  view.innerHTML =
    '<span class="badge ' + (opt.tipo || '') + '" aria-hidden="true">' + svg(ICONE[opt.icone || 'mail']) + '</span>' +
    '<h2>' + esc(opt.titulo) + '</h2>' +
    '<p class="sub">' + esc(opt.texto) + '</p>' +
    (opt.conta ? '<p class="conta">' + opt.conta + '</p>' : '') +
    (opt.corpo || '') +
    (opt.rodape || '');
}

function erroTela(detalhe) {
  tela({ icone: 'alert', tipo: 'err', titulo: TXT.erroT, texto: detalhe || TXT.errGeral, rodape: IR_ENTRAR });
}

function mensagem(e) {
  const c = String((e && e.code) || '');
  if (/expired-action-code/.test(c)) return TXT.errExp;
  if (/invalid-action-code/.test(c)) return TXT.errInv;
  if (/user-disabled/.test(c)) return TXT.errDis;
  if (/user-not-found/.test(c)) return TXT.errUser;
  if (/network-request-failed/.test(c)) return TXT.errRede;
  if (/too-many-requests/.test(c)) return TXT.errMuitas;
  if (/weak-password/.test(c)) return TXT.curta;
  if (/missing-password/.test(c)) return TXT.vazia;
  return TXT.errGeral;
}

function irParaLogin(ms) {
  setTimeout(() => { location.replace('/login'); }, ms || 1400);
}

/* ---------- carregar o Firebase só quando a página realmente precisa ---------- */
async function carregarFirebase() {
  const [{ initializeApp }, auth] = await Promise.all([
    import(CDN + 'firebase-app.js'),
    import(CDN + 'firebase-auth.js')
  ]);
  const cfg = window.AETIX_FIREBASE || {};
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) throw new Error('sem-config');
  return { auth: auth.getAuth(initializeApp(cfg)), M: auth };
}

/* ---------- formulário de nova senha ---------- */
function formularioSenha(email) {
  return '<form class="form" id="formaSenha" novalidate>' +
    '<label class="f"><span>' + esc(TXT.nova) + '</span>' +
      '<input id="p1" type="password" autocomplete="new-password" placeholder="' + esc(TXT.ph) + '" aria-label="' + esc(TXT.nova) + '"></label>' +
    '<label class="f"><span>' + esc(TXT.rep) + '</span>' +
      '<input id="p2" type="password" autocomplete="new-password" placeholder="' + esc(TXT.ph2) + '" aria-label="' + esc(TXT.rep) + '"></label>' +
    '<p class="msg" id="msgSenha" role="alert" aria-live="polite"></p>' +
    '<button class="cta" id="salvarSenha" type="submit"><span>' + esc(TXT.salvar) + '</span></button>' +
    '</form>';
}

function ligarFormulario(auth, M, email) {
  const forma = document.getElementById('formaSenha');
  const p1 = document.getElementById('p1');
  const p2 = document.getElementById('p2');
  const msg = document.getElementById('msgSenha');
  const botao = document.getElementById('salvarSenha');
  if (!forma || !p1 || !p2 || !msg || !botao) return;

  const aviso = (texto) => {
    msg.textContent = texto || '';
    p1.closest('.f').classList.toggle('bad', !!texto);
    p2.closest('.f').classList.toggle('bad', !!texto);
  };
  p1.addEventListener('input', () => aviso(''));
  p2.addEventListener('input', () => aviso(''));

  forma.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const a = p1.value;
    const b = p2.value;
    if (!a) return aviso(TXT.vazia);
    if (a.length < 8) return aviso(TXT.curta);
    if (a !== b) return aviso(TXT.difere);

    botao.disabled = true;
    botao.classList.add('busy');
    aviso('');
    try {
      await M.confirmPasswordReset(auth, codigo, a);
    } catch (e) {
      botao.disabled = false;
      botao.classList.remove('busy');
      const c = String((e && e.code) || '');
      if (/expired-action-code|invalid-action-code|user-disabled|user-not-found/.test(c)) return erroTela(mensagem(e));
      return aviso(mensagem(e));
    }
    tela({ icone: 'check', tipo: 'ok', titulo: TXT.senhaOkT, texto: TXT.senhaOkS });
    irParaLogin(1600);
  });

  p1.focus();
}

/* ---------- fluxo principal ---------- */
async function iniciar() {
  tela({ icone: 'mail', tipo: 'gira', titulo: TXT.confT, texto: TXT.confS });

  if (!modo || !codigo) {
    /* caso comum da verificação: o Firebase confirma no endereço dele e só depois
       manda para cá, sem parâmetros. A conta já está confirmada: seguir para o login. */
    tela({ icone: 'check', tipo: 'ok', titulo: TXT.prontoT, texto: TXT.prontoS, rodape: IR_ENTRAR });
    irParaLogin(2600);
    return;
  }

  let fb;
  try {
    fb = await carregarFirebase();
  } catch (e) {
    try { console.warn('[verificar] nao foi possivel carregar:', (e && e.message) || e); } catch (x) {}
    erroTela(TXT.errRede);
    return;
  }
  const { auth, M } = fb;

  if (modo === 'verifyEmail') {
    try {
      await M.applyActionCode(auth, codigo);
    } catch (e) {
      try { console.warn('[verificar] verifyEmail:', e && e.code); } catch (x) {}
      return erroTela(mensagem(e));
    }
    tela({ icone: 'check', tipo: 'ok', titulo: TXT.emailT, texto: TXT.emailS });
    return irParaLogin(1400);
  }

  if (modo === 'resetPassword') {
    let email = '';
    try {
      email = await M.verifyPasswordResetCode(auth, codigo);
    } catch (e) {
      try { console.warn('[verificar] resetPassword:', e && e.code); } catch (x) {}
      return erroTela(mensagem(e));
    }
    tela({
      icone: 'lock',
      tipo: '',
      titulo: TXT.senhaT,
      texto: TXT.senhaS,
      conta: esc(TXT.para) + ' <b>' + esc(email) + '</b>',
      corpo: formularioSenha(email)
    });
    return ligarFormulario(auth, M, email);
  }

  if (modo === 'recoverEmail') {
    let restaurado = '';
    try {
      const info = await M.checkActionCode(auth, codigo);
      restaurado = (info && info.data && info.data.email) || '';
      await M.applyActionCode(auth, codigo);
    } catch (e) {
      try { console.warn('[verificar] recoverEmail:', e && e.code); } catch (x) {}
      return erroTela(mensagem(e));
    }
    tela({
      icone: 'check',
      tipo: 'ok',
      titulo: TXT.recT,
      texto: TXT.recS,
      conta: restaurado ? esc(TXT.para) + ' <b>' + esc(restaurado) + '</b>' : ''
    });
    return irParaLogin(1600);
  }

  /* modo desconhecido (ex.: signIn antigo): estado neutro */
  tela({ icone: 'check', tipo: 'ok', titulo: TXT.prontoT, texto: TXT.prontoS, rodape: IR_ENTRAR });
  irParaLogin(2600);
}

iniciar();
