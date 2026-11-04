/* AETIX · aetix-nota.js — nota média no rodapé das páginas públicas */
(function(){
  fetch('/api/avaliacoes-resumo').then(function(r){return r.json();}).then(function(d){
    if(!d||!d.ok||!(d.total>=1)||!(d.media>=1))return;
    document.getElementById('rMedia').textContent=String(d.media).replace('.',',');
    document.getElementById('rTotal').textContent=d.total;
    document.getElementById('ratingLine').hidden=false;
  }).catch(function(){});
})();
