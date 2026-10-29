'use strict';
/* ==========================================================================
   AETIX DESIGN · script.js unificado
   Tudo roda no navegador. Nenhum arquivo é enviado a servidor.

   Namespaces:
     AetixApp.State            estado central (aba ativa, OpenCV, Tesseract, FFmpeg…)
     AetixApp.Core             i18n, abas, modais, splash, roteamento de arquivos
     AetixApp.ImageProcessor   módulo de imagem (Tesseract.js + OpenCV.js)
     AetixApp.VideoProcessor   módulo de vídeo (Web Worker + OpenCV.js + FFmpeg.wasm)
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
  pricing: 'Preços', pricingTitle: 'Preços',
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
  pricing: 'Pricing', pricingTitle: 'Pricing',
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
Core.modules.video = App.VideoProcessor = (function () {
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
     WORKER (demux → decode → inpaint → encode → mux)
     Esta função é convertida em texto e executada num Web Worker:
     NÃO pode referenciar nada do escopo externo.
     ============================================================ */
  function renderWorkerMain() {
    'use strict';
    var cv = null, booted = false, busy = false;
    var CV_URLS = [
      'https://docs.opencv.org/4.x/opencv.js',
      'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js'
    ];
    function post(m, t) { self.postMessage(m, t || []); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function codeErr(code) { var e = new Error(code); e.code = code; return e; }

    function boot() {
      try {
        importScripts(
          'https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js',
          'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.min.js'
        );
      } catch (e) { post({ type: 'bootfail', step: 'libs', err: String((e && e.message) || e) }); return; }
      post({ type: 'boot', step: 'libs' });
      loadCv(0);
    }

    function loadCv(i) {
      if (i >= CV_URLS.length) { post({ type: 'bootfail', step: 'cv', err: 'cv' }); return; }
      post({ type: 'boot', step: 'cv' });
      try { importScripts(CV_URLS[i]); } catch (e) { loadCv(i + 1); return; }
      (async function () {
        try {
          var c = self.cv;
          if (typeof c === 'function') c = await c();
          if (c && typeof c.then === 'function') {
            c = await new Promise(function (res, rej) { c.then(function (m) { try { delete m.then; } catch (e) {} res(m); }, rej); });
          }
          if (!c || !c.Mat) {
            await new Promise(function (res, rej) {
              var n = 0;
              var iv = setInterval(function () {
                if (c && c.Mat) { clearInterval(iv); res(); }
                else if (++n > 1800) { clearInterval(iv); rej(new Error('timeout')); }
              }, 100);
            });
          }
          if (!c || !c.inpaint) throw new Error('inpaint');
          cv = c; booted = true;
          post({ type: 'ready' });
        } catch (e) {
          try { self.cv = undefined; } catch (err) {}
          loadCv(i + 1);
        }
      })();
    }

    /* ---------- máscara ---------- */
    function stats(mask, W, H) {
      var x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;
      for (var y = 0; y < H; y++) {
        var row = y * W;
        for (var x = 0; x < W; x++) {
          if (mask[row + x] > 127) {
            n++; sx += x; sy += y;
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      return n ? { x0: x0, y0: y0, x1: x1, y1: y1, n: n, cx: sx / n, cy: sy / n } : null;
    }

    var scratch = null;

    function maskAt(t, kfs, W, H) {
      if (!kfs.length) return null;
      if (t <= kfs[0].t) return kfs[0].st ? { mask: kfs[0].mask, st: kfs[0].st } : null;
      var last = kfs[kfs.length - 1];
      if (t >= last.t) return last.st ? { mask: last.mask, st: last.st } : null;
      var i = 0;
      while (i < kfs.length - 1 && kfs[i + 1].t <= t) i++;
      var a = kfs[i], b = kfs[i + 1];
      if (!a.st) return b.st ? { mask: b.mask, st: b.st } : null;
      if (!b.st) return a.st ? { mask: a.mask, st: a.st } : null;
      var al = (t - a.t) / (b.t - a.t);
      if (al < 0) al = 0; if (al > 1) al = 1;
      if (!scratch) scratch = new Uint8Array(W * H);
      var out = scratch; out.fill(0);
      var ca = a.st, cb = b.st;
      var cx = ca.cx + (cb.cx - ca.cx) * al, cy = ca.cy + (cb.cy - ca.cy) * al;
      var dax = Math.round(cx - ca.cx), day = Math.round(cy - ca.cy);
      var dbx = Math.round(cx - cb.cx), dby = Math.round(cy - cb.cy);
      var ux0 = Math.min(ca.x0 + dax, cb.x0 + dbx), uy0 = Math.min(ca.y0 + day, cb.y0 + dby);
      var ux1 = Math.max(ca.x1 + dax, cb.x1 + dbx), uy1 = Math.max(ca.y1 + day, cb.y1 + dby);
      if (ux0 < 0) ux0 = 0; if (uy0 < 0) uy0 = 0;
      if (ux1 > W - 1) ux1 = W - 1; if (uy1 > H - 1) uy1 = H - 1;
      var am = a.mask, bm = b.mask;
      for (var y = uy0; y <= uy1; y++) {
        var ay = y - day, by = y - dby, row = y * W;
        for (var x = ux0; x <= ux1; x++) {
          var va = 0, vb = 0;
          var ax = x - dax;
          if (ax >= 0 && ax < W && ay >= 0 && ay < H && am[ay * W + ax] > 127) va = 255;
          var bx = x - dbx;
          if (bx >= 0 && bx < W && by >= 0 && by < H && bm[by * W + bx] > 127) vb = 255;
          if (va + vb >= 255) out[row + x] = 255;
        }
      }
      return { mask: out, st: { x0: ux0, y0: uy0, x1: ux1, y1: uy1, n: 1 } };
    }

    /* ---------- erosão da máscara (afina o traço) ---------- */
    var erodeOK = null, erodeKernel = null, erodeCv = null, erScratch = null;

    function erodeCV(m) {
      if (erodeCv !== cv) { erodeKernel = null; erodeCv = cv; }
      try {
        if (!erodeKernel) erodeKernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
        var dst = new cv.Mat(m.rows, m.cols, cv.CV_8UC1);
        cv.erode(m, dst, erodeKernel, new cv.Point(-1, -1), 1, cv.BORDER_REPLICATE);
        var ok = dst.rows === m.rows && dst.cols === m.cols && dst.data.length === m.data.length;
        var md = m.data, dd = dst.data, srcN = 0, outN = 0, bad = false;
        if (ok) {
          for (var i = 0; i < md.length; i++) {
            if (md[i] > 127) srcN++;
            if (dd[i] > 127) outN++;
            if (dd[i] > 127 && md[i] <= 127) { bad = true; break; }
          }
          ok = !bad && (srcN === 0 || outN > 0);
        }
        if (!ok) { dst.delete(); return null; }
        return dst;
      } catch (e) { return null; }
    }

    function erodeJS(md, w, h) {
      if (!erScratch || erScratch.length !== md.length) erScratch = new Uint8Array(md.length);
      var cp = erScratch; cp.set(md);
      for (var y = 0; y < h; y++) {
        var row = y * w;
        for (var x = 0; x < w; x++) {
          if (cp[row + x] <= 127) continue;
          var keep = 1;
          for (var ny = y - 1; ny <= y + 1 && keep; ny++) {
            var nr = ny < 0 ? row : (ny >= h ? row : ny * w);
            for (var nx = x - 1; nx <= x + 1; nx++) {
              var nv = nx < 0 ? cp[row + x] : (nx >= w ? cp[row + x] : cp[nr + nx]);
              if (nv <= 127) { keep = 0; break; }
            }
          }
          if (!keep) md[row + x] = 0;
        }
      }
    }

    /* ---------- inpaint só no bloco + placa limpa temporal ---------- */
    function inpaintRegion(ctx, mask, bb, W, H, radius, dil, algoFlag, addNoise, plate, stamp) {
      var pad = radius + 3;
      var x0 = Math.max(0, bb.x0 - pad), y0 = Math.max(0, bb.y0 - pad);
      var x1 = Math.min(W, bb.x1 + 1 + pad), y1 = Math.min(H, bb.y1 + 1 + pad);
      var w = x1 - x0, h = y1 - y0;
      if (w < 2 || h < 2) return;
      var img = ctx.getImageData(x0, y0, w, h);
      var id = img.data, n = w * h;

      if (plate) {
        var px0 = Math.max(x0, plate.x0), px1 = Math.min(x1 - 1, plate.x0 + plate.w - 1);
        var py0 = Math.max(y0, plate.y0), py1 = Math.min(y1 - 1, plate.y0 + plate.h - 1);
        for (var gy = py0; gy <= py1; gy++) {
          var mrow = gy * W, irow = (gy - y0) * w;
          var pi = (gy - plate.y0) * plate.w + (px0 - plate.x0);
          var pj = pi * 3;
          for (var gx = px0; gx <= px1; gx++, pi++, pj += 3) {
            if (mask[mrow + gx] > 127) continue;
            var jj = (irow + gx - x0) * 4;
            plate.rgb[pj] = id[jj]; plate.rgb[pj + 1] = id[jj + 1]; plate.rgb[pj + 2] = id[jj + 2];
            plate.stamp[pi] = stamp; plate.seen[pi] = 1;
          }
        }
      }

      var src = new cv.Mat(h, w, cv.CV_8UC3);
      var sd = src.data;
      for (var i = 0, j = 0; i < n; i++, j += 4) {
        var o = i * 3;
        sd[o] = id[j]; sd[o + 1] = id[j + 1]; sd[o + 2] = id[j + 2];
      }
      var m = new cv.Mat(h, w, cv.CV_8UC1);
      var md = m.data;
      var r2 = dil > 0 ? dil * dil : 0;
      for (var yy = 0; yy < h; yy++) {
        var sy = y0 + yy, row = sy * W;
        for (var xx = 0; xx < w; xx++) {
          if (mask[row + x0 + xx] <= 127) continue;
          if (dil <= 0) { md[yy * w + xx] = 255; continue; }
          var ny0 = yy - dil, ny1 = yy + dil, nx0 = xx - dil, nx1 = xx + dil;
          if (ny0 < 0) ny0 = 0; if (nx0 < 0) nx0 = 0;
          if (ny1 > h - 1) ny1 = h - 1; if (nx1 > w - 1) nx1 = w - 1;
          for (var ny = ny0; ny <= ny1; ny++) {
            var dy = ny - yy, dy2 = dy * dy, nrow = ny * w;
            for (var nx = nx0; nx <= nx1; nx++) {
              var dx = nx - xx;
              if (dx * dx + dy2 <= r2) md[nrow + nx] = 255;
            }
          }
        }
      }

      if (plate) {
        var maxAge = plate.maxAge;
        for (var vy = 0; vy < h; vy++) {
          var vgy = y0 + vy;
          if (vgy < plate.y0 || vgy >= plate.y0 + plate.h) continue;
          var prow = (vgy - plate.y0) * plate.w, vrow = vy * w, cbase = vy * w * 4;
          for (var vx = 0; vx < w; vx++) {
            if (md[vrow + vx] <= 127) continue;
            var vgx = x0 + vx;
            if (vgx < plate.x0 || vgx >= plate.x0 + plate.w) continue;
            var pi2 = prow + (vgx - plate.x0);
            if (!plate.seen[pi2]) continue;
            if (stamp - plate.stamp[pi2] > maxAge) continue;
            var pj2 = pi2 * 3, cj = (cbase + vx) * 4;
            id[cj] = plate.rgb[pj2]; id[cj + 1] = plate.rgb[pj2 + 1]; id[cj + 2] = plate.rgb[pj2 + 2];
            md[vrow + vx] = 0;
          }
        }
      }

      var m2 = m, er = null;
      if (erodeOK !== false) {
        er = erodeCV(m);
        if (er) erodeOK = true; else erodeOK = false;
      }
      if (er) m2 = er; else erodeJS(md, w, h);

      var dst = new cv.Mat();
      cv.inpaint(src, m2, dst, radius, algoFlag ? cv.INPAINT_NS : cv.INPAINT_TELEA);
      var od = dst.data, md2 = m2.data;
      for (var i2 = 0; i2 < n; i2++) {
        if (md2[i2] <= 127) continue;
        var j2 = i2 * 4, o2 = i2 * 3;
        var r = od[o2], g = od[o2 + 1], b = od[o2 + 2];
        if (addNoise) {
          r = r + ((Math.random() * 3) | 0) - 1;
          g = g + ((Math.random() * 3) | 0) - 1;
          b = b + ((Math.random() * 3) | 0) - 1;
          if (r < 0) r = 0; else if (r > 255) r = 255;
          if (g < 0) g = 0; else if (g > 255) g = 255;
          if (b < 0) b = 0; else if (b > 255) b = 255;
        }
        id[j2] = r; id[j2 + 1] = g; id[j2 + 2] = b;
      }
      ctx.putImageData(img, x0, y0);
      src.delete(); m.delete(); dst.delete();
      if (er) er.delete();
    }

    /* ---------- áudio ---------- */
    async function encodeAudio(a, id) {
      if (!a || !a.channels || !a.channels.length) return null;
      var sr = a.sampleRate, nch = Math.min(2, a.channels.length), total = a.channels[0].length;
      var cfg = { codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: nch, bitrate: 192000 };
      var sup = null;
      try { sup = await AudioEncoder.isConfigSupported(cfg); } catch (e) { return null; }
      if (!sup || !sup.supported) return null;
      var chunks = [], err = null;
      var enc = new AudioEncoder({
        output: function (c, m) { chunks.push({ chunk: c, meta: m }); },
        error: function (e) { err = e; }
      });
      enc.configure(cfg);
      var block = 1024;
      for (var off = 0; off < total; off += block) {
        if (err) break;
        var n = Math.min(block, total - off);
        var data = new Float32Array(n * nch);
        for (var c = 0; c < nch; c++) data.set(a.channels[c].subarray(off, off + n), c * n);
        var ad = new AudioData({
          format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: nch,
          timestamp: Math.round(off / sr * 1e6), data: data
        });
        enc.encode(ad); ad.close();
        if (enc.encodeQueueSize > 24) await sleep(2);
        if (off % (block * 200) === 0) post({ type: 'progress', id: id, phase: 'audio', p: off / total });
      }
      await enc.flush();
      if (err) throw err;
      return { chunks: chunks, sampleRate: sr, channels: nch };
    }

    /* ---------- render ---------- */
    async function doRender(job) {
      var id = job.id, W = job.W, H = job.H;
      var kfs = job.keyframes.map(function (k) { return { t: k.t, mask: new Uint8Array(k.mask) }; });
      kfs.sort(function (a, b) { return a.t - b.t; });
      kfs.forEach(function (k) { k.st = stats(k.mask, W, H); });

      post({ type: 'progress', id: id, phase: 'demux', p: 0 });

      var buf = job.file;
      try { buf.fileStart = 0; } catch (e) {}
      var mp4 = MP4Box.createFile();
      var info = null;
      mp4.onReady = function (i) { info = i; };
      mp4.onError = function () {};
      try { mp4.appendBuffer(buf); mp4.flush(); }
      catch (e) { throw codeErr('format'); }
      if (!info || !info.videoTracks || !info.videoTracks.length) throw codeErr('format');
      var vt = info.videoTracks[0];
      var trak = mp4.getTrackById(vt.id);
      var entry = trak.mdia.minf.stbl.stsd.entries[0];
      var box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (!box) throw codeErr('format');
      var ds = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
      box.write(ds);
      var desc = new Uint8Array(ds.buffer, 8);

      var decCfg = { codec: vt.codec, description: desc, codedWidth: vt.video.width, codedHeight: vt.video.height };
      var dsup = null;
      try { dsup = await VideoDecoder.isConfigSupported(decCfg); } catch (e) { dsup = null; }
      if (!dsup || !dsup.supported) throw codeErr('decode');

      var samples = [];
      mp4.onSamples = function (tid, u, ss) { for (var i = 0; i < ss.length; i++) samples.push(ss[i]); };
      mp4.setExtractionOptions(vt.id, null, { nbSamples: Math.max(1, Math.min(vt.nb_samples || 100000, 100000)) });
      mp4.start();
      var want = vt.nb_samples || 0, dl = Date.now() + 30000;
      while (Date.now() < dl && (want ? samples.length < want : samples.length === 0)) await sleep(10);
      if (!samples.length) throw codeErr('format');

      var t0 = Infinity;
      for (var si = 0; si < samples.length; si++) {
        var cts = samples[si].cts * 1e6 / vt.timescale;
        if (cts < t0) t0 = cts;
      }
      if (!isFinite(t0)) t0 = 0;

      var durSec = vt.duration / vt.timescale;
      var fps = vt.nb_samples && durSec > 0 ? vt.nb_samples / durSec : 30;
      if (!isFinite(fps) || fps < 1 || fps > 240) fps = 30;

      /* placa limpa temporal: área união de todos os keyframes */
      var plate = null;
      var ub = null;
      for (var ki = 0; ki < kfs.length; ki++) {
        var sk = kfs[ki].st;
        if (!sk) continue;
        if (!ub) { ub = { x0: sk.x0, y0: sk.y0, x1: sk.x1, y1: sk.y1 }; }
        else {
          if (sk.x0 < ub.x0) ub.x0 = sk.x0; if (sk.y0 < ub.y0) ub.y0 = sk.y0;
          if (sk.x1 > ub.x1) ub.x1 = sk.x1; if (sk.y1 > ub.y1) ub.y1 = sk.y1;
        }
      }
      if (ub && ub.x1 >= ub.x0 && ub.y1 >= ub.y0) {
        var pw = ub.x1 - ub.x0 + 1, ph = ub.y1 - ub.y0 + 1;
        plate = {
          x0: ub.x0, y0: ub.y0, w: pw, h: ph,
          rgb: new Uint8Array(pw * ph * 3),
          stamp: new Uint32Array(pw * ph),
          seen: new Uint8Array(pw * ph),
          maxAge: Math.max(4, Math.round(fps * 1.2))
        };
      }

      var bitrate = job.bitrate || 6000000;
      var cands = [
        { codec: 'avc1.42001f', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } },
        { codec: 'avc1.4d0028', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } },
        { codec: 'avc1.640028', width: W, height: H, bitrate: bitrate, framerate: fps, avc: { format: 'avc' } }
      ];
      var encCfg = null;
      for (var ci = 0; ci < cands.length; ci++) {
        try {
          var esup = await VideoEncoder.isConfigSupported(cands[ci]);
          if (esup && esup.supported) { encCfg = cands[ci]; break; }
        } catch (e) {}
      }
      if (!encCfg) throw codeErr('encode');

      var aud = null;
      try { aud = await encodeAudio(job.audio, id); } catch (e) { aud = null; }

      var muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: W, height: H, frameRate: fps },
        audio: aud ? { codec: 'aac', sampleRate: aud.sampleRate, numberOfChannels: aud.channels } : undefined,
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
      });
      if (aud) { for (var ai = 0; ai < aud.chunks.length; ai++) muxer.addAudioChunk(aud.chunks[ai].chunk, aud.chunks[ai].meta); }

      var frameCanvas = new OffscreenCanvas(W, H);
      var fctx = frameCanvas.getContext('2d', { willReadFrequently: true });
      var encErr = null;
      var enc = new VideoEncoder({
        output: function (chunk, m) { muxer.addVideoChunk(chunk, m); },
        error: function (e) { encErr = e; }
      });
      enc.configure(encCfg);

      var pending = 0, processed = 0, frameIndex = 0, fatal = null, chain = Promise.resolve();
      var keyEvery = Math.max(1, Math.round(fps * 2));

      async function processFrame(frame) {
        try {
          var t = (frame.timestamp - t0) / 1e6;
          var hit = maskAt(t, kfs, W, H);
          fctx.drawImage(frame, 0, 0, W, H);
          if (hit && hit.st) inpaintRegion(fctx, hit.mask, hit.st, W, H, job.radius, job.dil, job.algo === 'ns', job.noise, plate, frameIndex);
          var out = new VideoFrame(frameCanvas, {
            timestamp: Math.max(0, frame.timestamp - t0),
            duration: frame.duration || Math.round(1e6 / fps)
          });
          while (enc.encodeQueueSize > 12 && !fatal) await sleep(1);
          enc.encode(out, { keyFrame: frameIndex === 0 || frameIndex % keyEvery === 0 });
          frameIndex++;
          out.close();
        } finally {
          try { frame.close(); } catch (e) {}
        }
      }

      var decErr = null;
      var dec = new VideoDecoder({
        output: function (frame) {
          pending++;
          chain = chain.then(async function () {
            try { await processFrame(frame); }
            catch (e) { if (!fatal) fatal = e; }
            finally { pending--; }
          });
        },
        error: function (e) { decErr = e; }
      });
      dec.configure(decCfg);

      for (var i = 0; i < samples.length; i++) {
        if (fatal || decErr) break;
        var s = samples[i];
        var ts = Math.round(s.cts * 1e6 / vt.timescale);
        var du = Math.round((s.duration || 0) * 1e6 / vt.timescale) || Math.round(1e6 / fps);
        try {
          dec.decode(new EncodedVideoChunk({
            type: s.is_sync ? 'key' : 'delta',
            timestamp: ts, duration: du, data: s.data
          }));
        } catch (e) { fatal = e; break; }
        while ((dec.decodeQueueSize > 16 || pending > 6) && !fatal && !decErr) await sleep(2);
        if (i % 4 === 0) {
          processed++;
          post({ type: 'progress', id: id, phase: 'frames', p: Math.min(0.98, i / samples.length) });
        }
      }

      try { await dec.flush(); } catch (e) { if (!fatal) fatal = e; }
      try { await chain; } catch (e) { if (!fatal) fatal = e; }
      if (fatal) throw fatal;
      if (decErr) throw decErr;
      try { await enc.flush(); } catch (e) { if (!encErr) encErr = e; }
      if (encErr) throw encErr;

      post({ type: 'progress', id: id, phase: 'mux', p: 0.99 });
      muxer.finalize();
      var outBuf = muxer.target.buffer;
      post({ type: 'result', id: id, buffer: outBuf, hasAudio: !!aud }, [outBuf]);
    }

    self.onmessage = function (ev) {
      var d = ev.data;
      if (!d || d.cmd !== 'render') return;
      if (!booted) { post({ type: 'error', id: d.id, code: 'boot' }); return; }
      if (busy) { post({ type: 'error', id: d.id, code: 'busy' }); return; }
      busy = true;
      doRender(d)
        .catch(function (e) { post({ type: 'error', id: d.id, code: (e && e.code) || 'render' }); })
        .then(function () { busy = false; });
    };

    boot();
  }

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
    if (d.type === 'error') { const p = pendingJob; pendingJob = null; p.reject(new Error(d.code || 'render')); }
  }

  function ensureWorker() {
    if (bootP) return bootP;
    setEngine('load');
    bootP = new Promise((resolve, reject) => {
      bootWait = { resolve, reject };
      let w = null;
      const src = '(' + renderWorkerMain.toString() + ')()';
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
      const F = window.FFmpeg;
      if (!F || !F.createFFmpeg) throw new Error('ffmpeg');
      const ff = F.createFFmpeg({ log: false, mainName: 'main', corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js' });
      await ff.load();
      State.ffmpeg.status = 'ready';
      return ff;
    } catch (e) { State.ffmpeg.status = 'error'; throw e; }
  }
  async function stripMetadata(buffer) {
    const ff = await createFFmpeg();
    try {
      State.ffmpeg.status = 'running';
      ff.FS('writeFile', 'aetix_in.mp4', new Uint8Array(buffer));
      await ff.run('-i', 'aetix_in.mp4', '-map', '0', '-c', 'copy', '-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', 'aetix_out.mp4');
      const data = ff.FS('readFile', 'aetix_out.mp4');
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } catch (e) { State.ffmpeg.status = 'error'; throw e; }
    finally {
      try { ff.exit(); } catch (e) {}
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
    setDragOver: b => drop.classList.toggle('over', b),
    onEscape() { if (tool) setTool(null); },
    onLang() {
      renderMsg(); syncCount(); renderKfList(); renderMarks(); setPlayIcon();
      resultSub.textContent = tr(lastHasAudio ? 'resultHint' : 'resultNoAudio');
    }
  };
})();

/* ==========================================================================
   BOOT
   ========================================================================== */
function boot() {
  Core.initSplash();
  let l = 'pt';
  try { const v = localStorage.getItem(Core.LS_KEY); if (v && I18N[v]) l = v; } catch (e) {}
  Core.bind();
  Core.applyLang(l, false);
  Core.switchTab('image', true);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})(window.AetixApp);
