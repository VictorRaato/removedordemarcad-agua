/* ==========================================================================
   AETIX DESIGN AI · aetix-tema.js  — ÚNICO lugar para trocar o tema do site
   Troque a linha  var T = 'halloween'  por  var T = 'padrao'  para voltar ao visual normal.
   Vale para: página inicial, perfil e tela de login (login.js lê AETIX_TEMA_PADRAO).
   Teste rápido sem mexer em nada:  ?tema=padrao  ou  ?tema=halloween  na URL.
   ========================================================================== */
(function () {
  var T = 'halloween';            /* 'halloween' | 'padrao' */
  var q = '';
  try { q = new URLSearchParams(location.search).get('tema') || ''; } catch (e) {}
  window.AETIX_TEMA_PADRAO = T;
  if (q === 'padrao' || q === 'halloween') T = q;
  document.documentElement.setAttribute('data-tema', T);
})();
