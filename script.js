const I18N={
pt:{
title:'Removedor de marca d’água · AETIX DESIGN',
h1:'Removedor de marca d’água',
sub:'Apague textos e marcas das suas imagens em poucos cliques.',
engReady:'Pronto para usar',
engErr:'Detecção automática indisponível',
engLoad:'Carregando recursos…',
dropTitle:'Arraste sua imagem aqui',
dropHint:'ou cole com Ctrl+V',
dropBtn:'Escolher arquivo',
pencil:'Lápis',
pencilTip:'Lápis: pinte à mão o que o OCR não detectou',
penWidth:'Espessura do lápis',
eraser:'Borracha',
eraserTip:'Borracha: apague partes do traço feito com o lápis',
eraserWidth:'Largura da borracha',
removeImage:'Remover imagem',
cancelScan:'Cancelar escaneamento',
selectAll:'Selecionar todos',
clearSel:'Limpar seleção',
drawBox:'Desenhar caixa',
drawBoxTip:'Arraste sobre a imagem para marcar uma área que não foi detectada',
rescan:'Reescanear',
undo:'Desfazer',
removeSel:'Remover selecionados',
removing:'Removendo…',
savePng:'Baixar PNG',
adjust:'Ajustes',
fLang:'Idioma',
ocrPorEng:'Português + Inglês',
ocrEng:'Inglês',
ocrSpaEng:'Espanhol + Inglês',
ocrFraEng:'Francês + Inglês',
ocrDeuEng:'Alemão + Inglês',
ocrItaEng:'Italiano + Inglês',
fGran:'Detectar por',
gWords:'Palavras',
gLines:'Linhas',
fConf:'Confiança mínima',
fMode:'Modo',
mGlyph:'Só as letras',
mBox:'Caixa inteira',
fAlgo:'Algoritmo',
aTelea:'Suave',
aNs:'Bordas',
fPad:'Margem da caixa',
fThr:'Sensibilidade de cor',
fDil:'Espessura extra',
fRad:'Raio de reconstrução',
fPsm:'Leitura do texto',
psm11:'Texto esparso (PSM 11)',
psm3:'Página automática (PSM 3)',
psm6:'Bloco único',
fMerge:'Agrupar caixas',
fPrep:'Pré-processamento',
pOtsu:'Otsu (rígido)',
pAdaptive:'Adaptativo',
pOff:'Desligado',
fBinc:'Rigor do filtro',
fTex:'Recriar granulado',
fMeta:'Remover metadados',
footerBy:'Desenvolvido por',
footerRights:'© AETIX DESIGN. Todos os direitos reservados.',
helpTitle:'Central de ajuda',
close:'Fechar',
uiLang:'Idioma da interface',
countOne:'{n} texto',
countMany:'{n} textos',
selOne:'{n} selecionado',
selMany:'{n} selecionados',
manualStroke:'traço manual',
manualArea:'Área marcada à mão',
chooseImage:'Escolha um arquivo de imagem.',
openFail:'Não foi possível abrir essa imagem. Tente PNG, JPG ou WebP.',
preparing:'Preparando a detecção…',
loadingCV:'Carregando o OpenCV para preparar a imagem…',
searching:'Procurando textos… {p}%',
downloading:'Baixando dados do idioma… {p}%',
isolating:'Isolando os textos do fundo…',
refining:'Reforçando a leitura das bordas… {i}/4',
scanDone:'Clique nas caixas dos textos que deseja apagar e depois em “Remover selecionados”.',
scanNone:'Nenhum texto encontrado. Diminua a confiança mínima, reduza o rigor do filtro ou use “Desenhar caixa”.',
scanCancelled:'Escaneamento cancelado. Use “Reescanear”, o lápis ou “Desenhar caixa” quando quiser.',
scanError:'Erro na detecção de texto: {e}. Você ainda pode usar “Desenhar caixa”.',
penHint:'Pinte sobre a marca que deseja apagar. Ajuste a espessura e solte o controle para começar a pintar.',
eraserHint:'Ajuste a largura e solte o controle para começar a apagar.',
penActive:'Pinte sobre a marca que deseja apagar. Clique no lápis de novo para desativar.',
eraserActive:'Passe a borracha sobre o traço que quiser apagar. Clique na borracha de novo para desativar.',
drawHint:'Arraste sobre a imagem para marcar uma área.',
rebuilding:'Reconstruindo o fundo…',
done:'Pronto. Se sobrar algo, selecione de novo ou use “Reescanear”.',
doneAlt:'Pronto. (Usei o modo de reconstrução alternativo.) Se sobrar algo, selecione de novo ou use “Reescanear”.',
procError:'Erro ao processar: {e}',
undone:'Alteração desfeita.',
pngFail:'Não foi possível gerar o PNG.',
saved:'Imagem salva.',
errLoad:'Falha ao carregar {u}',
errCvInpaint:'cv.inpaint indisponível',
errFull:'A seleção cobre a imagem inteira.',
help:[
{t:'Enviar uma imagem',p:'Arraste o arquivo para a caixa, clique em “Escolher arquivo” ou cole com Ctrl+V. Funciona com PNG, JPG e WebP. Imagens com mais de 4096 px no maior lado são reduzidas para o navegador não travar.'},
{t:'Detecção automática de textos',p:'Ao abrir a imagem, o site procura textos e marca cada um com uma caixa azul. A leitura reforça as bordas, onde as marcas d’água costumam ficar. Uma linha de luz percorre a imagem enquanto isso acontece.'},
{t:'Selecionar e remover',p:'Clique nas caixas que deseja apagar (elas ficam rosas) e depois em “Remover selecionados”. “Selecionar todos” e “Limpar seleção” marcam e desmarcam tudo de uma vez.'},
{t:'Cancelar o escaneamento',p:'Enquanto o site lê a imagem, aparece o botão “Cancelar escaneamento”. Ele interrompe a leitura na hora. Depois você pode usar “Reescanear”, o lápis ou “Desenhar caixa”.'},
{t:'Desenhar caixa',p:'Se algum texto não foi detectado, clique em “Desenhar caixa” e arraste sobre a área. A caixa já entra selecionada.'},
{t:'Lápis',p:'Clique no lápis para abrir a guia de espessura e pinte sobre a marca que o escaneamento não pegou. O traço rosa entra junto com as caixas em “Remover selecionados”. Ao soltar o controle de espessura, a guia some sozinha para não atrapalhar. Clique no lápis de novo para desativá-lo e voltar a clicar nas caixas.'},
{t:'Borracha',p:'Apaga partes do traço que você fez com o lápis, se errou ou passou do ponto. Ela tem a própria guia de largura, que some ao soltar o controle. Clique na borracha de novo para desativá-la. A borracha só mexe no traço ainda não removido, nunca na imagem.'},
{t:'Desfazer',p:'“Desfazer” volta as últimas remoções, até 4 delas.'},
{t:'Reescanear e ajustes',p:'“Reescanear” lê a imagem de novo. Em “Ajustes” você muda o idioma, a confiança mínima, o agrupamento das caixas e o pré-processamento (Otsu, Adaptativo ou Desligado). Se sobrarem texturas marcadas como texto, aumente o “Rigor do filtro”; se faltar texto sutil, diminua.'},
{t:'Metadados e privacidade',p:'Com “Remover metadados” marcado, o arquivo baixado sai sem EXIF nem perfil de cor, e as áreas reconstruídas recebem uma variação aleatória de ±1 no RGB. É uma camada extra de privacidade, não garante que a edição seja indetectável.'},
{t:'Baixar PNG',p:'Salva a imagem em PNG sem perdas, com qualidade máxima. Tudo é processado no seu navegador e nada é enviado a um servidor.'},
{t:'Por que aparecem marcações em locais sem texto?',p:'Isso ocorre devido a variações drásticas de luz, sombras ou texturas complexas no fundo da imagem que o algoritmo inicial confunde com caracteres. Mas fique tranquilo! Isso não interfere em absolutamente nada no resultado final, pois APENAS as caixas que você selecionar manualmente serão removidas. Este é um comportamento de sensibilidade do motor que será refinado e corrigido nas nossas próximas atualizações.'}
]
},
en:{
title:'Watermark remover · AETIX DESIGN',
h1:'Watermark remover',
sub:'Erase text and marks from your images in just a few clicks.',
engReady:'Ready to use',
engErr:'Automatic detection unavailable',
engLoad:'Loading resources…',
dropTitle:'Drag your image here',
dropHint:'or paste with Ctrl+V',
dropBtn:'Choose file',
pencil:'Pencil',
pencilTip:'Pencil: paint by hand what the OCR didn’t detect',
penWidth:'Pencil thickness',
eraser:'Eraser',
eraserTip:'Eraser: erase parts of the stroke made with the pencil',
eraserWidth:'Eraser width',
removeImage:'Remove image',
cancelScan:'Cancel scan',
selectAll:'Select all',
clearSel:'Clear selection',
drawBox:'Draw box',
drawBoxTip:'Drag over the image to mark an area that wasn’t detected',
rescan:'Rescan',
undo:'Undo',
removeSel:'Remove selected',
removing:'Removing…',
savePng:'Download PNG',
adjust:'Settings',
fLang:'Language',
ocrPorEng:'Portuguese + English',
ocrEng:'English',
ocrSpaEng:'Spanish + English',
ocrFraEng:'French + English',
ocrDeuEng:'German + English',
ocrItaEng:'Italian + English',
fGran:'Detect by',
gWords:'Words',
gLines:'Lines',
fConf:'Minimum confidence',
fMode:'Mode',
mGlyph:'Letters only',
mBox:'Entire box',
fAlgo:'Algorithm',
aTelea:'Smooth',
aNs:'Edges',
fPad:'Box margin',
fThr:'Color sensitivity',
fDil:'Extra thickness',
fRad:'Reconstruction radius',
fPsm:'Text reading',
psm11:'Sparse text (PSM 11)',
psm3:'Automatic page (PSM 3)',
psm6:'Single block',
fMerge:'Group boxes',
fPrep:'Preprocessing',
pOtsu:'Otsu (strict)',
pAdaptive:'Adaptive',
pOff:'Off',
fBinc:'Filter strictness',
fTex:'Recreate grain',
fMeta:'Remove metadata',
footerBy:'Developed by',
footerRights:'© AETIX DESIGN. All rights reserved.',
helpTitle:'Help center',
close:'Close',
uiLang:'Interface language',
countOne:'{n} text',
countMany:'{n} texts',
selOne:'{n} selected',
selMany:'{n} selected',
manualStroke:'manual stroke',
manualArea:'Area marked by hand',
chooseImage:'Choose an image file.',
openFail:'Couldn’t open this image. Try PNG, JPG or WebP.',
preparing:'Preparing detection…',
loadingCV:'Loading OpenCV to prepare the image…',
searching:'Searching for text… {p}%',
downloading:'Downloading language data… {p}%',
isolating:'Isolating the text from the background…',
refining:'Reinforcing edge reading… {i}/4',
scanDone:'Click the boxes of the text you want to erase, then “Remove selected”.',
scanNone:'No text found. Lower the minimum confidence, reduce the filter strictness or use “Draw box”.',
scanCancelled:'Scan cancelled. Use “Rescan”, the pencil or “Draw box” whenever you like.',
scanError:'Text detection error: {e}. You can still use “Draw box”.',
penHint:'Paint over the mark you want to erase. Adjust the thickness and release the control to start painting.',
eraserHint:'Adjust the width and release the control to start erasing.',
penActive:'Paint over the mark you want to erase. Click the pencil again to turn it off.',
eraserActive:'Run the eraser over the stroke you want to erase. Click the eraser again to turn it off.',
drawHint:'Drag over the image to mark an area.',
rebuilding:'Rebuilding the background…',
done:'Done. If anything is left over, select it again or use “Rescan”.',
doneAlt:'Done. (I used the alternative reconstruction mode.) If anything is left over, select it again or use “Rescan”.',
procError:'Error while processing: {e}',
undone:'Change undone.',
pngFail:'Couldn’t generate the PNG.',
saved:'Image saved.',
errLoad:'Failed to load {u}',
errCvInpaint:'cv.inpaint unavailable',
errFull:'The selection covers the entire image.',
help:[
{t:'Upload an image',p:'Drag the file into the box, click “Choose file” or paste with Ctrl+V. Works with PNG, JPG and WebP. Images larger than 4096 px on the longest side are scaled down so the browser doesn’t freeze.'},
{t:'Automatic text detection',p:'When you open the image, the site looks for text and marks each one with a blue box. The reading reinforces the edges, where watermarks usually sit. A line of light sweeps across the image while this happens.'},
{t:'Select and remove',p:'Click the boxes you want to erase (they turn pink) and then “Remove selected”. “Select all” and “Clear selection” check and uncheck everything at once.'},
{t:'Cancel the scan',p:'While the site reads the image, the “Cancel scan” button appears. It stops the reading immediately. Afterwards you can use “Rescan”, the pencil or “Draw box”.'},
{t:'Draw box',p:'If some text wasn’t detected, click “Draw box” and drag over the area. The box is added already selected.'},
{t:'Pencil',p:'Click the pencil to open the thickness guide and paint over the mark the scan missed. The pink stroke is included along with the boxes in “Remove selected”. When you release the thickness control, the guide disappears on its own so it doesn’t get in the way. Click the pencil again to turn it off and go back to clicking the boxes.'},
{t:'Eraser',p:'Erases parts of the stroke you made with the pencil, if you made a mistake or went too far. It has its own width guide, which disappears when you release the control. Click the eraser again to turn it off. The eraser only affects the stroke that hasn’t been removed yet, never the image.'},
{t:'Undo',p:'“Undo” reverts the latest removals, up to 4 of them.'},
{t:'Rescan and settings',p:'“Rescan” reads the image again. In “Settings” you change the language, the minimum confidence, the grouping of boxes and the preprocessing (Otsu, Adaptive or Off). If textures are being marked as text, increase the “Filter strictness”; if subtle text is missing, decrease it.'},
{t:'Metadata and privacy',p:'With “Remove metadata” checked, the downloaded file comes out without EXIF or color profile, and the reconstructed areas receive a random ±1 variation in RGB. It’s an extra layer of privacy; it doesn’t guarantee the edit is undetectable.'},
{t:'Download PNG',p:'Saves the image as a lossless PNG at maximum quality. Everything is processed in your browser and nothing is sent to a server.'},
{t:'Why do marks appear in places without text?',p:'This happens because of drastic variations in light, shadows or complex textures in the image background that the initial algorithm confuses with characters. But don’t worry! This doesn’t affect the final result at all, since ONLY the boxes you select manually will be removed. This is a sensitivity behavior of the engine that will be refined and fixed in our upcoming updates.'}
]
}
};
const LS_KEY='aetix-lang';
let LANG='pt',curMsg=null,goKey='removeSel';
const _x45=e=>e&&e.i18n?tr(e.i18n.k,e.i18n.p):(e&&e.message)||String(e);
const tr=(k,p)=>{
  const s=(I18N[LANG]&&I18N[LANG][k])??I18N.pt[k]??k;
  return p?s.replace(/\{(\w+)\}/g,(_,n)=>{const v=p[n];return v==null?'':typeof v==='object'?_x45(v):v}):s;
};
const _x46=(k,p)=>{const e=new Error(tr(k,p));e.i18n={k,p};return e};
const _x54=b=>b.manual?tr('manualArea'):'“'+b.text+'” ('+b.conf+'%)';

