/* AETIX · aetix-colaboracao.js — mural, pódio e botão voltar da página Colaboração */
(function(){
  var home="/inicial/",NS="http://www.w3.org/2000/svg";
  function fromSite(){try{var u=new URL(document.referrer);return u.origin===location.origin&&!/^\/(termosprivacidade\/|privacidade|termos|sobre|colaboracao)/.test(u.pathname)}catch(e){return false}}
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[data-home]");
    if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!fromSite())return;
    e.preventDefault();
    if(history.length>1){history.back();return}
    window.close();
    setTimeout(function(){location.href=home},150);
  });

  function brl(c){return "R$\u00a0"+(c/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}
  function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360}
  function ini(n){var p=String(n).trim().split(/\s+/);var a=(p[0]||"?").charAt(0),b=p.length>1?p[1].charAt(0):"";return (a+b).toUpperCase()}
  var CH=[
   '<circle cx="14" cy="17" r="7" fill="#8B5A3C"/><circle cx="50" cy="17" r="7" fill="#8B5A3C"/><circle cx="14" cy="17" r="3.5" fill="#D9A47E"/><circle cx="50" cy="17" r="3.5" fill="#D9A47E"/><circle cx="32" cy="36" r="19" fill="#A56B46"/><ellipse cx="32" cy="43" rx="8" ry="6" fill="#E8C3A0"/><circle cx="25" cy="32" r="2.6" fill="#1b1220"/><circle cx="39" cy="32" r="2.6" fill="#1b1220"/><ellipse cx="32" cy="40.5" rx="3" ry="2.2" fill="#1b1220"/>',
   '<polygon points="13,28 16,8 29,20" fill="#F2A65A"/><polygon points="51,28 48,8 35,20" fill="#F2A65A"/><polygon points="17,24 18,14 25,20" fill="#F7C4C4"/><polygon points="47,24 46,14 39,20" fill="#F7C4C4"/><circle cx="32" cy="37" r="19" fill="#F6B76F"/><ellipse cx="25" cy="33" rx="2.6" ry="3.6" fill="#1b1220"/><ellipse cx="39" cy="33" rx="2.6" ry="3.6" fill="#1b1220"/><polygon points="29.5,40 34.5,40 32,43" fill="#E87A8C"/><path d="M8 38h12M8 43l11-2M56 38H44M56 43l-11-2" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>',
   '<polygon points="12,30 14,8 29,20" fill="#E8742E"/><polygon points="52,30 50,8 35,20" fill="#E8742E"/><polygon points="16,24 16.5,14 24,20" fill="#3A2218"/><polygon points="48,24 47.5,14 40,20" fill="#3A2218"/><circle cx="32" cy="36" r="19" fill="#EE7F36"/><path d="M13 38Q32 62 51 38Q42 49 32 49Q22 49 13 38Z" fill="#FFF1E0"/><circle cx="25" cy="32" r="2.4" fill="#1b1220"/><circle cx="39" cy="32" r="2.4" fill="#1b1220"/><ellipse cx="32" cy="44" rx="3" ry="2.2" fill="#1b1220"/>',
   '<line x1="32" y1="10" x2="32" y2="18" stroke="#9FB0D0" stroke-width="2.4"/><circle cx="32" cy="9" r="3.4" fill="#FF6B8B"/><rect x="12" y="18" width="40" height="34" rx="10" fill="#B7C4E0"/><rect x="18" y="26" width="28" height="13" rx="6" fill="#141B2E"/><circle cx="26" cy="32.5" r="3.4" fill="#2EE6FF"/><circle cx="38" cy="32.5" r="3.4" fill="#2EE6FF"/><rect x="23" y="43.5" width="18" height="3.6" rx="1.8" fill="#6B7A99"/><rect x="7" y="29" width="5" height="10" rx="2.5" fill="#8A99B8"/><rect x="52" y="29" width="5" height="10" rx="2.5" fill="#8A99B8"/>',
   '<circle cx="15" cy="16" r="7.5" fill="#1b1b24"/><circle cx="49" cy="16" r="7.5" fill="#1b1b24"/><circle cx="32" cy="36" r="20" fill="#F4F4F8"/><ellipse cx="24" cy="33" rx="5.2" ry="6.6" fill="#1b1b24" transform="rotate(20 24 33)"/><ellipse cx="40" cy="33" rx="5.2" ry="6.6" fill="#1b1b24" transform="rotate(-20 40 33)"/><circle cx="24" cy="33" r="1.8" fill="#fff"/><circle cx="40" cy="33" r="1.8" fill="#fff"/><ellipse cx="32" cy="42" rx="3.2" ry="2.3" fill="#1b1b24"/>',
   '<polygon points="14,26 14,8 28,17" fill="#7B5A3E"/><polygon points="50,26 50,8 36,17" fill="#7B5A3E"/><ellipse cx="32" cy="37" rx="20" ry="19" fill="#9A7350"/><circle cx="23.5" cy="33" r="8" fill="#FFF4DE"/><circle cx="40.5" cy="33" r="8" fill="#FFF4DE"/><circle cx="23.5" cy="33" r="3.8" fill="#1b1220"/><circle cx="40.5" cy="33" r="3.8" fill="#1b1220"/><circle cx="24.6" cy="31.8" r="1.2" fill="#fff"/><circle cx="41.6" cy="31.8" r="1.2" fill="#fff"/><polygon points="28.5,41 35.5,41 32,48" fill="#FFB020"/>',
   '<ellipse cx="32" cy="35" rx="19" ry="22" fill="#7BE08F"/><ellipse cx="23" cy="33" rx="6" ry="8.5" fill="#0d1a12" transform="rotate(-18 23 33)"/><ellipse cx="41" cy="33" rx="6" ry="8.5" fill="#0d1a12" transform="rotate(18 41 33)"/><circle cx="21.5" cy="30.5" r="1.7" fill="#fff"/><circle cx="39.5" cy="30.5" r="1.7" fill="#fff"/><path d="M27 48q5 3 10 0" stroke="#0d1a12" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="24" y1="14" x2="21" y2="6" stroke="#7BE08F" stroke-width="2.2"/><circle cx="20.5" cy="5.5" r="2.4" fill="#FFE27A"/><line x1="40" y1="14" x2="43" y2="6" stroke="#7BE08F" stroke-width="2.2"/><circle cx="43.5" cy="5.5" r="2.4" fill="#FFE27A"/>',
   '<ellipse cx="23" cy="14" rx="5.2" ry="13" fill="#F1E6F5" transform="rotate(-8 23 14)"/><ellipse cx="41" cy="14" rx="5.2" ry="13" fill="#F1E6F5" transform="rotate(8 41 14)"/><ellipse cx="23" cy="15" rx="2.4" ry="8.5" fill="#F4A6C0" transform="rotate(-8 23 15)"/><ellipse cx="41" cy="15" rx="2.4" ry="8.5" fill="#F4A6C0" transform="rotate(8 41 15)"/><circle cx="32" cy="38" r="18" fill="#F8F0FA"/><circle cx="25.5" cy="35" r="2.5" fill="#1b1220"/><circle cx="38.5" cy="35" r="2.5" fill="#1b1220"/><polygon points="29.5,41 34.5,41 32,44" fill="#F08AA8"/><circle cx="20" cy="42" r="3" fill="#F8B8CC" opacity=".7"/><circle cx="44" cy="42" r="3" fill="#F8B8CC" opacity=".7"/>'
  ];
  var uid=0;
  function avatar(nome){
    var h=hue(nome),h2=(h+55)%360,id="g"+(uid++),k=hue(nome+"#")%CH.length;
    var s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 64 64");s.setAttribute("class","av");s.setAttribute("aria-hidden","true");
    s.style.setProperty("--g","hsla("+h+",90%,65%,.7)");
    s.innerHTML='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl('+h+',70%,58%)"/><stop offset="1" stop-color="hsl('+h2+',72%,40%)"/></linearGradient><clipPath id="c'+id+'"><circle cx="32" cy="32" r="32"/></clipPath></defs><circle cx="32" cy="32" r="32" fill="url(#'+id+')"/><g clip-path="url(#c'+id+')">'+CH[k]+'</g>';
    return s;
  }
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
  var FLAG='<svg viewBox="0 0 20 14" aria-label="Brasil" role="img"><rect width="20" height="14" fill="#009C3B"/><path d="M10 1.6 18 7 10 12.4 2 7z" fill="#FFDF00"/><circle cx="10" cy="7" r="3.1" fill="#002776"/></svg>';
  function vl(c){var e=el("div","vl",c==null?"—":brl(c));if(c!=null){var f=el("span","fl");f.innerHTML=FLAG;e.appendChild(f)}return e}
  function ago(ms){
    if(!ms)return "";var s=Math.max(0,(Date.now()-ms)/1000);
    if(s<60)return "agora mesmo";
    var m=Math.floor(s/60);if(m<60)return "há "+m+" min";
    var h=Math.floor(m/60);if(h<24)return "há "+h+(h===1?" hora":" horas");
    var d=Math.floor(h/24);if(d<30)return "há "+d+(d===1?" dia":" dias");
    return new Date(ms).toLocaleDateString("pt-BR");
  }
  var MED=[["#FFE27A","#D99A00","#8A5A00"],["#F4F6FF","#A9B1C9","#5E667D"],["#FFB27A","#C26A2B","#6E3512"]];
  function medal(i){
    var c=MED[i],id="m"+i,s=document.createElementNS(NS,"svg");
    s.setAttribute("viewBox","0 0 40 50");s.setAttribute("class","medal");s.setAttribute("aria-label",["Ouro","Prata","Bronze"][i]);s.setAttribute("role","img");
    s.innerHTML='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c[0]+'"/><stop offset=".55" stop-color="'+c[1]+'"/><stop offset="1" stop-color="'+c[2]+'"/></linearGradient></defs>'+
      '<path d="M9 0h8l5 17h-8z" fill="#7C8CFF"/><path d="M31 0h-8l-5 17h8z" fill="#9B6BFF"/>'+
      '<circle cx="20" cy="31" r="15.5" fill="url(#'+id+')" stroke="'+c[0]+'" stroke-opacity=".7"/>'+
      '<circle cx="20" cy="31" r="11" fill="none" stroke="'+c[2]+'" stroke-opacity=".45" stroke-width="1.4"/>'+
      '<text x="20" y="32" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="15" fill="'+c[2]+'">'+(i+1)+'</text>';
    return s;
  }
  function podium(top){
    var box=document.getElementById("podium");box.textContent="";
    [[1,"p2"],[0,"p1"],[2,"p3"]].forEach(function(o){
      var x=top[o[0]],col=el("div","pd "+o[1]+(x?"":" empty"));
      if(x)col.appendChild(medal(o[0]));
      if(x){col.appendChild(avatar(x.nome))}
      else{var ph=el("div","av");ph.style.background="rgba(255,255,255,.06)";col.appendChild(ph)}
      col.appendChild(el("div","nm",x?x.nome:"—"));
      col.appendChild(vl(x?x.centavos:null));
      col.appendChild(el("div","step",String(o[0]+1)));
      box.appendChild(col);
    });
  }
  function lista(rec){
    var ul=document.getElementById("list");ul.textContent="";
    if(!rec.length){ul.appendChild(el("li","msg","Ainda não há colaborações públicas. Seja o primeiro! 💜"));return}
    rec.forEach(function(r){
      var li=el("li","row");li.appendChild(avatar(r.nome));
      var tx=el("div","tx");tx.appendChild(el("span","nm",r.nome));tx.appendChild(el("span","tm",ago(r.em)));
      li.appendChild(tx);li.appendChild(vl(r.centavos));ul.appendChild(li);
    });
  }
  function load(){
    fetch("/api/colaboracoes",{headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
      podium(d.top||[]);lista(d.recentes||[]);
    }).catch(function(){
      if(!document.querySelector(".row")){podium([]);var ul=document.getElementById("list");ul.textContent="";ul.appendChild(el("li","msg","Não foi possível carregar agora. Tente novamente em instantes."))}
    });
  }
  podium([]);load();setInterval(load,30000);
})();
