/* AETIX · aetix-voltar.js — botão "voltar" das páginas públicas */
(function(){
  var home="/inicial/";
  function fromSite(){try{var u=new URL(document.referrer);return u.origin===location.origin&&!/^\/termosprivacidade\//.test(u.pathname)}catch(e){return false}}
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[data-home]");
    if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!fromSite())return;
    e.preventDefault();
    if(history.length>1){history.back();return}
    window.close();
    setTimeout(function(){location.href=home},150);
  });
})();