const $=s=>document.querySelector(s);
const _x0=(v,a,b)=>Math.min(b,Math.max(a,v));
const _x1=()=>new Promise(r=>setTimeout(r,30));
const _x2=(k,err,p)=>{curMsg=k?{k,err:!!err,p}:null;_x56()};
const _x56=()=>{const m=$('#msg');m.textContent=curMsg?tr(curMsg.k,curMsg.p):'';m.className=curMsg&&curMsg.err?'err':''};
const eng={ocr:'load',cv:'load'};
const _x3=(k,s)=>{eng[k]=s;_x51()};
const _x51=()=>{
  const p=$('#engine');
  const st=eng.ocr==='err'?'err':(eng.ocr==='ok'&&eng.cv!=='load')?'ok':'load';
  p.dataset.s=st;
  $('#engine-t').textContent=tr(st==='ok'?'engReady':st==='err'?'engErr':'engLoad');
};
const cnv=$('#cnv'),cx=cnv.getContext('2d',{willReadFrequently:true});
const MAX=4096;
let W=0,H=0,boxes=[],raw={words:[],lines:[]},rawScale=1,hist=[],worker=null,workerLang='',busy=false,drawMode=false,cvOK=false,ink=null,scanCtl=null;
const TESS_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
const CV_URLS=['https://docs.opencv.org/4.x/opencv.js','https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js'];
function _x4(u){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=u;s.async=true;s.onload=res;s.onerror=()=>{s.remove();rej(_x46('errLoad',{u}))};document.head.appendChild(s)})}
async function _x5(u){
  await _x4(u);
  let c=window.cv;if(!c)throw new Error('cv ausente');
  if(typeof c.then==='function'){
    c=await new Promise((res,rej)=>{c.then(m=>{try{delete m.then}catch(e){}res(m)},rej)});window.cv=c;
  }
  if(!c.Mat){
    await new Promise((res,rej)=>{
      const t=setTimeout(()=>{clearInterval(p);rej(new Error('timeout'))},90000);
      const done=()=>{clearTimeout(t);clearInterval(p);res()};
      const p=setInterval(()=>{if(c.Mat)done()},250);
      c.onRuntimeInitialized=done;
    });
  }
  if(!window.cv.inpaint)throw _x46('errCvInpaint');
}
const _x6=(window._ps||Promise.resolve()).then(()=>new Promise(r=>setTimeout(r,80))); 
const tessP=_x6.then(()=>_x4(TESS_URL)).then(()=>_x3('ocr','ok')).catch(e=>{_x3('ocr','err');throw e});
tessP.catch(()=>{});
const cvP=(async()=>{ 
  await _x6;
  for(const u of CV_URLS){try{await _x5(u);cvOK=true;_x3('cv','ok');return}catch(e){console.warn(e)}}
  _x3('cv','err');
})();
function _x7(file){
  const viaReader=()=>new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onerror=()=>rej(new Error('leitura'));
    fr.onload=()=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('decodificação'));im.src=fr.result};
    fr.readAsDataURL(file);
  });
  const viaBitmap=()=>typeof createImageBitmap==='function'?createImageBitmap(file):Promise.reject(new Error('sem createImageBitmap'));
  return viaBitmap().catch(viaReader);
}
async function _x8(file){
  if(!file||!file.type.startsWith('image/')){_x2('chooseImage',true);return}
  let im;
  try{im=await _x7(file)}
  catch(e){console.error(e);_x2('openFail',true);return}
  const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;
  const s=Math.min(1,MAX/Math.max(iw,ih));
  W=Math.round(iw*s);H=Math.round(ih*s);
  cnv.width=W;cnv.height=H;ov.width=W;ov.height=H;penDirty=false;cx.clearRect(0,0,W,H);cx.drawImage(im,0,0,W,H);
  if(im.close)im.close();
  hist=[];boxes=[];raw={words:[],lines:[]};_x31();
  $('#drop').hidden=true;$('#editor').hidden=false;$('#helpBtn').hidden=false;$('#undo').disabled=true;_x22(null);
  _x15();
}
$('#file').onchange=e=>{_x8(e.target.files[0]);e.target.value=''};
function _x9(){
  if(busy)return;
  W=0;H=0;boxes=[];raw={words:[],lines:[]};hist=[];
  drawMode=false;$('#draw').setAttribute('aria-pressed','false');layer.classList.remove('draw');
  cnv.width=1;cnv.height=1;ov.width=1;ov.height=1;penDirty=false;_x22(null);_x31();
  $('#editor').hidden=true;$('#helpBtn').hidden=true;$('#drop').hidden=false;$('#undo').disabled=true;_x2('');
}
$('#reset').onclick=_x9;
const drop=$('#drop');
['dragenter','dragover'].forEach(t=>window.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>window.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
window.addEventListener('drop',e=>_x8(e.dataTransfer.files[0]));
window.addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])][0];if(f)_x8(f)});
function _x10(b,label){
  busy=b;
  ['#rescan','#all','#none','#undo','#save','#reset','#draw','#pencil','#eraser','#lang'].forEach(s=>$(s).disabled=b);
  $('#go').disabled=b||!(penDirty||boxes.some(x=>x.sel));
  if(!b)$('#undo').disabled=!hist.length;
  goKey=b&&label==='rem'?'removing':'removeSel';$('#go-t').textContent=tr(goKey);
}
function _x11(data,kind){
  if(data[kind]&&data[kind].length)return data[kind];
  const out=[];
  (data.blocks||[]).forEach(b=>(b.paragraphs||[]).forEach(p=>(p.lines||[]).forEach(l=>{
    if(kind==='lines')out.push(l);else(l.words||[]).forEach(w=>out.push(w))})));
  return out;
}
function _x12(src,mode,c){
  const k=window.cv;if(!cvOK||!k||mode==='off')return src;
  const mats=[],mk=()=>{const m=new k.Mat();mats.push(m);return m};
  try{
    const rgba=k.imread(src);mats.push(rgba);
    const g=mk(),o=mk();
    k.cvtColor(rgba,g,k.COLOR_RGBA2GRAY);
    k.GaussianBlur(g,g,new k.Size(3,3),0);
    if(mode==='otsu'){
      k.threshold(g,o,0,255,k.THRESH_BINARY|k.THRESH_OTSU);
      if(k.countNonZero(o)<o.rows*o.cols/2)k.bitwise_not(o,o); 
    }else{
      const bs=_x0(Math.round(Math.min(src.width,src.height)/6),31,255)|1,a=mk(),b=mk(); 
      k.adaptiveThreshold(g,a,255,k.ADAPTIVE_THRESH_GAUSSIAN_C,k.THRESH_BINARY,bs,c);
      k.adaptiveThreshold(g,b,255,k.ADAPTIVE_THRESH_GAUSSIAN_C,k.THRESH_BINARY,bs,-c);
      k.bitwise_not(b,b);k.bitwise_and(a,b,o);
    }
    const t=mk();k.medianBlur(o,t,3); 
    const out=document.createElement('canvas');out.width=src.width;out.height=src.height;
    k.imshow(out,t);return out;
  }catch(e){console.warn('binarização',e);return src}
  finally{mats.forEach(m=>{try{m.delete()}catch(e){}})}
}
function _x13(c,sc){ 
  const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,n=c.width*c.height,m=new Uint8Array(n);
  for(let i=0;i<n;i++)m[i]=d[i*4]<128?1:0;
  return{w:c.width,h:c.height,sc,d:m};
}
function _x14(b){
  if(!ink)return true;
  const s=ink.sc,x0=_x0(Math.floor(b.x*s),0,ink.w-1),y0=_x0(Math.floor(b.y*s),0,ink.h-1),x1=_x0(Math.ceil((b.x+b.w)*s),x0+1,ink.w),y1=_x0(Math.ceil((b.y+b.h)*s),y0+1,ink.h);
  let n=0;for(let y=y0;y<y1;y++){const o=y*ink.w;for(let x=x0;x<x1;x++)n+=ink.d[o+x]}
  const f=n/((x1-x0)*(y1-y0));return f>=.03&&f<=.85;
}
async function _x15(){
  if(!W||busy)return;
  const ctl={cancelled:false,rej:null};ctl.p=new Promise((_,rej)=>{ctl.rej=rej});ctl.p.catch(()=>{});
  scanCtl=ctl;const run=p=>Promise.race([p,ctl.p]); 
  _x10(true);const pg=$('#prog'),sb=$('#scanbar');sb.hidden=false;pg.removeAttribute('value');$('#laser').hidden=false;
  _x2('preparing');
  try{
    await run(tessP);
    if(eng.cv==='load')_x2('loadingCV');
    await run(cvP);
    _x2('preparing');
    const lang=$('#lang').value;
    if(!worker||workerLang!==lang){
      if(worker){const old=worker;worker=null;workerLang='';await run(Promise.resolve(old.terminate()).catch(()=>{}))}
      const mkw=Tesseract.createWorker(lang,1,{logger:m=>{
        if(ctl.cancelled)return;
        if(typeof m.progress==='number'){pg.value=m.progress;
          _x2(m.status==='recognizing text'?'searching':'downloading',false,{p:Math.round(m.progress*100)})}
      }});
      try{worker=await run(mkw);workerLang=lang}
      catch(e){if(ctl.cancelled)mkw.then(x=>x.terminate()).catch(()=>{});throw e}
    }
    const wk=worker;
    await run(wk.setParameters({tessedit_pageseg_mode:$('#psm').value,preserve_interword_spaces:'1',user_defined_dpi:'300'}));
    const prep=$('#prep').value,bc=+$('#binc').value,useBin=cvOK&&prep!=='off';
    const mx=Math.max(W,H);rawScale=mx<1600?2:mx>3200?3200/mx:1; 
    const oc=document.createElement('canvas');oc.width=Math.round(W*rawScale);oc.height=Math.round(H*rawScale);
    const o=oc.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,oc.width,oc.height);o.imageSmoothingQuality='high';try{o.filter='grayscale(1) contrast(1.25)'}catch(e){}o.drawImage(cnv,0,0,oc.width,oc.height);
    let inp=oc,newInk=null;
    if(useBin){_x2('isolating');await _x1();inp=_x12(oc,prep,bc);if(inp!==oc)newInk=_x13(inp,rawScale)}
    if(ctl.cancelled)throw new Error('cancelado');
    pg.removeAttribute('value');
    const {data}=await run(wk.recognize(inp));
    const norm=(arr,x0,y0,sc,edge)=>arr.filter(w=>w.bbox).map(w=>({text:w.text||'',confidence:w.confidence,edge,
      bbox:{x0:x0+w.bbox.x0/sc,y0:y0+w.bbox.y0/sc,x1:x0+w.bbox.x1/sc,y1:y0+w.bbox.y1/sc}}));
    const nr={words:norm(_x11(data,'words'),0,0,rawScale,false),lines:norm(_x11(data,'lines'),0,0,rawScale,false)};
    const bx=Math.round(W*.15),by=Math.round(H*.15);
    const strips=[[0,0,W,by],[0,H-by,W,by],[0,0,bx,H],[W-bx,0,bx,H]];
    for(let si=0;si<strips.length;si++){
      if(ctl.cancelled)throw new Error('cancelado');
      const [x,y,w,h]=strips[si];if(w<8||h<8)continue;
      try{
        _x2('refining',false,{i:si+1});
        const sc=_x0(2000/Math.max(w,h),1,3),sc2=document.createElement('canvas');
        sc2.width=Math.round(w*sc);sc2.height=Math.round(h*sc);
        const k=sc2.getContext('2d');k.fillStyle='#fff';k.fillRect(0,0,sc2.width,sc2.height);k.imageSmoothingQuality='high';
        try{k.filter='grayscale(1) contrast(1.8)'}catch(e){}
        k.drawImage(cnv,x,y,w,h,0,0,sc2.width,sc2.height);
        const inp2=useBin?_x12(sc2,prep,Math.max(3,Math.round(bc*.6))):sc2;
        const r2=await run(wk.recognize(inp2));
        nr.words.push(...norm(_x11(r2.data,'words'),x,y,sc,true));
        nr.lines.push(...norm(_x11(r2.data,'lines'),x,y,sc,true));
      }catch(e){if(ctl.cancelled)throw e;console.warn('faixa',si,e)}
    }
    raw=nr;ink=newInk; 
    _x19();
    const n=boxes.filter(b=>!b.manual).length;
    _x2(n?'scanDone':'scanNone',!n);
  }catch(e){
    if(ctl.cancelled)_x2('scanCancelled');
    else{console.error(e);_x2('scanError',true,{e})}
  }
  sb.hidden=true;$('#laser').hidden=true;scanCtl=null;_x10(false);
}
$('#cancel').onclick=()=>{
  const c=scanCtl;if(!c||c.cancelled)return;c.cancelled=true;
  if(worker){const w=worker;worker=null;workerLang='';Promise.resolve().then(()=>w.terminate()).catch(()=>{})} 
  c.rej(new Error('cancelado'));
};
function _x16(list,k){
  const n=list.length;if(n<2||k<=0)return list;
  const p=list.map((_,i)=>i),f=i=>{while(p[i]!==i){p[i]=p[p[i]];i=p[i]}return i};
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const a=list[i],b=list[j],minH=Math.min(a.h,b.h),maxH=Math.max(a.h,b.h);
    if(Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<minH*.5)continue; 
    if(maxH>minH*2.2)continue;                                         
    if(Math.max(a.x,b.x)-Math.min(a.x+a.w,b.x+b.w)<=maxH*k)p[f(i)]=f(j); 
  }
  const g=new Map();
  list.forEach((b,i)=>{const r=f(i);if(!g.has(r))g.set(r,[]);g.get(r).push(b)});
  return [...g.values()].map(m=>{
    if(m.length===1)return m[0];
    m.sort((a,b)=>a.x-b.x);
    const x0=Math.min(...m.map(b=>b.x)),y0=Math.min(...m.map(b=>b.y)),x1=Math.max(...m.map(b=>b.x+b.w)),y1=Math.max(...m.map(b=>b.y+b.h));
    const chars=m.reduce((t,b)=>t+b.text.length,0);
    return{x:x0,y:y0,w:x1-x0,h:y1-y0,text:m.map(b=>b.text).join(' '),conf:m.reduce((t,b)=>t+b.conf*b.text.length,0)/chars,sel:false};
  });
}
function _x17(b,th=4.5){
  const x=Math.max(0,Math.floor(b.x)),y=Math.max(0,Math.floor(b.y)),w=Math.min(W-x,Math.ceil(b.w)),h=Math.min(H-y,Math.ceil(b.h));
  if(w<2||h<2)return false;
  const d=cx.getImageData(x,y,w,h).data,n=w*h;let s=0,q=0;
  for(let i=0;i<n;i++){const l=d[i*4]*.299+d[i*4+1]*.587+d[i*4+2]*.114;s+=l;q+=l*l}
  const m=s/n;return Math.sqrt(Math.max(0,q/n-m*m))>=th;
}
function _x18(list){
  const out=[];
  list.slice().sort((a,b)=>b.conf-a.conf).forEach(b=>{
    const A=b.w*b.h;
    if(out.some(o=>{const iw=Math.min(o.x+o.w,b.x+b.w)-Math.max(o.x,b.x),ih=Math.min(o.y+o.h,b.y+b.h)-Math.max(o.y,b.y);return iw>0&&ih>0&&iw*ih>A*.5}))return;
    out.push(b);
  });
  return out;
}
function _x19(){
  const items=raw[$('#gran').value]||[],minc=+$('#conf').value,minDim=Math.min(W,H);
  const inEdge=b=>{const cX=b.x+b.w/2,cY=b.y+b.h/2;return cX<W*.15||cX>W*.85||cY<H*.15||cY>H*.85};
  let det=[];
  for(const w of items){
    if(!w.bbox)continue;
    const text=(w.text||'').trim(),conf=w.confidence;
    if(!text)continue;
    const b={x:w.bbox.x0,y:w.bbox.y0,w:w.bbox.x1-w.bbox.x0,h:w.bbox.y1-w.bbox.y0,text,conf,sel:false},e=inEdge(b);
    if(conf<(e?Math.max(10,minc*.4):minc))continue;
    const chars=text.replace(/\s/g,''),good=(chars.match(/[\p{L}\p{N}]/gu)||[]).length;
    if(good/chars.length<(e?.5:.6))continue;          
    if(good<2&&conf<(e?55:80))continue;               
    if(b.h<minDim*(e?.005:.008)||b.h>H*.4||b.w<2)continue; 
    if(b.h>b.w*3&&good<3)continue;                    
    det.push(b);
  }
  det=_x16(_x18(det),+$('#merge').value).filter(b=>inEdge(b)||_x14(b)).filter(b=>_x17(b,inEdge(b)?2.2:4.5)).map(b=>({...b,conf:Math.round(b.conf)}));
  boxes=boxes.filter(b=>b.manual).concat(det);_x31();
}
$('#rescan').onclick=_x15;
$('#lang').onchange=_x15;
$('#psm').onchange=_x15;$('#prep').onchange=_x15;$('#binc').onchange=_x15;
$('#gran').onchange=()=>{boxes=boxes.filter(b=>b.manual);_x19()};
$('#conf').oninput=e=>{$('#confv').textContent=e.target.value;if(raw.words.length||raw.lines.length)_x19()};
[['pad'],['thr'],['dil'],['rad'],['merge'],['binc']].forEach(([k])=>$('#'+k).oninput=e=>$('#'+k+'v').textContent=e.target.value);
$('#merge').addEventListener('input',()=>{if(raw.words.length||raw.lines.length)_x19()});
const layer=$('#boxes'),ov=$('#ov'),ox=ov.getContext('2d',{willReadFrequently:true});
let tool=null,penDirty=false,pl=null; 
const POPS={pen:'#penpop',eraser:'#erapop'},BTNS={pen:'#pencil',eraser:'#eraser'},SIZE={pen:'#pen',eraser:'#era'};
function _x20(){for(const k in POPS){$(POPS[k]).hidden=true;$(BTNS[k]).setAttribute('aria-expanded','false')}}
function _x21(t){ 
  _x20();const p=$(POPS[t]);p.style.setProperty('--dx','0px');p.hidden=false;
  const r=p.getBoundingClientRect(),m=10;let dx=0;
  if(r.left<m)dx=m-r.left;else if(r.right>innerWidth-m)dx=innerWidth-m-r.right;
  p.style.setProperty('--dx',dx+'px');$(BTNS[t]).setAttribute('aria-expanded','true');
}
function _x22(t){
  tool=t;_x20(); 
  for(const k in BTNS)$(BTNS[k]).setAttribute('aria-pressed',String(k===t));
  $('#wrap').classList.toggle('pen',!!t);
  if(t&&drawMode){drawMode=false;$('#draw').setAttribute('aria-pressed','false');layer.classList.remove('draw')}
  if(t)_x21(t);else{$('#pcur').hidden=true;pl=null}
  _x2(t==='pen'?'penHint':t==='eraser'?'eraserHint':null);
}
function _x23(t){
  if(tool===t)_x22(null); 
  else _x22(t);           
}
function _x24(t){_x20();_x2(t==='pen'?'penActive':'eraserActive')}
['pen','eraser'].forEach(t=>{const r=$(SIZE[t]);r.addEventListener('change',()=>_x24(t));r.addEventListener('pointerup',()=>_x24(t))});
function _x25(){ox.clearRect(0,0,ov.width,ov.height);penDirty=false}
function _x26(){ 
  const s=Math.min(1,160/Math.max(W,H)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(W*s));c.height=Math.max(1,Math.round(H*s));
  const k=c.getContext('2d',{willReadFrequently:true});k.imageSmoothingQuality='high';k.drawImage(ov,0,0,c.width,c.height);
  const d=k.getImageData(0,0,c.width,c.height).data;let any=false;
  for(let i=3;i<d.length;i+=4)if(d[i]>6){any=true;break}
  penDirty=any;_x32();
}
const pp=e=>{const r=ov.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,k:W/r.width}};
function _x27(a,b){
  const er=tool==='eraser';
  ox.globalCompositeOperation=er?'destination-out':'source-over';
  ox.strokeStyle='#FF4D8D';ox.lineCap='round';ox.lineJoin='round';
  ox.lineWidth=+$(SIZE[tool]).value*b.k;ox.beginPath();ox.moveTo(a.x,a.y);ox.lineTo(b.x+.01,b.y);ox.stroke();
  ox.globalCompositeOperation='source-over';
}
function _x28(e){
  const c=$('#pcur'),r=$('#wrap').getBoundingClientRect(),d=tool?+$(SIZE[tool]).value:20;
  c.hidden=!tool||e.pointerType==='touch';c.classList.toggle('era',tool==='eraser');c.style.width=c.style.height=d+'px';
  c.style.left=(e.clientX-r.left)+'px';c.style.top=(e.clientY-r.top)+'px';
}
$('#pencil').onclick=()=>_x23('pen');
$('#eraser').onclick=()=>_x23('eraser');
$('#pen').oninput=e=>{$('#penv').textContent=e.target.value+'px'};
$('#era').oninput=e=>{$('#erav').textContent=e.target.value+'px'};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.tool'))_x20()}); 
ov.addEventListener('pointerdown',e=>{
  if(!tool||!W||busy)return;
  ov.setPointerCapture(e.pointerId);pl=pp(e);_x27(pl,pl);
  if(tool==='pen'){penDirty=true;_x32()}
});
ov.addEventListener('pointermove',e=>{_x28(e);if(!pl)return;const p=pp(e);_x27(pl,p);pl=p});
ov.addEventListener('pointerleave',()=>{$('#pcur').hidden=true});
['pointerup','pointercancel'].forEach(t=>ov.addEventListener(t,()=>{const was=pl;pl=null;if(was&&tool==='eraser'&&penDirty)_x26()}));
function _x29(m){ 
  if(!penDirty)return;
  const od=ox.getImageData(0,0,W,H).data;
  for(let i=0;i<W*H;i++)if(od[i*4+3]>40)m[i]=1;
}
function _x30(m){
  const cell=8,gw=Math.ceil(W/cell),gh=Math.ceil(H/cell),g=new Uint8Array(gw*gh);
  for(let y=0;y<H;y++){const row=(y/cell|0)*gw,o=y*W;for(let x=0;x<W;x++)if(m[o+x])g[row+(x/cell|0)]=1}
  const seen=new Uint8Array(gw*gh),st=new Int32Array(gw*gh),out=[];
  for(let s0=0;s0<g.length;s0++){
    if(!g[s0]||seen[s0])continue;
    let sp=0,x0=gw,y0=gh,x1=0,y1=0;st[sp++]=s0;seen[s0]=1;
    while(sp){
      const i=st[--sp],x=i%gw,y=(i/gw)|0;
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=gw||yy>=gh)continue;
        const j=yy*gw+xx;if(g[j]&&!seen[j]){seen[j]=1;st[sp++]=j}
      }
    }
    out.push({x:x0*cell,y:y0*cell,w:(x1-x0+1)*cell,h:(y1-y0+1)*cell});
  }
  return out;
}
function _x31(){
  layer.querySelectorAll('.box').forEach(n=>n.remove());
  boxes.forEach(b=>{
    const e=document.createElement('button');e.type='button';e.className='box';
    e.style.cssText=`left:${b.x/W*100}%;top:${b.y/H*100}%;width:${b.w/W*100}%;height:${b.h/H*100}%`;
    e.setAttribute('aria-pressed',String(b.sel));
    const lbl=_x54(b);
    e.title=lbl;e.setAttribute('aria-label',lbl);
    e.onclick=()=>{b.sel=!b.sel;e.setAttribute('aria-pressed',String(b.sel));_x32()};
    layer.appendChild(e);
  });
  _x32();
}
function _x32(){
  const s=boxes.filter(b=>b.sel).length;
  $('#count').textContent=tr(boxes.length===1?'countOne':'countMany',{n:boxes.length})+' · '+tr(s===1?'selOne':'selMany',{n:s})+(penDirty?' · '+tr('manualStroke'):'');
  $('#go').disabled=busy||!(s||penDirty);
}
$('#all').onclick=()=>{boxes.forEach(b=>b.sel=true);_x31()};
$('#none').onclick=()=>{boxes.forEach(b=>b.sel=false);_x25();_x31()};
$('#draw').onclick=()=>{drawMode=!drawMode;if(drawMode&&tool)_x22(null);$('#draw').setAttribute('aria-pressed',String(drawMode));layer.classList.toggle('draw',drawMode);
  _x2(drawMode?'drawHint':null)};
