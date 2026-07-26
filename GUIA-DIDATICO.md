# 📚 Guia didático — como a página DevClub foi construída

> Este guia ensina **todas** as técnicas usadas na página, bloco por bloco,
> com o código real e a explicação de cada decisão. A meta: você conseguir
> reconstruir tudo à mão — e entender o que está fazendo em cada linha.
>
> Stack: **HTML + CSS + JavaScript puros**. Zero frameworks, zero bibliotecas,
> zero dependências externas. Tudo que a página faz, ela faz sozinha.

---

## Índice

1. [Estrutura de arquivos](#1-estrutura-de-arquivos)
2. [O esqueleto HTML](#2-o-esqueleto-html)
3. [Sistema de design em CSS (tokens)](#3-sistema-de-design-em-css-tokens)
4. [Fontes self-hosted](#4-fontes-self-hosted)
5. [Navbar sticky com blur](#5-navbar-sticky-com-blur)
6. [Intro PRESS START](#6-intro-press-start)
7. [Code morph — o código que vira página](#7-code-morph)
8. [Cubos 3D em canvas — o motor isométrico](#8-cubos-3d-em-canvas)
9. [Fade do hero no scroll](#9-fade-do-hero-no-scroll)
10. [Contadores animados + "ao vivo"](#10-contadores-animados)
11. [Aparecer ao rolar (reveal)](#11-aparecer-ao-rolar)
12. [Tilt 3D nos cards](#12-tilt-3d-nos-cards)
13. [CardStack — formações em leque 3D](#13-cardstack)
14. [Carrossel de projetos (scroll-snap + drag)](#14-carrossel-de-projetos)
15. [Carrossel de tutores (pilha de fotos)](#15-carrossel-de-tutores)
16. [Timeline que acende no scroll](#16-timeline-que-acende)
17. [Countdown da próxima turma](#17-countdown)
18. [Fundo animado em iframe com parallax](#18-fundo-animado)
19. [Acabamentos: cursor, marquee, FAQ, créditos](#19-acabamentos)
20. [O easter egg de 2009](#20-easter-egg-2009)
21. [Boas práticas que amarram tudo](#21-boas-práticas)
22. [Exercícios para fixar](#22-exercícios)

---

## 1. Estrutura de arquivos

```
devclub/
├── index.html          ← página principal (uma página só, seções âncora)
├── 2009.html           ← easter egg (site "de época")
├── css/
│   └── style.css       ← TODO o estilo, organizado em seções numeradas
├── js/
│   └── script.js       ← TODA a interação, uma função init por recurso
├── assets/
│   ├── fonts/          ← 4 fontes .woff2 (self-hosted)
│   ├── historia/       ← fotos da timeline (2000.png … 2026.png)
│   ├── projetos/       ← screenshots do carrossel de projetos
│   └── tutores/        ← fotos dos tutores
└── referencias/
    └── fundo.html      ← animação de fundo (roda num iframe)
```

**Por que um arquivo só de CSS e um só de JS?** Numa página estática pequena,
menos arquivos = menos requests = carrega mais rápido. A organização vem de
**comentários de seção numerados** dentro dos arquivos:

```css
/* ---------------------------------------------------------------------
   5. HERO — cena 3D + conteúdo por cima
   --------------------------------------------------------------------- */
```

No JS, cada recurso é uma função `initAlgumaCoisa()` independente, todas
chamadas num único lugar:

```js
document.addEventListener('DOMContentLoaded', () => {
  initPressStart();       // sempre primeiro
  initReveal();
  initHeroCubes();
  initHeroFade();
  initCounters();
  // ... etc
});
```

**Armadilha:** `DOMContentLoaded` dispara quando o HTML terminou de ser lido
— antes de imagens carregarem. É o momento certo pra ligar interações: os
elementos já existem, mas você não ficou esperando o resto.

---

## 2. O esqueleto HTML

A página é **uma landing de seção única** — cada bloco é um `<section>` com
`id`, e o menu navega por âncoras (`href="#formacoes"` rola até
`id="formacoes"`).

```html
<body>
  <div id="pressStart" class="press-start">…</div>   <!-- intro por cima de tudo -->
  <iframe id="bgFundo" class="bg-fundo" src="referencias/fundo.html"></iframe>
  <div class="announce">…</div>                       <!-- barra de aviso -->
  <header>…</header>                                  <!-- navbar sticky -->
  <main id="top">
    <section class="hero">…</section>
    <section class="stats-strip">…</section>
    <section class="section" id="quemsomos">…</section>
    <section class="section" id="formacoes">…</section>
    <!-- … as outras seções … -->
    <section class="section final-cta" id="cta">…</section>
  </main>
  <footer>…</footer>
  <script src="js/script.js"></script>                <!-- JS por último -->
</body>
```

**Três decisões importantes:**

1. **`<script>` no fim do body** — o navegador lê HTML de cima pra baixo;
   script no fim garante que os elementos existem quando o JS roda.
2. **Tags semânticas** (`header`, `main`, `section`, `footer`, `nav`) —
   leitores de tela e o Google entendem a estrutura.
3. **Rolagem suave nas âncoras** vem de uma linha de CSS:

```css
html{ scroll-behavior:smooth; }
```

---

## 3. Sistema de design em CSS (tokens)

**A técnica mais importante do projeto inteiro.** Todas as cores, fontes e
medidas moram em **variáveis CSS** (custom properties) no `:root`:

```css
:root{
  /* superfícies (do mais escuro pro mais claro) */
  --bg:        #05060a;
  --bg-1:      #0a0d13;
  --bg-2:      #10141c;

  /* linhas/bordas */
  --line:      #1c2230;
  --line-hi:   #2a3346;

  /* texto (3 níveis de hierarquia) */
  --text:      #eef2f7;
  --text-dim:  #8a95a8;
  --text-mute: #5c6577;

  /* A cor da marca */
  --lime:      #c6ff3d;
  --lime-soft: rgba(198,255,61,0.14);

  /* acentos */
  --info:      #4fe0ff;   /* ciano  */
  --violet:    #8b6cff;   /* violeta */
  --warn:      #ffb84d;   /* âmbar  */

  /* tipografia */
  --display: 'Sora', system-ui, sans-serif;       /* títulos  */
  --mono:    'JetBrains Mono', monospace;         /* código   */
  --body:    'Inter', system-ui, sans-serif;      /* texto    */

  /* medidas */
  --maxw: 1240px;
  --radius: 14px;
}
```

Uso: `color: var(--lime);` em qualquer lugar. **Por quê?**

- Trocar a cor da marca inteira = editar **1 linha**.
- Nenhum hexadecimal solto no meio do código (a "fonte da verdade" é uma só).
- Os 3 níveis de texto (`--text`, `--text-dim`, `--text-mute`) criam
  hierarquia sem você pensar: título, apoio, detalhe.

**Regra de ouro do dark theme usada aqui:** nunca preto puro sobre branco
puro. O fundo é `#05060a` (preto azulado) e o texto `#eef2f7` (branco
levemente azulado) — contraste alto sem "vibrar".

### O grid sutil do fundo

O corpo tem um padrão de grade desenhado **só com CSS**, sem imagem:

```css
body{
  background-image:
    radial-gradient(1200px 600px at 50% -10%, rgba(198,255,61,0.06), transparent 60%),
    linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px);
  background-size: 100% 100%, 48px 48px, 48px 48px;
  background-attachment: fixed;
}
```

Como funciona: dois `linear-gradient` de **1px de linha + resto transparente**,
repetidos a cada 48px (um vertical, um horizontal) = grade. O
`radial-gradient` por cima é um "respiro" lime no topo. `background-attachment:
fixed` faz a grade ficar parada enquanto o conteúdo rola.

### Títulos com palavra destacada

```html
<h2>Escolha o pacote e instale a <em>próxima etapa</em> da sua carreira</h2>
```

```css
.section-head h2 em{
  font-style: normal;                      /* tira o itálico do <em> */
  color: var(--lime);
  text-shadow: 0 0 32px rgba(198,255,61,0.35);   /* glow */
}
```

O `<em>` dá ênfase semântica (leitores de tela entendem) e a gente re-estiliza
pra virar o destaque lime com brilho.

### Tamanhos fluidos com clamp()

```css
font-size: clamp(1.8rem, 3.8vw, 2.9rem);
```

Leia como: **"no mínimo 1.8rem, idealmente 3.8% da largura da tela, no máximo
2.9rem"**. O título cresce e encolhe com a janela, sem media query.

---

## 4. Fontes self-hosted

Em vez de puxar do Google Fonts (request externo, IP do visitante vazando,
CDN podendo cair), os arquivos `.woff2` moram no projeto:

```css
@font-face{
  font-family:'Sora';
  src:url('../assets/fonts/sora.woff2') format('woff2');
  font-weight:100 800;      /* fonte VARIÁVEL: um arquivo cobre todos os pesos */
  font-style:normal;
  font-display:swap;        /* mostra fallback primeiro, troca quando carregar */
}
```

**Conceitos:**

- **Fonte variável**: um único arquivo contém o espectro de pesos. Por isso
  `font-weight: 100 800` (um intervalo, não um número).
- **`font-display: swap`**: o texto aparece imediatamente com a fonte de
  fallback e "troca" quando a webfont chega. Sem tela em branco.
- O caminho é relativo **ao arquivo CSS** (`../assets/...` porque o CSS está
  dentro de `css/`).

---

## 5. Navbar sticky com blur

```css
header{
  position: sticky; top: 0; z-index: 50;
  background: rgba(5,6,10,0.78);         /* fundo translúcido */
  backdrop-filter: blur(14px);           /* embaça o que passa por trás */
  border-bottom: 1px solid var(--line);
}
```

- **`position: sticky`** = o header rola normal até encostar em `top: 0`,
  e aí "gruda".
- **`backdrop-filter: blur()`** = efeito vidro fosco. O conteúdo que rola
  por baixo aparece embaçado. Precisa de fundo com transparência (o `rgba`)
  pra ter o que embaçar.

O `>` pulsante do logo é um `<span>` com animação de keyframes:

```css
.brand-prompt{
  color: var(--lime);
  text-shadow: 0 0 10px rgba(198,255,61,0.65);
  animation: promptPulse 1.4s ease-in-out infinite;
}
@keyframes promptPulse{
  0%, 100% { opacity: 1;    text-shadow: 0 0 8px  rgba(198,255,61,0.55); }
  50%      { opacity: 0.75; text-shadow: 0 0 18px rgba(198,255,61,0.95); }
}
```

**Padrão a memorizar:** animação de "respiração" = keyframes com estado
igual em `0%` e `100%` e o pico no `50%`, com `infinite`.

---

## 6. Intro PRESS START

### A tela

Um `<div>` fixo cobrindo tudo, com z-index altíssimo:

```css
.press-start{
  position: fixed; inset: 0;            /* inset:0 = top/right/bottom/left 0 */
  z-index: 99999;
  background: radial-gradient(ellipse at center, #071018 0%, #030509 70%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer;
  transition: opacity .5s ease;
}
.press-start.is-leaving{ opacity: 0; pointer-events: none; }
```

**Técnica do texto com gradiente** (o "PRESS START" ciano→lime):

```css
.ps-title{
  font-family: 'Press Start 2P', monospace;   /* fonte pixel */
  background: linear-gradient(180deg, #4fe0ff 0%, #c6ff3d 60%, #4fe0ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;          /* o texto vira uma "janela" pro gradiente */
  filter:
    drop-shadow(0 0 6px rgba(79,224,255,0.7))
    drop-shadow(0 0 18px rgba(198,255,61,0.55));   /* glow em camadas */
}
```

Como funciona: o gradiente é pintado como fundo do elemento;
`background-clip: text` recorta o fundo no formato das letras; `color:
transparent` deixa ver através. Os `drop-shadow` empilhados criam o neon.

**Scanlines retrô** (listras de TV antiga), sem imagem:

```css
.press-start::before{
  content: "";
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px,
    transparent 2px, transparent 4px
  );
}
```

`repeating-linear-gradient` repete o padrão: 1px de linha clara, 3px de nada,
pra sempre.

### A lógica

```js
const INTRO_KEY = 'devclub-intro-seen-v1';

function initPressStart() {
  const overlay = $('#pressStart');
  if (!overlay) return;

  /* já viu nesta sessão, ou a URL pede pra pular? remove e pronto */
  if (sessionStorage.getItem(INTRO_KEY) || location.search.includes('nointro')) {
    overlay.remove();
    return;
  }

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;          /* trava contra clique duplo */
    dismissed = true;
    sessionStorage.setItem(INTRO_KEY, '1');

    heroEls.forEach(el => el.classList.add('to-assemble'));  /* esconde o hero */
    overlay.classList.add('is-leaving');
    setTimeout(() => overlay.remove(), 500);   /* remove após o fade */
    startCodeMorph(heroEls);
  };

  document.addEventListener('keydown', dismiss);
  overlay.addEventListener('click', dismiss);
  overlay.addEventListener('touchstart', dismiss, { passive: true });
}
```

**Conceitos:**

- **`sessionStorage`** guarda dados até a aba fechar. Primeiro acesso mostra
  o intro; F5 não repete (não irritar é design também). `localStorage` seria
  pra sempre; `sessionStorage` é por visita.
- **Flag `dismissed`** evita a animação disparar duas vezes se a pessoa
  apertar tecla E clicar.
- **3 formas de disparar** (tecla, clique, toque) = acessível em qualquer
  dispositivo.

---

## 7. Code morph

O efeito pós-intro: **cada linha de código cai exatamente onde o elemento
real fica, pousa e "vira" o elemento**.

### A ideia

1. O hero começa escondido (classe `.to-assemble`: opacity 0, leve blur).
2. Pra cada elemento (badge, título, texto, botões, prova social), criamos
   um bloco `<div class="morph-line">` com o código HTML dele escrito.
3. O bloco cai do topo da tela até a **posição exata** do elemento
   (medida com `getBoundingClientRect()`).
4. Ao pousar: o bloco esvanece e o elemento real aparece **no mesmo lugar**.
5. O fundo escuro clareia um degrau a cada pouso.

### CSS dos estados

```css
/* elemento real escondido, esperando */
.hero .to-assemble{
  opacity: 0;
  transform: translateY(10px);
  filter: blur(3px);
  transition: opacity .45s cubic-bezier(.22,1,.36,1),
              transform .45s cubic-bezier(.22,1,.36,1),
              filter .45s cubic-bezier(.22,1,.36,1);
}
.hero .to-assemble.is-assembled{ opacity: 1; transform: none; filter: none; }

/* o bloco de código que cai */
.morph-line{
  position: absolute;
  font-family: var(--mono);
  padding: 7px 16px;
  background: rgba(198,255,61,0.07);
  border-left: 2px solid var(--lime);
  transition: transform .55s cubic-bezier(.2, 1.25, .35, 1),  /* queda */
              opacity .26s ease;
}
.morph-line.out{ opacity: 0; filter: blur(4px); }
```

**O segredo do "quique":** `cubic-bezier(.2, 1.25, .35, 1)`. O segundo valor
**acima de 1** faz a animação passar do alvo e voltar — o bloco "afunda" um
tiquinho ao pousar, como algo com peso.

### JS essencial

```js
heroEls.forEach((el, i) => {
  const line = document.createElement('div');
  line.className = 'morph-line';
  line.innerHTML = snippets[i];                 /* o código com cores */
  line.style.transform = 'translateY(-120vh)';  /* começa acima da tela */
  morph.appendChild(line);

  const t0 = 30 + i * 300;                      /* um a cada 300ms */

  setTimeout(() => {
    const rect = el.getBoundingClientRect();    /* mede AGORA (layout pode ter mudado) */
    line.style.left = rect.left + 'px';
    line.style.top  = rect.top + 'px';
    void line.offsetWidth;      /* ⚡ força o navegador a "commitar" a posição */
    line.style.transform = 'translateY(0)';     /* dispara a queda */
  }, t0);

  setTimeout(() => {
    el.classList.add('is-assembled');           /* elemento real aparece */
    line.classList.add('out');                  /* bloco evapora */
    bg.style.opacity = String(1 - (i + 1) / N); /* fundo clareia 1/N */
  }, t0 + 550);
});
```

**A linha mais estranha e mais importante:** `void line.offsetWidth;`

O navegador agrupa mudanças de estilo e aplica tudo junto. Se você seta a
posição e o `transform` final no mesmo "fôlego", ele pula o estado inicial —
e não há animação. **Ler** `offsetWidth` força o navegador a calcular o
layout (reflow) naquele instante, separando o "antes" do "depois". É o
truque clássico pra reiniciar/garantir transições via JS.

**Por que medir a posição dentro do setTimeout?** Se a fonte terminar de
carregar no meio da sequência, o layout desloca. Medindo na hora da queda,
cada bloco cai no lugar **atual** do elemento.

---

## 8. Cubos 3D em canvas

A parte mais avançada: um **motor isométrico** de ~160 linhas, sem WebGL,
sem biblioteca. Só `<canvas>` 2D e trigonometria leve.

### 8.1 Projeção isométrica

"Isométrico" é o 3D falso dos jogos antigos. A conversão de coordenadas de
grade `(i, j)` pra tela `(x, y)`:

```js
x = origemX + (i - j) * meioPassoX;
y = origemY + (i + j) * meioPassoY;   /* meioPassoY = metade do X → achata 2:1 */
```

- `i - j` espalha na horizontal (diagonal ↗ da grade).
- `i + j` desce na vertical (diagonal ↘).
- A proporção 2:1 entre os passos cria a inclinação isométrica clássica.

### 8.2 Desenhar UM cubo

Um cubo isométrico = **3 polígonos**: topo (losango) + face esquerda + face
direita.

```js
function drawCube(x, y, up, ener, col) {
  const w = cubeW / 2, h = cubeW / 4, ch = cubeH;
  const yy = y - up;                    /* 'up' = quanto o cubo está levitando */

  /* TOPO: losango de 4 pontos */
  ctx.beginPath();
  ctx.moveTo(x, yy - h);                /* ponta de cima    */
  ctx.lineTo(x + w, yy);                /* ponta direita    */
  ctx.lineTo(x, yy + h);                /* ponta de baixo   */
  ctx.lineTo(x - w, yy);                /* ponta esquerda   */
  ctx.closePath();
  ctx.fillStyle = `rgba(${col},${0.08 + ener * 0.30})`;  /* mais energia = mais cor */
  ctx.fill();

  /* FACE ESQUERDA: desce 'ch' pixels a partir das pontas esquerda/baixo */
  ctx.beginPath();
  ctx.moveTo(x - w, yy); ctx.lineTo(x, yy + h);
  ctx.lineTo(x, yy + h + ch); ctx.lineTo(x - w, yy + ch);
  ctx.closePath();
  ctx.fillStyle = 'rgba(5,6,10,0.85)';   /* mais escura = "sombra" */
  ctx.fill();

  /* FACE DIREITA: igual, espelhada, um tom mais clara */
  /* … */

  /* ARESTAS DO TOPO com glow quando energizado */
  ctx.strokeStyle = `rgba(${col},${0.35 + ener * 0.65})`;
  if (ener > 0.25) {
    ctx.shadowColor = `rgba(${col},0.9)`;
    ctx.shadowBlur = 18 * ener;          /* ✨ o neon */
  }
  ctx.stroke();
  ctx.shadowBlur = 0;                    /* SEMPRE zerar — shadow é caro */
}
```

**A ilusão de luz:** três tons (topo com cor, esquerda escura, direita média)
fazem o cérebro ler volume. É o mesmo truque de pixel art.

### 8.3 Ordem de pintura (painter's algorithm)

Canvas não tem noção de profundidade — quem desenha por último fica na
frente. Solução: desenhar **de trás pra frente**. Na projeção isométrica, a
profundidade é `i + j` (quanto maior, mais na frente):

```js
for (let s = 0; s <= (N - 1) * 2; s++) {   /* s = i+j, das costas pra frente */
  for (let i = 0; i <= s; i++) {
    const j = s - i;
    if (i >= N || j >= N) continue;
    /* … desenha o cubo (i, j) … */
  }
}
```

### 8.4 A onda idle

Cada cubo levita seguindo um seno **defasado pela posição** — isso cria a
onda atravessando o campo:

```js
const wave = (Math.sin(t * 1.2 + (i + j) * 0.5) + 1) * 5;
/*            tempo ↑        defasagem ↑    amplitude ↑  */
```

Sem o `+ (i+j) * 0.5`, todos subiriam e desceriam juntos (chato). A
defasagem transforma em onda.

### 8.5 O ripple do mouse (falloff gaussiano)

Cubos perto do cursor sobem. "Perto" é medido com uma **gaussiana** — a
curva do sino, que dá transição suave em vez de liga/desliga:

```js
const dx = x - mouse.x, dy = y - mouse.y;
const boost = Math.exp(-(dx*dx + dy*dy) / (2 * sig * sig));
/* boost = 1 exatamente no cursor, caindo suave até 0 longe dele */
const target = wave + boost * 30;
```

`sig` (sigma) controla o raio da influência. É a mesma matemática do
desfoque gaussiano do Photoshop.

### 8.6 Física de mola

Se o cubo pulasse direto pro `target`, ficaria robótico. Em vez disso, cada
cubo tem velocidade própria e é **puxado** pro alvo:

```js
vel[idx] += (target - lift[idx]) * 0.14;   /* rigidez da mola  */
vel[idx] *= 0.78;                          /* amortecimento    */
lift[idx] += vel[idx];
```

- Longe do alvo → acelera.
- Perto → desacelera e assenta (o `* 0.78` "rouba" energia a cada frame,
  senão oscilaria pra sempre).

Esse trio de linhas é **o** padrão de animação orgânica. Guarde-o.

### 8.7 Nitidez em tela retina (DPR)

```js
const DPR = Math.min(window.devicePixelRatio || 1, 2);
canvas.width  = W * DPR;              /* resolução interna maior     */
canvas.height = H * DPR;
canvas.style.width  = W + 'px';       /* tamanho visual normal       */
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);  /* desenha em coordenadas normais */
```

Sem isso, o canvas fica borrado em telas de alta densidade. O `Math.min(…, 2)`
limita o custo em telas 3x.

### 8.8 Não desperdiçar bateria

```js
/* pausa quando o hero sai da tela */
new IntersectionObserver((en) => { inView = en[0].isIntersecting; })
  .observe(hero);

(function loop(now) {
  if (inView && !document.hidden) frame(now);   /* só desenha se visível */
  requestAnimationFrame(loop);
})(0);
```

E cubos fora da tela nem são desenhados (culling):

```js
if (x < -spacing*2 || x > W + spacing*2 || y < -spacing*2 || y > H + spacing*2) continue;
```

---

## 9. Fade do hero no scroll

O conteúdo do hero esvanece nos primeiros 400px de rolagem:

```js
function initHeroFade() {
  const content = $('#heroContent');
  const MAX = 400;
  let ticking = false;

  const update = () => {
    const opacity = clamp(1 - window.scrollY / MAX, 0, 1);
    content.style.opacity = opacity.toFixed(3);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
}
```

**Dois padrões de performance aqui:**

1. **Throttle com rAF**: o evento `scroll` dispara dezenas de vezes por
   segundo. A flag `ticking` garante **um** update por frame de tela.
2. **`{ passive: true }`**: promete ao navegador que você não vai chamar
   `preventDefault()`, liberando ele pra rolar sem esperar seu código.

---

## 10. Contadores animados

Os números do painel de stats (42.300+ alunos…) contam do zero quando entram
na tela.

### HTML declarativo

```html
<span data-count="42300" data-suffix="+" data-live>0</span>
```

Os `data-*` são atributos livres que o JS lê via `el.dataset.count` etc.
O HTML "declara", o JS "executa" — separação limpa.

### A animação com easing

```js
const easeOut = t => 1 - Math.pow(1 - t, 3);   /* rápido no começo, freia no fim */

const animate = (el) => {
  const target = parseFloat(el.dataset.count.replace(/\./g, ''));
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const t = clamp((now - start) / duration, 0, 1);   /* progresso 0→1 */
    el.textContent = format(target * easeOut(t), el);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
};
```

**Anatomia de toda animação JS:** progresso linear `t` (0→1 pelo relógio) →
passa por uma **função de easing** → multiplica pelo valor final.
`easeOut` cúbico = arranca rápido e pousa suave (bom pra contadores).

O disparo usa IntersectionObserver (seção 11) — só anima quando o elemento
aparece na tela.

### O tick "ao vivo"

Depois da animação, o contador com `data-live` soma +1 a cada 8s:

```js
setInterval(() => {
  if (document.hidden) return;        /* aba em background? não gasta */
  current += 1;
  el.textContent = format(current, el);
  el.classList.remove('just-ticked');
  void el.offsetWidth;                /* reinicia a animação CSS (de novo ele!) */
  el.classList.add('just-ticked');
}, 8000);
```

```css
[data-live].just-ticked{ animation: liveTick 0.9s ease-out; }
@keyframes liveTick{
  0%   { color: var(--lime-hi); text-shadow: 0 0 32px rgba(198,255,61,0.9); }
  100% { color: var(--lime); }
}
```

Remover a classe → forçar reflow → readicionar = **reinicia uma animação
CSS**. Sem o reflow no meio, o navegador acha que nada mudou.

---

## 11. Aparecer ao rolar

O padrão mais reutilizável da página. Qualquer elemento com `data-reveal`
entra com fade+slide quando aparece:

```css
[data-reveal]{
  opacity: 0;
  transform: translateY(28px);
  transition: opacity .8s ease, transform .8s ease;
}
[data-reveal].is-visible{ opacity: 1; transform: none; }
```

```js
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);        /* animou uma vez? para de vigiar */
      }
    });
  }, { threshold: 0.15 });             /* dispara com 15% visível */

  $$('[data-reveal]').forEach(el => io.observe(el));
}
```

**IntersectionObserver** é o jeito moderno de saber "o elemento está na
tela?" — o navegador avisa você, em vez de você calcular posições a cada
scroll (como se fazia antigamente, gastando CPU à toa).

---

## 12. Tilt 3D nos cards

Cards que inclinam seguindo o mouse:

```js
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;      /* posição do mouse DENTRO do card */
  const y = e.clientY - rect.top;
  const cx = rect.width / 2, cy = rect.height / 2;

  const rx = ((y - cy) / cy) * -6;      /* mouse em cima → inclina pra trás */
  const ry = ((x - cx) / cx) * 8;       /* mouse à direita → gira pra direita */

  card.style.transform =
    `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;

  /* alimenta o brilho que segue o mouse (CSS var por elemento!) */
  card.style.setProperty('--mx', `${x}px`);
  card.style.setProperty('--my', `${y}px`);
});
card.addEventListener('mouseleave', () => { card.style.transform = ''; });
```

- **`perspective(900px)`** dentro do transform dá profundidade real ao
  rotate (sem ele, rotateX/Y só "achata").
- A matemática: distância do centro, normalizada pra -1…1, vezes o ângulo
  máximo.

**O holofote que segue o mouse** usa as variáveis setadas acima:

```css
.pkg-card::after{
  content:""; position:absolute; inset:0;
  background: radial-gradient(600px circle at var(--mx,50%) var(--my,50%),
              rgba(198,255,61,0.08), transparent 40%);
  opacity:0; transition:opacity .3s;
}
.pkg-card:hover::after{ opacity:1; }
```

CSS vars podem ser setadas **por elemento** via JS — o gradiente de cada
card segue o mouse daquele card.

---

## 13. CardStack

As 4 formações em leque 3D, onde **a posição X do mouse escolhe o card**.

### O layout do leque

Todos os cards ficam absolutos no mesmo lugar; o que muda é o transform
calculado por JS a partir da distância (`off`) do card ativo:

```js
const off = signedOffset(i, active);     /* -2, -1, 0, +1, +2 … com wrap */
const abs = Math.abs(off);
const isActive = off === 0;

const rotateZ = off * stepDeg;           /* abre o leque                */
const x       = off * spacing;           /* espalha pros lados          */
const z       = -abs * 130;              /* empurra pro fundo (3D real) */
const scale   = isActive ? 1.03 : 0.92;

card.style.transform =
  `translate3d(${x}px, ${y}px, 0) rotateX(${rotateX}deg) ` +
  `rotateZ(${rotateZ}deg) translateZ(${z}px) scale(${scale})`;
card.style.zIndex = String(100 - abs);   /* ativo por cima */
```

O contêiner precisa de `perspective: 1100px` (CSS) pro `translateZ`
funcionar.

**Wrap-around** (do último volta pro primeiro pelo caminho curto):

```js
function signedOffset(i, active) {
  const raw = i - active;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}
```

### Hover escolhe o card

```js
stage.addEventListener('mousemove', (e) => {
  const rect = stage.getBoundingClientRect();
  const frac = clamp((e.clientX - rect.left) / rect.width, 0, 0.9999);
  const idx  = Math.floor(frac * len);   /* 0..len-1 conforme o X */
  if (idx !== active) setActive(idx);
});
```

Mapeia a largura da área em N fatias: mouse na esquerda = card 0, na direita
= último. Simples e mágico de usar.

---

## 14. Carrossel de projetos

### Scroll-snap: o navegador faz o trabalho

```css
.proj-track{
  display: flex; gap: 22px;
  overflow-x: auto;                  /* rolagem horizontal nativa */
  scroll-snap-type: x mandatory;     /* sempre assenta num card   */
  scrollbar-width: none;             /* esconde a barra (Firefox) */
  cursor: grab;
}
.proj-track::-webkit-scrollbar{ display: none; }   /* (Chrome) */
.proj-card{
  flex: 0 0 min(380px, 82vw);        /* largura fixa, não encolhe */
  scroll-snap-align: center;         /* assenta CENTRALIZADO      */
}
```

Com isso o carrossel já funciona com touch e trackpad, **sem JS nenhum**.
O JS só adiciona: setas, autoplay e drag de mouse.

### Drag com o mouse

Mouse não arrasta `overflow: auto` nativamente (touch sim). A gente traduz:

```js
track.addEventListener('pointerdown', (e) => {
  dragging = true;
  dragStartX = e.clientX;
  dragStartScroll = track.scrollLeft;
  track.classList.add('is-dragging');
  track.setPointerCapture(e.pointerId);   /* segura o mouse mesmo saindo do track */
});
track.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
});
track.addEventListener('pointerup', () => {
  dragging = false;
  track.classList.remove('is-dragging');  /* o snap volta e acomoda o card */
});
```

```css
.proj-track.is-dragging{
  cursor: grabbing;
  scroll-snap-type: none;    /* ⚠️ solta o snap DURANTE o arrasto */
  user-select: none;
}
```

**Armadilha real:** com o snap ligado durante o drag, o navegador fica
puxando o scroll de volta e o arrasto "engasga". Desligar no `.is-dragging`
e religar ao soltar = o snap dá o acabamento final.

**`setPointerCapture`** faz o elemento continuar recebendo os eventos mesmo
que o cursor saia dele no meio do arrasto — sem isso, arrastos rápidos
"escapam".

---

## 15. Carrossel de tutores

### A pilha de fotos

Todas as fotos ficam empilhadas (`position: absolute; inset: 0`) e cada uma
recebe um transform conforme sua distância do ativo:

```js
const offset = ((i - active) + len) % len;   /* 0 = ativa */
let x, rotY, scale;
if (offset === 0)      { x = '0%';   rotY = 0;   scale = 1;    }
else if (offset === 1) { x = '18%';  rotY = -14; scale = 0.86; }  /* espia à direita */
else                   { x = '-18%'; rotY = 14;  scale = 0.86; }  /* espia à esquerda */

img.style.zIndex = String(len - Math.abs(offset));
img.style.transform = `translate3d(${x},0,0) rotateY(${rotY}deg) scale(${scale})`;
```

O contêiner tem `perspective: 1000px` — é o que faz o `rotateY` parecer
foto virada de lado e não foto espremida.

### Texto trocando com stagger de palavras

A frase do tutor entra **palavra por palavra**:

```js
const wordWrap = (text) =>
  text.split(' ').map(w => `<span class="word">${w}</span>`).join(' ');

/* cada palavra atrasa 20ms a mais que a anterior */
$$('.word', quoteEl).forEach((w, i) => {
  w.style.transitionDelay = (i * 20) + 'ms';
});
quoteEl.classList.add('is-animating');
```

```css
.testimonials-quote .word{
  display: inline-block;          /* necessário pra transform funcionar */
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .35s ease, transform .35s ease;
}
.testimonials-quote.is-animating .word{ opacity: 1; transform: none; }
```

Uma classe no pai + `transition-delay` progressivo nos filhos = cascata.
Padrão que serve pra qualquer lista.

---

## 16. Timeline que acende

### A linha que preenche

Duas camadas: o trilho cinza (`::before`) e o preenchimento lime (`::after`)
cuja altura é uma **variável CSS controlada por JS**:

```css
.timeline{ position: relative; --fill: 0%; }
.timeline::before{  /* trilho */
  content:""; position:absolute; left:6px; top:6px; bottom:6px;
  width:2px; background:var(--line);
}
.timeline::after{   /* preenchimento */
  content:""; position:absolute; left:6px; top:6px;
  width:2px; height:var(--fill);          /* ← controlado pelo JS */
  background:linear-gradient(180deg, var(--lime), rgba(198,255,61,0.3));
}
```

```js
const onScroll = () => {
  const rect = line.getBoundingClientRect();
  /* quanto da timeline já passou do "gatilho" (75% da altura da janela) */
  const filled = clamp(window.innerHeight * 0.75 - rect.top, 0, rect.height);
  line.style.setProperty('--fill', (filled / rect.height) * 100 + '%');

  /* acende cada marco quando ele sobe além de 60% da janela */
  items.forEach(it => {
    it.classList.toggle('is-lit', it.getBoundingClientRect().top < window.innerHeight * 0.6);
  });
};
window.addEventListener('scroll', onScroll, { passive: true });
```

JS **não anima nada** aqui — só atualiza um número. Quem desenha é o CSS.
Essa divisão (JS mede, CSS pinta) mantém tudo fluido.

### As fotos que acordam

A mesma classe `.is-lit` que acende a bolinha dispara a foto:

```css
.tl-image{
  opacity: 0;
  transform: translateY(28px) scale(0.98);
  filter: blur(8px) brightness(0.55);          /* dormindo  */
  transition: opacity .9s ease, transform .9s cubic-bezier(.22,1,.36,1),
              filter .9s ease;
}
.tl-item.is-lit .tl-image{
  opacity: 1; transform: none;
  filter: none;                                 /* acordou   */
  box-shadow: 0 24px 60px -20px rgba(0,0,0,0.75),
              0 0 40px -10px rgba(198,255,61,0.25);
}
```

Animar `filter: blur()` dá aquele efeito de foto "revelando" — mais rico
que só opacity.

---

## 17. Countdown

```js
/* alvo: segunda-feira daqui a ~2 semanas, 20h */
const target = (() => {
  const d = new Date();
  d.setDate(d.getDate() + (8 - d.getDay()) % 7 + 14);
  d.setHours(20, 0, 0, 0);
  return d;
})();

function tick() {
  const diff = target - new Date();          /* milissegundos restantes */
  const d = diff / 86400000;                 /* ms num dia   */
  const h = (diff / 3600000) % 24;           /* ms numa hora */
  const m = (diff / 60000) % 60;
  const s = (diff / 1000) % 60;
  dEl.textContent = pad(d);                  /* pad = String().padStart(2,'0') */
  /* … */
}
tick();                                      /* roda já (sem esperar 1s) */
setInterval(tick, 1000);
```

Datas em JS são milissegundos por baixo — subtrair duas dá o intervalo.
O resto é divisão e módulo. `font-variant-numeric: tabular-nums` no CSS faz
os dígitos terem a mesma largura (o relógio não "treme").

---

## 18. Fundo animado

Uma animação HTML separada (`referencias/fundo.html`) roda num iframe fixo
**atrás** de tudo:

```css
.bg-fundo{
  position: fixed;
  top: -80vh;                  /* sobra pra cima…            */
  height: 260vh;               /* …e muito pra baixo         */
  width: 100vw;
  z-index: -2;                 /* atrás do conteúdo          */
  pointer-events: none;        /* cliques atravessam         */
  opacity: 0.55;
  mix-blend-mode: screen;      /* funde com o fundo escuro   */
}
```

**Parallax**: no scroll, o iframe é empurrado pra cima na metade da
velocidade — como ele é `fixed` (não rolaria nunca), o translate cria
descolamento entre fundo e conteúdo:

```js
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, window.innerHeight * 1.6);
      iframe.style.transform = `translate3d(0, ${-y * 0.5}px, 0)`;
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

Por isso o iframe tem 260vh de altura: o excesso garante que o movimento
nunca revele "buraco". O véu por cima é um `body::before` fixo com
gradientes escuros — dá contraste pro texto sem apagar o fundo.

---

## 19. Acabamentos

### Cursor personalizado (SVG embutido)

```css
body{
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' \
width='16' height='22'><rect x='6' y='1' width='4' height='20' fill='%23c6ff3d'/></svg>") 8 11, text;
}
```

Um SVG inteiro dentro do CSS via `data:` URI — sem arquivo externo. O
`%23` é o `#` escapado. Os números `8 11` são o "hotspot" (a ponta que
clica). Sempre declare um fallback (`, text`).

### Marquee infinito (empresas)

```css
.marquee-track{
  display: flex; gap: 72px; width: max-content;
  animation: scroll 34s linear infinite;
}
@keyframes scroll{ to{ transform: translateX(-50%); } }
```

O truque: o conteúdo é **duplicado** no HTML (as 12 empresas, duas vezes).
Andar -50% = exatamente uma cópia — quando o loop reinicia, está visualmente
idêntico. Loop perfeito, sem JS. A máscara nas pontas:

```css
.marquee{
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
```

### FAQ e créditos sem JS

`<details>/<summary>` é um acordeão nativo do HTML:

```html
<details class="faq-item">
  <summary>Preciso saber matemática?</summary>
  <div class="faq-answer">Não. …</div>
</details>
```

```css
.faq-item summary::-webkit-details-marker{ display: none; }  /* some a setinha */
.faq-item summary::after{ content: "+"; transition: transform .25s; }
.faq-item[open] summary::after{ transform: rotate(45deg); }  /* + vira × */
```

Acessível de graça (teclado, leitores de tela) — só estilizamos.

### Pointer-events em camadas

No hero, o texto fica POR CIMA do canvas, mas o canvas precisa receber o
mouse. Solução em duas camadas:

```css
.hero .wrap.hero-content{ pointer-events: none; }   /* wrapper: atravessa  */
.hero .hero-cta, .hero .console{ pointer-events: auto; }  /* botões: capturam */
```

O mouse "fura" o wrapper e chega no canvas, exceto onde há algo clicável.

---

## 20. Easter egg 2009

Clicar no bolo do hero abre `2009.html` — o "site da época". Aqui a graça é
usar as técnicas **erradas de propósito**:

- Layout inteiro numa `<table>` com `border: 4px ridge` (relevo noventista).
- `Comic Sans MS` e `Times New Roman`.
- Contador de visitas: fundo preto, fonte `Courier`, verde `#00ff00`.
- Marquee e blink **recriados em CSS** (as tags `<marquee>`/`<blink>`
  morreram, mas keyframes imitam):

```css
.marquee span{
  display: inline-block; padding-left: 100%;
  animation: marquee 20s linear infinite;
}
@keyframes marquee{ 100%{ transform: translate(-100%, 0); } }

.blink{ animation: blink 1.2s step-end infinite; }
@keyframes blink{ 50%{ opacity: 0; } }
```

`step-end` no blink é o que dá o pisca "seco" (liga/desliga sem fade) —
igualzinho ao original.

Detalhes de época que vendem a ilusão: e-mail @yahoo.com.br, MSN, Orkut,
"melhor visualizado em Internet Explorer 8 a 800x600", preços em R$ de 2009.

---

## 21. Boas práticas

### Cache busting

```html
<link rel="stylesheet" href="css/style.css?v=2026-selfhost">
```

O navegador cacheia CSS/JS agressivamente. Mudou o arquivo? Muda o `?v=` —
a URL "nova" fura o cache. Manual, mas infalível em site estático.

### prefers-reduced-motion

Pessoas com sensibilidade vestibular configuram o sistema pra reduzir
animações. Respeite:

```css
@media (prefers-reduced-motion: reduce){
  *{ animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

```js
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED) { frame(0); return; }   /* cubos: 1 frame estático, sem loop */
```

### Acessibilidade mínima que fizemos

- `aria-label` em botões só-ícone (setas, links sociais).
- `aria-hidden="true"` em tudo decorativo (canvas, ícones).
- `alt` descritivo em toda imagem com conteúdo.
- `:focus-visible` com outline lime — navegação por Tab visível.
- Efeitos com significado (FAQ, tabs) em elementos nativos.

### Performance — o resumo das regras

| Regra | Onde usamos |
|---|---|
| Anime só `transform` e `opacity` (GPU, sem reflow) | praticamente tudo |
| Throttle de scroll com rAF + flag | fade do hero, timeline, parallax |
| IntersectionObserver, não cálculo manual | reveal, contadores, pausa dos cubos |
| `will-change` só em quem realmente anima | morph-line, cs-card |
| Pausar o que não está visível | cubos (viewport + document.hidden) |
| `loading="lazy"` em imagem abaixo da dobra | timeline, carrosséis |

### Zero dependências

A página não busca **nada** fora do próprio host: fontes, imagens e efeitos
são todos locais, e os efeitos "de biblioteca" (Spline, GSAP, framer-motion
dos componentes de referência) foram **reimplementados à mão**. Benefícios:
funciona offline, nada quebra por CDN fora do ar, sem tracking de terceiros,
e você entende 100% do que roda.

---

## 22. Exercícios

Pra fixar, tente **sem olhar o código**:

1. **Fácil** — Crie um badge pill com dot pulsante (seção 5).
2. **Fácil** — Faça um acordeão de FAQ com `<details>` e o "+" que gira.
3. **Médio** — Um contador que anima de 0 a 1.000 com easeOut ao entrar na
   tela (IntersectionObserver + rAF).
4. **Médio** — Cards com tilt 3D + holofote seguindo o mouse (CSS vars).
5. **Médio** — Um carrossel scroll-snap com drag de mouse (lembre de soltar
   o snap durante o arrasto!).
6. **Difícil** — Desenhe UM cubo isométrico num canvas. Depois uma grade
   3×3. Depois faça a onda senoidal atravessar.
7. **Difícil** — Recrie o code morph: um bloco que cai do topo e pousa
   exatamente sobre um elemento da página, que aparece quando ele some.

Se travar em qualquer um, o código real está todo em
[github.com/NaBala15/pagina-devclub](https://github.com/NaBala15/pagina-devclub) —
e cada trecho deste guia aponta pra seção correspondente do `style.css` e
`script.js`.

---

*Guia escrito para o projeto DevClub — página conceitual de portfólio por
JeffDev. HTML, CSS e JavaScript puros, sem dependências.*
