/* AETIX · aetix-splash.js — abertura 1x por sessão, usada pelo login */
(function(){
  var h=document.getElementById('splash'); if(!h) return;
  var w=h.firstElementChild, M=0;
  'AETIX DESIGN AI'.split('').forEach(function(s,J){
    var H=document.createElement('span');
    if(s===' ') H.className='gap';
    else { H.textContent=s; H.style.setProperty('--i',M++); if(J>5 && J<12) H.className='w2'; }
    w.appendChild(H);
  });
  var skip=window.__aetixSkipSplash?1:0;
  var delay=skip?0:2300;
  setTimeout(function(){document.documentElement.classList.remove('splashing');h.classList.add('out');setTimeout(function(){h.remove()},skip?0:750);},delay);
})();