let ds=null,tmp=null;
const lp=e=>{const r=layer.getBoundingClientRect();return{x:_x0((e.clientX-r.left)*W/r.width,0,W),y:_x0((e.clientY-r.top)*H/r.height,0,H)}};
const _x33=(a,b)=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)});
layer.addEventListener('pointerdown',e=>{
  if(!drawMode||e.target!==layer)return;
  layer.setPointerCapture(e.pointerId);ds=lp(e);tmp=document.createElement('div');tmp.className='box tmp';layer.appendChild(tmp);
});
layer.addEventListener('pointermove',e=>{
  if(!ds)return;const r=_x33(ds,lp(e));
  tmp.style.cssText=`left:${r.x/W*100}%;top:${r.y/H*100}%;width:${r.w/W*100}%;height:${r.h/H*100}%`;
});
const endDraw=e=>{
  if(!ds)return;const r=_x33(ds,lp(e));ds=null;if(tmp){tmp.remove();tmp=null}
  if(r.w>6&&r.h>6){boxes.unshift({...r,text:'',conf:100,sel:true,manual:true});_x31()}
};
layer.addEventListener('pointerup',endDraw);
layer.addEventListener('pointercancel',()=>{ds=null;if(tmp){tmp.remove();tmp=null}});
function _x34(sel){
  const d=cx.getImageData(0,0,W,H).data,m=new Uint8Array(W*H);
  const pad=+$('#pad').value,thr=+$('#thr').value,whole=$('#mode').value==='box';
  for(const b of sel){
    const x0=Math.max(0,Math.floor(b.x-pad)),y0=Math.max(0,Math.floor(b.y-pad)),x1=Math.min(W,Math.ceil(b.x+b.w+pad)),y1=Math.min(H,Math.ceil(b.y+b.h+pad));
    const fill=()=>{for(let y=y0;y<y1;y++)m.fill(1,y*W+x0,y*W+x1)};
    if(whole){fill();continue}
    const r=5,ax0=Math.max(0,x0-r),ay0=Math.max(0,y0-r),ax1=Math.min(W,x1+r),ay1=Math.min(H,y1+r);
    const R=[],G=[],B=[];
    for(let y=ay0;y<ay1;y++)for(let x=ax0;x<ax1;x++){
      if(x>=x0&&x<x1&&y>=y0&&y<y1)continue;const i=(y*W+x)*4;R.push(d[i]);G.push(d[i+1]);B.push(d[i+2])}
    if(R.length<8){fill();continue}
    const med=a=>{a.sort((p,q)=>p-q);return a[a.length>>1]};
    const mr=med(R),mg=med(G),mb=med(B),hit=[];
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const i=(y*W+x)*4;
      if(Math.max(Math.abs(d[i]-mr),Math.abs(d[i+1]-mg),Math.abs(d[i+2]-mb))>thr)hit.push(y*W+x);
    }
    if(!hit.length||hit.length>(x1-x0)*(y1-y0)*.7){fill();continue}
    for(const j of hit)m[j]=1;
  }
  return m;
}
const _x35=()=>Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.2831853*Math.random());
function _x36(d,mk){
  const buf=new Uint8Array(65536);let bi=buf.length;
  const fill=()=>{try{crypto.getRandomValues(buf)}catch(e){for(let i=0;i<buf.length;i++)buf[i]=Math.random()*256|0}bi=0};
  for(let i=0;i<W*H;i++){
    if(!mk[i])continue;
    for(let ch=0;ch<3;ch++){
      if(bi>=buf.length)fill();
      const v=d[i*4+ch]+(buf[bi++]%3-1);
      d[i*4+ch]=v<0?0:v>255?255:v;
    }
  }
}
function _x37(d,m){ 
  const diffs=[],l=j=>d[j*4]*.3+d[j*4+1]*.59+d[j*4+2]*.11;
  if(W<4||H<4)return 0;
  for(let s=0;s<20000;s++){
    const x=1+Math.floor(Math.random()*(W-2)),y=1+Math.floor(Math.random()*(H-2)),i=y*W+x;
    if(m[i]||m[i-1]||m[i+1]||m[i-W]||m[i+W])continue;
    diffs.push(Math.abs(l(i)-(l(i-1)+l(i+1)+l(i-W)+l(i+W))/4));
  }
  if(!diffs.length)return 0;
  diffs.sort((a,b)=>a-b);return diffs[diffs.length>>1]*1.2;
}
function _x38(sel,m){
  const c=window.cv,img=cx.getImageData(0,0,W,H);
  const sg=$('#tex').checked?_x37(img.data,m):0;
  const m255=new Uint8Array(W*H);for(let i=0;i<m.length;i++)if(m[i])m255[i]=255;
  const rgba=c.matFromImageData(img),rgb=new c.Mat(),mask=c.matFromArray(H,W,c.CV_8UC1,m255),out=new c.Mat();let k=null;
  try{
    c.cvtColor(rgba,rgb,c.COLOR_RGBA2RGB);
    const it=+$('#dil').value,rad=+$('#rad').value,flag=$('#algo').value==='ns'?c.INPAINT_NS:c.INPAINT_TELEA;
    if(it>0){k=c.Mat.ones(3,3,c.CV_8U);c.dilate(mask,mask,k,new c.Point(-1,-1),it)}
    const px=+$('#pad').value+it+rad*3+6;
    for(const b of _x30(m)){ 
      const x0=Math.max(0,Math.floor(b.x-px)),y0=Math.max(0,Math.floor(b.y-px)),x1=Math.min(W,Math.ceil(b.x+b.w+px)),y1=Math.min(H,Math.ceil(b.y+b.h+px));
      if(x1-x0<2||y1-y0<2)continue;
      const r=new c.Rect(x0,y0,x1-x0,y1-y0),s=rgb.roi(r),mk=mask.roi(r),o=new c.Mat();
      try{c.inpaint(s,mk,o,rad,flag);o.copyTo(s)}finally{s.delete();mk.delete();o.delete()}
    }
    c.cvtColor(rgb,out,c.COLOR_RGB2RGBA);
    const res=new ImageData(new Uint8ClampedArray(out.data),W,H),md=mask.data;
    if(sg>0)for(let i=0;i<W*H;i++){
      if(!md[i])continue;const g=_x35()*sg;
      for(let ch=0;ch<3;ch++)res.data[i*4+ch]=_x0(res.data[i*4+ch]+g+_x35()*sg*.25,0,255);
    }
    if($('#meta').checked)_x36(res.data,md);
    cx.putImageData(res,0,0);
  }finally{[rgba,rgb,mask,out,k].forEach(x=>x&&x.delete())}
}
function _x39(m){
  const t=new Uint8Array(W*H),o=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;t[i]=m[i]|(x>0?m[i-1]:0)|(x<W-1?m[i+1]:0)}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;o[i]=t[i]|(y>0?t[i-W]:0)|(y<H-1?t[i+W]:0)}
  return o;
}
function _x40(d,m){
  const L=[];let c=new Float32Array(W*H*3),a=new Float32Array(W*H),n=new Float32Array(W*H).fill(1),known=0;
  for(let i=0;i<W*H;i++)if(!m[i]){known++;a[i]=1;c[i*3]=d[i*4];c[i*3+1]=d[i*4+1];c[i*3+2]=d[i*4+2]}
  if(!known)return null;
  L.push({w:W,h:H,c,a,n});
  while(L[L.length-1].w>1||L[L.length-1].h>1){
    const p=L[L.length-1],nw=(p.w+1)>>1,nh=(p.h+1)>>1,q={w:nw,h:nh,c:new Float32Array(nw*nh*3),a:new Float32Array(nw*nh),n:new Float32Array(nw*nh)};
    for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++){
      const i=y*p.w+x,j=(y>>1)*nw+(x>>1);q.a[j]+=p.a[i];q.n[j]+=p.n[i];
      q.c[j*3]+=p.c[i*3];q.c[j*3+1]+=p.c[i*3+1];q.c[j*3+2]+=p.c[i*3+2]}
    L.push(q);
  }
  let F=null;
  for(let k=L.length-1;k>=0;k--){
    const l=L[k],f=new Float32Array(l.w*l.h*3),P=L[k+1];
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      const i=y*l.w+x,cov=l.a[i]/l.n[i];
      for(let ch=0;ch<3;ch++){
        let up=0;
        if(F){
          const px=Math.min(Math.max((x+.5)/2-.5,0),P.w-1),py=Math.min(Math.max((y+.5)/2-.5,0),P.h-1),
          x0=px|0,y0=py|0,x1=Math.min(x0+1,P.w-1),y1=Math.min(y0+1,P.h-1),fx=px-x0,fy=py-y0;
          up=(F[(y0*P.w+x0)*3+ch]*(1-fx)+F[(y0*P.w+x1)*3+ch]*fx)*(1-fy)+(F[(y1*P.w+x0)*3+ch]*(1-fx)+F[(y1*P.w+x1)*3+ch]*fx)*fy;
        }
        const mean=l.a[i]>0?l.c[i*3+ch]/l.a[i]:up;
        f[i*3+ch]=cov*mean+(1-cov)*up;
      }
    }
    F=f;
  }
  return F;
}
function _x41(m){
  const src=cx.getImageData(0,0,W,H),d=src.data;
  let mm=m;for(let k=0;k<+$('#dil').value;k++)mm=_x39(mm);
  const F=_x40(d,mm);if(!F)throw _x46('errFull');
  const sg=$('#tex').checked?_x37(d,mm):0,bm=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,k=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H){s+=mm[yy*W+xx];k++}}
    bm[y*W+x]=s/k}
  for(let i=0;i<W*H;i++){
    const b=bm[i];if(!b)continue;const g=_x35()*sg;
    for(let ch=0;ch<3;ch++){const v=F[i*3+ch]+g+_x35()*sg*.25;d[i*4+ch]=d[i*4+ch]*(1-b)+_x0(v,0,255)*b}
  }
  if($('#meta').checked)_x36(d,mm);
  cx.putImageData(src,0,0);
}
async function _x42(){
  const sel=boxes.filter(b=>b.sel);if((!sel.length&&!penDirty)||busy)return;
  _x10(true,'rem');_x2('rebuilding');await _x1();
  hist.push({img:cx.getImageData(0,0,W,H),boxes:boxes.map(b=>({...b}))});if(hist.length>4)hist.shift();
  try{
    const m=_x34(sel);_x29(m); 
    if(cvOK)_x38(sel,m);else _x41(m);
    _x25();boxes=boxes.filter(b=>!b.sel);_x31();
    _x2(cvOK?'done':'doneAlt');
  }catch(e){
    console.error(e);const h=hist.pop();if(h)cx.putImageData(h.img,0,0);
    _x2('procError',true,{e});
  }
  _x10(false);
}
$('#go').onclick=_x42;
$('#undo').onclick=()=>{
  const h=hist.pop();if(!h)return;cx.putImageData(h.img,0,0);boxes=h.boxes;_x31();
  $('#undo').disabled=!hist.length;_x2('undone');
};
$('#save').onclick=()=>{
  let c=cnv;
  if($('#meta').checked){ 
    c=document.createElement('canvas');c.width=W;c.height=H;
    const k=c.getContext('2d');k.imageSmoothingEnabled=false;k.drawImage(cnv,0,0);
  }
  c.toBlob(b=>{ 
    if(!b){_x2('pngFail',true);return}
    const a=document.createElement('a'),u=URL.createObjectURL(b);
    a.href=u;a.download='Aetix Design.png';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),4000);_x2('saved');
  },'image/png',1);
};
const acc=$('#acc');
I18N.pt.help.forEach((_,i)=>{
  const li=document.createElement('li');li.className='acc-i';
  li.innerHTML='<h3><button type="button" class="acc-b" id="hb'+i+'" aria-expanded="false" aria-controls="hp'+i+'"><span class="n">'+(i+1)+'.</span><span class="t"></span><svg class="ic chev" aria-hidden="true"><use href="#i-chev"/></svg></button></h3><div class="acc-p" id="hp'+i+'" role="region" aria-labelledby="hb'+i+'"><div><p></p></div></div>';
  li.querySelector('button').onclick=e=>{const o=li.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(o))};
  acc.appendChild(li);
});
const _x57=()=>{const H=I18N[LANG].help;acc.querySelectorAll('.acc-i').forEach((li,i)=>{li.querySelector('.t').textContent=H[i].t;li.querySelector('p').textContent=H[i].p})};
let helpFrom=null;
function _x43(){helpFrom=document.activeElement;_x20();$('#help').hidden=false;$('#app').inert=true;$('#helpBtn').inert=true;$('#langsw').inert=true;$('#helpX').focus()}
function _x44(){
  $('#help').hidden=true;$('#app').inert=false;$('#helpBtn').inert=false;$('#langsw').inert=false;
  acc.querySelectorAll('.acc-i.open').forEach(li=>{li.classList.remove('open');li.querySelector('button').setAttribute('aria-expanded','false')});
  if(helpFrom&&helpFrom.focus&&document.contains(helpFrom))helpFrom.focus();
}
$('#helpBtn').onclick=_x43;$('#helpX').onclick=_x44;
$('#help').addEventListener('pointerdown',e=>{if(e.target===$('#help'))_x44()});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(!$('#help').hidden)_x44();else if(tool)_x22(null);
});
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#file').click()}});

