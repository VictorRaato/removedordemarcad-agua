'use strict';
/* ==========================================================================
   AETIX DESIGN AI · login.js
   Página de login/cadastro, ligada ao Firebase por /aetix-auth.js (que cria window.AETIX_AUTH).

   O QUE MEXER DEPOIS:
   - Tema ao abrir ........ CONFIG.temaPadrao  (ou ?tema=padrao / ?tema=halloween na URL)
   - Textos / idiomas ..... objeto TEXTOS (pt e en). "chave@halloween" vale só nesse tema.
   - Ligar ao site ........ defina CONFIG.demo = false e crie window.AETIX_AUTH (veja "CONTRATO").
   - Para onde vai depois . CONFIG.destino

   CONTRATO DO AETIX_AUTH (cada função devolve uma Promise):
     login({ email, senha, lembrar })   cadastro({ nome, email, senha })
     recuperar({ email })               google()
   Para falhar com mensagem bonita, rejeite com { codigo }:
     'credenciais' | 'email_em_uso' | 'limite' | 'rede'   (qualquer outro vira a mensagem genérica)
   ========================================================================== */
(function () {
  var CONFIG = {
    temaPadrao: window.AETIX_TEMA_PADRAO || 'halloween',   // vem de aetix-tema.js (único lugar para trocar o tema)
    temas: ['halloween', 'padrao'],
    demo: false,                             // true = nada é enviado (só simula). Ligado ao Firebase via /aetix-auth.js
    destino: '/inicial/',                    // para onde ir depois de entrar (quando demo = false)
    minSenha: 8
  };

  /* ---------- textos ---------- */
  var TEXTOS = {
    pt: {
      title: 'Entrar · AETIX DESIGN AI',
      titLogin: 'Entrar', titSignup: 'Crie sua conta', titForgot: 'Recuperar acesso',
      noAcc: 'Não tem conta?', haveAcc: 'Já tem conta?',
      googleLogin: 'Entrar com Google', googleSignup: 'Cadastrar com Google',
      orLogin: 'ou entre com e-mail', orSignup: 'ou cadastre com e-mail',
      /* painel de informações do PC (lado direito): edite os textos aqui */
      infoTitle: 'Remova marcas d’água de imagens e vídeos com <em>IA</em>.',
      info1T: 'Remover com IA', info1P: 'digite o que apagar e a IA localiza a marca na imagem ou no vídeo',
      info2T: 'Imagens e vídeos', info2P: 'PNG, JPG e WebP em imagens; MP4, MOV e WEBM em vídeos (BETA)',
      info3T: 'Edição direto no navegador', info3P: 'seus arquivos ficam no aparelho; só a opção com IA envia uma cópia reduzida para localizar a marca',
      info4T: 'Gratuito e rápido', info4P: 'marque a área, remova e baixe o resultado na hora',
      subLogin: 'Entre para continuar', 'subLogin@halloween': 'Gostosuras ou travessuras? Entre para continuar 🎃',
      subSignup: 'Crie sua conta em poucos segundos', 'subSignup@halloween': 'Crie sua conta e junte-se à noite mais sombria 🦇',
      subForgot: 'Vamos recuperar o seu acesso',
      tabLogin: 'Entrar', tabSignup: 'Criar conta',
      lblEmail: 'E-mail', lblSenha: 'Senha', lblSenha2: 'Repetir senha', lblNome: 'Nome',
      phEmail: 'voce@email.com', phSenha: '••••••••', phSenhaNova: 'Mínimo 8 caracteres', phSenha2: 'Digite a senha de novo', phNome: 'Seu nome',
      showPass: 'Mostrar senha', hidePass: 'Ocultar senha',
      remember: 'Lembrar de mim', forgot: 'Esqueci a senha',
      btnLogin: 'Entrar', btnSignup: 'Criar minha conta', btnForgot: 'Enviar link', backLogin: 'Voltar para entrar', btnContinue: 'Continuar',
      forgotHint: 'Digite o e-mail da sua conta e enviaremos um link para você criar uma nova senha.',
      terms: 'Li e aceito os <a href="/termosprivacidade/termos" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/termosprivacidade/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.',
      demo: 'Modo demonstração: nada é enviado nem salvo. O login ainda não está ligado ao site.',
      foot: 'seus dados ficam protegidos',
      doneLoginT: 'Bem-vindo de volta!', doneLoginP: 'Login feito com sucesso.',
      doneSignupT: 'Conta criada!', doneSignupP: 'Sua conta foi criada com sucesso. Que bom ter você aqui!',
      doneVerificarT: 'Conta criada! Confirme seu e-mail',
      doneVerificarP: 'Enviamos um link para o seu e-mail. Abra a mensagem e clique no link para liberar a IA, o Pix e as avaliações. Não achou? Confira também o spam.',
      doneForgotT: 'Link a caminho!', doneForgotP: 'Se esse e-mail tiver uma conta, você receberá um link para criar uma nova senha.',
      vEmail: 'Digite um e-mail válido, como voce@email.com.',
      vSenha: 'Digite a sua senha.', vSenhaCurta: 'A senha precisa ter pelo menos 8 caracteres.',
      vNome: 'Conte como podemos te chamar.', vSenha2: 'As senhas não são iguais. Confira e tente de novo.',
      vTermos: 'Para criar a conta, aceite os Termos e a Política de Privacidade.',
      errCredenciais: 'E-mail ou senha incorretos. Confira e tente de novo.',
      errEmailEmUso: 'Este e-mail já tem uma conta. Que tal entrar?',
      errLimite: 'Muitas tentativas em pouco tempo. Respire um instante e tente de novo em alguns minutos.',
      errRede: 'Parece que a conexão caiu. Confira sua internet e tente de novo.',
      errTermos: 'Essa conta Google ainda não existe aqui. Use “Criar conta”, aceite os Termos e tente de novo.',
      errGeneric: 'Não foi possível concluir agora. Tente novamente em instantes.'
    },
    en: {
      title: 'Sign in · AETIX DESIGN AI',
      titLogin: 'Sign in', titSignup: 'Create your account', titForgot: 'Recover access',
      noAcc: 'Don’t have an account?', haveAcc: 'Already have an account?',
      googleLogin: 'Sign in with Google', googleSignup: 'Sign up with Google',
      orLogin: 'or sign in with email', orSignup: 'or sign up with email',
      infoTitle: 'Remove watermarks from images and videos with <em>AI</em>.',
      info1T: 'Remove with AI', info1P: 'type what to erase and the AI finds the mark in the image or video',
      info2T: 'Images and videos', info2P: 'PNG, JPG and WebP images; MP4, MOV and WEBM videos (BETA)',
      info3T: 'Editing right in your browser', info3P: 'your files stay on your device; only the AI option sends a reduced copy to locate the mark',
      info4T: 'Free and fast', info4P: 'mark the area, remove it and download the result right away',
      subLogin: 'Sign in to continue', 'subLogin@halloween': 'Trick or treat? Sign in to continue 🎃',
      subSignup: 'Create your account in seconds', 'subSignup@halloween': 'Create your account and join the darkest night 🦇',
      subForgot: 'Let’s get you back in',
      tabLogin: 'Sign in', tabSignup: 'Create account',
      lblEmail: 'Email', lblSenha: 'Password', lblSenha2: 'Repeat password', lblNome: 'Name',
      phEmail: 'you@email.com', phSenha: '••••••••', phSenhaNova: 'At least 8 characters', phSenha2: 'Type the password again', phNome: 'Your name',
      showPass: 'Show password', hidePass: 'Hide password',
      remember: 'Remember me', forgot: 'Forgot password',
      btnLogin: 'Sign in', btnSignup: 'Create my account', btnForgot: 'Send link', backLogin: 'Back to sign in', btnContinue: 'Continue',
      forgotHint: 'Enter your account email and we’ll send you a link to create a new password.',
      terms: 'I accept the <a href="/termosprivacidade/termos" target="_blank" rel="noopener">Terms of Use</a> and the <a href="/termosprivacidade/privacidade" target="_blank" rel="noopener">Privacy Policy</a>.',
      demo: 'Demo mode: nothing is sent or saved. Sign-in isn’t connected to the site yet.',
      foot: 'your data stays protected',
      doneLoginT: 'Welcome back!', doneLoginP: 'You’re signed in.',
      doneSignupT: 'Account created!', doneSignupP: 'Your account is ready. We’re glad to have you here!',
      doneVerificarT: 'Account created! Confirm your email',
      doneVerificarP: 'We sent a link to your email. Open the message and click the link to unlock AI, Pix and reviews. Can’t find it? Check your spam folder too.',
      doneForgotT: 'Link on its way!', doneForgotP: 'If that email has an account, you’ll get a link to create a new password.',
      vEmail: 'Enter a valid email, like you@email.com.',
      vSenha: 'Enter your password.', vSenhaCurta: 'Your password needs at least 8 characters.',
      vNome: 'Tell us what we can call you.', vSenha2: 'The passwords don’t match. Check and try again.',
      vTermos: 'To create your account, accept the Terms and the Privacy Policy.',
      errCredenciais: 'Wrong email or password. Check and try again.',
      errEmailEmUso: 'This email already has an account. Want to sign in?',
      errLimite: 'Too many attempts in a short time. Take a breath and try again in a few minutes.',
      errRede: 'Looks like the connection dropped. Check your internet and try again.',
      errTermos: 'That Google account doesn’t exist here yet. Use “Create account”, accept the Terms and try again.',
      errGeneric: 'We couldn’t finish that right now. Please try again in a moment.'
    }
  };

  /* ---------- ligação com o servidor (modo demonstração) ---------- */
  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var DEMO_AUTH = {
    /* dica de teste: e-mails que começam com "erro@" simulam senha errada; "rede@" simula queda de conexão */
    login: function (d) {
      return espera(800).then(function () {
        if (/^erro@/i.test(d.email)) throw { codigo: 'credenciais' };
        if (/^rede@/i.test(d.email)) throw { codigo: 'rede' };
      });
    },
    cadastro: function (d) {
      return espera(900).then(function () { if (/^existe@/i.test(d.email)) throw { codigo: 'email_em_uso' }; });
    },
    recuperar: function () { return espera(800); },
    google: function () { return espera(700); }
  };
  function auth() { return CONFIG.demo ? DEMO_AUTH : (window.AETIX_AUTH || DEMO_AUTH); }

  /* ---------- estado ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var html = document.documentElement;
  var tema = CONFIG.temaPadrao, lang = 'pt', viewAtual = 'login', doneTipo = 'login';

  function lerTema() {
    var q = '';
    try { q = new URLSearchParams(location.search).get('tema') || ''; } catch (e) {}
    return CONFIG.temas.indexOf(q) > -1 ? q : CONFIG.temaPadrao;
  }
  function lerLang() {
    var s = ''; try { s = localStorage.getItem('aetix-lang') || ''; } catch (e) {}
    if (s === 'pt' || s === 'en') return s;
    return /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en';
  }
  function t(k) {
    var d = TEXTOS[lang] || TEXTOS.pt, p = TEXTOS.pt;
    var a = d[k + '@' + tema]; if (a != null) return a;
    a = d[k]; if (a != null) return a;
    a = p[k + '@' + tema]; if (a != null) return a;
    return p[k] != null ? p[k] : k;
  }

  /* ---------- idioma ---------- */
  function aplicarTextos() {
    html.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    document.querySelectorAll('.eye').forEach(function (b) { b.setAttribute('aria-label', t(b.getAttribute('aria-pressed') === 'true' ? 'hidePass' : 'showPass')); });
    $('langBtn').textContent = lang === 'pt' ? 'EN' : 'PT';
    atualizarSub(); atualizarDone();
  }
  function atualizarSub() {
    var s = viewAtual === 'signup', f = viewAtual === 'forgot';
    $('sub').textContent = t(s ? 'subSignup' : f ? 'subForgot' : 'subLogin');
    $('cardTitulo').textContent = t(s ? 'titSignup' : f ? 'titForgot' : 'titLogin');
    $('gTxt').textContent = t(s ? 'googleSignup' : 'googleLogin');
    $('orTxt').textContent = t(s ? 'orSignup' : 'orLogin');
  }
  function atualizarDone() {
    var m = { login: 'Login', signup: 'Signup', forgot: 'Forgot', verificar: 'Verificar' }[doneTipo];
    $('doneT').textContent = t('done' + m + 'T'); $('doneP').textContent = t('done' + m + 'P');
  }

  /* ---------- telas ---------- */
  var VIEWS = { login: 'vLogin', signup: 'vSignup', forgot: 'vForgot', done: 'vDone' };
  function mostrar(nome, focar) {
    viewAtual = nome;
    Object.keys(VIEWS).forEach(function (k) { $(VIEWS[k]).hidden = k !== nome; });
    var comGoogle = nome === 'login' || nome === 'signup';
    $('orBox').hidden = $('btnGoogle').hidden = !comGoogle;
    $('head').hidden = nome === 'done';
    $('demoNote').hidden = !CONFIG.demo;
    atualizarSub();
    if (focar !== false && nome !== 'done') {
      var f = $(VIEWS[nome]).querySelector('input'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 30);
    }
  }
  function concluir(tipo) {
    /* cadastro novo que ainda não confirmou o e-mail: a tela final avisa e explica o link */
    if (tipo === 'signup' && window.AETIX_USER && window.AETIX_USER.verificado === false) tipo = 'verificar';
    doneTipo = tipo; atualizarDone(); mostrar('done', false); setTimeout(function () { $('btnDone').focus({ preventScroll: true }); }, 30);
  }

  /* ---------- validação ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function marcar(el, ruim) { var b = el.closest('.f') || el.closest('.chk'); if (b) b.classList.toggle('bad', !!ruim); }
  function limpar(form) { form.querySelectorAll('.bad').forEach(function (x) { x.classList.remove('bad'); }); }
  function msg(id, texto, ok) { var m = $(id); m.textContent = texto || ''; m.classList.toggle('ok', !!ok); }
  function falha(id, el, chave) { marcar(el, true); msg(id, t(chave)); el.focus({ preventScroll: true }); return false; }

  function validarLogin() {
    limpar($('vLogin')); msg('mLogin', '');
    if (!EMAIL.test($('lEmail').value.trim())) return falha('mLogin', $('lEmail'), 'vEmail');
    if (!$('lSenha').value) return falha('mLogin', $('lSenha'), 'vSenha');
    return true;
  }
  function validarCadastro() {
    limpar($('vSignup')); msg('mSignup', '');
    if ($('sNome').value.trim().length < 2) return falha('mSignup', $('sNome'), 'vNome');
    if (!EMAIL.test($('sEmail').value.trim())) return falha('mSignup', $('sEmail'), 'vEmail');
    if ($('sSenha').value.length < CONFIG.minSenha) return falha('mSignup', $('sSenha'), 'vSenhaCurta');
    if ($('sSenha2').value !== $('sSenha').value) return falha('mSignup', $('sSenha2'), 'vSenha2');
    if (!$('sTermos').checked) return falha('mSignup', $('sTermos'), 'vTermos');
    return true;
  }
  function validarForgot() {
    limpar($('vForgot')); msg('mForgot', '');
    if (!EMAIL.test($('fEmail').value.trim())) return falha('mForgot', $('fEmail'), 'vEmail');
    return true;
  }

  /* ---------- envio ---------- */
  var MAPA_ERRO = { credenciais: 'errCredenciais', email_em_uso: 'errEmailEmUso', limite: 'errLimite', rede: 'errRede', termos: 'errTermos' };
  function erroAmigavel(e) { return t(MAPA_ERRO[e && e.codigo] || 'errGeneric'); }   // nunca mostra texto técnico

  function enviar(btn, msgId, fn, tipo) {
    btn.disabled = true; btn.classList.add('busy');
    var p; try { p = Promise.resolve(fn()); } catch (e) { p = Promise.reject(e); }
    return p.then(function () { concluir(tipo); }, function (e) { msg(msgId, erroAmigavel(e)); })
      .then(function () { btn.disabled = false; btn.classList.remove('busy'); });
  }

  function ligar() {
    $('vLogin').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!validarLogin()) return;
      enviar($('btnLogin'), 'mLogin', function () {
        return auth().login({ email: $('lEmail').value.trim(), senha: $('lSenha').value, lembrar: $('lLembrar').checked });
      }, 'login');
    });
    $('vSignup').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!validarCadastro()) return;
      enviar($('btnSignup'), 'mSignup', function () {
        return auth().cadastro({ nome: $('sNome').value.trim(), email: $('sEmail').value.trim(), senha: $('sSenha').value, aceitou: $('sTermos').checked });
      }, 'signup');
    });
    $('vForgot').addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!validarForgot()) return;
      enviar($('btnForgot'), 'mForgot', function () { return auth().recuperar({ email: $('fEmail').value.trim() }); }, 'forgot');
    });
    $('btnGoogle').addEventListener('click', function () {
      var alvo = viewAtual === 'signup' ? 'mSignup' : 'mLogin', tipo = viewAtual === 'signup' ? 'signup' : 'login';
      /* criar conta com Google exige o aceite dos Termos; no "Entrar" só contas que já existem passam */
      if (viewAtual === 'signup') { limpar($('vSignup')); msg('mSignup', ''); if (!$('sTermos').checked) return falha('mSignup', $('sTermos'), 'vTermos'); }
      enviar($('btnGoogle'), alvo, function () { return auth().google({ aceitou: viewAtual === 'signup' && $('sTermos').checked }); }, tipo);
    });
    $('goLogin').addEventListener('click', function () { mostrar('login'); });
    $('goSignup').addEventListener('click', function () { mostrar('signup'); });
    $('goForgot').addEventListener('click', function () { $('fEmail').value = $('lEmail').value; mostrar('forgot'); });
    $('backLogin').addEventListener('click', function () { mostrar('login'); });
    $('btnDone').addEventListener('click', function () {
      if (CONFIG.demo) { document.querySelectorAll('form').forEach(function (f) { f.reset(); limpar(f); }); document.querySelectorAll('.msg').forEach(function (m) { m.textContent = ''; }); mostrar('login'); }
      else location.href = CONFIG.destino;
    });
    document.querySelectorAll('.eye').forEach(function (b) {
      b.addEventListener('click', function () {
        var input = b.parentNode.querySelector('input'), ver = input.type === 'password';
        input.type = ver ? 'text' : 'password'; b.setAttribute('aria-pressed', String(ver));
        b.setAttribute('aria-label', t(ver ? 'hidePass' : 'showPass'));
      });
    });
    document.querySelectorAll('.f input, .chk input').forEach(function (i) {
      i.addEventListener('input', function () { marcar(i, false); var m = i.closest('form').querySelector('.msg'); if (m && !m.classList.contains('ok')) m.textContent = ''; });
    });
    $('langBtn').addEventListener('click', function () {
      lang = lang === 'pt' ? 'en' : 'pt';
      try { localStorage.setItem('aetix-lang', lang); } catch (e) {}
      aplicarTextos();
    });
  }

  /* ---------- decoração: vagalumes/estrelas do tema ---------- */
  function criarEstrelas() {
    var box = $('stars'), cores = ['#FF9B3D', '#FFB347', '#C084FC', '#FF7A1A'];
    var leve = document.documentElement.classList.contains('sem-anim');
    for (var i = 0; i < (leve ? 0 : 34); i++) {
      var s = document.createElement('i'), tam = 2 + Math.random() * 2.6;
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (10 + Math.random() * 88).toFixed(1) + '%;width:' + tam.toFixed(1) + 'px;height:' + tam.toFixed(1) +
        'px;--c:' + cores[i % cores.length] + ';--d:' + (4 + Math.random() * 6).toFixed(1) + 's;--w:-' + (Math.random() * 8).toFixed(1) + 's;--x:' + ((Math.random() - .5) * 40).toFixed(0) + 'px;--y:' + (-8 - Math.random() * 26).toFixed(0) + 'px';
      box.appendChild(s);
    }
  }

  /* ---------- início ---------- */
  tema = lerTema(); lang = lerLang();
  html.setAttribute('data-tema', tema);
  criarEstrelas(); ligar(); aplicarTextos(); mostrar('login', false);
})();
