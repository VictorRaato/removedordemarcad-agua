/* AETIX · aetix-cabeca.js — roda no <head> da página inicial, antes de desenhar a tela (abertura 1x por sessão + rota /inicial/) */
/* abertura (splash) só 1x por sessão: ao voltar do perfil/outras páginas não repete */
(function(){try{if(sessionStorage.getItem('aetix-splash')){window.__aetixSkipSplash=1;document.documentElement.classList.remove('splashing');document.write('<style>#splash{display:none!important}</style>')}else sessionStorage.setItem('aetix-splash','1')}catch(e){}})();

try{var p=location.pathname;if(p==="/"||p==="/index"||p==="/index/"||p==="/index.html"){history.replaceState(history.state,"","/inicial/"+location.search+location.hash)}}catch(e){}
