/* AETIX · aetix-final.js — comportamentos da página inicial que rodam depois do script.js (antes eram <script> dentro do HTML) */
/* Aviso neon de colaboração: aparece após a abertura, dura 10s (pausa ao passar o mouse) */
(function(){
  var T={pt:{t:'Ajude a manter o AETIX grátis',p:'Sem pagar nada. Se a ferramenta te ajudou, um <b>Pix a partir de R$ 5</b> mantém o projeto no ar e traz novidades.',b:'COLABORAR VIA PIX',tm:'Apoie o AETIX',pm:'Sem pagar nada. Se a ferramenta te ajudou, um <b>Pix a partir de R$ 5</b> mantém o projeto no ar e traz novidades.',bm:'COLABORAR'},
         en:{t:'Help keep AETIX free',p:'Nothing to pay. If it helped you, a <b>Pix from R$ 5</b> keeps the project online and funds new features.',b:'CONTRIBUTE VIA PIX',tm:'Support AETIX',pm:'Nothing to pay. If it helped you, a <b>Pix from R$ 5</b> keeps the project online and funds new features.',bm:'CONTRIBUTE'}};
  var box,tries=0,done=false;
  function $(i){return document.getElementById(i)}
  function mob(){return window.matchMedia&&window.matchMedia('(max-width:600px)').matches}
  function place(){var h=document.querySelector(mob()?'.hdr-right':'.hdr');if(h)box.style.top=Math.round(h.getBoundingClientRect().bottom+(mob()?6:10))+'px'}
  function hide(){done=true;box.classList.remove('show')}
  function show(){
    var l=(document.documentElement.lang||'pt').toLowerCase().indexOf('en')===0?'en':'pt';
    var m=mob();$('nudgeT').textContent=m?T[l].tm:T[l].t;$('nudgeP').innerHTML=m?T[l].pm:T[l].p;$('nudgeGo').textContent=m?T[l].bm:T[l].b;
    place();void box.offsetWidth;box.classList.add('show');
  }
  function ready(){
    if(document.documentElement.classList.contains('splashing')||$('splash'))return false;
    return true;
  }
  function after(){
    setTimeout(function(){if(!done&&!document.querySelector('.modal:not([hidden])'))show()},700);
  }
  function tick(){
    if(done)return;
    if(!ready()&&tries++<60)return setTimeout(tick,200);
    /* só aparece depois que o pop-up de Halloween for fechado */
    if(window.__aetixHwDone)return after();
    document.addEventListener('aetix:hw-done',function once(){document.removeEventListener('aetix:hw-done',once);after()});
  }
  function init(){
    box=$('nudge');if(!box)return;
    $('nudgeX').addEventListener('click',hide);
    $('nudgeBar').addEventListener('animationend',hide);
    $('nudgeGo').addEventListener('click',function(){hide();var b=$('pricingOpen');if(b)b.click()});
    window.addEventListener('resize',function(){if(box.classList.contains('show'))place()});
    tick();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

window.addEventListener('load',function(){
  var ok=window.AetixApp&&window.AetixApp.Core&&typeof window.AetixApp.Core.openHelp==='function';
  if(ok)return;
  var d=document.createElement('div');
  d.setAttribute('role','alert');
  d.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:999;padding:12px 14px;border-radius:12px;background:#2a1220;border:1px solid #FF6B83;color:#FFD5DC;font:500 14px/1.4 Inter,system-ui,sans-serif;text-align:center';
  d.textContent='Não foi possível carregar a ferramenta por completo. Recarregue a página (Ctrl+F5) e tente de novo em instantes.';
  document.body.appendChild(d);
});

/* Nota média real (vinda do nosso banco de dados) -> linha visível no rodapé + aggregateRating no JSON-LD */
(function(){
  fetch('/api/avaliacoes-resumo').then(function(r){return r.json();}).then(function(d){
    if(!d||!d.ok||!(d.total>=1)||!(d.media>=1)) return;
    var media=String(d.media);
    if(document.documentElement.lang!=='en') media=media.replace('.',',');
    document.getElementById('rMedia').textContent=media;
    document.getElementById('rTotal').textContent=d.total;
    document.getElementById('ratingLine').hidden=false;
    var el=document.getElementById('aetixLd');
    if(!el) return;
    var ld=JSON.parse(el.textContent);
    ld.aggregateRating={'@type':'AggregateRating',ratingValue:d.media,ratingCount:d.total,bestRating:5,worstRating:1};
    el.textContent=JSON.stringify(ld);
  }).catch(function(){});
})();

(function(){
  /* fotos da seção: se o arquivo não abrir com a extensão esperada, tenta as outras extensões comuns */
  var exts=['.jpg','.jpeg','.png','.webp','.JPG','.JPEG','.PNG','.WEBP'];
  [].forEach.call(document.querySelectorAll('.sx-photo'),function(img){
    var base=img.getAttribute('src').replace(/\.[A-Za-z]+$/,''),i=0;
    img.addEventListener('error',function(){
      while(i<exts.length&&base+exts[i]===img.getAttribute('src'))i++;
      if(i<exts.length){var n=base+exts[i++];img.setAttribute('src',n);}
    });
    if(img.complete&&img.naturalWidth===0){var s=img.getAttribute('src');img.removeAttribute('src');img.setAttribute('src',s);}
  });
})();

(function(){
  /* celular: títulos "Removedor de marca d'água em ..." sempre em uma linha só, no maior tamanho que couber */
  var h=document.getElementById('heroTitle'); if(!h)return;
  function fit(){
    h.style.fontSize=''; h.style.whiteSpace='';
    if(window.innerWidth>760||!h.clientWidth)return;
    h.style.whiteSpace='nowrap';
    var fs=parseFloat(getComputedStyle(h).fontSize);
    while(h.scrollWidth>h.clientWidth+.5&&fs>11){fs-=.5;h.style.fontSize=fs+'px';}
  }
  fit();
  window.addEventListener('resize',fit); window.addEventListener('orientationchange',fit);
  window.addEventListener('load',fit);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  if('MutationObserver' in window)new MutationObserver(fit).observe(h,{childList:true,characterData:true,subtree:true});
})();

(function(){
  /* botão "Usar a ferramenta agora": volta ao topo da página */
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#sxTop'); if(!b)return;
    var p=document.getElementById('page'); if(!p)return;
    var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
    p.scrollTo({top:0,behavior:calm?'auto':'smooth'});
  });
  /* carrossel dos passos: troca sozinho a cada 4 s */
  var wrap=document.getElementById('sxCar'); if(!wrap)return;
  var view=wrap.querySelector('.sx-view'),
      items=[].slice.call(wrap.querySelectorAll('.sx-step')),
      dots=[].slice.call(wrap.querySelectorAll('.sx-dot')),
      n=items.length,cur=0,timer=null,paused=false,visible=true,
      calm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(n<2)return;
  function layout(){
    items.forEach(function(li,i){
      var o=((i-cur)%n+n)%n; if(o>n/2)o-=n;
      var prev=li.getAttribute('data-o');
      if(prev!==null&&Math.abs(o-(+prev))>2){ /* volta pelo outro lado: troca sem atravessar o centro */
        li.style.transition='none'; li.setAttribute('data-o',o); void li.offsetWidth; li.style.transition='';
      } else li.setAttribute('data-o',o);
      if(o===0)li.setAttribute('aria-current','step'); else li.removeAttribute('aria-current');
    });
    dots.forEach(function(d,i){d.setAttribute('aria-current',i===cur?'true':'false');});
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){if(calm||timer||paused||!visible||document.hidden)return;timer=setInterval(function(){go(cur+1,true);},4000);}
  function go(i,auto){cur=((i%n)+n)%n;layout();if(!auto){stop();start();}}
  wrap.classList.add('is-car'); layout();
  dots.forEach(function(d){d.addEventListener('click',function(){go(+d.getAttribute('data-i'));});});
  var x0=null,moved=false;
  view.addEventListener('pointerdown',function(e){x0=e.clientX;moved=false;});
  view.addEventListener('pointerup',function(e){
    if(x0===null)return; var dx=e.clientX-x0; x0=null;
    if(Math.abs(dx)>40){moved=true;go(cur+(dx<0?1:-1));}
  });
  view.addEventListener('pointercancel',function(){x0=null;});
  items.forEach(function(li,i){li.addEventListener('click',function(){
    if(moved){moved=false;return;}
    if(+li.getAttribute('data-o')!==0)go(i);
  });});
  wrap.addEventListener('mouseenter',function(){paused=true;stop();});
  wrap.addEventListener('mouseleave',function(){paused=false;start();});
  wrap.addEventListener('focusin',function(){paused=true;stop();});
  wrap.addEventListener('focusout',function(){paused=false;start();});
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
  if('IntersectionObserver' in window){
    visible=false;
    new IntersectionObserver(function(en){visible=en[0].isIntersecting;visible?start():stop();},{threshold:.25}).observe(wrap);
  } else start();
})();

/* Pop-up de Halloween: aparece a cada atualização da página, depois do splash.
   Se vier de "Colaborar com o projeto" (?colaborar=1), abre o pop-up de colaboração no lugar. */
(function(){
  var SRC='/img/og_hallowenn.png',tries=0,finished=false,opened=false;
  var wantsColab=/[?&]colaborar=1(&|$)/.test(location.search);
  function done(){
    if(finished)return;finished=true;window.__aetixHwDone=true;
    try{document.dispatchEvent(new Event('aetix:hw-done'))}catch(e){}
  }
  function cleanUrl(){try{var u=new URL(location.href);u.searchParams.delete('colaborar');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}catch(e){}}
  function go(){
    var A=window.AetixApp,c=A&&A.Core;
    if(!c||!c.openModal||!c.splashDone){if(tries++<150)setTimeout(go,100);else done();return}
    if(wantsColab){
      c.splashDone.then(function(){setTimeout(function(){cleanUrl();c.openModal('pricingModal');done()},300)});
      return;
    }
    var modal=document.getElementById('halloweenModal'),img=document.getElementById('halloweenImg');
    if(!modal||!img){done();return}
    c.modalHooks['halloweenModal']=function(){done()};
    var guard=setTimeout(function(){if(!opened)done()},12000);
    var pre=new Image();
    pre.onload=function(){
      c.splashDone.then(function(){
        setTimeout(function(){
          if(finished)return;
          if(document.querySelector('.modal:not([hidden])')){done();return}
          opened=true;clearTimeout(guard);
          img.src=SRC;c.openModal('halloweenModal','halloweenX');
        },300);
      });
    };
    pre.onerror=function(){clearTimeout(guard);done()};
    pre.src=SRC;
  }
  if(document.readyState==='complete')go();else window.addEventListener('load',go);
})();

/* Teclado no celular: mede a área visível e mantém o campo digitado acima do teclado */
(function(){
  var vv=window.visualViewport,root=document.documentElement,t=0;
  function upd(){
    var h=vv?vv.height:window.innerHeight,top=vv?vv.offsetTop:0;
    root.style.setProperty('--vvh',Math.round(h)+'px');
    root.style.setProperty('--vvt',Math.round(top)+'px');
    root.classList.toggle('kb-open',window.innerHeight-h>120);
  }
  function reveal(el){
    clearTimeout(t);
    t=setTimeout(function(){upd();try{el.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}},320);
  }
  if(vv){vv.addEventListener('resize',function(){upd();var a=document.activeElement;if(a&&a.closest&&a.closest('.modal:not([hidden])')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))reveal(a)});vv.addEventListener('scroll',upd)}
  window.addEventListener('orientationchange',function(){setTimeout(upd,300)});
  document.addEventListener('focusin',function(e){var a=e.target;if(a&&a.closest&&a.closest('.modal:not([hidden])')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))reveal(a)});
  upd();
})();