function _x58(){layer.querySelectorAll('.box:not(.tmp)').forEach((e,i)=>{const b=boxes[i];if(!b)return;const l=_x54(b);e.title=l;e.setAttribute('aria-label',l)})}
function _x49(l,save){
  if(!I18N[l])l='pt';
  LANG=l;
  if(save!==false){try{localStorage.setItem(LS_KEY,l)}catch(e){}}
  document.documentElement.lang=l==='en'?'en':'pt-BR';
  document.title=tr('title');
  document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=tr(n.dataset.i18n)});
  document.querySelectorAll('[data-i18n-title]').forEach(n=>{n.title=tr(n.dataset.i18nTitle)});
  document.querySelectorAll('[data-i18n-aria]').forEach(n=>{n.setAttribute('aria-label',tr(n.dataset.i18nAria))});
  $('#uilang').value=l;
  $('#go-t').textContent=tr(goKey);
  _x51();_x56();_x58();_x32();_x57();_x55();
}
const _sw=$('#langsw'),_logo=document.querySelector('.logo');
function _x55(){
  const r=_logo.getBoundingClientRect(),h=_sw.offsetHeight||36;
  _sw.style.setProperty('--sw-y',(r.top+r.height/2-h/2).toFixed(1)+'px');
}
$('#uilang').addEventListener('change',e=>_x49(e.target.value));
window.addEventListener('resize',_x55);
$('#app').addEventListener('scroll',_x55,{passive:true});
if(window.ResizeObserver){const ro=new ResizeObserver(_x55);['header','.card','footer'].forEach(q=>{const n=document.querySelector(q);if(n)ro.observe(n)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(_x55);
(function(){let l='pt';try{const v=localStorage.getItem(LS_KEY);if(v&&I18N[v])l=v}catch(e){}_x49(l,false)})();
