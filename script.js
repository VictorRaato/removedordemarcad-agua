'use strict';
/* ==========================================================================
   AETIX DESIGN · script.js unificado
   Tudo roda no navegador. Nenhum arquivo é enviado a servidor.

   Namespaces:
     AetixApp.State            estado central (aba ativa, OpenCV, Tesseract, FFmpeg…)
     AetixApp.Core             i18n, abas, modais, splash, roteamento de arquivos
     AetixApp.ImageProcessor   módulo de imagem (Tesseract.js + OpenCV.js)
     AetixApp.VideoProcessor   módulo de vídeo (Web Worker + OpenCV.js + FFmpeg.wasm)
     AetixApp.Payment          checkout Pix (BravoPay) + rastreamento UTMify
   ========================================================================== */
window.AetixApp = window.AetixApp || {};
(function (App) {

/* ==========================================================================
   I18N  (pt/en) — separado por namespace: core, img, vid
   ========================================================================== */
const I18N = {
pt: {
core: {
  title: 'Remover marca d’água · AETIX DESIGN',
  navAria: 'Navegação principal',
  navImage: 'Marca d\'água imagem', navVideo: 'Marca d\'água vídeo',
  tabsAria: 'Modo de processamento',
  tabImage: 'Imagem', tabVideo: 'Vídeo',
  h1_image: 'Removedor de marca d\'água em imagens',
  sub_image: 'Apague textos e marcas das suas imagens em poucos cliques.',
  h1_video: 'Removedor de marca d\'água em vídeos',
  sub_video: 'Apague marcas d’água em movimento dos seus vídeos, direto no navegador.',
  helpItems: [
    ['Enviar um arquivo', 'Arraste o arquivo para a área de upload, clique em “Escolher arquivo” ou cole com Ctrl+V. Imagens: PNG, JPG e WebP. Vídeos: MP4, MOV e WEBM (H.264 recomendado).'],
    ['Privacidade e metadados', 'Tudo roda no seu navegador e nenhum arquivo é enviado a servidores. Os metadados do arquivo final são removidos por padrão; você pode desativar isso nos Ajustes.'],
    ['Detecção (OCR)', 'O OCR procura textos na imagem. Clique nas caixas que deseja apagar, use “Selecionar todos” ou “Limpar seleção” para agilizar e “Reescanear” para repetir a busca.'],
    ['Lápis e Borracha', 'Pinte à mão o que o OCR não detectou (imagem) ou a marca d’água no instante atual (vídeo). Ajuste o tamanho no controle deslizante; a borracha corrige o traço feito com o lápis.'],
    ['Desenhar caixa', 'Arraste sobre a imagem para marcar manualmente uma área que não foi detectada. A caixa entra na seleção e é removida junto com as demais em “Remover selecionados”.'],
    ['Ajustes avançados', 'Mude o idioma do OCR, a confiança mínima, o algoritmo e o raio de reconstrução. Marcar só a área da marca, com margem pequena, deixa o resultado mais natural.'],
    ['Vídeo: marca em movimento', 'Pause o vídeo no tempo desejado e pinte a marca d’água. Se ela se move, adicione keyframes em outros tempos: a máscara é interpolada entre eles. Use “Excluir keyframe” para corrigir.'],
    ['Vídeo: renderizar e baixar', 'Clique em “Renderizar vídeo”, confira o resultado e baixe o MP4. O áudio original é mantido e a renderização pode ser cancelada. Módulo em BETA: use Chrome ou Edge atualizados.'],
    ['Desfazer e recomeçar', 'Use “Desfazer” para voltar uma alteração. “Remover imagem” ou “Remover vídeo” descarta o arquivo atual para você recomeçar do zero.'],
    ['Baixar o resultado', 'Imagem: “Baixar PNG”, exportado em qualidade máxima. Vídeo: “Baixar MP4” depois de renderizar. Os botões ficam ativos quando há algo pronto para salvar.']
  ],
  helpUp: 'Tópicos anteriores', helpDown: 'Próximos tópicos', helpOf: 'de',
  help: 'CENTRAL DE AJUDA', helpItem: 'Central de Ajuda', helpTitle: 'Central de ajuda',
  pricing: 'SEJA UM COLABORADOR', pricingTitle: 'SEJA UM COLABORADOR', uiLangLabel: 'Idioma', waLabel: 'FALAR COM CRIADOR', waTip: 'Falar com Criador',
  profile: 'Conta', profileTitle: 'Minha conta',
  close: 'Fechar', uiLang: 'Idioma da interface',
  engReady: 'Pronto para usar', engErr: 'Recursos indisponíveis', engLoad: 'Carregando recursos…',
  footerBy: 'Desenvolvido por',
  footerRights: '© AETIX DESIGN. Todos os direitos reservados.'
},
img: {
  dropTitle: 'Arraste sua imagem aqui', dropHint: 'ou cole com Ctrl+V', dropBtn: 'Escolher arquivo',
  pencil: 'Lápis', pencilTip: 'Lápis: pinte à mão o que o OCR não detectou', penWidth: 'Espessura do lápis',
  eraser: 'Borracha', eraserTip: 'Borracha: apague partes do traço feito com o lápis', eraserWidth: 'Largura da borracha',
  removeImage: 'Remover imagem', cancelScan: 'Cancelar escaneamento',
  selectAll: 'Selecionar todos', clearSel: 'Limpar seleção',
  drawBox: 'Desenhar caixa', drawBoxTip: 'Arraste sobre a imagem para marcar uma área que não foi detectada',
  rescan: 'Reescanear', undo: 'Desfazer', removeSel: 'Remover selecionados', removing: 'Removendo…', savePng: 'Baixar PNG',
  adjust: 'Ajustes', fLang: 'Idioma',
  ocrPorEng: 'Português + Inglês', ocrEng: 'Inglês', ocrSpaEng: 'Espanhol + Inglês', ocrFraEng: 'Francês + Inglês', ocrDeuEng: 'Alemão + Inglês', ocrItaEng: 'Italiano + Inglês',
  fGran: 'Detectar por', gWords: 'Palavras', gLines: 'Linhas',
  fConf: 'Confiança mínima', fMode: 'Modo', mGlyph: 'Só as letras', mBox: 'Caixa inteira',
  fAlgo: 'Algoritmo', aTelea: 'Suave', aNs: 'Bordas',
  fPad: 'Margem da caixa', fThr: 'Sensibilidade de cor', fDil: 'Espessura extra', fRad: 'Raio de reconstrução',
  fPsm: 'Leitura do texto', psm11: 'Texto esparso (PSM 11)', psm3: 'Página automática (PSM 3)', psm6: 'Bloco único',
  fMerge: 'Agrupar caixas', fPrep: 'Pré-processamento', pOtsu: 'Otsu (rígido)', pAdaptive: 'Adaptativo', pOff: 'Desligado',
  fBinc: 'Rigor do filtro', fTex: 'Recriar granulado', fMeta: 'Remover metadados',
  countOne: '{n} texto', countMany: '{n} textos', selOne: '{n} selecionado', selMany: '{n} selecionados',
  manualStroke: 'traço manual', manualArea: 'Área marcada à mão',
  chooseImage: 'Escolha um arquivo de imagem.',
  openFail: 'Não foi possível abrir essa imagem. Tente PNG, JPG ou WebP.',
  preparing: 'Preparando a detecção…', loadingCV: 'Carregando o OpenCV para preparar a imagem…',
  searching: 'Procurando textos… {p}%', downloading: 'Baixando dados do idioma… {p}%',
  isolating: 'Isolando os textos do fundo…', refining: 'Reforçando a leitura das bordas… {i}/4',
  scanDone: 'Clique nas caixas dos textos que deseja apagar e depois em “Remover selecionados”.',
  scanNone: 'Nenhum texto encontrado. Diminua a confiança mínima, reduza o rigor do filtro ou use “Desenhar caixa”.',
  scanCancelled: 'Escaneamento cancelado. Use “Reescanear”, o lápis ou “Desenhar caixa” quando quiser.',
  scanError: 'Erro na detecção de texto: {e}. Você ainda pode usar “Desenhar caixa”.',
  penHint: 'Pinte sobre a marca que deseja apagar. Ajuste a espessura e solte o controle para começar a pintar.',
  eraserHint: 'Ajuste a largura e solte o controle para começar a apagar.',
  penActive: 'Pinte sobre a marca que deseja apagar. Clique no lápis de novo para desativar.',
  eraserActive: 'Passe a borracha sobre o traço que quiser apagar. Clique na borracha de novo para desativar.',
  drawHint: 'Arraste sobre a imagem para marcar uma área.',
  rebuilding: 'Reconstruindo o fundo…',
  done: 'Pronto. Se sobrar algo, selecione de novo ou use “Reescanear”.',
  doneAlt: 'Pronto. (Usei o modo de reconstrução alternativo.) Se sobrar algo, selecione de novo ou use “Reescanear”.',
  procError: 'Erro ao processar: {e}', undone: 'Alteração desfeita.',
  pngFail: 'Não foi possível gerar o PNG.', saved: 'Imagem salva.',
  errLoad: 'Falha ao carregar {u}', errCvInpaint: 'cv.inpaint indisponível', errFull: 'A seleção cobre a imagem inteira.'
},
vid: {
  dropTitle: 'Arraste seu vídeo aqui', dropHint: 'ou cole com Ctrl+V', dropBtn: 'Escolher arquivo',
  pencil: 'Lápis', pencilTip: 'Lápis: pinte a marca d’água na posição atual', penWidth: 'Espessura do lápis',
  eraser: 'Borracha', eraserTip: 'Borracha: apague partes do traço feito com o lápis', eraserWidth: 'Largura da borracha',
  removeVideo: 'Remover vídeo', cancelRender: 'Cancelar renderização', render: 'Renderizar vídeo', saveMp4: 'Baixar MP4',
  adjust: 'Ajustes', fAlgo: 'Algoritmo', aTelea: 'Suave', aNs: 'Bordas',
  fRad: 'Raio de reconstrução', fDil: 'Espessura extra', fQuality: 'Qualidade do MP4',
  qHigh: 'Alta (6 Mbps)', qMid: 'Média (3 Mbps)', qLow: 'Leve (1,5 Mbps)',
  fNoise: 'Ruído anti-forense', fMeta: 'Remover metadados',
  advNote: 'A máscara é interpolada linearmente entre os keyframes. O processamento acontece só na área pintada, em 480p, para terminar rápido.',
  addKf: 'Adicionar keyframe', delKf: 'Excluir keyframe',
  kfHint: 'Pause o vídeo no tempo desejado e pinte a marca d’água. Repita em outros tempos para criar a trajetória.',
  play: 'Reproduzir', pause: 'Pausar', prevFrame: 'Quadro anterior', nextFrame: 'Próximo quadro', seek: 'Tempo do vídeo',
  resultTitle: 'Vídeo pronto',
  resultHint: 'Confira o resultado e baixe o MP4. O áudio original foi mantido.',
  resultNoAudio: 'Confira o resultado e baixe o MP4. Este vídeo não tinha áudio ou ele não pôde ser mantido.',
  countZero: 'Nenhum keyframe', countOne: '{n} keyframe', countMany: '{n} keyframes',
  kfNone: 'Nenhum keyframe ainda', kfAt: 'Keyframe em {t}',
  kfAdded: 'Keyframe adicionado. Pinte a marca d’água nesta posição.',
  kfExists: 'Este keyframe já existe.', kfRemoved: 'Keyframe excluído.',
  chooseVideo: 'Escolha um arquivo de vídeo.',
  openFail: 'Não foi possível abrir esse vídeo. Tente MP4 ou MOV.',
  loadingVideo: 'Carregando o vídeo…',
  readyHint: 'Pause o vídeo, pinte a marca d’água e adicione keyframes em outros tempos para acompanhar o movimento.',
  needMask: 'Pinte a marca d’água em pelo menos um keyframe antes de renderizar.',
  renderPreparing: 'Preparando a renderização…', phaseAudio: 'Preparando o áudio…', phaseDemux: 'Lendo o vídeo…',
  phaseFrames: 'Processando quadros… {p}%', phaseMux: 'Montando o MP4…', phaseStrip: 'Limpando metadados…',
  renderDone: 'Vídeo pronto.', renderDoneMeta: 'Vídeo pronto. Não foi possível remover todos os metadados.',
  renderCancelled: 'Renderização cancelada.', renderFail: 'Não foi possível renderizar o vídeo. Tente novamente.',
  formatFail: 'Este arquivo não pôde ser lido. Por enquanto, use MP4 ou MOV com vídeo H.264.',
  encodeFail: 'Seu navegador não conseguiu codificar este vídeo.',
  engineFail: 'Não foi possível carregar os recursos de processamento. Verifique a conexão e recarregue a página.',
  unsupported: 'Seu navegador não tem os recursos necessários para processar vídeos. Use o Chrome ou o Edge atualizados.',
  saveDone: 'Download iniciado.',
  penHint: 'Pinte sobre a marca d’água na posição atual.',
  eraserHint: 'Passe a borracha sobre o traço que quiser apagar.'
}
},
en: {
core: {
  title: 'Remove watermark · AETIX DESIGN',
  navAria: 'Main navigation',
  navImage: 'Image watermark', navVideo: 'Video watermark',
  tabsAria: 'Processing mode',
  tabImage: 'Image', tabVideo: 'Video',
  h1_image: 'Remove watermarks from images',
  sub_image: 'Erase text and marks from your images in just a few clicks.',
  h1_video: 'Remove watermarks from videos',
  sub_video: 'Erase moving watermarks right in your browser.',
  helpItems: [
    ['Upload a file', 'Drag the file into the upload area, click “Choose file” or paste with Ctrl+V. Images: PNG, JPG and WebP. Videos: MP4, MOV and WEBM (H.264 recommended).'],
    ['Privacy and metadata', 'Everything runs in your browser and no file is sent to any server. Metadata is stripped from the final file by default; you can turn that off in Settings.'],
    ['Detection (OCR)', 'OCR looks for text in the image. Click the boxes you want to erase, use “Select all” or “Clear selection” to speed up and “Rescan” to search again.'],
    ['Pencil and Eraser', 'Paint by hand what the OCR missed (image) or the watermark at the current moment (video). Adjust the size with the slider; the eraser fixes strokes made with the pencil.'],
    ['Draw box', 'Drag over the image to manually mark an area that wasn’t detected. The box joins the selection and is removed together with the others via “Remove selected”.'],
    ['Advanced settings', 'Change the OCR language, minimum confidence, algorithm and reconstruction radius. Marking only the watermark area with a small margin gives a more natural result.'],
    ['Video: moving marks', 'Pause the video at the desired time and paint the watermark. If it moves, add keyframes at other times: the mask is interpolated between them. Use “Delete keyframe” to fix mistakes.'],
    ['Video: render and download', 'Click “Render video”, check the result and download the MP4. The original audio is kept and rendering can be cancelled. BETA module: use an up-to-date Chrome or Edge.'],
    ['Undo and start over', 'Use “Undo” to step back a change. “Remove image” or “Remove video” discards the current file so you can start from scratch.'],
    ['Download the result', 'Image: “Download PNG”, exported at maximum quality. Video: “Download MP4” after rendering. The buttons become active when there is something ready to save.']
  ],
  helpUp: 'Previous topics', helpDown: 'Next topics', helpOf: 'of',
  help: 'HELP CENTER', helpItem: 'Help Center', helpTitle: 'Help center',
  pricing: 'BECOME A SUPPORTER', pricingTitle: 'BECOME A SUPPORTER', uiLangLabel: 'Language', waLabel: 'TALK TO THE CREATOR', waTip: 'Talk to the creator',
  profile: 'Account', profileTitle: 'My account',
  close: 'Close', uiLang: 'Interface language',
  engReady: 'Ready to use', engErr: 'Resources unavailable', engLoad: 'Loading resources…',
  footerBy: 'Developed by',
  footerRights: '© AETIX DESIGN. All rights reserved.'
},
img: {
  dropTitle: 'Drag your image here', dropHint: 'or paste with Ctrl+V', dropBtn: 'Choose file',
  pencil: 'Pencil', pencilTip: 'Pencil: paint by hand what the OCR didn’t detect', penWidth: 'Pencil thickness',
  eraser: 'Eraser', eraserTip: 'Eraser: erase parts of the stroke made with the pencil', eraserWidth: 'Eraser width',
  removeImage: 'Remove image', cancelScan: 'Cancel scan',
  selectAll: 'Select all', clearSel: 'Clear selection',
  drawBox: 'Draw box', drawBoxTip: 'Drag over the image to mark an area that wasn’t detected',
  rescan: 'Rescan', undo: 'Undo', removeSel: 'Remove selected', removing: 'Removing…', savePng: 'Download PNG',
  adjust: 'Settings', fLang: 'Language',
  ocrPorEng: 'Portuguese + English', ocrEng: 'English', ocrSpaEng: 'Spanish + English', ocrFraEng: 'French + English', ocrDeuEng: 'German + English', ocrItaEng: 'Italian + English',
  fGran: 'Detect by', gWords: 'Words', gLines: 'Lines',
  fConf: 'Minimum confidence', fMode: 'Mode', mGlyph: 'Letters only', mBox: 'Entire box',
  fAlgo: 'Algorithm', aTelea: 'Smooth', aNs: 'Edges',
  fPad: 'Box margin', fThr: 'Color sensitivity', fDil: 'Extra thickness', fRad: 'Reconstruction radius',
  fPsm: 'Text reading', psm11: 'Sparse text (PSM 11)', psm3: 'Automatic page (PSM 3)', psm6: 'Single block',
  fMerge: 'Group boxes', fPrep: 'Preprocessing', pOtsu: 'Otsu (strict)', pAdaptive: 'Adaptive', pOff: 'Off',
  fBinc: 'Filter strictness', fTex: 'Recreate grain', fMeta: 'Remove metadata',
  countOne: '{n} text', countMany: '{n} texts', selOne: '{n} selected', selMany: '{n} selected',
  manualStroke: 'manual stroke', manualArea: 'Area marked by hand',
  chooseImage: 'Choose an image file.',
  openFail: 'Couldn’t open this image. Try PNG, JPG or WebP.',
  preparing: 'Preparing detection…', loadingCV: 'Loading OpenCV to prepare the image…',
  searching: 'Searching for text… {p}%', downloading: 'Downloading language data… {p}%',
  isolating: 'Isolating the text from the background…', refining: 'Reinforcing edge reading… {i}/4',
  scanDone: 'Click the boxes of the text you want to erase, then “Remove selected”.',
  scanNone: 'No text found. Lower the minimum confidence, reduce the filter strictness or use “Draw box”.',
  scanCancelled: 'Scan cancelled. Use “Rescan”, the pencil or “Draw box” whenever you like.',
  scanError: 'Text detection error: {e}. You can still use “Draw box”.',
  penHint: 'Paint over the mark you want to erase. Adjust the thickness and release the control to start painting.',
  eraserHint: 'Adjust the width and release the control to start erasing.',
  penActive: 'Paint over the mark you want to erase. Click the pencil again to turn it off.',
  eraserActive: 'Run the eraser over the stroke you want to erase. Click the eraser again to turn it off.',
  drawHint: 'Drag over the image to mark an area.',
  rebuilding: 'Rebuilding the background…',
  done: 'Done. If anything is left over, select it again or use “Rescan”.',
  doneAlt: 'Done. (I used the alternative reconstruction mode.) If anything is left over, select it again or use “Rescan”.',
  procError: 'Error while processing: {e}', undone: 'Change undone.',
  pngFail: 'Couldn’t generate the PNG.', saved: 'Image saved.',
  errLoad: 'Failed to load {u}', errCvInpaint: 'cv.inpaint unavailable', errFull: 'The selection covers the entire image.'
},
vid: {
  dropTitle: 'Drag your video here', dropHint: 'or paste with Ctrl+V', dropBtn: 'Choose file',
  pencil: 'Pencil', pencilTip: 'Pencil: paint the watermark at the current position', penWidth: 'Pencil thickness',
  eraser: 'Eraser', eraserTip: 'Eraser: erase parts of the stroke made with the pencil', eraserWidth: 'Eraser width',
  removeVideo: 'Remove video', cancelRender: 'Cancel rendering', render: 'Render video', saveMp4: 'Download MP4',
  adjust: 'Settings', fAlgo: 'Algorithm', aTelea: 'Smooth', aNs: 'Edges',
  fRad: 'Reconstruction radius', fDil: 'Extra thickness', fQuality: 'MP4 quality',
  qHigh: 'High (6 Mbps)', qMid: 'Medium (3 Mbps)', qLow: 'Light (1.5 Mbps)',
  fNoise: 'Anti-forensic noise', fMeta: 'Remove metadata',
  advNote: 'The mask is interpolated linearly between keyframes. Processing runs only inside the painted area, at 480p, to finish fast.',
  addKf: 'Add keyframe', delKf: 'Delete keyframe',
  kfHint: 'Pause the video at the desired time and paint the watermark. Repeat at other times to create the trajectory.',
  play: 'Play', pause: 'Pause', prevFrame: 'Previous frame', nextFrame: 'Next frame', seek: 'Video time',
  resultTitle: 'Video ready',
  resultHint: 'Check the result and download the MP4. The original audio was kept.',
  resultNoAudio: 'Check the result and download the MP4. This video had no audio or it could not be kept.',
  countZero: 'No keyframes', countOne: '{n} keyframe', countMany: '{n} keyframes',
  kfNone: 'No keyframes yet', kfAt: 'Keyframe at {t}',
  kfAdded: 'Keyframe added. Paint the watermark at this position.',
  kfExists: 'This keyframe already exists.', kfRemoved: 'Keyframe deleted.',
  chooseVideo: 'Choose a video file.',
  openFail: 'Couldn’t open this video. Try MP4 or MOV.',
  loadingVideo: 'Loading the video…',
  readyHint: 'Pause the video, paint the watermark and add keyframes at other times to follow the movement.',
  needMask: 'Paint the watermark in at least one keyframe before rendering.',
  renderPreparing: 'Preparing the render…', phaseAudio: 'Preparing the audio…', phaseDemux: 'Reading the video…',
  phaseFrames: 'Processing frames… {p}%', phaseMux: 'Building the MP4…', phaseStrip: 'Stripping metadata…',
  renderDone: 'Video ready.', renderDoneMeta: 'Video ready. Some metadata could not be removed.',
  renderCancelled: 'Rendering cancelled.', renderFail: 'Couldn’t render the video. Please try again.',
  formatFail: 'This file could not be read. For now, use MP4 or MOV with H.264 video.',
  encodeFail: 'Your browser could not encode this video.',
  engineFail: 'Couldn’t load the processing resources. Check your connection and reload the page.',
  unsupported: 'Your browser lacks the resources needed to process videos. Use an up-to-date Chrome or Edge.',
  saveDone: 'Download started.',
  penHint: 'Paint over the watermark at the current position.',
  eraserHint: 'Run the eraser over the stroke you want to erase.'
}
}
};

/* ==========================================================================
   STATE — objeto central
   ========================================================================== */
const State = App.State = {
  activeTab: 'image',                     // 'image' | 'video'
  lang: 'pt',
  modal: null,                            // id do modal aberto
  help: { open: false, scrollTop: 0, openIdx: -1 },    // Central de Ajuda (guia suspensa; rolagem oculta)
  tesseract:   { status: 'idle' },        // idle | load | ok | err
  opencv:      { status: 'idle', ready: false },        // OpenCV.js (thread principal, módulo de imagem)
  videoEngine: { status: 'idle', supported: true },     // Web Worker + OpenCV do worker (módulo de vídeo)
  ffmpeg:      { status: 'idle' },        // idle | loading | ready | running | error
  busy:        { image: false, video: false }
};

/* ==========================================================================
   CORE
   ========================================================================== */
const Core = App.Core = { modules: {}, modalHooks: {}, LS_KEY: 'aetix-lang', I18N };

const qs = (s, r) => (r || document).querySelector(s);
const qsa = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
Core.qs = qs; Core.qsa = qsa; Core.clamp = clamp;

/* seletor com escopo: '#x' vira '#<prefix>-x' (IDs do módulo) */
Core.scope = function (prefix) {
  const m = s => s.replace(/#([A-Za-z][\w-]*)/g, '#' + prefix + '-$1');
  return { $: s => qs(m(s)), $$: s => qsa(m(s)) };
};

Core.loadScript = u => new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = u; s.async = true;
  s.onload = () => res();
  s.onerror = () => { s.remove(); rej(new Error('load ' + u)); };
  document.head.appendChild(s);
});

/* tr('img.pencil', {n}) — procura no namespace, depois em core, depois em pt */
Core.tr = function (path, p) {
  const i = path.indexOf('.'), ns = path.slice(0, i), k = path.slice(i + 1);
  const pick = l => { const d = I18N[l]; if (!d) return undefined; const v = d[ns] && d[ns][k]; return v != null ? v : (d.core && d.core[k]); };
  let s = pick(State.lang);
  if (s == null) s = pick('pt');
  if (s == null) s = k;
  if (typeof s !== 'string' || !p) return s;
  return s.replace(/\{(\w+)\}/g, (_, n) => {
    const v = p[n];
    if (v == null) return '';
    if (typeof v === 'object') return v.i18n ? Core.tr(ns + '.' + v.i18n.k, v.i18n.p) : (v.message || String(v));
    return v;
  });
};

Core.applyLang = function (l, save) {
  if (!I18N[l]) l = 'pt';
  State.lang = l;
  if (save !== false) { try { localStorage.setItem(Core.LS_KEY, l); } catch (e) {} }
  document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
  document.title = Core.tr('core.title');
  qsa('[data-i18n]').forEach(n => { n.textContent = Core.tr(n.dataset.i18n); });
  qsa('[data-i18n-title]').forEach(n => { n.title = Core.tr(n.dataset.i18nTitle); });
  qsa('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', Core.tr(n.dataset.i18nAria)); });
  qs('#uiLang').value = l;
  Core.renderHelp();
  Object.keys(Core.modules).forEach(k => { const m = Core.modules[k]; if (m && m.onLang) m.onLang(); });
  Core.refreshEngine();
  if (Core.refreshWhatsApp) Core.refreshWhatsApp();
};

