/* AETIX · aetix-inicio.js — enfeites e menu da página inicial (antes eram <script> dentro do HTML) */
(function(){var b=document.getElementById('hwStars');if(!b||document.documentElement.getAttribute('data-tema')!=='halloween')return;var c=['#FF9B3D','#FFB347','#C084FC','#FF7A1A'];for(var i=0;i<24;i++){var s=document.createElement('i'),z=2+Math.random()*2.4;s.style.cssText='left:'+(Math.random()*100).toFixed(1)+'%;top:'+(8+Math.random()*90).toFixed(1)+'%;width:'+z.toFixed(1)+'px;height:'+z.toFixed(1)+'px;--c:'+c[i%4]+';--d:'+(4+Math.random()*6).toFixed(1)+'s;--w:-'+(Math.random()*8).toFixed(1)+'s;--x:'+((Math.random()-.5)*40).toFixed(0)+'px;--y:'+(-8-Math.random()*26).toFixed(0)+'px';b.appendChild(s)}})();

/* ===== PERFIL NO MENU =====
   Mostra "Olá, Nome!" no topo do menu e traduz "Meu perfil".
   Quando o login existir, é só chamar:  aetixSetUser('Vitinho Silva')  -> aparece "Olá, Vitinho!" (usa só o primeiro nome).
   Também dá para definir  window.AETIX_USER = { nome: 'Vitinho' }  antes deste trecho.
   Sem usuário, aparece "Olá, visitante!". */
(function(){
  var nome='';
  function primeiro(n){return String(n||'').trim().split(/\s+/)[0].slice(0,20)}
  function en(){var s=document.getElementById('uiLang');return !!(s&&s.value==='en')}
  function render(){
    var t=document.getElementById('profileName');
    if(t)t.textContent=nome?(en()?'Hi, ':'Olá, ')+nome+'!':(en()?'Hi, guest!':'Olá, visitante!');
    var m=document.querySelector('#myProfile span');
    if(m)m.textContent=en()?'My profile':'Meu perfil';
  }
  window.aetixSetUser=function(n){nome=primeiro(n);render()};
  if(window.AETIX_USER&&window.AETIX_USER.nome)nome=primeiro(window.AETIX_USER.nome);
  render();
  var s=document.getElementById('uiLang');
  if(s)s.addEventListener('change',function(){setTimeout(render,0)});
  window.addEventListener('load',render);
})();
