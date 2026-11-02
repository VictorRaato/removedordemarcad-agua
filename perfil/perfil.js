/* ==========================================================================
   AETIX DESIGN AI · perfil.js
   - Tema ............ definido no <head> do index.html (var T) ou ?tema=padrao / ?tema=halloween
   - Idioma .......... mesma chave do site: localStorage 'aetix-lang' ('pt' | 'en')
   - Usuário ......... CONFIG.demo = true  -> mostra um usuário de exemplo (login ainda NÃO ligado)
                       CONFIG.demo = false -> lê o usuário real (veja "COMO LIGAR O LOGIN" abaixo)

   LOGIN: já ligado pelo /aetix-auth.js (Firebase), que preenche window.AETIX_USER e chama aetixPerfil.set().
   (CONFIG.demo = true só serve para ver a tela com dados de exemplo.)
   Contrato, caso um dia troque de serviço de login:
   2) Deixe o usuário disponível de um destes jeitos:
        window.AETIX_USER = { nome:'Vitinho Silva', email:'vitinho@gmail.com', foto:'https://...' }
      ou, com a página já aberta:  aetixPerfil.set({ nome, email, foto })
   3) Sair da conta: se existir  window.AETIX_AUTH.logout()  ele é chamado, depois vai para CONFIG.aposSair.
   4) Excluir conta: se existir  window.AETIX_AUTH.excluir()  ele é chamado (peça confirmação antes).
   Sem usuário (demo false e nada definido) a tela mostra "visitante" e botão para entrar (CONFIG.loginUrl).
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    demo: false,
    demoUser: { nome: 'Vitinho Silva', email: 'vitinho@exemplo.com', foto: '' },
    loginUrl: '/login/',
    aposSair: '/inicial/'
  };

  var TEXTOS = {
    pt: {
      back: 'Voltar ao site', secConta: 'Dados da conta', secContaP: 'Vêm da sua conta Google e não podem ser editados aqui.',
      lblNome: 'Nome', lblEmail: 'E-mail', secPref: 'Preferências', lblIdioma: 'Idioma', lblIdiomaP: 'Vale para todo o site.',
      secLinks: 'Atalhos', lnkTool: 'Remover marca d’água', lnkToolP: 'Voltar para a ferramenta',
      lnkColab: 'Colaboração', lnkColabP: 'Ajude o projeto a continuar gratuito', lnkSobre: 'Sobre', lnkSobreP: 'Conheça o AETIX DESIGN AI',
      lnkTermos: 'Termos de Uso', lnkPriv: 'Política de Privacidade', secSessao: 'Sessão', btnSair: 'Sair da conta', btnExcluir: 'Excluir conta',
      demo: 'Modo demonstração: os dados desta tela são de exemplo e o login ainda não está ligado ao site.',
      foot: 'seus dados ficam protegidos', title: 'Meu perfil · AETIX DESIGN AI', guest: 'Visitante', guestMail: 'Você ainda não entrou na sua conta',
      badgeDemo: 'Exemplo', badgeOn: 'Conta conectada', badgeOff: 'Sem login', btnEntrar: 'Entrar',
      soon: 'Disponível quando o login for ligado ao site.', confirmDel: 'Excluir a conta é permanente. Deseja continuar?', erro: 'Não foi possível concluir. Tente novamente.'
    },
    en: {
      back: 'Back to site', secConta: 'Account details', secContaP: 'They come from your Google account and can’t be edited here.',
      lblNome: 'Name', lblEmail: 'Email', secPref: 'Preferences', lblIdioma: 'Language', lblIdiomaP: 'Applies to the whole site.',
      secLinks: 'Shortcuts', lnkTool: 'Remove watermark', lnkToolP: 'Back to the tool',
      lnkColab: 'Support', lnkColabP: 'Help keep the project free', lnkSobre: 'About', lnkSobreP: 'Get to know AETIX DESIGN AI',
      lnkTermos: 'Terms of Use', lnkPriv: 'Privacy Policy', secSessao: 'Session', btnSair: 'Sign out', btnExcluir: 'Delete account',
      demo: 'Demo mode: the data on this screen is sample data and login is not connected to the site yet.',
      foot: 'your data stays protected', title: 'My profile · AETIX DESIGN AI', guest: 'Guest', guestMail: 'You are not signed in yet',
      badgeDemo: 'Sample', badgeOn: 'Account connected', badgeOff: 'Signed out', btnEntrar: 'Sign in',
      soon: 'Available once login is connected to the site.', confirmDel: 'Deleting your account is permanent. Continue?', erro: 'Could not finish. Please try again.'
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var lang = 'pt', user = null;

  function lerLang() {
    var s = ''; try { s = localStorage.getItem('aetix-lang') || ''; } catch (e) {}
    if (s === 'pt' || s === 'en') return s;
    return /^en/i.test(navigator.language || '') ? 'en' : 'pt';
  }
  function t(k) { return (TEXTOS[lang] && TEXTOS[lang][k]) || TEXTOS.pt[k] || ''; }
  function limpar(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max || 120); }
  function primeiro(n) { return limpar(n, 60).split(/\s+/)[0]; }

  function lerUsuario() {
    if (CONFIG.demo) return CONFIG.demoUser;
    var u = window.AETIX_USER;
    if (u === undefined) { try { u = JSON.parse(localStorage.getItem('aetix-user-cache') || 'null'); } catch (e) { u = null; } }  /* evita piscar "visitante" enquanto o login carrega */
    return u && (u.nome || u.email) ? u : null;
  }

  function msg(texto, ok) { var m = $('msg'); m.textContent = texto || ''; m.className = 'msg' + (ok ? ' ok' : ''); }

  function render() {
    var d = document, nome = user ? limpar(user.nome, 60) : '', mail = user ? limpar(user.email, 120) : '';
    d.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    d.title = t('title');
    [].forEach.call(d.querySelectorAll('[data-i18n]'), function (el) { var v = t(el.getAttribute('data-i18n')); if (v) el.textContent = v; });

    $('langBtn').textContent = lang === 'en' ? 'PT' : 'EN';
    [].forEach.call(d.querySelectorAll('.seg button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });

    $('meNome').textContent = user ? (nome || primeiro(mail)) : t('guest');
    $('meEmail').textContent = user ? mail : t('guestMail');
    $('fNome').value = nome; $('fEmail').value = mail;
    var b = $('meBadge'); b.textContent = CONFIG.demo ? t('badgeDemo') : (user ? t('badgeOn') : t('badgeOff')); b.className = 'badge' + (!CONFIG.demo && user ? ' ok' : '');

    var av = $('avatar'); av.textContent = '';
    if (user && (user.foto || nome)) {
      if (user.foto && /^https:\/\//i.test(user.foto)) {
        var img = new Image(); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = user.foto;
        img.onerror = function () { av.textContent = (nome || mail).charAt(0).toUpperCase(); };
        av.appendChild(img);
      } else av.textContent = (nome || mail).charAt(0).toUpperCase();
    } else av.innerHTML = '<svg class="ic"><use href="#i-user"/></svg>';

    $('demoNote').hidden = !CONFIG.demo;
    var sair = $('btnSair'), exc = $('btnExcluir'), temUser = !!user;
    exc.hidden = !temUser;
    var sp = sair.querySelector('span');
    if (!temUser && !CONFIG.demo) sp.textContent = t('btnEntrar'); else sp.textContent = t('btnSair');
    sair.querySelector('use').setAttribute('href', !temUser && !CONFIG.demo ? '#i-user' : '#i-out');
  }

  function ligar() {
    var alternar = function (l) { lang = l; try { localStorage.setItem('aetix-lang', lang); } catch (e) {} msg(''); render(); };
    $('langBtn').addEventListener('click', function () { alternar(lang === 'en' ? 'pt' : 'en'); });
    [].forEach.call(document.querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { alternar(b.getAttribute('data-lang')); }); });

    $('btnSair').addEventListener('click', function () {
      if (CONFIG.demo) return msg(t('soon'));
      if (!user) { location.href = CONFIG.loginUrl; return; }
      var A = window.AETIX_AUTH;
      if (!A || typeof A.logout !== 'function') return msg(t('soon'));
      Promise.resolve().then(function () { return A.logout(); }).then(function () { location.href = CONFIG.aposSair; }, function () { msg(t('erro')); });
    });
    $('btnExcluir').addEventListener('click', function () {
      if (CONFIG.demo) return msg(t('soon'));
      var A = window.AETIX_AUTH;
      if (!A || typeof A.excluir !== 'function') return msg(t('soon'));
      if (!window.confirm(t('confirmDel'))) return;
      Promise.resolve().then(function () { return A.excluir(); }).then(function () { location.href = CONFIG.aposSair; }, function () { msg(t('erro')); });
    });
  }

  function criarEstrelas() {
    var box = $('stars'), cores = ['#FF9B3D', '#FFB347', '#C084FC', '#FF7A1A'];
    if (!box || document.documentElement.getAttribute('data-tema') !== 'halloween') return;
    for (var i = 0; i < 30; i++) {
      var s = document.createElement('i'), tam = 2 + Math.random() * 2.6;
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (10 + Math.random() * 88).toFixed(1) + '%;width:' + tam.toFixed(1) + 'px;height:' + tam.toFixed(1) +
        'px;--c:' + cores[i % cores.length] + ';--d:' + (4 + Math.random() * 6).toFixed(1) + 's;--w:-' + (Math.random() * 8).toFixed(1) + 's;--x:' + ((Math.random() - .5) * 40).toFixed(0) + 'px;--y:' + (-8 - Math.random() * 26).toFixed(0) + 'px';
      box.appendChild(s);
    }
  }

  /* API para o login usar depois */
  window.aetixPerfil = { set: function (u) { user = u && (u.nome || u.email) ? u : null; render(); } };

  lang = lerLang(); user = lerUsuario();
  criarEstrelas(); ligar(); render();
})();