/* ---------- Central de Ajuda (dropdown acoplado ao botão) ---------- */
Core.renderHelp = function () {
  const ul = qs('#helpList'), items = (I18N[State.lang] || I18N.pt).core.helpItems || [];
  ul.innerHTML = ''; State.help.openIdx = -1;
  items.forEach((it, i) => {
    const li = document.createElement('li'), btn = document.createElement('button'), b = document.createElement('b'),
      h = document.createElement('h3'), ans = document.createElement('div'), inner = document.createElement('div'), p = document.createElement('p');
    btn.type = 'button'; btn.className = 'help-row'; btn.setAttribute('aria-expanded', 'false');
    btn.id = 'helpQ' + i; ans.id = 'helpA' + i; btn.setAttribute('aria-controls', ans.id);
    ans.setAttribute('role', 'region'); ans.setAttribute('aria-labelledby', btn.id); ans.className = 'help-ans';
    b.textContent = String(i + 1); h.textContent = it[0]; p.textContent = it[1];
    const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chev.setAttribute('class', 'ic help-chev'); chev.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#i-chev'); chev.appendChild(use);
    btn.appendChild(b); btn.appendChild(h); btn.appendChild(chev);
    inner.appendChild(p); ans.appendChild(inner);
    btn.addEventListener('click', () => Core.toggleHelpItem(i));
    li.appendChild(btn); li.appendChild(ans); ul.appendChild(li);
  });
  Core.updateHelpNav();
};
/* accordion: abre um tópico por vez; clicar de novo (ou em outro) recolhe */
Core.toggleHelpItem = function (i) {
  const lis = qsa('#helpList li'), was = State.help.openIdx;
  lis.forEach((li, k) => {
    const on = k === i && was !== i;
    li.classList.toggle('open', on);
    li.firstChild.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
  State.help.openIdx = was === i ? -1 : i;
  Core.updateHelpNav();
  setTimeout(() => {
    if (State.help.openIdx >= 0 && lis[State.help.openIdx]) lis[State.help.openIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    Core.updateHelpNav();
  }, 300);
};
/* setas ^ / v e contador "1–6 de 10" */
Core.updateHelpNav = function () {
  const ul = qs('#helpList'), lis = qsa('#helpList li'), n = lis.length;
  if (!n) return;
  const top = ul.scrollTop, bottom = top + ul.clientHeight, ur = ul.getBoundingClientRect();
  let first = -1, last = -1;
  lis.forEach((li, k) => {
    const r = li.getBoundingClientRect(), t = r.top - ur.top + top, bt = r.bottom - ur.top + top;
    if (t >= top - 2 && bt <= bottom + 2) { if (first < 0) first = k; last = k; }
  });
  if (first < 0) { first = 0; last = 0; }
  qs('#helpCount').textContent = (first + 1) + '–' + (last + 1) + ' ' + Core.tr('core.helpOf') + ' ' + n;
  qs('#helpUp').disabled = top <= 2;
  qs('#helpDown').disabled = top + ul.clientHeight >= ul.scrollHeight - 2;
};
Core.helpPage = function (dir) {
  const ul = qs('#helpList');
  ul.scrollBy({ top: dir * Math.max(60, ul.clientHeight - 24), behavior: 'smooth' });
};
Core.openHelp = function () {
  Core.closeProfile();
  qs('#helpMenu').hidden = false;
  qs('#helpOpen').setAttribute('aria-expanded', 'true');
  State.help.open = true;
  qs('#helpList').scrollTop = State.help.scrollTop || 0;
  Core.updateHelpNav();
};
Core.closeHelp = function () {
  const m = qs('#helpMenu');
  if (m.hidden) return;
  if (State.help.openIdx >= 0) Core.toggleHelpItem(State.help.openIdx);
  State.help.scrollTop = qs('#helpList').scrollTop;
  m.hidden = true; State.help.open = false;
  qs('#helpOpen').setAttribute('aria-expanded', 'false');
};

/* pílula de status do motor (depende da aba ativa) */
Core.refreshEngine = function () {
  const pill = qs('#engine'), t = qs('#engineText');
  let st = 'load';
  if (State.activeTab === 'image') {
    const o = State.tesseract.status, c = State.opencv.status;
    st = o === 'err' ? 'err' : (o === 'ok' && (c === 'ok' || c === 'err')) ? 'ok' : 'load';
  } else {
    const v = State.videoEngine.status;
    st = v === 'ok' ? 'ok' : v === 'err' ? 'err' : 'load';
  }
  pill.dataset.s = st;
  /* aba Vídeo: o aviso de erro do motor não deve ficar parado na tela */
  pill.classList.toggle('hidden', State.activeTab !== 'image' && st === 'err');
  t.textContent = Core.tr(st === 'ok' ? 'core.engReady' : st === 'err' ? 'core.engErr' : 'core.engLoad');
};

/* ---------- splash ---------- */
Core.splashDone = new Promise(r => { Core._splashResolve = r; });
Core.initSplash = function () {
  const sp = qs('#splash'), w = sp.firstElementChild, app = qs('#app');
  let idx = 0;
  app.inert = true;
  'AETIX DESIGN'.split('').forEach((ch, n) => {
    const e = document.createElement('span');
    if (ch === ' ') e.className = 'gap';
    else { e.textContent = ch; e.style.setProperty('--i', idx++); if (n > 5) e.className = 'w2'; }
    w.appendChild(e);
  });
  setTimeout(() => {
    sp.classList.add('out');
    document.documentElement.classList.remove('splashing');
    app.inert = !!State.modal;
    setTimeout(() => { sp.remove(); Core._splashResolve(); }, 900);
  }, 2300);
};

/* ---------- modais ---------- */
let modalFrom = null;
Core.openModal = function (id, focusId) {
  const m = qs('#' + id);
  if (!m) return;
  Core.closeProfile(); Core.closeHelp();
  if (State.modal) Core.closeModal();
  modalFrom = document.activeElement;
  m.hidden = false; State.modal = id;
  qs('#app').inert = true;
  const f = focusId ? qs('#' + focusId) : qs('[data-close-modal]', m);
  if (f) f.focus();
};
Core.closeModal = function () {
  const id = State.modal;
  if (!id) return;
  qs('#' + id).hidden = true;
  State.modal = null;
  qs('#app').inert = false;
  if (Core.modalHooks[id]) Core.modalHooks[id]();
  if (modalFrom && modalFrom.focus && document.contains(modalFrom)) modalFrom.focus();
  modalFrom = null;
};
Core.openProfile = function () {
  Core.closeHelp();
  qs('#profileMenu').hidden = false;
  qs('#profileBtn').setAttribute('aria-expanded', 'true');
};
Core.closeProfile = function () {
  const m = qs('#profileMenu');
  if (m.hidden) return;
  m.hidden = true;
  qs('#profileBtn').setAttribute('aria-expanded', 'false');
};

/* ---------- abas ---------- */
Core.switchTab = function (tab, force) {
  if (tab !== 'image' && tab !== 'video') return;
  const prev = State.activeTab;
  if (!force && tab === prev) return;
  if (prev !== tab && Core.modules[prev] && Core.modules[prev].deactivate) Core.modules[prev].deactivate();
  State.activeTab = tab;
  qsa('[data-tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    if (b.getAttribute('role') === 'tab') { b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
    else if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  qs('#panelImage').classList.toggle('hidden', tab !== 'image');
  qs('#panelVideo').classList.toggle('hidden', tab !== 'video');
  const h = qs('#heroTitle'), s = qs('#heroSub');
  h.dataset.i18n = 'core.h1_' + tab; s.dataset.i18n = 'core.sub_' + tab;
  h.textContent = Core.tr(h.dataset.i18n); s.textContent = Core.tr(s.dataset.i18n);
  Core.modules[tab].activate();
  Core.refreshEngine();
  qs('#page').scrollTop = 0;
};

/* roteia um arquivo para o módulo certo (por tipo) */
Core.routeFile = function (f) {
  if (!f || State.modal) return;
  const t = f.type || '', n = (f.name || '').toLowerCase();
  let tab = State.activeTab;
  if (/^image\//.test(t)) tab = 'image';
  else if (/^video\//.test(t) || /\.(mp4|mov|m4v|webm)$/.test(n)) tab = 'video';
  Core.switchTab(tab);
  Core.modules[tab].loadFile(f);
};

/* ---------- header: botão colaborador, idioma no perfil, CSS extra ---------- */
Core.setupHeader = function () {
  if (!qs('#aetixExtraCss')) {
    const st = document.createElement('style');
    st.id = 'aetixExtraCss';
    st.textContent = [
      '.cta.cta-collab{height:38px;padding:0 16px;font:700 .74rem Inter,system-ui,sans-serif;letter-spacing:.1em;color:#fff;border:1px solid rgba(124,140,255,.55);border-radius:12px;cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,rgba(124,140,255,.22),rgba(155,107,255,.16));animation:aetixCollabGlow 2.4s ease-in-out infinite}',
      '.cta.cta-collab:hover{animation-play-state:paused}',
      '@keyframes aetixCollabGlow{0%,100%{box-shadow:0 0 10px -4px rgba(124,140,255,.45),0 0 0 0 rgba(155,107,255,0),inset 0 1px 0 rgba(255,255,255,.1);border-color:rgba(124,140,255,.45);filter:brightness(1)}50%{box-shadow:0 0 26px 2px rgba(155,107,255,.75),0 0 0 5px rgba(124,140,255,.16),inset 0 1px 0 rgba(255,255,255,.18);border-color:rgba(155,107,255,.95);filter:brightness(1.16)}}',
      '.dropdown .langsw{width:100%;height:42px;margin-top:10px}',
      '.dropdown .langsw select{width:100%;height:42px;font-size:.88rem}',
      '.dropdown .langsw .ic{left:14px;margin-top:-8px}',
      '.dropdown .langsw select{padding-left:38px}',
      '@media (max-width:700px){.helpwrap .cta{display:none}}',
      '@media (max-width:560px){.hdr{padding-left:10px;padding-right:10px;gap:6px}.hdr-right{gap:6px;flex:none}.brand{flex:none;font-size:.8rem;letter-spacing:.08em}.brand .logo{margin-right:.15em}.cta.cta-collab{height:32px;padding:0 9px;font-size:.56rem;letter-spacing:.05em}.avatar-btn{width:32px;height:32px}}',
      '@media (max-width:400px){.hdr{padding-left:8px;padding-right:8px;gap:4px}.hdr-right{gap:5px}.brand{font-size:.72rem;letter-spacing:.06em}.cta.cta-collab{padding:0 7px;font-size:.5rem;letter-spacing:.03em}.avatar-btn{width:30px;height:30px}}',
      '@media (max-width:350px){.brand{font-size:.66rem}.cta.cta-collab{font-size:.46rem;padding:0 6px}}',
      '#pricingModal{transition:opacity .5s ease}#pricingModal.fadeout{opacity:0;pointer-events:none}',
      '.pay-card[data-step="pix"] .pay-step.aetix-paid{gap:14px;padding:6px 0 10px}',
      '.aetix-paid .pay-qr{background:transparent;padding:0}',
      '.aetix-paid #payCode,.aetix-paid #payCopy,.aetix-paid .pay-thanks,.aetix-paid .pay-status{display:none}',
      '.pay-check{width:100%;height:100%;display:block;filter:drop-shadow(0 0 14px rgba(74,222,154,.75)) drop-shadow(0 0 30px rgba(74,222,154,.45));animation:payCheckPop .5s cubic-bezier(.2,1.4,.4,1) both}',
      '.pc-ring{stroke-dasharray:327;stroke-dashoffset:327;animation:payDraw .6s ease-out .05s forwards}',
      '.pc-tick{stroke-dasharray:90;stroke-dashoffset:90;animation:payDraw .45s ease-out .5s forwards}',
      '@keyframes payDraw{to{stroke-dashoffset:0}}',
      '@keyframes payCheckPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}',
      '.pay-paid-txt{margin:0;text-align:center;font:700 1.3rem Inter,system-ui,sans-serif;color:#4ADE9A;text-shadow:0 0 16px rgba(74,222,154,.55);animation:fadein .5s ease .6s both}',
      '.aetix-thanks{position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom,0px));z-index:300;display:flex;align-items:flex-start;gap:14px;width:min(460px,calc(100vw - 24px));padding:16px 14px 16px 16px;border-radius:20px;border:1px solid rgba(155,107,255,.55);background:linear-gradient(145deg,rgba(32,24,62,.96),rgba(15,17,28,.97));-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 30px 70px -20px rgba(0,0,0,.9),0 0 40px -6px rgba(155,107,255,.6),inset 0 1px 0 rgba(255,255,255,.08);color:var(--ink);cursor:pointer;transform:translate(-50%,0);animation:thanksIn .6s cubic-bezier(.2,.9,.3,1.1) both}',
      '.aetix-thanks.out{animation:thanksOut .55s ease forwards}',
      '.aetix-thanks .at-ic{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;font-size:1.4rem;background:linear-gradient(135deg,rgba(124,140,255,.3),rgba(155,107,255,.2));border:1px solid rgba(155,107,255,.5);box-shadow:0 0 20px -4px rgba(155,107,255,.8)}',
      '.aetix-thanks .at-tx{flex:1;min-width:0}',
      '.aetix-thanks strong{display:block;margin-bottom:3px;font-size:1rem;letter-spacing:.02em;background:linear-gradient(135deg,#C9D0FF,#9B6BFF);-webkit-background-clip:text;background-clip:text;color:transparent}',
      '.aetix-thanks p{margin:0;font-size:.88rem;line-height:1.5;color:#D8DCEA}',
      '.aetix-thanks .at-x{flex:none;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--muted);font-size:1.3rem;line-height:1;cursor:pointer}',
      '.aetix-thanks .at-x:hover{color:#fff;background:rgba(255,255,255,.1)}',
      '@keyframes thanksIn{from{opacity:0;transform:translate(-50%,24px) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}',
      '@keyframes thanksOut{to{opacity:0;transform:translate(-50%,16px) scale(.97)}}',
      '@media (prefers-reduced-motion:reduce){.aetix-thanks{animation:none!important}.pc-ring,.pc-tick{stroke-dashoffset:0!important}.cta.cta-collab{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  /* "Preços" vira o botão premium "SEJA UM COLABORADOR" */
  const pb = qs('#pricingOpen');
  if (pb) {
    pb.className = 'cta cta-collab';
    pb.setAttribute('data-i18n', 'core.pricing');
    pb.textContent = Core.tr('core.pricing');
  }
  /* seletor de idioma sai do topo e entra no menu de perfil (PC e celular) */
  const sw = qs('#langsw'), body = qs('#profileBody');
  if (sw && body && sw.parentNode !== body) body.appendChild(sw);
};

/* ---------- WhatsApp: suporte direto (menu do perfil + ícone flutuante) ---------- */
Core.whatsapp = (function () {
  const number = '5581973300288';
  const message = 'Olá Victor! Estou usando o removedor de marcas da  AETIX DESIGN e gostaria de tirar uma dúvida ou dar um feedback sobre a plataforma. 🌟';
  return { number: number, message: message, url: 'https://wa.me/' + number + '?text=' + encodeURIComponent(message) };
})();
Core.WA_ICON = '<svg class="wa-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

Core.refreshWhatsApp = function () {
  const fab = qs('#waFab');
  if (fab) { const t = Core.tr('core.waTip'); fab.setAttribute('data-tip', t); fab.setAttribute('aria-label', t); }
};

Core.setupWhatsApp = function () {
  if (!qs('#aetixWaCss')) {
    const st = document.createElement('style');
    st.id = 'aetixWaCss';
    st.textContent = [
      '.wa-item{text-decoration:none;color:var(--ink)}',
      '.wa-item .wa-svg{width:18px;height:18px;flex:none;color:#2EE6FF;filter:drop-shadow(0 0 5px rgba(46,230,255,.7))}',
      '.wa-item:hover{background:rgba(46,230,255,.12);border-color:rgba(46,230,255,.55)}',
      '.wa-fab{position:fixed;right:18px;bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:40;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;color:#2EE6FF;text-decoration:none;background:radial-gradient(circle at 50% 35%,rgba(46,230,255,.16),rgba(10,12,26,.92));border:1.5px solid rgba(46,230,255,.85);box-shadow:0 0 0 1px rgba(46,230,255,.25) inset,0 0 16px 1px rgba(46,230,255,.65),0 0 38px 4px rgba(155,107,255,.45);animation:waGlow 2.8s ease-in-out infinite;transition:transform .18s,filter .18s;-webkit-tap-highlight-color:transparent}',
      '.wa-fab .wa-svg{width:26px;height:26px;filter:drop-shadow(0 0 6px rgba(46,230,255,.95))}',
      '.wa-fab:hover,.wa-fab:focus-visible{transform:translateY(-2px) scale(1.06);filter:brightness(1.15);animation-play-state:paused;box-shadow:0 0 0 1px rgba(46,230,255,.35) inset,0 0 22px 3px rgba(46,230,255,.85),0 0 50px 8px rgba(155,107,255,.65)}',
      '.wa-fab::after{content:attr(data-tip);position:absolute;right:calc(100% + 12px);top:50%;transform:translate(6px,-50%);padding:7px 12px;border-radius:10px;border:1px solid rgba(46,230,255,.5);background:#0B1019;color:#E2F9FF;font:600 .78rem/1 Inter,system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap;box-shadow:0 10px 26px -10px rgba(0,0,0,.9),0 0 18px -4px rgba(46,230,255,.55);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s,transform .18s,visibility .18s}',
      '.wa-fab:hover::after,.wa-fab:focus-visible::after{opacity:1;visibility:visible;transform:translate(0,-50%)}',
      '@keyframes waGlow{0%,100%{box-shadow:0 0 0 1px rgba(46,230,255,.25) inset,0 0 14px 1px rgba(46,230,255,.55),0 0 32px 3px rgba(155,107,255,.38)}50%{box-shadow:0 0 0 1px rgba(46,230,255,.35) inset,0 0 22px 3px rgba(46,230,255,.8),0 0 46px 7px rgba(155,107,255,.6)}}',
      '.page-in{padding-bottom:calc(clamp(12px,3dvh,32px) + 56px)}',
      '@media (max-width:700px){.wa-fab{width:44px;height:44px;right:12px;bottom:max(12px,env(safe-area-inset-bottom,0px))}.wa-fab .wa-svg{width:22px;height:22px}.page-in{padding-bottom:calc(clamp(12px,3dvh,32px) + 64px)}}',
      '@media (hover:none){.wa-fab::after{display:none}}',
      '@media (prefers-reduced-motion:reduce){.wa-fab{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  const url = Core.whatsapp.url;

  /* item no menu do perfil */
  const body = qs('#profileBody');
  if (body && !qs('#waProfile')) {
    const a = document.createElement('a');
    a.id = 'waProfile'; a.className = 'menu-item wa-item';
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.innerHTML = Core.WA_ICON;
    const sp = document.createElement('span');
    sp.setAttribute('data-i18n', 'core.waLabel'); sp.textContent = Core.tr('core.waLabel');
    a.appendChild(sp);
    a.addEventListener('click', () => { Core.closeProfile(); });
    const sw = qs('#langsw');
    if (sw && sw.parentNode === body) body.insertBefore(a, sw); else body.appendChild(a);
  }

  /* ícone flutuante fixo (visível em todas as etapas das telas de imagem e vídeo) */
  if (!qs('#waFab')) {
    const f = document.createElement('a');
    f.id = 'waFab'; f.className = 'wa-fab';
    f.href = url; f.target = '_blank'; f.rel = 'noopener noreferrer';
    f.innerHTML = Core.WA_ICON;
    document.body.appendChild(f);
  }
  Core.refreshWhatsApp();
};

Core.bind = function () {
  qsa('[data-tab]').forEach(b => b.addEventListener('click', () => Core.switchTab(b.dataset.tab)));
  qs('#brand').addEventListener('click', () => Core.switchTab('image'));
  qs('.tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = State.activeTab === 'image' ? 'video' : 'image';
    Core.switchTab(next); qs('#tab' + (next === 'image' ? 'Image' : 'Video')).focus();
  });

  qs('#helpOpen').addEventListener('click', () => { qs('#helpMenu').hidden ? Core.openHelp() : Core.closeHelp(); });
  qs('#helpClose').addEventListener('click', Core.closeHelp);
  qs('#helpUp').addEventListener('click', () => Core.helpPage(-1));
  qs('#helpDown').addEventListener('click', () => Core.helpPage(1));
  qs('#helpList').addEventListener('scroll', Core.updateHelpNav, { passive: true });
  qs('#profileHelp').addEventListener('click', () => { Core.closeProfile(); Core.openHelp(); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.helpwrap')) Core.closeHelp(); });
  qs('#pricingOpen').addEventListener('click', () => Core.openModal('pricingModal'));
  qsa('[data-close-modal]').forEach(b => b.addEventListener('click', Core.closeModal));
  qsa('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m) Core.closeModal(); }));

  qs('#profileBtn').addEventListener('click', () => { qs('#profileMenu').hidden ? Core.openProfile() : Core.closeProfile(); });
  qs('#profileClose').addEventListener('click', Core.closeProfile);
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.profile')) Core.closeProfile(); });

  qs('#uiLang').addEventListener('change', e => Core.applyLang(e.target.value));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (State.modal) { Core.closeModal(); return; }
    if (!qs('#helpMenu').hidden) { Core.closeHelp(); if (qs('#helpOpen').offsetParent) qs('#helpOpen').focus(); return; }
    if (!qs('#profileMenu').hidden) { Core.closeProfile(); return; }
    const m = Core.modules[State.activeTab];
    if (m && m.onEscape) m.onEscape();
  });

  /* drag & drop / paste globais */
  const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
  const setOver = b => { const m = Core.modules[State.activeTab]; if (m && m.setDragOver) m.setDragOver(b); };
  ['dragenter', 'dragover'].forEach(t => window.addEventListener(t, e => { e.preventDefault(); if (hasFiles(e) && !State.modal) setOver(true); }));
  window.addEventListener('dragleave', e => { e.preventDefault(); if (!e.relatedTarget) setOver(false); });
  window.addEventListener('drop', e => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) Core.routeFile(f);
  });
  window.addEventListener('paste', e => {
    const f = Array.from((e.clipboardData && e.clipboardData.files) || [])[0];
    if (f) { e.preventDefault(); Core.routeFile(f); }
  });
};

/* ==========================================================================
   IMAGE PROCESSOR  (OCR com Tesseract.js + reconstrução com OpenCV.js)
   ========================================================================== */
Core.modules.image = App.ImageProcessor = (function () {
  const { $ } = Core.scope('im');
  const tr = (k, p) => Core.tr('img.' + k, p);
  const i18nError = (k, p) => { const e = new Error(tr(k, p)); e.i18n = { k, p }; return e; };

  const MAX = 4096;
  const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const CV_URLS = ['https://docs.opencv.org/4.x/opencv.js', 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js'];

  const cnv = $('#cnv'), cx = cnv.getContext('2d', { willReadFrequently: true });
  const layer = $('#boxes'), ov = $('#ov'), ox = ov.getContext('2d', { willReadFrequently: true });
  const drop = $('#drop');
  const POPS = { pen: '#penpop', eraser: '#erapop' }, BTNS = { pen: '#pencil', eraser: '#eraser' }, SIZE = { pen: '#pen', eraser: '#era' };

  let W = 0, H = 0, boxes = [], raw = { words: [], lines: [] }, rawScale = 1, hist = [];
  let worker = null, workerLang = '', busy = false, drawMode = false, cvOK = false, ink = null, scanCtl = null;
  let tool = null, penDirty = false, pl = null, curMsg = null, goKey = 'removeSel';
  let tessP = null, cvP = null, ds = null, tmp = null;

  /* ---------- mensagens ---------- */
  function renderMsg() {
    const m = $('#msg');
    m.textContent = curMsg ? tr(curMsg.k, curMsg.p) : '';
    m.className = 'msg' + (curMsg && curMsg.err ? ' err' : '');
  }
  function setMsg(k, err, p) { curMsg = k ? { k, err: !!err, p } : null; renderMsg(); }

  /* ---------- ciclo de vida dos motores ---------- */
  function setEngine(key, status) {
    State[key].status = status;
    if (key === 'opencv') State.opencv.ready = status === 'ok';
    Core.refreshEngine();
  }
  const loadScript = u => Core.loadScript(u).catch(() => { throw i18nError('errLoad', { u }); });

  async function loadOpenCV(u) {
    await loadScript(u);
    let c = window.cv;
    if (!c) throw new Error('cv ausente');
    if (typeof c.then === 'function') {
      c = await new Promise((res, rej) => { c.then(m => { try { delete m.then; } catch (e) {} res(m); }, rej); });
      window.cv = c;
    }
    if (!c.Mat) {
      await new Promise((res, rej) => {
        const t = setTimeout(() => { clearInterval(p); rej(new Error('timeout')); }, 90000);
        const done = () => { clearTimeout(t); clearInterval(p); res(); };
        const p = setInterval(() => { if (c.Mat) done(); }, 250);
        c.onRuntimeInitialized = done;
      });
    }
    if (!window.cv.inpaint) throw i18nError('errCvInpaint');
  }

  function bootEngines() {
    if (tessP) return;
    setEngine('tesseract', 'load'); setEngine('opencv', 'load');
    const wait = Core.splashDone.then(() => new Promise(r => setTimeout(r, 80)));
    tessP = wait.then(() => loadScript(TESS_URL)).then(() => setEngine('tesseract', 'ok')).catch(e => { setEngine('tesseract', 'err'); throw e; });
    tessP.catch(() => {});
    cvP = (async () => {
      await wait;
      for (const u of CV_URLS) { try { await loadOpenCV(u); cvOK = true; setEngine('opencv', 'ok'); return; } catch (e) { console.warn(e); } }
      setEngine('opencv', 'err');
    })();
  }

  /* ---------- abrir imagem ---------- */
  function openImageSource(file) {
    const viaReader = () => new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('leitura'));
      fr.onload = () => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('decodificação')); im.src = fr.result; };
      fr.readAsDataURL(file);
    });
    const viaBitmap = () => typeof createImageBitmap === 'function' ? createImageBitmap(file) : Promise.reject(new Error('sem createImageBitmap'));
    return viaBitmap().catch(viaReader);
  }

  async function loadFile(file) {
    if (busy) return;
    if (!file || !file.type.startsWith('image/')) { setMsg('chooseImage', true); return; }
    let im;
    try { im = await openImageSource(file); }
    catch (e) { console.error(e); setMsg('openFail', true); return; }
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const s = Math.min(1, MAX / Math.max(iw, ih));
    W = Math.round(iw * s); H = Math.round(ih * s);
    cnv.width = W; cnv.height = H; ov.width = W; ov.height = H; penDirty = false;
    cx.clearRect(0, 0, W, H); cx.drawImage(im, 0, 0, W, H);
    if (im.close) im.close();
    hist = []; boxes = []; raw = { words: [], lines: [] }; renderBoxes();
    drop.hidden = true; $('#editor').hidden = false; $('#undo').disabled = true; setTool(null);
    scan();
  }

  function resetImage() {
    if (busy) return;
    W = 0; H = 0; boxes = []; raw = { words: [], lines: [] }; hist = [];
    drawMode = false; $('#draw').setAttribute('aria-pressed', 'false'); layer.classList.remove('draw');
    cnv.width = 1; cnv.height = 1; ov.width = 1; ov.height = 1; penDirty = false; setTool(null); renderBoxes();
    $('#editor').hidden = true; drop.hidden = false; $('#undo').disabled = true; setMsg('');
  }

  function setBusy(b, label) {
    busy = b; State.busy.image = b;
    ['#rescan', '#all', '#none', '#undo', '#save', '#reset', '#draw', '#pencil', '#eraser', '#lang'].forEach(s => { $(s).disabled = b; });
    $('#go').disabled = b || !(penDirty || boxes.some(x => x.sel));
    if (!b) $('#undo').disabled = !hist.length;
    goKey = b && label === 'rem' ? 'removing' : 'removeSel';
    $('#go-t').textContent = tr(goKey);
  }

  /* ---------- OCR ---------- */
  const tick = () => new Promise(r => setTimeout(r, 30));

  function pickItems(data, kind) {
    if (data[kind] && data[kind].length) return data[kind];
    const out = [];
    (data.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => {
      if (kind === 'lines') out.push(l); else (l.words || []).forEach(w => out.push(w));
    })));
    return out;
  }

  function binarize(src, mode, c) {
    const k = window.cv;
    if (!cvOK || !k || mode === 'off') return src;
    const mats = [], mk = () => { const m = new k.Mat(); mats.push(m); return m; };
    try {
      const rgba = k.imread(src); mats.push(rgba);
      const g = mk(), o = mk();
      k.cvtColor(rgba, g, k.COLOR_RGBA2GRAY);
      k.GaussianBlur(g, g, new k.Size(3, 3), 0);
      if (mode === 'otsu') {
        k.threshold(g, o, 0, 255, k.THRESH_BINARY | k.THRESH_OTSU);
        if (k.countNonZero(o) < o.rows * o.cols / 2) k.bitwise_not(o, o);
      } else {
        const bs = clamp(Math.round(Math.min(src.width, src.height) / 6), 31, 255) | 1, a = mk(), b = mk();
        k.adaptiveThreshold(g, a, 255, k.ADAPTIVE_THRESH_GAUSSIAN_C, k.THRESH_BINARY, bs, c);
        k.adaptiveThreshold(g, b, 255, k.ADAPTIVE_THRESH_GAUSSIAN_C, k.THRESH_BINARY, bs, -c);
        k.bitwise_not(b, b); k.bitwise_and(a, b, o);
      }
      const t = mk(); k.medianBlur(o, t, 3);
      const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
      k.imshow(out, t); return out;
    } catch (e) { console.warn('binarização', e); return src; }
    finally { mats.forEach(m => { try { m.delete(); } catch (e) {} }); }
  }

  function buildInk(c, sc) {
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, m = new Uint8Array(n);
    for (let i = 0; i < n; i++) m[i] = d[i * 4] < 128 ? 1 : 0;
    return { w: c.width, h: c.height, sc, d: m };
  }

  function inkOK(b) {
    if (!ink) return true;
    const s = ink.sc, x0 = clamp(Math.floor(b.x * s), 0, ink.w - 1), y0 = clamp(Math.floor(b.y * s), 0, ink.h - 1);
    const x1 = clamp(Math.ceil((b.x + b.w) * s), x0 + 1, ink.w), y1 = clamp(Math.ceil((b.y + b.h) * s), y0 + 1, ink.h);
    let n = 0; for (let y = y0; y < y1; y++) { const o = y * ink.w; for (let x = x0; x < x1; x++) n += ink.d[o + x]; }
    const f = n / ((x1 - x0) * (y1 - y0)); return f >= .03 && f <= .85;
  }

  async function scan() {
    if (!W || busy) return;
    bootEngines();
    const ctl = { cancelled: false, rej: null };
    ctl.p = new Promise((_, rej) => { ctl.rej = rej; }); ctl.p.catch(() => {});
    scanCtl = ctl;
    const run = p => Promise.race([p, ctl.p]);
    setBusy(true);
    const pg = $('#prog'), sb = $('#scanbar');
    sb.hidden = false; pg.removeAttribute('value'); $('#laser').hidden = false;
    setMsg('preparing');
    try {
      await run(tessP);
      if (State.opencv.status === 'load') setMsg('loadingCV');
      await run(cvP);
      setMsg('preparing');
      const lang = $('#lang').value;
      if (!worker || workerLang !== lang) {
        if (worker) { const old = worker; worker = null; workerLang = ''; await run(Promise.resolve(old.terminate()).catch(() => {})); }
        const mkw = Tesseract.createWorker(lang, 1, { logger: m => {
          if (ctl.cancelled) return;
          if (typeof m.progress === 'number') {
            pg.value = m.progress;
            setMsg(m.status === 'recognizing text' ? 'searching' : 'downloading', false, { p: Math.round(m.progress * 100) });
          }
        } });
        try { worker = await run(mkw); workerLang = lang; }
        catch (e) { if (ctl.cancelled) mkw.then(x => x.terminate()).catch(() => {}); throw e; }
      }
      const wk = worker;
      await run(wk.setParameters({ tessedit_pageseg_mode: $('#psm').value, preserve_interword_spaces: '1', user_defined_dpi: '300' }));
      const prep = $('#prep').value, bc = +$('#binc').value, useBin = cvOK && prep !== 'off';
      const mx = Math.max(W, H); rawScale = mx < 1600 ? 2 : mx > 3200 ? 3200 / mx : 1;
      const oc = document.createElement('canvas'); oc.width = Math.round(W * rawScale); oc.height = Math.round(H * rawScale);
      const o = oc.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, oc.width, oc.height); o.imageSmoothingQuality = 'high';
      try { o.filter = 'grayscale(1) contrast(1.25)'; } catch (e) {}
      o.drawImage(cnv, 0, 0, oc.width, oc.height);
      let inp = oc, newInk = null;
      if (useBin) { setMsg('isolating'); await tick(); inp = binarize(oc, prep, bc); if (inp !== oc) newInk = buildInk(inp, rawScale); }
      if (ctl.cancelled) throw new Error('cancelado');
      pg.removeAttribute('value');
      const { data } = await run(wk.recognize(inp));
      const norm = (arr, x0, y0, sc, edge) => arr.filter(w => w.bbox).map(w => ({
        text: w.text || '', confidence: w.confidence, edge,
        bbox: { x0: x0 + w.bbox.x0 / sc, y0: y0 + w.bbox.y0 / sc, x1: x0 + w.bbox.x1 / sc, y1: y0 + w.bbox.y1 / sc }
      }));
      const nr = { words: norm(pickItems(data, 'words'), 0, 0, rawScale, false), lines: norm(pickItems(data, 'lines'), 0, 0, rawScale, false) };
      const bx = Math.round(W * .15), by = Math.round(H * .15);
      const strips = [[0, 0, W, by], [0, H - by, W, by], [0, 0, bx, H], [W - bx, 0, bx, H]];
      for (let si = 0; si < strips.length; si++) {
        if (ctl.cancelled) throw new Error('cancelado');
        const [x, y, w, h] = strips[si]; if (w < 8 || h < 8) continue;
        try {
          setMsg('refining', false, { i: si + 1 });
          const sc = clamp(2000 / Math.max(w, h), 1, 3), sc2 = document.createElement('canvas');
          sc2.width = Math.round(w * sc); sc2.height = Math.round(h * sc);
          const k = sc2.getContext('2d'); k.fillStyle = '#fff'; k.fillRect(0, 0, sc2.width, sc2.height); k.imageSmoothingQuality = 'high';
          try { k.filter = 'grayscale(1) contrast(1.8)'; } catch (e) {}
          k.drawImage(cnv, x, y, w, h, 0, 0, sc2.width, sc2.height);
          const inp2 = useBin ? binarize(sc2, prep, Math.max(3, Math.round(bc * .6))) : sc2;
          const r2 = await run(wk.recognize(inp2));
          nr.words.push(...norm(pickItems(r2.data, 'words'), x, y, sc, true));
          nr.lines.push(...norm(pickItems(r2.data, 'lines'), x, y, sc, true));
        } catch (e) { if (ctl.cancelled) throw e; console.warn('faixa', si, e); }
      }
      raw = nr; ink = newInk;
      buildBoxes();
      const n = boxes.filter(b => !b.manual).length;
      setMsg(n ? 'scanDone' : 'scanNone', !n);
    } catch (e) {
      if (ctl.cancelled) setMsg('scanCancelled');
      else { console.error(e); setMsg('scanError', true, { e }); }
    }
    sb.hidden = true; $('#laser').hidden = true; scanCtl = null; setBusy(false);
  }

  function cancelScan() {
    const c = scanCtl; if (!c || c.cancelled) return;
    c.cancelled = true;
    if (worker) { const w = worker; worker = null; workerLang = ''; Promise.resolve().then(() => w.terminate()).catch(() => {}); }
    c.rej(new Error('cancelado'));
  }

  /* ---------- caixas ---------- */
  function mergeBoxes(list, k) {
    const n = list.length; if (n < 2 || k <= 0) return list;
    const p = list.map((_, i) => i), f = i => { while (p[i] !== i) { p[i] = p[p[i]]; i = p[i]; } return i; };
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = list[i], b = list[j], minH = Math.min(a.h, b.h), maxH = Math.max(a.h, b.h);
      if (Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) < minH * .5) continue;
      if (maxH > minH * 2.2) continue;
      if (Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w) <= maxH * k) p[f(i)] = f(j);
    }
    const g = new Map();
    list.forEach((b, i) => { const r = f(i); if (!g.has(r)) g.set(r, []); g.get(r).push(b); });
    return [...g.values()].map(m => {
      if (m.length === 1) return m[0];
      m.sort((a, b) => a.x - b.x);
      const x0 = Math.min(...m.map(b => b.x)), y0 = Math.min(...m.map(b => b.y)), x1 = Math.max(...m.map(b => b.x + b.w)), y1 = Math.max(...m.map(b => b.y + b.h));
      const chars = m.reduce((t, b) => t + b.text.length, 0);
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, text: m.map(b => b.text).join(' '), conf: m.reduce((t, b) => t + b.conf * b.text.length, 0) / chars, sel: false };
    });
  }

  function hasContrast(b, th = 4.5) {
    const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y)), w = Math.min(W - x, Math.ceil(b.w)), h = Math.min(H - y, Math.ceil(b.h));
    if (w < 2 || h < 2) return false;
    const d = cx.getImageData(x, y, w, h).data, n = w * h; let s = 0, q = 0;
    for (let i = 0; i < n; i++) { const l = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114; s += l; q += l * l; }
    const m = s / n; return Math.sqrt(Math.max(0, q / n - m * m)) >= th;
  }

  function dedupe(list) {
    const out = [];
    list.slice().sort((a, b) => b.conf - a.conf).forEach(b => {
      const A = b.w * b.h;
      if (out.some(o => { const iw = Math.min(o.x + o.w, b.x + b.w) - Math.max(o.x, b.x), ih = Math.min(o.y + o.h, b.y + b.h) - Math.max(o.y, b.y); return iw > 0 && ih > 0 && iw * ih > A * .5; })) return;
      out.push(b);
    });
    return out;
  }

  function buildBoxes() {
    const items = raw[$('#gran').value] || [], minc = +$('#conf').value, minDim = Math.min(W, H);
    const inEdge = b => { const cX = b.x + b.w / 2, cY = b.y + b.h / 2; return cX < W * .15 || cX > W * .85 || cY < H * .15 || cY > H * .85; };
    let det = [];
    for (const w of items) {
      if (!w.bbox) continue;
      const text = (w.text || '').trim(), conf = w.confidence;
      if (!text) continue;
      const b = { x: w.bbox.x0, y: w.bbox.y0, w: w.bbox.x1 - w.bbox.x0, h: w.bbox.y1 - w.bbox.y0, text, conf, sel: false }, e = inEdge(b);
      if (conf < (e ? Math.max(10, minc * .4) : minc)) continue;
      const chars = text.replace(/\s/g, ''), good = (chars.match(/[\p{L}\p{N}]/gu) || []).length;
      if (good / chars.length < (e ? .5 : .6)) continue;
      if (good < 2 && conf < (e ? 55 : 80)) continue;
      if (b.h < minDim * (e ? .005 : .008) || b.h > H * .4 || b.w < 2) continue;
      if (b.h > b.w * 3 && good < 3) continue;
      det.push(b);
    }
    det = mergeBoxes(dedupe(det), +$('#merge').value)
      .filter(b => inEdge(b) || inkOK(b))
      .filter(b => hasContrast(b, inEdge(b) ? 2.2 : 4.5))
      .map(b => ({ ...b, conf: Math.round(b.conf) }));
    boxes = boxes.filter(b => b.manual).concat(det);
    renderBoxes();
  }

  const boxLabel = b => b.manual ? tr('manualArea') : '“' + b.text + '” (' + b.conf + '%)';
  function refreshLabels() {
    layer.querySelectorAll('.box:not(.tmp)').forEach((e, i) => { const b = boxes[i]; if (!b) return; const l = boxLabel(b); e.title = l; e.setAttribute('aria-label', l); });
  }
  function renderBoxes() {
    layer.querySelectorAll('.box').forEach(n => n.remove());
    boxes.forEach(b => {
      const e = document.createElement('button'); e.type = 'button'; e.className = 'box';
      e.style.cssText = `left:${b.x / W * 100}%;top:${b.y / H * 100}%;width:${b.w / W * 100}%;height:${b.h / H * 100}%`;
      e.setAttribute('aria-pressed', String(b.sel));
      const lbl = boxLabel(b); e.title = lbl; e.setAttribute('aria-label', lbl);
      e.onclick = () => { b.sel = !b.sel; e.setAttribute('aria-pressed', String(b.sel)); updateCount(); };
      layer.appendChild(e);
    });
    updateCount();
  }
  function updateCount() {
    const s = boxes.filter(b => b.sel).length;
    $('#count').textContent = tr(boxes.length === 1 ? 'countOne' : 'countMany', { n: boxes.length }) + ' · ' + tr(s === 1 ? 'selOne' : 'selMany', { n: s }) + (penDirty ? ' · ' + tr('manualStroke') : '');
    $('#go').disabled = busy || !(s || penDirty);
  }

  /* ---------- lápis / borracha ---------- */
  function hidePops() { for (const k in POPS) { $(POPS[k]).hidden = true; $(BTNS[k]).setAttribute('aria-expanded', 'false'); } }
  function openPop(t) {
    hidePops(); const p = $(POPS[t]); p.style.setProperty('--dx', '0px'); p.hidden = false;
    const r = p.getBoundingClientRect(), m = 10; let dx = 0;
    if (r.left < m) dx = m - r.left; else if (r.right > innerWidth - m) dx = innerWidth - m - r.right;
    p.style.setProperty('--dx', dx + 'px'); $(BTNS[t]).setAttribute('aria-expanded', 'true');
  }
  function setTool(t) {
    tool = t; hidePops();
    for (const k in BTNS) $(BTNS[k]).setAttribute('aria-pressed', String(k === t));
    $('#wrap').classList.toggle('pen', !!t);
    if (t && drawMode) { drawMode = false; $('#draw').setAttribute('aria-pressed', 'false'); layer.classList.remove('draw'); }
    if (t) openPop(t); else { $('#pcur').hidden = true; pl = null; }
    setMsg(t === 'pen' ? 'penHint' : t === 'eraser' ? 'eraserHint' : null);
  }
  const toggleTool = t => setTool(tool === t ? null : t);
  function keepPopClosed(t) { hidePops(); setMsg(t === 'pen' ? 'penActive' : 'eraserActive'); }
  function clearPen() { ox.clearRect(0, 0, ov.width, ov.height); penDirty = false; }
  function recheckPen() {
    const s = Math.min(1, 160 / Math.max(W, H)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(W * s)); c.height = Math.max(1, Math.round(H * s));
    const k = c.getContext('2d', { willReadFrequently: true }); k.imageSmoothingQuality = 'high'; k.drawImage(ov, 0, 0, c.width, c.height);
    const d = k.getImageData(0, 0, c.width, c.height).data; let any = false;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 6) { any = true; break; }
    penDirty = any; updateCount();
  }
  const pp = e => { const r = ov.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, k: W / r.width }; };
  function paintSegment(a, b) {
    const er = tool === 'eraser';
    ox.globalCompositeOperation = er ? 'destination-out' : 'source-over';
    ox.strokeStyle = '#FF4D8D'; ox.lineCap = 'round'; ox.lineJoin = 'round';
    ox.lineWidth = +$(SIZE[tool]).value * b.k; ox.beginPath(); ox.moveTo(a.x, a.y); ox.lineTo(b.x + .01, b.y); ox.stroke();
    ox.globalCompositeOperation = 'source-over';
  }
  function moveCursor(e) {
    const c = $('#pcur'), r = $('#wrap').getBoundingClientRect(), d = tool ? +$(SIZE[tool]).value : 20;
    c.hidden = !tool || e.pointerType === 'touch'; c.classList.toggle('era', tool === 'eraser');
    c.style.width = c.style.height = d + 'px';
    c.style.left = (e.clientX - r.left) + 'px'; c.style.top = (e.clientY - r.top) + 'px';
  }
  function mergePenIntoMask(m) {
    if (!penDirty) return;
    const od = ox.getImageData(0, 0, W, H).data;
    for (let i = 0; i < W * H; i++) if (od[i * 4 + 3] > 40) m[i] = 1;
  }

  /* agrupa a máscara em retângulos (para inpaint por região) */
  function maskRegions(m) {
    const cell = 8, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell), g = new Uint8Array(gw * gh);
    for (let y = 0; y < H; y++) { const row = (y / cell | 0) * gw, o = y * W; for (let x = 0; x < W; x++) if (m[o + x]) g[row + (x / cell | 0)] = 1; }
    const seen = new Uint8Array(gw * gh), st = new Int32Array(gw * gh), out = [];
    for (let s0 = 0; s0 < g.length; s0++) {
      if (!g[s0] || seen[s0]) continue;
      let sp = 0, x0 = gw, y0 = gh, x1 = 0, y1 = 0; st[sp++] = s0; seen[s0] = 1;
      while (sp) {
        const i = st[--sp], x = i % gw, y = (i / gw) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          const j = yy * gw + xx; if (g[j] && !seen[j]) { seen[j] = 1; st[sp++] = j; }
        }
      }
      out.push({ x: x0 * cell, y: y0 * cell, w: (x1 - x0 + 1) * cell, h: (y1 - y0 + 1) * cell });
    }
    return out;
  }

  /* ---------- desenhar caixa ---------- */
  const lp = e => { const r = layer.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) * W / r.width, 0, W), y: clamp((e.clientY - r.top) * H / r.height, 0, H) }; };
  const dragRect = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
  function endDraw(e) {
    if (!ds) return;
    const r = dragRect(ds, lp(e)); ds = null; if (tmp) { tmp.remove(); tmp = null; }
    if (r.w > 6 && r.h > 6) { boxes.unshift({ ...r, text: '', conf: 100, sel: true, manual: true }); renderBoxes(); }
  }

  /* ---------- remoção ---------- */
  function buildMask(sel) {
    const d = cx.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
    const pad = +$('#pad').value, thr = +$('#thr').value, whole = $('#mode').value === 'box';
    for (const b of sel) {
      const x0 = Math.max(0, Math.floor(b.x - pad)), y0 = Math.max(0, Math.floor(b.y - pad)), x1 = Math.min(W, Math.ceil(b.x + b.w + pad)), y1 = Math.min(H, Math.ceil(b.y + b.h + pad));
      const fill = () => { for (let y = y0; y < y1; y++) m.fill(1, y * W + x0, y * W + x1); };
      if (whole) { fill(); continue; }
      const r = 5, ax0 = Math.max(0, x0 - r), ay0 = Math.max(0, y0 - r), ax1 = Math.min(W, x1 + r), ay1 = Math.min(H, y1 + r);
      const R = [], G = [], B = [];
      for (let y = ay0; y < ay1; y++) for (let x = ax0; x < ax1; x++) {
        if (x >= x0 && x < x1 && y >= y0 && y < y1) continue;
        const i = (y * W + x) * 4; R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]);
      }
      if (R.length < 8) { fill(); continue; }
      const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
      const mr = med(R), mg = med(G), mb = med(B), hit = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4;
        if (Math.max(Math.abs(d[i] - mr), Math.abs(d[i + 1] - mg), Math.abs(d[i + 2] - mb)) > thr) hit.push(y * W + x);
      }
      if (!hit.length || hit.length > (x1 - x0) * (y1 - y0) * .7) { fill(); continue; }
      for (const j of hit) m[j] = 1;
    }
    return m;
  }

  const gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(6.2831853 * Math.random());

  function addMetaNoise(d, mk) {
    const buf = new Uint8Array(65536); let bi = buf.length;
    const fill = () => { try { crypto.getRandomValues(buf); } catch (e) { for (let i = 0; i < buf.length; i++) buf[i] = Math.random() * 256 | 0; } bi = 0; };
    for (let i = 0; i < W * H; i++) {
      if (!mk[i]) continue;
      for (let ch = 0; ch < 3; ch++) {
        if (bi >= buf.length) fill();
        const v = d[i * 4 + ch] + (buf[bi++] % 3 - 1);
        d[i * 4 + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }

  function grainSigma(d, m) {
    const diffs = [], l = j => d[j * 4] * .3 + d[j * 4 + 1] * .59 + d[j * 4 + 2] * .11;
    if (W < 4 || H < 4) return 0;
    for (let s = 0; s < 20000; s++) {
      const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2)), i = y * W + x;
      if (m[i] || m[i - 1] || m[i + 1] || m[i - W] || m[i + W]) continue;
      diffs.push(Math.abs(l(i) - (l(i - 1) + l(i + 1) + l(i - W) + l(i + W)) / 4));
    }
    if (!diffs.length) return 0;
    diffs.sort((a, b) => a - b); return diffs[diffs.length >> 1] * 1.2;
  }

  function inpaintCV(sel, m) {
    const c = window.cv, img = cx.getImageData(0, 0, W, H);
    const sg = $('#tex').checked ? grainSigma(img.data, m) : 0;
    const m255 = new Uint8Array(W * H); for (let i = 0; i < m.length; i++) if (m[i]) m255[i] = 255;
    const rgba = c.matFromImageData(img), rgb = new c.Mat(), mask = c.matFromArray(H, W, c.CV_8UC1, m255), out = new c.Mat(); let k = null;
    try {
      c.cvtColor(rgba, rgb, c.COLOR_RGBA2RGB);
      const it = +$('#dil').value, rad = +$('#rad').value, flag = $('#algo').value === 'ns' ? c.INPAINT_NS : c.INPAINT_TELEA;
      if (it > 0) { k = c.Mat.ones(3, 3, c.CV_8U); c.dilate(mask, mask, k, new c.Point(-1, -1), it); }
      const px = +$('#pad').value + it + rad * 3 + 6;
      for (const b of maskRegions(m)) {
        const x0 = Math.max(0, Math.floor(b.x - px)), y0 = Math.max(0, Math.floor(b.y - px)), x1 = Math.min(W, Math.ceil(b.x + b.w + px)), y1 = Math.min(H, Math.ceil(b.y + b.h + px));
        if (x1 - x0 < 2 || y1 - y0 < 2) continue;
        const r = new c.Rect(x0, y0, x1 - x0, y1 - y0), s = rgb.roi(r), mk = mask.roi(r), o = new c.Mat();
        try { c.inpaint(s, mk, o, rad, flag); o.copyTo(s); } finally { s.delete(); mk.delete(); o.delete(); }
      }
      c.cvtColor(rgb, out, c.COLOR_RGB2RGBA);
      const res = new ImageData(new Uint8ClampedArray(out.data), W, H), md = mask.data;
      if (sg > 0) for (let i = 0; i < W * H; i++) {
        if (!md[i]) continue; const g = gauss() * sg;
        for (let ch = 0; ch < 3; ch++) res.data[i * 4 + ch] = clamp(res.data[i * 4 + ch] + g + gauss() * sg * .25, 0, 255);
      }
      if ($('#meta').checked) addMetaNoise(res.data, md);
      cx.putImageData(res, 0, 0);
    } finally { [rgba, rgb, mask, out, k].forEach(x => x && x.delete()); }
  }

  /* alternativa sem OpenCV: preenchimento por pirâmide */
  function dilateMask(m) {
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; t[i] = m[i] | (x > 0 ? m[i - 1] : 0) | (x < W - 1 ? m[i + 1] : 0); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; o[i] = t[i] | (y > 0 ? t[i - W] : 0) | (y < H - 1 ? t[i + W] : 0); }
    return o;
  }

  function pyramidFill(d, m) {
    const L = []; let c = new Float32Array(W * H * 3), a = new Float32Array(W * H), n = new Float32Array(W * H).fill(1), known = 0;
    for (let i = 0; i < W * H; i++) if (!m[i]) { known++; a[i] = 1; c[i * 3] = d[i * 4]; c[i * 3 + 1] = d[i * 4 + 1]; c[i * 3 + 2] = d[i * 4 + 2]; }
    if (!known) return null;
    L.push({ w: W, h: H, c, a, n });
    while (L[L.length - 1].w > 1 || L[L.length - 1].h > 1) {
      const p = L[L.length - 1], nw = (p.w + 1) >> 1, nh = (p.h + 1) >> 1, q = { w: nw, h: nh, c: new Float32Array(nw * nh * 3), a: new Float32Array(nw * nh), n: new Float32Array(nw * nh) };
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const i = y * p.w + x, j = (y >> 1) * nw + (x >> 1); q.a[j] += p.a[i]; q.n[j] += p.n[i];
        q.c[j * 3] += p.c[i * 3]; q.c[j * 3 + 1] += p.c[i * 3 + 1]; q.c[j * 3 + 2] += p.c[i * 3 + 2];
      }
      L.push(q);
    }
    let F = null;
    for (let k = L.length - 1; k >= 0; k--) {
      const l = L[k], f = new Float32Array(l.w * l.h * 3), P = L[k + 1];
      for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) {
        const i = y * l.w + x, cov = l.a[i] / l.n[i];
        for (let ch = 0; ch < 3; ch++) {
          let up = 0;
          if (F) {
            const px = Math.min(Math.max((x + .5) / 2 - .5, 0), P.w - 1), py = Math.min(Math.max((y + .5) / 2 - .5, 0), P.h - 1),
              x0 = px | 0, y0 = py | 0, x1 = Math.min(x0 + 1, P.w - 1), y1 = Math.min(y0 + 1, P.h - 1), fx = px - x0, fy = py - y0;
            up = (F[(y0 * P.w + x0) * 3 + ch] * (1 - fx) + F[(y0 * P.w + x1) * 3 + ch] * fx) * (1 - fy) + (F[(y1 * P.w + x0) * 3 + ch] * (1 - fx) + F[(y1 * P.w + x1) * 3 + ch] * fx) * fy;
          }
          const mean = l.a[i] > 0 ? l.c[i * 3 + ch] / l.a[i] : up;
          f[i * 3 + ch] = cov * mean + (1 - cov) * up;
        }
      }
      F = f;
    }
    return F;
  }

  function inpaintJS(m) {
    const src = cx.getImageData(0, 0, W, H), d = src.data;
    let mm = m; for (let k = 0; k < +$('#dil').value; k++) mm = dilateMask(mm);
    const F = pyramidFill(d, mm); if (!F) throw i18nError('errFull');
    const sg = $('#tex').checked ? grainSigma(d, mm) : 0, bm = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { s += mm[yy * W + xx]; k++; } }
      bm[y * W + x] = s / k;
    }
    for (let i = 0; i < W * H; i++) {
      const b = bm[i]; if (!b) continue; const g = gauss() * sg;
      for (let ch = 0; ch < 3; ch++) { const v = F[i * 3 + ch] + g + gauss() * sg * .25; d[i * 4 + ch] = d[i * 4 + ch] * (1 - b) + clamp(v, 0, 255) * b; }
    }
    if ($('#meta').checked) addMetaNoise(d, mm);
    cx.putImageData(src, 0, 0);
  }

  async function removeSelected() {
    const sel = boxes.filter(b => b.sel); if ((!sel.length && !penDirty) || busy) return;
    setBusy(true, 'rem'); setMsg('rebuilding'); await tick();
    hist.push({ img: cx.getImageData(0, 0, W, H), boxes: boxes.map(b => ({ ...b })) }); if (hist.length > 4) hist.shift();
    try {
      const m = buildMask(sel); mergePenIntoMask(m);
      if (cvOK) inpaintCV(sel, m); else inpaintJS(m);
      clearPen(); boxes = boxes.filter(b => !b.sel); renderBoxes();
      setMsg(cvOK ? 'done' : 'doneAlt');
    } catch (e) {
      console.error(e); const h = hist.pop(); if (h) cx.putImageData(h.img, 0, 0);
      setMsg('procError', true, { e });
    }
    setBusy(false);
  }

  function undo() {
    const h = hist.pop(); if (!h) return;
    cx.putImageData(h.img, 0, 0); boxes = h.boxes; renderBoxes();
    $('#undo').disabled = !hist.length; setMsg('undone');
  }

  /* download: PNG sem perdas, nome 'Aetix Design.png' */
  function savePng() {
    let c = cnv;
    if ($('#meta').checked) {
      c = document.createElement('canvas'); c.width = W; c.height = H;
      const k = c.getContext('2d'); k.imageSmoothingEnabled = false; k.drawImage(cnv, 0, 0);
    }
    c.toBlob(b => {
      if (!b) { setMsg('pngFail', true); return; }
      const a = document.createElement('a'), u = URL.createObjectURL(b);
      a.href = u; a.download = 'Aetix Design.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000); setMsg('saved');
      Core.payment.promptAfterDownload();
    }, 'image/png', 1);
  }

  /* ---------- eventos ---------- */
  function init() {
    $('#file').onchange = e => { loadFile(e.target.files[0]); e.target.value = ''; };
    $('#reset').onclick = resetImage;
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file').click(); } });

    $('#cancel').onclick = cancelScan;
    $('#rescan').onclick = scan;
    $('#lang').onchange = scan; $('#psm').onchange = scan; $('#prep').onchange = scan; $('#binc').onchange = scan;
    $('#gran').onchange = () => { boxes = boxes.filter(b => b.manual); buildBoxes(); };
    $('#conf').oninput = e => { $('#confv').textContent = e.target.value; if (raw.words.length || raw.lines.length) buildBoxes(); };
    ['pad', 'thr', 'dil', 'rad', 'merge', 'binc'].forEach(k => { $('#' + k).oninput = e => { $('#' + k + 'v').textContent = e.target.value; }; });
    $('#merge').addEventListener('input', () => { if (raw.words.length || raw.lines.length) buildBoxes(); });

    ['pen', 'eraser'].forEach(t => { const r = $(SIZE[t]); r.addEventListener('change', () => keepPopClosed(t)); r.addEventListener('pointerup', () => keepPopClosed(t)); });
    $('#pencil').onclick = () => toggleTool('pen');
    $('#eraser').onclick = () => toggleTool('eraser');
    $('#pen').oninput = e => { $('#penv').textContent = e.target.value + 'px'; };
    $('#era').oninput = e => { $('#erav').textContent = e.target.value + 'px'; };
    document.addEventListener('pointerdown', e => { if (!e.target.closest('.tool')) hidePops(); });

    ov.addEventListener('pointerdown', e => {
      if (!tool || !W || busy) return;
      ov.setPointerCapture(e.pointerId); pl = pp(e); paintSegment(pl, pl);
      if (tool === 'pen') { penDirty = true; updateCount(); }
    });
    ov.addEventListener('pointermove', e => { moveCursor(e); if (!pl) return; const p = pp(e); paintSegment(pl, p); pl = p; });
    ov.addEventListener('pointerleave', () => { $('#pcur').hidden = true; });
    ['pointerup', 'pointercancel'].forEach(t => ov.addEventListener(t, () => { const was = pl; pl = null; if (was && tool === 'eraser' && penDirty) recheckPen(); }));

    $('#all').onclick = () => { boxes.forEach(b => { b.sel = true; }); renderBoxes(); };
    $('#none').onclick = () => { boxes.forEach(b => { b.sel = false; }); clearPen(); renderBoxes(); };
    $('#draw').onclick = () => {
      drawMode = !drawMode; if (drawMode && tool) setTool(null);
      $('#draw').setAttribute('aria-pressed', String(drawMode)); layer.classList.toggle('draw', drawMode);
      setMsg(drawMode ? 'drawHint' : null);
    };
    layer.addEventListener('pointerdown', e => {
      if (!drawMode || e.target !== layer) return;
      layer.setPointerCapture(e.pointerId); ds = lp(e);
      tmp = document.createElement('div'); tmp.className = 'box tmp'; layer.appendChild(tmp);
    });
    layer.addEventListener('pointermove', e => {
      if (!ds) return; const r = dragRect(ds, lp(e));
      tmp.style.cssText = `left:${r.x / W * 100}%;top:${r.y / H * 100}%;width:${r.w / W * 100}%;height:${r.h / H * 100}%`;
    });
    layer.addEventListener('pointerup', endDraw);
    layer.addEventListener('pointercancel', () => { ds = null; if (tmp) { tmp.remove(); tmp = null; } });

    $('#go').onclick = removeSelected;
    $('#undo').onclick = undo;
    $('#save').onclick = savePng;
  }
  init();

  /* ---------- API do módulo ---------- */
  return {
    activate: bootEngines,
    deactivate: hidePops,
    loadFile,
    setDragOver: b => drop.classList.toggle('over', b),
    onEscape: () => { if (tool) setTool(null); },
    onLang: () => { $('#go-t').textContent = tr(goKey); renderMsg(); refreshLabels(); updateCount(); }
  };
})();

/* ==========================================================================
   VIDEO PROCESSOR  (Web Worker: MP4Box + WebCodecs + OpenCV.js + mp4-muxer; FFmpeg.wasm p/ metadados)
   ========================================================================== */
Core['modules']['video'] = App['VideoProcessor'] = (function () {
  const { $ } = Core.scope('vd');
  const tr = (k, p) => Core.tr('vid.' + k, p);
  const fmtTime = (t, tenths) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60), s = Math.floor(t % 60), base = m + ':' + String(s).padStart(2, '0');
    return tenths ? base + '.' + Math.floor((t % 1) * 10) : base;
  };

  /* ---------- DOM ---------- */
  const drop = $('#drop'), fileInput = $('#file'), editor = $('#editor'), msgEl = $('#msg');
  const vid = $('#vid'), ov = $('#ov'), wrap = $('#wrap'), pcur = $('#pcur');
  const pencil = $('#pencil'), eraser = $('#eraser'), penpop = $('#penpop'), erapop = $('#erapop');
  const pen = $('#pen'), era = $('#era'), penv = $('#penv'), erav = $('#erav');
  const resetBtn = $('#reset'), playBtn = $('#play'), playIc = $('#playic'), prevf = $('#prevf'), nextf = $('#nextf');
  const seek = $('#seek'), marks = $('#marks'), timeEl = $('#time');
  const addkf = $('#addkf'), delkf = $('#delkf'), kflist = $('#kflist'), countEl = $('#count');
  const scanbar = $('#scanbar'), prog = $('#prog'), cancelBtn = $('#cancel');
  const renderBtn = $('#render'), saveBtn = $('#save');
  const algo = $('#algo'), rad = $('#rad'), radv = $('#radv'), dil = $('#dil'), dilv = $('#dilv');
  const quality = $('#quality'), noise = $('#noise'), meta = $('#meta');
  const resvid = $('#resvid'), resultSub = $('#resultSub'), resultSave = $('#resultSave');

  /* Navier-Stokes por padrão: preserva melhor textura e fundo em movimento */
  algo.value = 'ns';

  /* ---------- estado local ---------- */
  let videoFile = null, videoUrl = null;
  let PW = 0, PH = 0;
  let keyframes = [];            // {t, mask:Uint8Array, stats}
  let activeIdx = -1;
  let previewBuf = null, ovData = null, paintCv = null, paintCtx = null;
  let tool = null, painting = false, points = [], strokeMode = 'pen', brushPx = 1;
  let lastBlob = null, lastHasAudio = false, resultUrl = null;
  let rendering = false, cancelled = false;
  let curMsg = null;
  let rafId = 0, lastOv = 0;
  let worker = null, bootP = null, bootWait = null, pendingJob = null, jobSeq = 0;

  /* ---------- mensagens ---------- */
  function renderMsg() {
    msgEl.textContent = curMsg ? tr(curMsg.k, curMsg.p) : '';
    msgEl.className = 'msg' + (curMsg && curMsg.err ? ' err' : '');
  }
  function setMsg(key, err, params) { curMsg = key ? { k: key, err: !!err, p: params || null } : null; renderMsg(); }

  /* ---------- motor ---------- */
  function setEngine(state) { State.videoEngine.status = state; Core.refreshEngine(); }
  function checkSupport() {
    const ok = typeof Worker !== 'undefined' && typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && !!URL.createObjectURL;
    if (!ok && State.videoEngine.supported) { State.videoEngine.supported = false; setEngine('err'); setMsg('unsupported', true); }
    State.videoEngine.supported = ok;
    return ok;
  }

  /* ============================================================
     PIPELINE OPENCV — INPAINT NAVIER-STOKES EM SUB-BLOCO ISOLADO
     Função pura (recebe o objeto cv). É usada dentro do Web Worker
     (via toString) e exposta em AetixApp.VideoProcessor.processFrameOpenCV.
     NÃO pode referenciar nada do escopo externo.
     ============================================================ */
  const IMPL_SRC = "function processFrameOpenCVImpl(cv, frameCanvas, bbox, maskCanvas, opts) {\n    opts = opts || {};\n    /* Instancia do OpenCV: usa o objeto injetado (obrigatorio dentro do Web Worker, onde 'window' NAO existe)\n       e cai para o global da thread atual (self === window na thread principal). */\n    const opencvInstance = cv || (typeof self !== 'undefined' ? self['cv'] : null);\n    if (!opencvInstance || !opencvInstance['inpaint']) return false;\n    var radius = opts['radius'] > 0 ? opts['radius'] : 3;\n    var dil = opts['dil'] > 0 ? opts['dil'] : 0;\n    var addNoise = !!opts['noise'];\n    var src = null, mask = null, maskGray = null, eroded = null, rgb = null, dst = null, out = null, kernel = null, grown = null;\n    try {\n      /* A. sub-bloco: so os pixels dentro da bounding box */\n      var fctx = frameCanvas['getContext']('2d', { willReadFrequently: true });\n      var mctx = maskCanvas['getContext']('2d', { willReadFrequently: true });\n      var x = Math.max(0, Math.floor(bbox['x'])), y = Math.max(0, Math.floor(bbox['y']));\n      var w = Math.min(frameCanvas['width'] - x, Math.ceil(bbox['width']));\n      var h = Math.min(frameCanvas['height'] - y, Math.ceil(bbox['height']));\n      if (w < 2 || h < 2) return false;\n      var frameData = fctx['getImageData'](x, y, w, h);\n      var maskData = mctx['getImageData'](x, y, w, h);\n\n      /* B. matrizes do OpenCV */\n      src = opencvInstance['matFromImageData'](frameData);\n      mask = opencvInstance['matFromImageData'](maskData);\n\n      /* C. mascara em cinza + binarizacao obrigatoria (CV_8UC1, valores 0/255) */\n      maskGray = new opencvInstance['Mat']();\n      opencvInstance['cvtColor'](mask, maskGray, opencvInstance['COLOR_RGBA2GRAY']);\n      opencvInstance['threshold'](maskGray, maskGray, 10, 255, opencvInstance['THRESH_BINARY']);\n\n      /* so executa o inpaint se ha pixels desenhados nesta area */\n      if (opencvInstance['countNonZero'](maskGray) > 0) {\n        kernel = opencvInstance['Mat']['ones'](3, 3, opencvInstance['CV_8U']);\n        var work = maskGray;\n        if (dil > 0) {\n          grown = new opencvInstance['Mat']();\n          opencvInstance['dilate'](maskGray, grown, kernel, new opencvInstance['Point'](-1, -1), dil);\n          work = grown;\n        }\n        eroded = new opencvInstance['Mat']();\n        opencvInstance['erode'](work, eroded, kernel, new opencvInstance['Point'](-1, -1), 2);\n        if (opencvInstance['countNonZero'](eroded) === 0) {   /* traco muito fino: nao perde a mascara */\n          work['copyTo'](eroded);\n        }\n\n        /* D. inpaint Navier-Stokes (INPAINT_NS) - inpaint exige imagem 8UC3 e mascara 8UC1 */\n        rgb = new opencvInstance['Mat']();\n        opencvInstance['cvtColor'](src, rgb, opencvInstance['COLOR_RGBA2RGB']);\n        dst = new opencvInstance['Mat']();\n        opencvInstance['inpaint'](rgb, eroded, dst, radius, opencvInstance['INPAINT_NS']);\n\n        /* E. recomposicao: volta a RGBA e devolve ao canvas nas coordenadas x, y */\n        out = new opencvInstance['Mat']();\n        opencvInstance['cvtColor'](dst, out, opencvInstance['COLOR_RGB2RGBA']);\n        var od = out['data'], md = eroded['data'], n = w * h;\n        if (addNoise) {\n          for (var i = 0; i < n; i++) {\n            if (md[i] <= 127) continue;\n            var j = i * 4;\n            for (var c = 0; c < 3; c++) {\n              var v = od[j + c] + ((Math.random() * 3) | 0) - 1;\n              od[j + c] = v < 0 ? 0 : v > 255 ? 255 : v;\n            }\n          }\n        }\n        fctx['putImageData'](new ImageData(new Uint8ClampedArray(od), w, h), x, y);\n        return true;\n      }\n      return false;   /* area vazia neste frame: segue o loop sem erro */\n    } catch (e) {\n      console['warn']('processFrameOpenCV', e);\n      return false;\n    } finally {\n      /* GC estrito do WebAssembly: libera tudo a cada frame */\n      if (src) { try { src['delete'](); } catch (e1) {} }\n      if (mask) { try { mask['delete'](); } catch (e2) {} }\n      if (maskGray) { try { maskGray['delete'](); } catch (e3) {} }\n      if (eroded) { try { eroded['delete'](); } catch (e4) {} }\n      if (rgb) { try { rgb['delete'](); } catch (e5) {} }\n      if (dst) { try { dst['delete'](); } catch (e6) {} }\n      if (out) { try { out['delete'](); } catch (e7) {} }\n      if (kernel) { try { kernel['delete'](); } catch (e8) {} }\n      if (grown) { try { grown['delete'](); } catch (e9) {} }\n    }\n  }";
  const processFrameOpenCVImpl = new Function("return (" + IMPL_SRC + ")")();

  /* ============================================================
     WORKER (demux → decode → inpaint → encode → mux)
     Esta função é convertida em texto e executada num Web Worker:
     NÃO pode referenciar nada do escopo externo.
     ============================================================ */
  const MAIN_SRC = "function renderWorkerMain() {\n    'use strict';\n    var cv = null, booted = false, busy = false;\n    var CV_URLS = [\n      'https://docs.opencv.org/4.x/opencv.js',\n      'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js'\n    ];\n    function post(m, t) { self.postMessage(m, t || []); }\n    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }\n    function codeErr(code) { var e = new Error(code); e.code = code; return e; }\n\n    function boot() {\n      try {\n        importScripts(\n          'https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js',\n          'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.min.js'\n        );\n      } catch (e) { post({ type: 'bootfail', step: 'libs', err: String((e && e.message) || e) }); return; }\n      post({ type: 'boot', step: 'libs' });\n      loadCv(0);\n    }\n\n    function loadCv(i) {\n      if (i >= CV_URLS.length) { post({ type: 'bootfail', step: 'cv', err: 'cv' }); return; }\n      post({ type: 'boot', step: 'cv' });\n      try { importScripts(CV_URLS[i]); } catch (e) { loadCv(i + 1); return; }\n      (async function () {\n        try {\n          var c = self['cv'];\n          if (typeof c === 'function') c = await c();\n          if (c && typeof c.then === 'function') {\n            c = await new Promise(function (res, rej) { c.then(function (m) { try { delete m.then; } catch (e) {} res(m); }, rej); });\n          }\n          if (!c || !c['Mat']) {\n            await new Promise(function (res, rej) {\n              var n = 0;\n              var iv = setInterval(function () {\n                if (c && c['Mat']) { clearInterval(iv); res(); }\n                else if (++n > 1800) { clearInterval(iv); rej(new Error('timeout')); }\n              }, 100);\n            });\n          }\n          if (!c || !c['inpaint']) throw new Error('inpaint');\n          cv = c; booted = true;\n          post({ type: 'ready' });\n        } catch (e) {\n          try { self['cv'] = undefined; } catch (err) {}\n          loadCv(i + 1);\n        }\n      })();\n    }\n\n    /* ---------- m\u00e1scara ---------- */\n    function stats(mask, W, H) {\n      var x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;\n      for (var y = 0; y < H; y++) {\n        var row = y * W;\n        for (var x = 0; x < W; x++) {\n          if (mask[row + x] > 127) {\n            n++; sx += x; sy += y;\n            if (x < x0) x0 = x; if (x > x1) x1 = x;\n            if (y < y0) y0 = y; if (y > y1) y1 = y;\n          }\n        }\n      }\n      return n ? { x0: x0, y0: y0, x1: x1, y1: y1, n: n, cx: sx / n, cy: sy / n } : null;\n    }\n\n    var scratch = null;\n\n    function maskAt(t, kfs, W, H) {\n      if (!kfs.length) return null;\n      if (t <= kfs[0].t) return kfs[0].st ? { mask: kfs[0].mask, st: kfs[0].st } : null;\n      var last = kfs[kfs.length - 1];\n      if (t >= last.t) return last.st ? { mask: last.mask, st: last.st } : null;\n      var i = 0;\n      while (i < kfs.length - 1 && kfs[i + 1].t <= t) i++;\n      var a = kfs[i], b = kfs[i + 1];\n      if (!a.st) return b.st ? { mask: b.mask, st: b.st } : null;\n      if (!b.st) return a.st ? { mask: a.mask, st: a.st } : null;\n      var al = (t - a.t) / (b.t - a.t);\n      if (al < 0) al = 0; if (al > 1) al = 1;\n      if (!scratch) scratch = new Uint8Array(W * H);\n      var out = scratch; out.fill(0);\n      var ca = a.st, cb = b.st;\n      var cx = ca.cx + (cb.cx - ca.cx) * al, cy = ca.cy + (cb.cy - ca.cy) * al;\n      var dax = Math.round(cx - ca.cx), day = Math.round(cy - ca.cy);\n      var dbx = Math.round(cx - cb.cx), dby = Math.round(cy - cb.cy);\n      var ux0 = Math.min(ca.x0 + dax, cb.x0 + dbx), uy0 = Math.min(ca.y0 + day, cb.y0 + dby);\n      var ux1 = Math.max(ca.x1 + dax, cb.x1 + dbx), uy1 = Math.max(ca.y1 + day, cb.y1 + dby);\n      if (ux0 < 0) ux0 = 0; if (uy0 < 0) uy0 = 0;\n      if (ux1 > W - 1) ux1 = W - 1; if (uy1 > H - 1) uy1 = H - 1;\n      var am = a.mask, bm = b.mask;\n      for (var y = uy0; y <= uy1; y++) {\n        var ay = y - day, by = y - dby, row = y * W;\n        for (var x = ux0; x <= ux1; x++) {\n          var va = 0, vb = 0;\n          var ax = x - dax;\n          if (ax >= 0 && ax < W && ay >= 0 && ay < H && am[ay * W + ax] > 127) va = 255;\n          var bx = x - dbx;\n          if (bx >= 0 && bx < W && by >= 0 && by < H && bm[by * W + bx] > 127) vb = 255;\n          if (va + vb >= 255) out[row + x] = 255;\n        }\n      }\n      return { mask: out, st: { x0: ux0, y0: uy0, x1: ux1, y1: uy1, n: 1 } };\n    }\n\n    /* ---------- pipeline OpenCV (Navier-Stokes + sub-bloco isolado) ----------\n       processFrameOpenCVImpl \u00e9 injetada neste worker (ver ensureWorker). */\n    function processFrameOpenCV(frameCanvas, bbox, maskCanvas, opts) {\n      return processFrameOpenCVImpl(cv, frameCanvas, bbox, maskCanvas, opts);\n    }\n\n    /* escreve a m\u00e1scara (Uint8Array W*H) do bbox no canvas de m\u00e1scara (branco = remover) */\n    var maskCv = null, maskCtx = null;\n    function paintMaskCanvas(mask, W, H, bb) {\n      if (!maskCv || maskCv.width !== W || maskCv.height !== H) {\n        maskCv = new OffscreenCanvas(W, H);\n        maskCtx = maskCv.getContext('2d', { willReadFrequently: true });\n      }\n      var w = bb.width, h = bb.height;\n      var img = maskCtx.createImageData(w, h), d = img.data;\n      for (var yy = 0; yy < h; yy++) {\n        var mrow = (bb.y + yy) * W + bb.x, drow = yy * w * 4;\n        for (var xx = 0; xx < w; xx++) {\n          var v = mask[mrow + xx] > 127 ? 255 : 0, j = drow + xx * 4;\n          d[j] = v; d[j + 1] = v; d[j + 2] = v; d[j + 3] = 255;\n        }\n      }\n      maskCtx.putImageData(img, bb.x, bb.y);\n      return maskCv;\n    }\n\n    /* bounding box (com folga para o inpaint) a partir das estat\u00edsticas da m\u00e1scara */\n    function bboxFrom(st, W, H, pad) {\n      var x0 = Math.max(0, st.x0 - pad), y0 = Math.max(0, st.y0 - pad);\n      var x1 = Math.min(W, st.x1 + 1 + pad), y1 = Math.min(H, st.y1 + 1 + pad);\n      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };\n    }\n\n    /* ---------- \u00e1udio ---------- */\n    async function encodeAudio(a, id) {\n      if (!a || !a.channels || !a.channels.length) return null;\n      var sr = a.sampleRate, nch = Math.min(2, a.channels.length), total = a.channels[0].length;\n      var cfg = { codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: nch, bitrate: 192000 };\n      var sup = null;\n      try { sup = await AudioEncoder.isConfigSupported(cfg); } catch (e) { return null; }\n      if (!sup || !sup.supported) return null;\n      var chunks = [], err = null;\n      var enc = new AudioEncoder({\n        output: function (c, m) { chunks.push({ chunk: c, meta: m }); },\n        error: function (e) { err = e; }\n      });\n      enc.configure(cfg);\n      var block = 1024;\n      for (var off = 0; off < total; off += block) {\n        if (err) break;\n        var n = Math.min(block, total - off);\n        var data = new Float32Array(n * nch);\n        for (var c = 0; c < nch; c++) data.set(a.channels[c].subarray(off, off + n), c * n);\n        var ad = new AudioData({\n          format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: nch,\n          timestamp: Math.round(off / sr * 1e6), data: data\n        });\n        enc.encode(ad); ad.close();\n        if (enc.encodeQueueSize > 24) await sleep(2);\n        if (off % (block * 200) === 0) post({ type: 'progress', id: id, phase: 'audio', p: off / total });\n      }\n      await enc.flush();\n      if (err) throw err;\n      return { chunks: chunks, sampleRate: sr, channels: nch };\n    }\n\n    /* ---------- render ---------- */\n    async function doRender(job) {\n      var id = job.id, W = job.W, H = job.H;\n      var kfs = job.keyframes.map(function (k) { return { t: k.t, mask: new Uint8Array(k.mask) }; });\n      kfs.sort(function (a, b) { return a.t - b.t; });\n      kfs.forEach(function (k) { k.st = stats(k.mask, W, H); });\n\n      post({ type: 'progress', id: id, phase: 'demux', p: 0 });\n\n      var buf = job.file;\n      try { buf.fileStart = 0; } catch (e) {}\n      var mp4 = MP4Box.createFile();\n      var info = null;\n      mp4.onReady = function (i) { info = i; };\n      mp4.onError = function () {};\n      try { mp4.appendBuffer(buf); mp4.flush(); }\n      catch (e) { throw codeErr('format'); }\n      if (!info || !info.videoTracks || !info.videoTracks.length) throw codeErr('format');\n      var vt = info.videoTracks[0];\n      var trak = mp4.getTrackById(vt.id);\n      var entry = trak.mdia.minf.stbl.stsd.entries[0];\n      var box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;\n      if (!box) throw codeErr('format');\n      var ds = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);\n      box.write(ds);\n      var desc = new Uint8Array(ds.buffer, 8);\n\n      var decCfg = { codec: vt.codec, description: desc, codedWidth: vt.video.width, codedHeight: vt.video.height };\n      var dsup = null;\n      try { dsup = await VideoDecoder.isConfigSupported(decCfg); } catch (e) { dsup = null; }\n      if (!dsup || !dsup.supported) throw codeErr('decode');\n\n      var samples = [];\n      mp4.onSamples = function (tid, u, ss) { for (var i = 0; i < ss.length; i++) samples.push(ss[i]); };\n      mp4.setExtractionOptions(vt.id, null, { nbSamples: Math.max(1, Math.min(vt.nb_samples || 100000, 100000)) });\n      mp4.start();\n      var want = vt.nb_samples || 0, dl = Date.now() + 30000;\n      while (Date.now() < dl && (want ? samples.length < want : samples.length === 0)) await sleep(10);\n      if (!samples.length) throw codeErr('format');\n\n      var t0 = Infinity;\n      for (var si = 0; si < samples.length; si++) {\n        var cts = samples[si].cts * 1e6 / vt.timescale;\n        if (cts < t0) t0 = cts;\n      }\n      if (!isFinite(t0)) t0 = 0;\n\n      var durSec = vt.duration / vt.timescale;\n      var fps = vt.nb_samples && durSec > 0 ? vt.nb_samples / durSec : 30;\n      if (!isFinite(fps) || fps < 1 || fps > 240) fps = 30;\n\n      var bitrate = job.bitrate || 6000000;\n      var cands = [\n        { codec: 'avc1.42001f', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } },\n        { codec: 'avc1.4d0028', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } },\n        { codec: 'avc1.640028', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } }\n      ];\n      var encCfg = null;\n      for (var ci = 0; ci < cands.length; ci++) {\n        try {\n          var esup = await VideoEncoder.isConfigSupported(cands[ci]);\n          if (esup && esup.supported) { encCfg = cands[ci]; break; }\n        } catch (e) {}\n      }\n      if (!encCfg) throw codeErr('encode');\n\n      var aud = null;\n      try { aud = await encodeAudio(job.audio, id); } catch (e) { aud = null; }\n\n      var muxer = new Mp4Muxer.Muxer({\n        target: new Mp4Muxer.ArrayBufferTarget(),\n        video: { codec: 'avc', width: W, height: H, frameRate: fps },\n        audio: aud ? { codec: 'aac', sampleRate: aud.sampleRate, numberOfChannels: aud.channels } : undefined,\n        fastStart: 'in-memory',\n        firstTimestampBehavior: 'offset'\n      });\n      if (aud) { for (var ai = 0; ai < aud.chunks.length; ai++) muxer.addAudioChunk(aud.chunks[ai].chunk, aud.chunks[ai].meta); }\n\n      var frameCanvas = new OffscreenCanvas(W, H);\n      var fctx = frameCanvas.getContext('2d', { willReadFrequently: true });\n      var encErr = null;\n      var enc = new VideoEncoder({\n        output: function (chunk, m) { muxer.addVideoChunk(chunk, m); },\n        error: function (e) { encErr = e; }\n      });\n      enc.configure(encCfg);\n\n      var pending = 0, processed = 0, frameIndex = 0, fatal = null, chain = Promise.resolve();\n      var keyEvery = Math.max(1, Math.round(fps * 2));\n\n      async function processFrame(frame) {\n        try {\n          var t = (frame.timestamp - t0) / 1e6;\n          var hit = maskAt(t, kfs, W, H);\n          fctx.drawImage(frame, 0, 0, W, H);\n          if (hit && hit.st) {\n            var bb = bboxFrom(hit.st, W, H, job.radius + job.dil + 6);\n            if (bb.width >= 2 && bb.height >= 2) {\n              var mc = paintMaskCanvas(hit.mask, W, H, bb);\n              processFrameOpenCV(frameCanvas, bb, mc, { radius: job.radius, dil: job.dil, noise: job.noise });\n            }\n          }\n          var out = new VideoFrame(frameCanvas, {\n            timestamp: Math.max(0, frame.timestamp - t0),\n            duration: frame.duration || Math.round(1e6 / fps)\n          });\n          while (enc.encodeQueueSize > 12 && !fatal) await sleep(1);\n          enc.encode(out, { keyFrame: frameIndex === 0 || frameIndex % keyEvery === 0 });\n          frameIndex++;\n          out.close();\n        } finally {\n          try { frame.close(); } catch (e) {}\n        }\n      }\n\n      var decErr = null;\n      var dec = new VideoDecoder({\n        output: function (frame) {\n          pending++;\n          chain = chain.then(async function () {\n            try { await processFrame(frame); }\n            catch (e) { if (!fatal) fatal = e; }\n            finally { pending--; }\n          });\n        },\n        error: function (e) { decErr = e; }\n      });\n      dec.configure(decCfg);\n\n      for (var i = 0; i < samples.length; i++) {\n        if (fatal || decErr) break;\n        var s = samples[i];\n        var ts = Math.round(s.cts * 1e6 / vt.timescale);\n        var du = Math.round((s.duration || 0) * 1e6 / vt.timescale) || Math.round(1e6 / fps);\n        try {\n          dec.decode(new EncodedVideoChunk({\n            type: s.is_sync ? 'key' : 'delta',\n            timestamp: ts, duration: du, data: s.data\n          }));\n        } catch (e) { fatal = e; break; }\n        while ((dec.decodeQueueSize > 16 || pending > 6) && !fatal && !decErr) await sleep(2);\n        if (i % 4 === 0) {\n          processed++;\n          post({ type: 'progress', id: id, phase: 'frames', p: Math.min(0.98, i / samples.length) });\n        }\n      }\n\n      try { await dec.flush(); } catch (e) { if (!fatal) fatal = e; }\n      try { await chain; } catch (e) { if (!fatal) fatal = e; }\n      if (fatal) throw fatal;\n      if (decErr) throw decErr;\n      try { await enc.flush(); } catch (e) { if (!encErr) encErr = e; }\n      if (encErr) throw encErr;\n\n      post({ type: 'progress', id: id, phase: 'mux', p: 0.99 });\n      muxer.finalize();\n      var outBuf = muxer.target.buffer;\n      post({ type: 'result', id: id, buffer: outBuf, hasAudio: !!aud }, [outBuf]);\n    }\n\n    self.onmessage = function (ev) {\n      var d = ev.data;\n      if (!d || d.cmd !== 'render') return;\n      if (!booted) { post({ type: 'error', id: d.id, code: 'boot' }); return; }\n      if (busy) { post({ type: 'error', id: d.id, code: 'busy' }); return; }\n      busy = true;\n      doRender(d)\n        .catch(function (e) { post({ type: 'error', id: d.id, code: (e && typeof e.code === 'string' && e.code) || 'render', detail: String((e && (e.name + ': ' + e.message)) || e) }); })\n        .then(function () { busy = false; });\n    };\n\n    boot();\n  }";

  /* ---------- ponte com o worker ---------- */
  function onWorkerMessage(d) {
    if (!d || !d.type) return;
    if (d.type === 'boot') { setEngine('load'); return; }
    if (d.type === 'ready') {
      setEngine('ok');
      if (bootWait) { const b = bootWait; bootWait = null; b.resolve(true); }
      return;
    }
    if (d.type === 'bootfail') {
      setEngine('err');
      if (!videoFile) setMsg('engineFail', true);
      const b = bootWait; bootWait = null; bootP = null;
      if (b) b.reject(new Error('boot'));
      return;
    }
    if (!pendingJob || d.id !== pendingJob.id) return;
    if (d.type === 'progress') { updateProgress(d); return; }
    if (d.type === 'result') { const p = pendingJob; pendingJob = null; p.resolve(d); return; }
    if (d.type === 'error') { const p = pendingJob; pendingJob = null; console['warn']('[AETIX] erro no worker de render:', d['code'], d['detail']); p.reject(new Error(d.code || 'render')); }
  }

  function ensureWorker() {
    if (bootP) return bootP;
    setEngine('load');
    bootP = new Promise((resolve, reject) => {
      bootWait = { resolve, reject };
      let w = null;
      const src = 'var processFrameOpenCVImpl = ' + IMPL_SRC + ';\n(' + MAIN_SRC + ')()';
      const u = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      try { w = new Worker(u); }
      catch (e) { URL.revokeObjectURL(u); bootWait = null; bootP = null; setEngine('err'); reject(e); return; }
      URL.revokeObjectURL(u);
      worker = w;
      w.onmessage = e => onWorkerMessage(e.data);
      w.onerror = e => {
        const m = (e && e.message) || 'worker';
        if (bootWait) { const b = bootWait; bootWait = null; bootP = null; b.reject(new Error(m)); }
        if (pendingJob) { const p = pendingJob; pendingJob = null; p.reject(new Error(m)); }
        setEngine('err');
        try { w.terminate(); } catch (err) {}
        if (worker === w) worker = null;
      };
    });
    return bootP;
  }

  function terminateWorker() {
    if (worker) { try { worker.terminate(); } catch (e) {} worker = null; }
    bootP = null; bootWait = null; pendingJob = null;
  }

  function runRender(payload, transfer) {
    return new Promise((resolve, reject) => {
      pendingJob = { id: payload.id, resolve, reject };
      try { worker.postMessage(payload, transfer); }
      catch (e) { pendingJob = null; reject(e); }
    });
  }

  function updateProgress(d) {
    if (d.phase === 'frames') { const p = Core.clamp(d.p || 0, 0, 1); prog.value = 0.15 + 0.75 * p; setMsg('phaseFrames', false, { p: Math.round(p * 100) }); }
    else if (d.phase === 'audio') { prog.value = 0.06 + 0.04 * Core.clamp(d.p || 0, 0, 1); setMsg('phaseAudio'); }
    else if (d.phase === 'demux') { prog.value = 0.12; setMsg('phaseDemux'); }
    else if (d.phase === 'mux') { prog.value = 0.95; setMsg('phaseMux'); }
  }

  /* ============================================================
     VÍDEO
     ============================================================ */
  const clamp = Core.clamp;

  function resetEditorState() {
    keyframes = []; activeIdx = -1; lastBlob = null; lastHasAudio = false;
    previewBuf = null; ovData = null; paintCv = null; paintCtx = null;
    points = []; painting = false;
    kflist.innerHTML = ''; marks.innerHTML = '';
    countEl.textContent = '';
    seek.value = 0; timeEl.textContent = '0:00 / 0:00';
    scanbar.hidden = true; prog.value = 0;
  }

  function mediaReady(v) {
    return new Promise((res, rej) => {
      if (v.readyState >= 1 && v.videoWidth) return res();
      let done = false;
      const t = setTimeout(() => { if (done) return; done = true; cleanup(); rej(new Error('timeout')); }, 20000);
      function cleanup() { clearTimeout(t); v.removeEventListener('loadedmetadata', ok); v.removeEventListener('error', bad); }
      function ok() { if (done) return; done = true; cleanup(); res(); }
      function bad() { if (done) return; done = true; cleanup(); rej(new Error('media')); }
      v.addEventListener('loadedmetadata', ok);
      v.addEventListener('error', bad);
    });
  }

  function setupDimensions() {
    const w = vid.videoWidth, h = vid.videoHeight;
    const scale = Math.min(1, 854 / w, 480 / h);
    PW = Math.max(2, Math.round(w * scale / 2) * 2);
    PH = Math.max(2, Math.round(h * scale / 2) * 2);
    ov.width = PW; ov.height = PH;
    previewBuf = new Uint8Array(PW * PH);
    ovData = ov.getContext('2d').createImageData(PW, PH);
    paintCv = document.createElement('canvas');
    paintCv.width = PW; paintCv.height = PH;
    paintCtx = paintCv.getContext('2d', { willReadFrequently: true });
  }

  function loadVideo(f) {
    if (!f || rendering) return;
    const name = (f.name || '').toLowerCase();
    const okType = /^video\//.test(f.type || '') || /\.(mp4|mov|m4v|webm)$/.test(name);
    if (!okType) { setMsg('chooseVideo', true); return; }
    setMsg('loadingVideo');
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null; }
    videoFile = f;
    videoUrl = URL.createObjectURL(f);
    resetEditorState();
    vid.pause();
    vid.src = videoUrl;
    vid.load();
    mediaReady(vid).then(() => {
      if (!vid.videoWidth || !vid.videoHeight) { resetVideo(); setMsg('openFail', true); return; }
      setupDimensions();
      drop.hidden = true; editor.hidden = false;
      keyframes = []; activeIdx = -1; lastBlob = null; lastHasAudio = false;
      saveBtn.disabled = true;
      syncTimeline(); syncActive(); clearOverlay(); syncCount(); syncUI(); setTool(null);
      setMsg('readyHint');
    }).catch(() => { resetVideo(); setMsg('openFail', true); });
  }

  function resetVideo() {
    if (rendering) return;
    vid.pause();
    vid.removeAttribute('src');
    try { vid.load(); } catch (e) {}
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null; }
    videoFile = null;
    resetEditorState();
    editor.hidden = true; drop.hidden = false;
    setMsg(null); setTool(null); syncUI();
  }

  /* ---------- máscara / overlay ---------- */
  function maskStats(mask) {
    const W = PW, H = PH;
    let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        if (mask[row + x] > 127) {
          n++; sx += x; sy += y;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    return n ? { x0, y0, x1, y1, n, cx: sx / n, cy: sy / n } : null;
  }
  function statsOf(k) { if (!k.stats) k.stats = maskStats(k.mask); return k.stats; }
  function clearOverlay() { if (!ov.width) return; ov.getContext('2d').clearRect(0, 0, ov.width, ov.height); }

  function maskAtTime(t) {
    const n = keyframes.length;
    if (!n) return null;
    if (t <= keyframes[0].t + 1e-4) { const k = keyframes[0]; return k.stats ? k.mask : null; }
    const last = keyframes[n - 1];
    if (t >= last.t - 1e-4) return last.stats ? last.mask : null;
    let i = 0;
    while (i < n - 1 && keyframes[i + 1].t <= t) i++;
    const a = keyframes[i], b = keyframes[i + 1];
    const sa = statsOf(a), sb = statsOf(b);
    if (!sa) return sb ? b.mask : null;
    if (!sb) return a.mask;
    let al = (t - a.t) / (b.t - a.t);
    al = clamp(al, 0, 1);
    const out = previewBuf;
    if (!out) return null;
    out.fill(0);
    const cx = sa.cx + (sb.cx - sa.cx) * al, cy = sa.cy + (sb.cy - sa.cy) * al;
    const dax = Math.round(cx - sa.cx), day = Math.round(cy - sa.cy);
    const dbx = Math.round(cx - sb.cx), dby = Math.round(cy - sb.cy);
    let ux0 = Math.min(sa.x0 + dax, sb.x0 + dbx), uy0 = Math.min(sa.y0 + day, sb.y0 + dby);
    let ux1 = Math.max(sa.x1 + dax, sb.x1 + dbx), uy1 = Math.max(sa.y1 + day, sb.y1 + dby);
    ux0 = Math.max(0, ux0); uy0 = Math.max(0, uy0);
    ux1 = Math.min(PW - 1, ux1); uy1 = Math.min(PH - 1, uy1);
    const am = a.mask, bm = b.mask;
    for (let y = uy0; y <= uy1; y++) {
      const ay = y - day, by = y - dby, row = y * PW;
      for (let x = ux0; x <= ux1; x++) {
        let va = 0, vb = 0;
        const ax = x - dax;
        if (ax >= 0 && ax < PW && ay >= 0 && ay < PH && am[ay * PW + ax] > 127) va = 255;
        const bx = x - dbx;
        if (bx >= 0 && bx < PW && by >= 0 && by < PH && bm[by * PW + bx] > 127) vb = 255;
        if (va + vb >= 255) out[row + x] = 255;
      }
    }
    return out;
  }

  function drawOverlay(mask) {
    if (!ovData) return;
    const d = ovData.data;
    if (!mask) { ov.getContext('2d').clearRect(0, 0, PW, PH); return; }
    for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
      if (mask[i] > 127) { d[j] = 255; d[j + 1] = 77; d[j + 2] = 141; d[j + 3] = 190; }
      else d[j + 3] = 0;
    }
    ov.getContext('2d').putImageData(ovData, 0, 0);
  }

  function drawOverlayNow() {
    if (painting || !PW) return;
    const t = vid.currentTime || 0;
    let mask = null;
    if (activeIdx >= 0 && keyframes[activeIdx] && Math.abs(keyframes[activeIdx].t - t) < 0.06) {
      const k = keyframes[activeIdx];
      mask = statsOf(k) ? k.mask : null;
    } else mask = maskAtTime(t);
    drawOverlay(mask);
  }

  /* ---------- keyframes ---------- */
  const sortKeyframes = () => keyframes.sort((a, b) => a.t - b.t);
  function nearestKf(t, tol) {
    let best = -1, bd = tol;
    keyframes.forEach((k, i) => { const d = Math.abs(k.t - t); if (d <= bd) { bd = d; best = i; } });
    return best;
  }
  function syncActive() { activeIdx = nearestKf(vid.currentTime || 0, 0.05); renderKfList(); syncUI(); }

  function addKeyframe() {
    if (!videoFile || rendering) return;
    const t = vid.currentTime || 0;
    const near = nearestKf(t, 0.05);
    if (near >= 0) { activeIdx = near; setMsg('kfExists'); renderKfList(); renderMarks(); syncUI(); drawOverlayNow(); return; }
    const k = { t, mask: new Uint8Array(PW * PH), stats: null };
    keyframes.push(k); sortKeyframes(); activeIdx = keyframes.indexOf(k);
    clearOverlay(); renderKfList(); renderMarks(); syncCount(); syncUI(); setMsg('kfAdded');
  }

  function ensureActiveKf() {
    const t = vid.currentTime || 0;
    if (activeIdx >= 0 && keyframes[activeIdx] && Math.abs(keyframes[activeIdx].t - t) < 0.06) return keyframes[activeIdx];
    const near = nearestKf(t, 0.06);
    if (near >= 0) { activeIdx = near; return keyframes[near]; }
    const k = { t, mask: new Uint8Array(PW * PH), stats: null };
    keyframes.push(k); sortKeyframes(); activeIdx = keyframes.indexOf(k);
    clearOverlay(); renderKfList(); renderMarks(); syncCount(); syncUI();
    return k;
  }

  function selectKf(i) {
    if (!keyframes[i]) return;
    activeIdx = i; vid.pause(); vid.currentTime = keyframes[i].t;
    drawOverlayNow(); renderKfList(); renderMarks(); syncUI();
  }

  function removeKf(i) {
    if (!keyframes[i]) return;
    keyframes.splice(i, 1); activeIdx = -1;
    syncActive(); drawOverlayNow(); renderMarks(); syncCount(); setMsg('kfRemoved');
  }

  function renderKfList() {
    kflist.innerHTML = '';
    if (!keyframes.length) {
      const s = document.createElement('span'); s.className = 'kf-empty'; s.textContent = tr('kfNone'); kflist.appendChild(s); return;
    }
    keyframes.forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kf'; b.setAttribute('role', 'listitem');
      if (i === activeIdx) b.setAttribute('aria-current', 'true');
      const label = tr('kfAt', { t: fmtTime(k.t, true) });
      b.title = label; b.setAttribute('aria-label', label);
      const sp = document.createElement('span'); sp.textContent = fmtTime(k.t, true); b.appendChild(sp);
      const x = document.createElement('span'); x.className = 'kx'; x.setAttribute('aria-hidden', 'true');
      x.innerHTML = '<svg class="ic"><use href="#i-x"/></svg>'; b.appendChild(x);
      b.addEventListener('click', e => { if (e.target.closest('.kx')) removeKf(i); else selectKf(i); });
      kflist.appendChild(b);
    });
  }

  function renderMarks() {
    marks.innerHTML = '';
    const d = vid.duration || 0;
    if (!d) return;
    keyframes.forEach((k, i) => {
      const m = document.createElement('span');
      m.className = 'mark' + (i === activeIdx ? ' active' : '');
      m.style.left = (clamp(k.t / d, 0, 1) * 100) + '%';
      marks.appendChild(m);
    });
  }

  function syncCount() {
    const n = keyframes.length;
    countEl.textContent = n ? tr(n === 1 ? 'countOne' : 'countMany', { n }) : tr('countZero');
  }

  /* ---------- timeline ---------- */
  function syncTimeline() {
    const d = vid.duration || 0, t = vid.currentTime || 0;
    seek.max = d || 0; seek.value = t;
    timeEl.textContent = fmtTime(t) + ' / ' + fmtTime(d);
    renderMarks();
  }
  function setPlayIcon() {
    const playing = !vid.paused && !vid.ended;
    playIc.setAttribute('href', playing ? '#i-pause' : '#i-play');
    playBtn.setAttribute('aria-label', tr(playing ? 'pause' : 'play'));
  }
  function loop() {
    if (vid.paused || vid.ended) { rafId = 0; return; }
    const now = performance.now();
    if (now - lastOv > 90) { lastOv = now; drawOverlayNow(); }
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }

  /* ---------- ferramentas ---------- */
  function hidePops() {
    [penpop, erapop].forEach(p => { if (p) p.hidden = true; });
    [pencil, eraser].forEach(b => { if (b) b.setAttribute('aria-expanded', 'false'); });
  }
  function openPop(t) {
    hidePops();
    const p = t === 'pen' ? penpop : erapop, b = t === 'pen' ? pencil : eraser;
    p.style.setProperty('--dx', '0px'); p.hidden = false;
    const r = p.getBoundingClientRect(), m = 10; let dx = 0;
    if (r.left < m) dx = m - r.left; else if (r.right > innerWidth - m) dx = innerWidth - m - r.right;
    p.style.setProperty('--dx', dx + 'px'); b.setAttribute('aria-expanded', 'true');
  }
  function setTool(t) {
    tool = t; hidePops();
    pencil.setAttribute('aria-pressed', String(t === 'pen'));
    eraser.setAttribute('aria-pressed', String(t === 'eraser'));
    wrap.classList.toggle('pen', !!t);
    if (t) openPop(t); else pcur.hidden = true;
    if (t) setMsg(t === 'pen' ? 'penHint' : 'eraserHint');
    else if (curMsg && (curMsg.k === 'penHint' || curMsg.k === 'eraserHint')) setMsg(null);
  }
  const toggleTool = t => setTool(tool === t ? null : t);

  function toCanvas(e) {
    const r = ov.getBoundingClientRect();
    return { x: (e.clientX - r.left) * PW / r.width, y: (e.clientY - r.top) * PH / r.height };
  }
  const brushValue = () => +(tool === 'eraser' ? era : pen).value || 20;
  function strokeWidth() { const r = ov.getBoundingClientRect(); return Math.max(1, brushValue() * (r.width ? PW / r.width : 1)); }

  function liveSegment(a, b) {
    const c = ov.getContext('2d'), er = strokeMode === 'eraser';
    c.save();
    c.globalCompositeOperation = er ? 'destination-out' : 'source-over';
    c.strokeStyle = 'rgba(255,77,141,.78)'; c.fillStyle = 'rgba(255,77,141,.78)';
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = brushPx;
    c.beginPath();
    if (a.x === b.x && a.y === b.y) { c.arc(a.x, a.y, brushPx / 2, 0, Math.PI * 2); c.fill(); }
    else { c.moveTo(a.x, a.y); c.lineTo(b.x + .01, b.y); c.stroke(); }
    c.restore();
  }

  function commitStroke() {
    const k = keyframes[activeIdx];
    if (!k) return;
    paintCtx.clearRect(0, 0, PW, PH);
    paintCtx.strokeStyle = '#fff'; paintCtx.fillStyle = '#fff';
    paintCtx.lineCap = 'round'; paintCtx.lineJoin = 'round'; paintCtx.lineWidth = brushPx;
    paintCtx.beginPath();
    if (points.length === 1) { paintCtx.arc(points[0].x, points[0].y, brushPx / 2, 0, Math.PI * 2); paintCtx.fill(); }
    else {
      paintCtx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) paintCtx.lineTo(points[i].x, points[i].y);
      paintCtx.stroke();
    }
    const d = paintCtx.getImageData(0, 0, PW, PH).data, er = strokeMode === 'eraser';
    for (let i = 0, j = 3; i < k.mask.length; i++, j += 4) { if (d[j] > 24) k.mask[i] = er ? 0 : 255; }
    k.stats = null;
    drawOverlayNow(); renderKfList(); syncCount(); syncUI();
  }

  function moveCursor(e) {
    if (!tool) { pcur.hidden = true; return; }
    const r = wrap.getBoundingClientRect(), d = brushValue();
    pcur.hidden = e.pointerType === 'touch';
    pcur.classList.toggle('era', tool === 'eraser');
    pcur.style.width = pcur.style.height = d + 'px';
    pcur.style.left = (e.clientX - r.left) + 'px'; pcur.style.top = (e.clientY - r.top) + 'px';
  }

  /* ---------- sincronização da UI ---------- */
  function syncUI() {
    const hasVideo = !!videoFile;
    const hasPaint = keyframes.some(k => { if (!k.stats) k.stats = maskStats(k.mask); return !!(k.stats && k.stats.n); });
    renderBtn.disabled = !hasVideo || !hasPaint || rendering;
    saveBtn.disabled = !lastBlob || rendering;
    resetBtn.disabled = rendering;
    pencil.disabled = !hasVideo || rendering; eraser.disabled = !hasVideo || rendering;
    addkf.disabled = !hasVideo || rendering;
    delkf.disabled = !hasVideo || rendering || activeIdx < 0;
    playBtn.disabled = !hasVideo || rendering; prevf.disabled = !hasVideo || rendering; nextf.disabled = !hasVideo || rendering;
    seek.disabled = !hasVideo || rendering;
    if (!rendering) cancelBtn.disabled = false;
  }

  /* ============================================================
     RENDER
     ============================================================ */
  async function decodeAudio(f) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    let ac = null;
    try {
      try { ac = new AC({ sampleRate: 48000 }); } catch (e) { ac = new AC(); }
      const ab = await f.arrayBuffer();
      const buf = await ac.decodeAudioData(ab);
      const nch = Math.min(2, buf.numberOfChannels);
      if (!nch) return null;
      const channels = [];
      for (let i = 0; i < nch; i++) channels.push(new Float32Array(buf.getChannelData(i)));
      return { sampleRate: buf.sampleRate, channels };
    } catch (e) { return null; }
    finally { if (ac) { try { ac.close(); } catch (e) {} } }
  }

  /* ---------- FFmpeg.wasm (metadados) — ciclo em State.ffmpeg ---------- */
  let ffScriptP = null;
  function loadFFmpegScript() {
    if (ffScriptP) return ffScriptP;
    ffScriptP = Core.loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js').catch(e => { ffScriptP = null; throw e; });
    return ffScriptP;
  }
  async function createFFmpeg() {
    State.ffmpeg.status = 'loading';
    try {
      await loadFFmpegScript();
      const F = window['FFmpeg'];
      if (!F || !F['createFFmpeg']) throw new Error('ffmpeg');
      const ff = F['createFFmpeg']({ log: false, mainName: 'main', corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js' });
      await ff['load']();
      State.ffmpeg.status = 'ready';
      return ff;
    } catch (e) { State.ffmpeg.status = 'error'; throw e; }
  }
  async function stripMetadata(buffer) {
    const ff = await createFFmpeg();
    try {
      State.ffmpeg.status = 'running';
      ff['FS']('writeFile', 'aetix_in.mp4', new Uint8Array(buffer));
      await ff['run']('-i', 'aetix_in.mp4', '-map', '0', '-c', 'copy', '-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', 'aetix_out.mp4');
      const data = ff['FS']('readFile', 'aetix_out.mp4');
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } catch (e) { State.ffmpeg.status = 'error'; throw e; }
    finally {
      try { ff['exit'](); } catch (e) {}
      if (State.ffmpeg.status !== 'error') State.ffmpeg.status = 'idle';
    }
  }

  function phase(p, key) { prog.value = p; setMsg(key); }

  async function startRender() {
    if (rendering || !videoFile) return;
    const painted = keyframes.filter(k => { if (!k.stats) k.stats = maskStats(k.mask); return !!(k.stats && k.stats.n); });
    if (!painted.length) { setMsg('needMask', true); return; }

    cancelled = false; rendering = true; State.busy.video = true; syncUI();
    scanbar.hidden = false; prog.value = 0; cancelBtn.disabled = false;
    setMsg('renderPreparing');
    vid.pause();
    let metaOK = true;

    try {
      phase(0.03, 'phaseDemux');
      const wk = await ensureWorker();
      if (!wk) throw new Error('boot');

      phase(0.05, 'phaseAudio');
      const audio = await decodeAudio(videoFile);
      if (cancelled) return;

      const buf = await videoFile.arrayBuffer();
      if (cancelled) return;

      const transfer = [buf];
      const masks = keyframes.map(k => { const c = new Uint8Array(k.mask); transfer.push(c.buffer); return { t: k.t, mask: c.buffer }; });
      if (audio) audio.channels.forEach(c => transfer.push(c.buffer));

      const id = ++jobSeq;
      prog.value = 0.12;
      const res = await runRender({
        cmd: 'render', id, file: buf, W: PW, H: PH,
        radius: +rad.value, dil: +dil.value,
        algo: algo.value, noise: !!noise.checked, bitrate: +quality.value,
        audio, keyframes: masks
      }, transfer);
      if (cancelled) return;

      let out = res.buffer;
      if (meta.checked) {
        prog.value = 0.94; setMsg('phaseStrip'); cancelBtn.disabled = true;
        try { out = await stripMetadata(out); }
        catch (e) { console.warn('metadata strip', e); metaOK = false; }
        cancelBtn.disabled = false;
      }

      lastBlob = new Blob([out], { type: 'video/mp4' });
      lastHasAudio = !!res.hasAudio;
      setMsg(metaOK ? 'renderDone' : 'renderDoneMeta');
      showResult(lastBlob);
    } catch (e) {
      if (cancelled) return;
      console.warn(e);
      const code = e && e.message;
      if (code === 'boot') setMsg('engineFail', true);
      else if (code === 'encode') setMsg('encodeFail', true);
      else if (code === 'format' || code === 'decode' || code === 'samples') setMsg('formatFail', true);
      else setMsg('renderFail', true);
    } finally {
      if (!cancelled) {
        rendering = false; State.busy.video = false;
        scanbar.hidden = true; prog.value = 0; cancelBtn.disabled = false;
        syncUI();
      }
    }
  }

  function cancelRender() {
    if (!rendering || cancelBtn.disabled) return;
    cancelled = true;
    if (pendingJob) { const p = pendingJob; pendingJob = null; try { p.reject(new Error('cancel')); } catch (e) {} }
    terminateWorker();
    rendering = false; State.busy.video = false;
    scanbar.hidden = true; prog.value = 0; cancelBtn.disabled = false;
    syncUI(); setMsg('renderCancelled');
  }

  /* ---------- resultado ---------- */
  function showResult(blob) {
    if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
    resultUrl = URL.createObjectURL(blob);
    resvid.src = resultUrl;
    resultSub.textContent = tr(lastHasAudio ? 'resultHint' : 'resultNoAudio');
    vid.pause();
    Core.openModal('vd-result', 'vd-resultX');
  }
  Core.modalHooks['vd-result'] = function () {
    try { resvid.pause(); } catch (e) {}
    resvid.removeAttribute('src');
    try { resvid.load(); } catch (e) {}
    if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }
  };

  function saveMp4() {
    if (!lastBlob) return;
    const u = URL.createObjectURL(lastBlob), a = document.createElement('a');
    a.href = u; a.download = 'Aetix Design.mp4';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(u); } catch (e) {} }, 5000);
    setMsg('saveDone');
    Core.payment.promptAfterDownload();
  }

  /* ---------- eventos ---------- */
  function init() {
    fileInput.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) loadVideo(f); });
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });

    pencil.addEventListener('click', () => toggleTool('pen'));
    eraser.addEventListener('click', () => toggleTool('eraser'));
    document.addEventListener('pointerdown', e => { if (!e.target.closest('.tool')) hidePops(); });
    pen.addEventListener('input', () => { penv.textContent = pen.value + 'px'; });
    era.addEventListener('input', () => { erav.textContent = era.value + 'px'; });
    ['pointerup', 'change'].forEach(ev => {
      pen.addEventListener(ev, () => { penpop.hidden = true; pencil.setAttribute('aria-expanded', 'false'); });
      era.addEventListener(ev, () => { erapop.hidden = true; eraser.setAttribute('aria-expanded', 'false'); });
    });

    ov.addEventListener('pointerdown', e => {
      if (!tool || !videoFile || rendering) return;
      e.preventDefault();
      vid.pause();
      painting = true; strokeMode = tool; brushPx = strokeWidth();
      const p = toCanvas(e); points = [p];
      ensureActiveKf();
      liveSegment(p, p);
      try { ov.setPointerCapture(e.pointerId); } catch (err) {}
      moveCursor(e);
    });
    ov.addEventListener('pointermove', e => {
      moveCursor(e);
      if (!painting) return;
      const p = toCanvas(e), prev = points[points.length - 1] || p;
      points.push(p); liveSegment(prev, p);
    });
    const endStroke = () => { if (!painting) return; painting = false; commitStroke(); };
    ov.addEventListener('pointerup', endStroke);
    ov.addEventListener('pointercancel', endStroke);
    ov.addEventListener('pointerleave', () => { pcur.hidden = true; });

    playBtn.addEventListener('click', () => {
      if (!videoFile || rendering) return;
      if (vid.paused) vid.play().catch(() => {}); else vid.pause();
    });
    vid.addEventListener('play', () => { activeIdx = -1; setPlayIcon(); startLoop(); });
    vid.addEventListener('pause', () => { setPlayIcon(); syncActive(); drawOverlayNow(); });
    vid.addEventListener('ended', () => { setPlayIcon(); syncActive(); drawOverlayNow(); });
    vid.addEventListener('timeupdate', syncTimeline);
    vid.addEventListener('seeked', () => { syncTimeline(); syncActive(); drawOverlayNow(); });
    vid.addEventListener('loadedmetadata', () => { syncTimeline(); syncActive(); });

    seek.addEventListener('input', () => { if (!videoFile || rendering) return; vid.currentTime = +seek.value; syncTimeline(); });
    const stepFrame = dir => {
      if (!videoFile || rendering) return;
      vid.pause();
      vid.currentTime = clamp((vid.currentTime || 0) + dir * (1 / 30), 0, vid.duration || 0);
    };
    prevf.addEventListener('click', () => stepFrame(-1));
    nextf.addEventListener('click', () => stepFrame(1));

    addkf.addEventListener('click', addKeyframe);
    delkf.addEventListener('click', () => { if (activeIdx >= 0) removeKf(activeIdx); });
    resetBtn.addEventListener('click', resetVideo);
    renderBtn.addEventListener('click', startRender);
    saveBtn.addEventListener('click', saveMp4);
    resultSave.addEventListener('click', saveMp4);
    cancelBtn.addEventListener('click', cancelRender);

    rad.addEventListener('input', () => { radv.textContent = rad.value; });
    dil.addEventListener('input', () => { dilv.textContent = dil.value; });

    penv.textContent = pen.value + 'px'; erav.textContent = era.value + 'px';
    radv.textContent = rad.value; dilv.textContent = dil.value;
    syncUI();
  }
  init();

  /* ---------- API do módulo ---------- */
  return {
    activate() {
      if (!checkSupport()) return;
      if (State.videoEngine.status === 'idle') {
        setEngine('load');
        Core.splashDone.then(() => new Promise(r => setTimeout(r, 80))).then(() => ensureWorker().catch(() => {}));
      } else Core.refreshEngine();
    },
    deactivate() { vid.pause(); hidePops(); },
    loadFile: loadVideo,
    /* pipeline OpenCV (NS + sub-bloco); usa o cv da thread principal quando disponível */
    processFrameOpenCV: function (frameCanvas, bbox, maskCanvas, opts) {
      if (!window['cv'] || !window['cv']['inpaint']) throw new Error('OpenCV indisponível');
      return processFrameOpenCVImpl(window['cv'], frameCanvas, bbox, maskCanvas, opts);
    },
    setDragOver: b => drop.classList.toggle('over', b),
    onEscape() { if (tool) setTool(null); },
    onLang() {
      renderMsg(); syncCount(); renderKfList(); renderMarks(); setPlayIcon();
      resultSub.textContent = tr(lastHasAudio ? 'resultHint' : 'resultNoAudio');
    }
  };
})();

/* ==========================================================================
   PAYMENT · checkout Pix (BravoPay) + rastreamento UTMify
   - Lê os UTMs da URL e guarda em localStorage no 1º acesso
   - POST /api/v1/transactions (method "pix", amount_cents fixo em 549)
   - Mostra QR Code + copia-e-cola
   - Polling GET /api/v1/transactions/{id} a cada 3 s até PAID
   ========================================================================== */
Core.payment = (function () {

  /* ---------- CONFIGURAÇÃO (ajuste só aqui) ---------- */
  const CFG = {
    // URL base da API. Se criar um proxy/backend seu, troque aqui (a chave sai do navegador).
    baseUrl: 'https://bravopay.club/api/v1',
    // Chave de API. ATENÇÃO: ela fica visível no navegador de qualquer visitante.
    apiKey: 'bp_live_HiVjl6x4GXE7SBlRmXbQS0S4VRlrf9X5pn_Oew',

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // >>> COLE AQUI O ID REAL DO PRODUTO (https://bravopay.club/dashboard/produtos)
    // >>> Necessário para a UTMify atribuir a venda corretamente. Vazio = não envia.
    productId: '',
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    minAmountCents: 500,       // R$ 5,00 — piso absoluto do valor digitado pelo usuário
    defaultAmount: '5,00',     // valor inicial exibido no campo
    pollMs: 3000,              // intervalo do polling
    timeoutMs: 20000,          // timeout de cada requisição
    redirectUrl: '',           // ex.: '/obrigado'. Vazio = mostra a tela de sucesso no modal
    redirectDelayMs: 1800,
    qrLibUrl: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
  };

  const UTM_LS_KEY = 'aetix-utm';
  // parâmetro da URL -> campo do objeto "utm" da BravoPay
  const UTM_MAP = {
    utm_source: 'source', utm_medium: 'medium', utm_campaign: 'campaign',
    utm_content: 'content', utm_term: 'term',
    fbclid: 'fbclid', ttclid: 'ttclid', gclid: 'gclid'
  };
  const FINAL_BAD = { EXPIRED: 'O Pix expirou. Gere um novo.', FAILED: 'O pagamento falhou. Tente novamente.',
                      CANCELED: 'O pagamento foi cancelado.', REFUNDED: 'O pagamento foi reembolsado.' };

  let pollTimer = null, pollGen = 0, busy = false, qrPromise = null;

  /* ---------- rastreamento: guarda UTMs no 1º acesso ---------- */
  function readUrlUtm() {
    const out = {};
    try {
      const p = new URLSearchParams(location.search);
      Object.keys(UTM_MAP).forEach(k => { const v = p.get(k); if (v) out[UTM_MAP[k]] = v; });
    } catch (e) {}
    return out;
  }
  function loadUtm() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(UTM_LS_KEY) || '{}') || {}; } catch (e) {}
    return saved;
  }
  /** Chamado ao iniciar a página: só grava se ainda não houver UTMs guardados (1º acesso). */
  function captureUtm() {
    const saved = loadUtm();
    if (Object.keys(saved).length) return saved;
    const cur = readUrlUtm();
    if (Object.keys(cur).length) { try { localStorage.setItem(UTM_LS_KEY, JSON.stringify(cur)); } catch (e) {} }
    return cur;
  }

  /* ---------- máscaras e validação ---------- */
  const digits = s => String(s || '').replace(/\D+/g, '');

  /** Converte o texto digitado pelo usuário (ex.: "5,00", "10.50", "12,5") em centavos (inteiro).
   *  Aceita vírgula ou ponto como separador decimal. Retorna NaN se não der para interpretar. */
  function parseAmountToCents(raw) {
    let s = String(raw == null ? '' : raw).trim().replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    const hasComma = s.indexOf(',') !== -1, hasDot = s.indexOf('.') !== -1;
    if (hasComma && hasDot) {
      // ambos presentes: o último símbolo é o separador decimal, o outro é milhar e é descartado
      s = s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
    } else if (hasComma) {
      s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    if (!isFinite(n) || n < 0) return NaN;
    return Math.round(n * 100);
  }

  /** Formata um valor em centavos de volta para o texto "X,XX" exibido no campo. */
  function formatCentsToAmount(cents) {
    const n = Math.max(0, Math.round(cents)) / 100;
    return n.toFixed(2).replace('.', ',');
  }

  function maskPhone(v) {
    const d = digits(v).slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  /* ---------- helpers de UI ---------- */
  const el = id => qs('#' + id);
  function showStep(name) {
    ['payFormView', 'payPixView', 'payOkView'].forEach(id => { el(id).hidden = (id !== name); });
    /* o CSS usa data-step para esconder a lata/texto e evitar rolagem nas etapas 2 e 3 */
    qs('.pay-card').dataset.step = name === 'payFormView' ? 'form' : name === 'payPixView' ? 'pix' : 'ok';
  }
  function setErr(msg, fieldId) {
    el('payErr').textContent = msg || '';
    qsa('.pay-f').forEach(f => f.classList.remove('bad'));
    qsa('.pay-amount-wrap').forEach(f => f.classList.remove('bad'));
    if (fieldId) {
      const i = el(fieldId);
      const wrap = i.closest('.pay-f') || i.closest('.pay-amount-wrap');
      if (wrap) wrap.classList.add('bad');
      i.focus();
    }
  }
  function setBusy(b) {
    busy = b;
    el('payBtn').disabled = b;
    el('payBtnTxt').textContent = b ? 'Gerando Pix…' : 'Gerar PIX de Colaboração';
  }
  function setStatus(txt) {
    const s = el('payStatus');
    s.lastElementChild.textContent = txt;
    s.hidden = !txt;
  }

  /* ---------- QR Code (biblioteca leve carregada sob demanda) ---------- */
  function loadQrLib() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (qrPromise) return qrPromise;
    qrPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = CFG.qrLibUrl; s.async = true;
      s.onload = () => window.qrcode ? res(window.qrcode) : rej(new Error('qr'));
      s.onerror = () => { qrPromise = null; rej(new Error('qr')); };
      document.head.appendChild(s);
    });
    return qrPromise;
  }
  async function drawQr(text) {
    const box = el('payQr');
    box.textContent = 'Gerando QR…';
    try {
      const qrcode = await loadQrLib();
      const q = qrcode(0, 'M');               // tipo automático, correção média
      q.addData(text); q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); // SVG gerado pela lib (texto do Pix não é HTML)
    } catch (e) {
      box.textContent = 'QR indisponível. Use o código abaixo.';
    }
  }

  /* ---------- chamadas à API ---------- */
  async function api(path, opts) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), CFG.timeoutMs);
    try {
      const r = await fetch(CFG.baseUrl + path, Object.assign({
        signal: ctl.signal,
        headers: Object.assign({ 'Authorization': 'Bearer ' + CFG.apiKey }, (opts && opts.headers) || {})
      }, opts && { method: opts.method, body: opts.body }));
      let data = null;
      try { data = await r.json(); } catch (e) {}
      if (!r.ok) {
        const m = data && (data.message || data.error && (data.error.message || data.error)) || ('Erro ' + r.status);
        throw new Error(typeof m === 'string' ? m : 'Erro ' + r.status);
      }
      return data || {};
    } finally { clearTimeout(t); }
  }

  /** Monta o corpo do POST conforme a documentação da BravoPay.
   *  amountCents vem do valor digitado pelo usuário, já validado e convertido (ver submit()). */
  function buildBody(c, amountCents) {
    const body = {
      amount_cents: amountCents,
      method: 'pix',
      customer: { name: c.name, email: c.email, phone: c.phone },
      external_reference: 'aetix-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
    };
    if (CFG.productId) body.product_id = CFG.productId;   // ID real do produto (UTMify)
    const utm = Object.assign({}, loadUtm());              // UTMs guardados no 1º acesso
    const now = readUrlUtm();
    Object.keys(now).forEach(k => { if (!utm[k]) utm[k] = now[k]; });
    body.utm = utm;                                        // SEMPRE enviado
    return body;
  }

  /* ---------- polling ---------- */
  function stopPolling() { pollGen++; clearTimeout(pollTimer); pollTimer = null; }
  function startPolling(id) {
    stopPolling();
    const gen = pollGen;
    let fails = 0;
    const tick = async () => {
      if (gen !== pollGen) return;
      try {
        const tx = await api('/transactions/' + encodeURIComponent(id));
        if (gen !== pollGen) return;
        fails = 0;
        const st = String(tx.status || '').toUpperCase();
        if (st === 'PAID') { stopPolling(); onPaid(); return; }
        if (FINAL_BAD[st]) { stopPolling(); setStatus(FINAL_BAD[st]); el('payStatus').firstElementChild.style.display = 'none'; return; }
      } catch (e) { if (++fails >= 10) { setStatus('Sem conexão com o servidor. Reabra o modal para tentar de novo.'); return; } }
      pollTimer = setTimeout(tick, CFG.pollMs);
    };
    pollTimer = setTimeout(tick, CFG.pollMs);
  }
  let paid = false, paidTimer = null, thanksTimer = null, lastThanks = -1;

  /* 5 mensagens de agradecimento: uma é sorteada a cada doação confirmada */
  const THANKS = [
    'Você acabou de fazer a diferença. Sua colaboração mantém o AETIX DESIGN no ar, rápido e livre de anúncios. Gratidão de coração! 💜',
    'Gente como você transforma projetos em realidade. Obrigado por acreditar no nosso trabalho e nos ajudar a continuar evoluindo! ✨',
    'Cada gesto de generosidade vira combustível para novas ideias. Muito obrigado por fazer parte dessa jornada com a gente! 🚀',
    'Sua força chegou até nós e vai render muito mais ferramentas incríveis. Valeu demais pela confiança! 🌟',
    'Bondade como a sua inspira a gente a ir mais longe todos os dias. Que o bem que você faz volte em dobro para você! 🥤💫'
  ];
  function pickThanks() {
    let i = Math.floor(Math.random() * THANKS.length);
    if (THANKS.length > 1 && i === lastThanks) i = (i + 1 + Math.floor(Math.random() * (THANKS.length - 1))) % THANKS.length;
    lastThanks = i;
    return THANKS[i];
  }

  function showThanks(msg) {
    const old = qs('#aetixThanks');
    if (old) old.remove();
    clearTimeout(thanksTimer);
    const t = document.createElement('div');
    t.id = 'aetixThanks'; t.className = 'aetix-thanks';
    t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
    const ic = document.createElement('div'); ic.className = 'at-ic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = '💜';
    const tx = document.createElement('div'); tx.className = 'at-tx';
    const h = document.createElement('strong'); h.textContent = 'Obrigado!';
    const p = document.createElement('p'); p.textContent = msg;
    tx.appendChild(h); tx.appendChild(p);
    const x = document.createElement('button'); x.type = 'button'; x.className = 'at-x'; x.setAttribute('aria-label', 'Fechar'); x.textContent = '×';
    t.appendChild(ic); t.appendChild(tx); t.appendChild(x);
    const hide = () => {
      clearTimeout(thanksTimer);
      t.classList.add('out');
      setTimeout(() => { if (t.parentNode) t.remove(); }, 600);
    };
    x.addEventListener('click', hide);
    t.addEventListener('click', hide);
    document.body.appendChild(t);
    thanksTimer = setTimeout(hide, 7500);
  }

  function onPaid() {
    paid = true;
    stopPolling();
    /* troca o QR Code por um check verde + "pagamento confirmado" */
    const view = el('payPixView'), qr = el('payQr');
    view.classList.add('aetix-paid');
    qr.innerHTML = '<svg class="pay-check" viewBox="0 0 120 120" aria-hidden="true"><circle class="pc-ring" cx="60" cy="60" r="52" fill="none" stroke="#4ADE9A" stroke-width="6"/><path class="pc-tick" d="M36 62l16 16 32-36" fill="none" stroke="#4ADE9A" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let pt = el('payPaidTxt');
    if (!pt) {
      pt = document.createElement('p');
      pt.id = 'payPaidTxt'; pt.className = 'pay-paid-txt'; pt.setAttribute('role', 'status');
      qr.insertAdjacentElement('afterend', pt);
    }
    pt.textContent = 'pagamento confirmado';
    setStatus('');
    const msg = pickThanks();
    clearTimeout(paidTimer);
    paidTimer = setTimeout(() => {
      const m = qs('#pricingModal');
      if (State.modal === 'pricingModal' && m) {
        m.classList.add('fadeout');
        setTimeout(() => {
          if (State.modal === 'pricingModal') Core.closeModal();
          m.classList.remove('fadeout');
          setTimeout(() => showThanks(msg), 250);
        }, 520);
      } else showThanks(msg);
      if (CFG.redirectUrl) setTimeout(() => { location.href = CFG.redirectUrl; }, CFG.redirectDelayMs);
    }, 2200);
  }

  /* ---------- fluxo principal ---------- */
  /* aplica as máscaras (necessário quando o Chrome preenche sem disparar "input") */
  function applyMasks() {
    const ph = el('payPhone');
    ph.value = maskPhone(ph.value);
  }

  async function submit() {
    if (busy) return;
    applyMasks();
    const c = {
      name: el('payName').value.trim(), email: el('payEmail').value.trim(),
      phone: digits(el('payPhone').value)
    };
    const amountCents = parseAmountToCents(el('payAmount').value);
    if (c.name.split(/\s+/).filter(Boolean).length < 2) return setErr('Informe seu nome completo.', 'payName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return setErr('Informe um e-mail válido.', 'payEmail');
    if (c.phone.length < 10 || c.phone.length > 11) return setErr('Informe o telefone com DDD.', 'payPhone');
    if (!isFinite(amountCents) || amountCents < CFG.minAmountCents) {
      return setErr('Informe um valor de R$ 5,00 ou mais.', 'payAmount');
    }
    setErr('');
    el('payAmount').value = formatCentsToAmount(amountCents);  // normaliza o que fica visível no campo
    c.phone = '55' + c.phone;                              // formato 5511999999999
    setBusy(true);
    try {
      const tx = await api('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(c, amountCents))
      });
      const code = tx.pix && tx.pix.copy_paste;
      if (!tx.id || !code) throw new Error('Resposta inesperada da BravoPay.');
      el('payCode').value = code;
      el('payStatus').firstElementChild.style.display = '';
      setStatus('');                       // status só aparece em caso de problema; o agradecimento é fixo no HTML
      showStep('payPixView');
      drawQr(code);
      startPolling(tx.id);
    } catch (e) {
      setErr(e && e.name === 'AbortError' ? 'Tempo esgotado. Tente de novo.' : (e.message || 'Não foi possível gerar o Pix.'));
    } finally { setBusy(false); }
  }

  async function copyCode() {
    const ta = el('payCode'), b = el('payCopy');
    try { await navigator.clipboard.writeText(ta.value); }
    catch (e) { ta.select(); try { document.execCommand('copy'); } catch (e2) {} }
    b.textContent = 'Copiado!';
    setTimeout(() => { b.textContent = 'Copiar código Pix'; }, 1800);
  }

  /** Volta o modal ao estado inicial (ao fechar). */
  function reset() {
    stopPolling(); setBusy(false); setErr('');
    clearTimeout(paidTimer); paidTimer = null;
    showStep('payFormView');
    el('payPixView').classList.remove('aetix-paid');
    const ppt = el('payPaidTxt'); if (ppt) ppt.remove();
    el('payQr').textContent = ''; el('payCode').value = '';
    el('payAmount').value = CFG.defaultAmount;
    setStatus('');
  }

  /** Abre o modal automaticamente após um download concluído (nunca depois de pago). */
  function promptAfterDownload() {
    if (paid) return;
    setTimeout(() => { if (!paid) Core.openModal('pricingModal'); }, 700);
  }

  function init() {
    captureUtm();
    const ph = el('payPhone');
    ph.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });
    /* autofill nem sempre dispara "input": reaplica a máscara em change/blur */
    ['change', 'blur'].forEach(ev => { ph.addEventListener(ev, applyMasks); });

    const amt = el('payAmount');
    /* só deixa dígitos, vírgula e ponto enquanto o usuário digita */
    amt.addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d.,]/g, ''); });
    /* ao sair do campo, normaliza para "X,XX" se der para interpretar; senão volta ao padrão */
    amt.addEventListener('blur', e => {
      const cents = parseAmountToCents(e.target.value);
      e.target.value = isFinite(cents) && cents > 0 ? formatCentsToAmount(cents) : CFG.defaultAmount;
    });

    el('payBtn').addEventListener('click', submit);
    el('payCopy').addEventListener('click', copyCode);
    qsa('.pay-form input, #payAmount').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
    Core.modalHooks.pricingModal = reset;
  }

  return { init, CFG, promptAfterDownload };
})();

/* ==========================================================================
   BOOT
   ========================================================================== */
function boot() {
  Core.initSplash();
  let l = 'pt';
  try { const v = localStorage.getItem(Core.LS_KEY); if (v && I18N[v]) l = v; } catch (e) {}
  Core.setupHeader();
  Core.setupWhatsApp();
  Core.bind();
  Core.payment.init();
  Core.applyLang(l, false);
  Core.switchTab('image', true);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})(window.AetixApp);
