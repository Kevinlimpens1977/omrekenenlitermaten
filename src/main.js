import { gsap } from 'gsap';
import * as THREE from 'three';
import './styles.css';
import { buildLessonSlides } from './lessonSlides.js';
import { mountLiterDm3Scene } from './literDm3Scene.js';
import { checkNumberPuzzle, NUMBER_PUZZLE } from './numberPuzzle.js';
import {
  checkAnswer,
  createFinalState,
  createPracticeState,
  formatNumber,
  isPracticeFinalShortcut,
  makeQuestionSet,
  resolveFinalAnswer,
  resolvePracticeAnswer
} from './quizEngine.js';

import titleImage from '../1.jpg';
import introImage from '../94inhoudinliters.jpg';
import schemaTitleImage from '../3.jpg';
import schemaBaseImage from '../4.jpg';
import schemaRightImage from '../5.jpg';
import schemaFullImage from '../6.jpg';
import answersSelfImage from '../antwoordfenzelfoef.jpg';
import literImage from '../litermaten.jpg';
import geometryImage from '../meetkundige inhoudsmaten.jpg';
import summaryImage from '../samengevat.jpg';
import togetherImage from '../samenoefenen.jpg';
import planImage from '../stappenplan.jpg';
import selfPracticeImage from '../startzelfoefenen.jpg';
import togetherAnswersImage from '../uitwerkingsamenoef.jpg';
import exampleImage from '../voorbeeldvraag.jpg';
import exampleTwoImage from '../voorbeeldvraag2.jpg';

const app = document.querySelector('#app');
const canvas = document.querySelector('#space-canvas');
const FIRST_LESSON_SLIDE_COUNT = 18;
const NEXT_SERIES_START_INDEX = FIRST_LESSON_SLIDE_COUNT;

const slides = buildLessonSlides({
  titleImage,
  introImage,
  schemaTitleImage,
  schemaBaseImage,
  schemaRightImage,
  schemaFullImage,
  selfPracticeImage,
  answersSelfImage,
  literImage,
  geometryImage,
  togetherImage,
  exampleImage,
  exampleTwoImage,
  togetherAnswersImage,
  planImage,
  summaryImage
});

let view = 'slides';
let slideIndex = 0;
let practiceState = createPracticeState(20);
let finalState = createFinalState();
let practiceQuestions = makeQuestionSet(20, 0);
let finalQuestions = makeQuestionSet(40, 7);
let activeQuestion = null;
let lastResult = null;
let locked = false;
let activeSlideScene = null;
let puzzleValues = Array(NUMBER_PUZZLE.size * NUMBER_PUZZLE.size).fill('');
let puzzleSolved = false;
let puzzleScratchpad = '';

function render() {
  cleanupSlideScene();

  if (view === 'slides') renderSlide();
  if (view === 'rules') renderRules();
  if (view === 'practice') renderPractice();
  if (view === 'practice-feedback') renderPracticeFeedback();
  if (view === 'final-rules') renderFinalRules();
  if (view === 'final') renderFinal();
  if (view === 'final-feedback') renderFinalFeedback();
  if (view === 'win') renderWin();

  animateIn();
}

function renderShell(content) {
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Omrekenen</p>
          <h1>${getHeaderTitle()}</h1>
        </div>
        ${renderStageNavigation()}
      </header>
      ${content}
    </main>
  `;
}

function renderSlide() {
  const slide = slides[slideIndex];
  if (slide.variant === 'liter-dm3') {
    renderLiterDm3Slide(slide);
    return;
  }
  if (slide.variant === 'blank-next-series') {
    renderBlankNextSeriesSlide();
    return;
  }
  if (slide.variant === 'number-puzzle') {
    renderNumberPuzzleSlide(slide);
    return;
  }

  renderShell(`
    <section class="${slide.variant === 'prefixes' ? 'prefix-slide' : 'lesson-grid'} screen-panel">
      <figure class="image-frame ${slide.supportImage ? 'image-frame-stacked' : ''}">
        ${slide.supportImage ? `<img class="support-image" src="${slide.supportImage}" alt="${slide.supportAlt ?? 'Omrekenschema'}" />` : ''}
        <img src="${slide.image}" alt="${slide.title}" />
      </figure>
      <article class="lesson-copy">
        <p class="kicker">${slide.kicker}</p>
        <h2>${slide.title}</h2>
        <p>${slide.body}</p>
        ${slide.variant === 'prefixes' ? renderPrefixBoard(slide) : ''}
        <div class="progress">
          <span style="width: ${getSlideProgressPercent()}%"></span>
        </div>
        <p class="progress-text">${getSlideProgressText()}</p>
      </article>
    </section>
    ${renderSlideControls()}
  `);
}

function renderBlankNextSeriesSlide() {
  renderShell(`
    <section class="screen-panel blank-slide" aria-label="Lege dia 19"></section>
    ${renderSlideControls()}
  `);
}

function renderNumberPuzzleSlide(slide) {
  if (puzzleSolved) {
    renderShell(`
      <section class="screen-panel puzzle-win-panel">
        <p class="kicker">Puzzel opgelost</p>
        <h2>Alles klopt.</h2>
        <p>Mooi gerekend. Je mag door naar dia 20.</p>
        <button class="primary-button wide" type="button" data-action="next">Verder naar dia 20</button>
      </section>
    `);
    return;
  }

  renderShell(`
    <section class="screen-panel number-puzzle-slide">
      <div class="puzzle-clues">
        <p class="kicker">${slide.kicker}</p>
        <h2>${slide.title}</h2>
        <p>${slide.body}</p>
        <div class="puzzle-clue-columns">
          ${renderPuzzleClues('Horizontaal', NUMBER_PUZZLE.horizontal)}
          ${renderPuzzleClues('Verticaal', NUMBER_PUZZLE.vertical)}
        </div>
      </div>
      <div class="puzzle-workspace">
        ${renderPuzzleGrid()}
        <label class="scratchpad-label" for="scratchpad">Kladblaadje</label>
        <textarea id="scratchpad" class="scratchpad" spellcheck="false" aria-label="Kladblaadje voor berekeningen">${puzzleScratchpad}</textarea>
        <button class="primary-button wide" type="button" data-action="check-puzzle">Kijk na</button>
      </div>
    </section>
    ${renderSlideControls()}
  `);

  gsap.fromTo('.puzzle-cell', { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.28, stagger: 0.006, ease: 'back.out(1.8)' });
}

function renderPuzzleClues(title, clues) {
  return `
    <section class="puzzle-clue-list" aria-label="${title}">
      <h3>${title}</h3>
      ${clues
        .map(([letter, clue]) => `<p><strong>${letter}</strong><span>${clue}</span></p>`)
        .join('')}
    </section>
  `;
}

function renderPuzzleGrid() {
  const starts = new Map([
    [0, 'a'], [4, 'b'], [8, 'c'], [12, 'd'], [16, 'e'], [20, 'f'], [24, 'g'], [28, 'h'],
    [32, 'i'], [36, 'j'], [40, 'k'], [44, 'l'], [48, 'm'], [52, 'n'], [56, 'o'], [60, 'p']
  ]);

  return `
    <div class="puzzle-grid" style="--puzzle-size: ${NUMBER_PUZZLE.size}" aria-label="Rekenkruiswoord puzzel">
      ${puzzleValues
        .map(
          (value, index) => `
            <label class="puzzle-cell">
              ${starts.has(index) ? `<span>${starts.get(index)}</span>` : ''}
              <input data-puzzle-index="${index}" value="${value}" inputmode="numeric" maxlength="1" aria-label="Puzzelvak ${index + 1}" />
            </label>
          `
        )
        .join('')}
    </div>
  `;
}

function renderLiterDm3Slide(slide) {
  renderShell(`
    <section class="screen-panel liter-dm3-slide">
      <div class="liter-dm3-copy">
        <p class="kicker">${slide.kicker}</p>
        <h2>${slide.title}</h2>
        <p>${slide.body}</p>
        <div class="liter-dm3-facts">
          <div><strong>1 liter</strong><span>de hoeveelheid water in de maatbeker</span></div>
          <div><strong>1 dm3</strong><span>de ruimte in een kubus van 1 dm bij 1 dm bij 1 dm</span></div>
        </div>
        <div class="liter-dm3-progress" aria-label="Gietvoortgang">
          <span data-pour-progress></span>
        </div>
        <p class="liter-dm3-status" data-pour-status>0 L = 0 dm3</p>
        <div class="liter-dm3-conclusion" data-pour-conclusion hidden>
          De maatbeker bevat 1 liter water. De kubus heeft een inhoud van 1 dm3.
          Het water past er precies in. Dus: 1 liter = 1 dm3.
        </div>
        <div class="liter-dm3-actions" aria-label="Animatieknoppen">
          <button class="primary-button" type="button" data-liter-action="start" aria-label="Giet 1 liter in de kubus">
            Giet 1 liter in de kubus
          </button>
          <button class="icon-button" type="button" data-liter-action="pause" aria-label="Pauzeer of speel verder">
            Pauze
          </button>
          <button class="icon-button" type="button" data-liter-action="reset" aria-label="Reset de animatie">
            Reset
          </button>
        </div>
        <div class="progress">
          <span style="width: ${getSlideProgressPercent()}%"></span>
        </div>
        <p class="progress-text">${getSlideProgressText()}</p>
      </div>
      <div class="liter-dm3-scene" data-liter-dm3-root>
        <canvas data-liter-dm3-canvas aria-label="3D animatie van 1 liter water dat in een kubus van 1 dm3 wordt gegoten"></canvas>
        <button class="scene-focus-button" type="button" data-liter-action="focus" aria-label="Toon de animatie fullscreen">
          Fullscreen
        </button>
        <div class="scene-label cube-formula-label">Kubus is 1 dm x 1 dm x 1 dm = 1 dm3</div>
        <div class="scene-label cup-label">1 liter</div>
        <p class="scene-drag-hint">Sleep de maatbeker boven de kubus om te gieten.</p>
      </div>
    </section>
    ${renderSlideControls()}
  `);

  const root = document.querySelector('.liter-dm3-slide');
  activeSlideScene = mountLiterDm3Scene({ root, THREE, gsap });
}

function renderSlideControls() {
  const isFirstSlide = slideIndex === 0;
  const isFirstLessonEnd = slideIndex === FIRST_LESSON_SLIDE_COUNT - 1;
  const isLastSlide = slideIndex === slides.length - 1;
  const isLockedPuzzle = slides[slideIndex]?.variant === 'number-puzzle' && !puzzleSolved;

  return `
    <nav class="controls" aria-label="Presentatieknoppen">
      <button class="icon-button" type="button" data-action="prev" ${isFirstSlide ? 'disabled' : ''} title="Terug">
        <span aria-hidden="true">←</span><span>Terug</span>
      </button>
      <button class="primary-button" type="button" data-action="${isFirstLessonEnd ? 'rules' : 'next'}" ${isLastSlide || isLockedPuzzle ? 'disabled' : ''}>
        <span>${isFirstLessonEnd ? 'Exit ticket' : 'Verder'}</span><span aria-hidden="true">→</span>
      </button>
    </nav>
  `;
}

function cleanupSlideScene() {
  activeSlideScene?.destroy?.();
  activeSlideScene = null;
}

function renderPrefixBoard(slide) {
  return `
    <div class="prefix-board" aria-label="Uitleg over voorvoegsels">
      <div class="base-liter">
        <span class="base-letter">L</span>
        <div>
          <strong>liter</strong>
          <span>De L blijft staan. Het voorvoegsel komt ervoor.</span>
        </div>
      </div>
      <div class="prefix-list">
        ${slide.prefixes
          .map(
            (item) => `
              <div class="prefix-card">
                <span class="prefix-symbol">${item.symbol}</span>
                <div>
                  <strong>${item.prefix}</strong>
                  <span>${item.prefix} = ${item.part} = ${item.liter}</span>
                </div>
                <b>${item.symbol} + L = ${item.unit}</b>
              </div>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderRules() {
  renderShell(`
    <section class="screen-panel rules-panel">
      <div>
        <p class="kicker">Exit ticket</p>
        <h2>Ronde 1: met hulpschema</h2>
        <p>Je krijgt 20 oefeningen. Na elk antwoord zie je of het goed of fout was.</p>
      </div>
      <div class="rule-grid">
        <div><strong>Schema zichtbaar</strong><span>Je mag het literschema boven in beeld gebruiken.</span></div>
        <div><strong>Teller</strong><span>Aantal goed en fout blijft in beeld.</span></div>
        <div><strong>Door naar finale</strong><span>Minder dan 10 fout? Dan mag je door.</span></div>
        <div><strong>Opnieuw</strong><span>Meer dan 10 fout? Dan start ronde 1 opnieuw.</span></div>
      </div>
      <button class="primary-button wide" type="button" data-action="start-practice">Start ronde 1</button>
    </section>
  `);
}

function renderPractice() {
  activeQuestion = practiceQuestions[practiceState.current];
  renderShell(`
    <section class="game-layout">
      ${renderScorebar(practiceState, 'Vraag', true)}
      <figure class="schema-strip">
        <img src="${schemaFullImage}" alt="Omrekenschema L dL cL mL" />
      </figure>
      ${renderQuestionCard(activeQuestion, 'Controleer')}
    </section>
  `);
  focusAnswer();
}

function renderPracticeFeedback() {
  const passed = practiceState.readyForFinal;
  const restart = practiceState.shouldRestart;
  renderShell(`
    <section class="screen-panel feedback-panel ${lastResult.correct ? 'is-correct' : 'is-wrong'}">
      <p class="kicker">${lastResult.correct ? 'Goed' : 'Nog niet'}</p>
      <h2>${lastResult.correct ? 'Dat klopt.' : 'Het juiste antwoord is ' + formatNumber(lastResult.answer) + ' ' + lastResult.to}</h2>
      <p>${getPracticeFeedbackText(passed, restart)}</p>
      ${renderMiniScore(practiceState)}
      <button class="primary-button wide" type="button" data-action="${restart ? 'restart-practice' : passed ? 'final-rules' : 'next-practice'}">
        ${restart ? 'Ronde opnieuw starten' : passed ? 'Naar finale' : 'Volgende vraag'}
      </button>
    </section>
  `);
}

function renderFinalRules() {
  renderShell(`
    <section class="screen-panel rules-panel">
      <div>
        <p class="kicker">Finale ronde</p>
        <h2>10 op een rij goed</h2>
        <p>Nu is er geen hulpschema. Je ziet alleen je voortgang en de score.</p>
      </div>
      <div class="rule-grid">
        <div><strong>Zonder schema</strong><span>Gebruik je stappenplan in je hoofd.</span></div>
        <div><strong>Streak</strong><span>Elke goede vraag telt mee voor je reeks.</span></div>
        <div><strong>Fout antwoord</strong><span>De reeks start weer op 0 goede.</span></div>
        <div><strong>Winnen</strong><span>Bij 10 goede antwoorden op een rij win je.</span></div>
      </div>
      <button class="primary-button wide" type="button" data-action="start-final">Start finale</button>
    </section>
  `);
}

function renderFinal() {
  activeQuestion = finalQuestions[finalState.current % finalQuestions.length];
  renderShell(`
    <section class="game-layout final-mode">
      ${renderFinalScorebar()}
      ${renderQuestionCard(activeQuestion, 'Antwoord')}
    </section>
  `);
  focusAnswer();
}

function renderFinalFeedback() {
  renderShell(`
    <section class="screen-panel feedback-panel ${lastResult.correct ? 'is-correct' : 'is-wrong'}">
      <p class="kicker">${lastResult.correct ? 'Goed' : 'Fout'}</p>
      <h2>${lastResult.correct ? `Reeks: ${finalState.correctStreak} van 10` : 'Je reeks begint weer bij 0'}</h2>
      <p>Juiste antwoord: ${formatNumber(lastResult.answer)} ${lastResult.to}</p>
      ${renderFinalScorebar()}
      <button class="primary-button wide" type="button" data-action="next-final">Volgende vraag</button>
    </section>
  `);
}

function renderWin() {
  locked = true;
  renderShell(`
    <section class="screen-panel win-panel">
      <p class="kicker">Gewonnen</p>
      <h2>Gefeliciteerd!</h2>
      <p>Je hebt 10 omrekeningen op een rij goed gemaakt.</p>
      <strong>Laat je docent zien dat je gewonnen hebt.</strong>
      <p class="teacher-note">Docent: ontgrendel met Shift + spatie. Daarna ga je naar dia 19.</p>
    </section>
  `);
}

function renderScorebar(state, label, showSchema) {
  const percent = Math.min(100, (state.current / state.total) * 100);
  return `
    <section class="scorebar ${showSchema ? '' : 'compact'}">
      <span>${label} ${Math.min(state.current + 1, state.total)} van ${state.total}</span>
      <div class="progress"><span style="width: ${percent}%"></span></div>
      <span>Goed: ${state.correct}</span>
      <span>Fout: ${state.wrong}</span>
    </section>
  `;
}

function renderFinalScorebar() {
  const percent = Math.min(100, (finalState.correctStreak / 10) * 100);
  return `
    <section class="scorebar compact">
      <span>Reeks ${finalState.correctStreak} van 10</span>
      <div class="progress"><span style="width: ${percent}%"></span></div>
      <span>Goed: ${finalState.correct}</span>
      <span>Fout: ${finalState.wrong}</span>
    </section>
  `;
}

function renderMiniScore(state) {
  return `<div class="mini-score"><span>Goed: ${state.correct}</span><span>Fout: ${state.wrong}</span></div>`;
}

function renderQuestionCard(question, buttonLabel) {
  return `
    <form class="question-card" data-action="answer">
      <p class="kicker">Reken om</p>
      <label for="answer">${question.prompt}</label>
      <div class="answer-row">
        <input id="answer" name="answer" inputmode="decimal" autocomplete="off" placeholder="..." />
        <span>${question.to}</span>
      </div>
      <button class="primary-button wide" type="submit">${buttonLabel}</button>
    </form>
  `;
}

function getHeaderTitle() {
  if (view === 'slides') return 'Lespresentatie';
  if (view.includes('final')) return 'Finale ronde';
  if (view === 'win') return 'Winscherm';
  return 'Exit ticket';
}

function getStageLabel() {
  if (view === 'slides') return `${slideIndex + 1}/${slides.length}`;
  if (view.includes('final')) return 'Finale';
  if (view === 'win') return 'Gewonnen';
  return 'Oefenen';
}

function renderStageNavigation() {
  if (view !== 'slides') {
    return `<div class="stage-pill">${getStageLabel()}</div>`;
  }

  const inNextSeries = slideIndex >= NEXT_SERIES_START_INDEX;
  const yellowLabel = inNextSeries ? `1/${FIRST_LESSON_SLIDE_COUNT}` : `${slideIndex + 1}/${FIRST_LESSON_SLIDE_COUNT}`;
  const greenLabel = inNextSeries ? `${slideIndex + 1}/${slides.length}` : `${NEXT_SERIES_START_INDEX + 1}/${slides.length}`;

  return `
    <div class="stage-nav" aria-label="Diareeksen">
      <button class="stage-pill stage-pill-yellow ${inNextSeries ? '' : 'is-active'}" type="button" data-action="jump-first-series" aria-label="Ga naar dia 1">
        ${yellowLabel}
      </button>
      <button class="stage-pill stage-pill-green ${inNextSeries ? 'is-active' : ''}" type="button" data-action="jump-next-series" aria-label="Ga naar dia 19">
        ${greenLabel}
      </button>
    </div>
  `;
}

function getSlideProgressPercent() {
  if (slideIndex < NEXT_SERIES_START_INDEX) {
    return ((slideIndex + 1) / FIRST_LESSON_SLIDE_COUNT) * 100;
  }

  const nextSeriesCount = Math.max(1, slides.length - NEXT_SERIES_START_INDEX);
  return ((slideIndex - NEXT_SERIES_START_INDEX + 1) / nextSeriesCount) * 100;
}

function getSlideProgressText() {
  if (slideIndex < NEXT_SERIES_START_INDEX) {
    return `Dia ${slideIndex + 1} van ${FIRST_LESSON_SLIDE_COUNT}`;
  }

  return `Dia ${slideIndex + 1} van ${slides.length}`;
}

function getPracticeFeedbackText(passed, restart) {
  if (restart) return 'Je hebt meer dan 10 fouten. We oefenen ronde 1 opnieuw met het schema in beeld.';
  if (passed) return 'Je hebt minder dan 10 fouten. Je mag door naar de finale.';
  return 'Bekijk de stap in het schema en ga verder met de volgende som.';
}

function submitAnswer(form) {
  const answer = form.elements.answer.value;
  const correct = checkAnswer(answer, activeQuestion.answer);
  lastResult = { ...activeQuestion, correct };

  if (view === 'practice') {
    practiceState = resolvePracticeAnswer(practiceState, correct);
    view = 'practice-feedback';
  } else {
    finalState = resolveFinalAnswer(finalState, correct);
    view = finalState.won ? 'win' : 'final-feedback';
  }

  render();
}

function restartPractice() {
  practiceState = createPracticeState(20);
  practiceQuestions = makeQuestionSet(20, practiceQuestions.length + finalState.current);
  view = 'practice';
  render();
}

function resetForTeacher() {
  locked = false;
  slideIndex = NEXT_SERIES_START_INDEX;
  practiceState = createPracticeState(20);
  finalState = createFinalState();
  view = 'slides';
  render();
}

function animateIn() {
  gsap.fromTo(
    '.shell',
    { autoAlpha: 0, y: 18 },
    { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }
  );
}

function focusAnswer() {
  requestAnimationFrame(() => {
    document.querySelector('#answer')?.focus();
  });
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || locked) return;

  const action = button.dataset.action;
  if (!action) return;

  if (action === 'prev') slideIndex = Math.max(0, slideIndex - 1);
  if (action === 'next') slideIndex = Math.min(slides.length - 1, slideIndex + 1);
  if (action === 'jump-first-series') slideIndex = 0;
  if (action === 'jump-next-series') slideIndex = NEXT_SERIES_START_INDEX;
  if (action === 'check-puzzle') checkPuzzle();
  if (action === 'rules') view = 'rules';
  if (action === 'start-practice') restartPractice();
  if (action === 'restart-practice') restartPractice();
  if (action === 'next-practice') view = 'practice';
  if (action === 'final-rules') view = 'final-rules';
  if (action === 'start-final') {
    finalState = createFinalState();
    view = 'final';
  }
  if (action === 'next-final') view = 'final';

  render();
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  if (locked) return;
  submitAnswer(event.target);
});

app.addEventListener('input', (event) => {
  if (event.target.matches('.scratchpad')) {
    puzzleScratchpad = event.target.value;
    return;
  }

  const input = event.target.closest('[data-puzzle-index]');
  if (!input || locked) return;

  input.value = input.value.replace(/\D/g, '').slice(-1);
  const index = Number(input.dataset.puzzleIndex);
  puzzleValues[index] = input.value;

  if (input.value) {
    const nextInput = document.querySelector(`[data-puzzle-index="${index + 1}"]`);
    nextInput?.focus();
  }
});

function checkPuzzle() {
  const result = checkNumberPuzzle(puzzleValues);
  puzzleValues = result.clearedValues;
  puzzleSolved = result.complete;
  render();

  if (puzzleSolved) {
    gsap.fromTo('.puzzle-win-panel', { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(1.7)' });
  } else {
    gsap.fromTo('.puzzle-cell input[value=""]', { backgroundColor: '#ffe9e6' }, { backgroundColor: '#ffffff', duration: 0.7, ease: 'power2.out' });
  }
}

window.addEventListener(
  'keydown',
  (event) => {
    if (locked) {
      if (event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        resetForTeacher();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (isPracticeFinalShortcut(event, view)) {
      event.preventDefault();
      view = 'final-rules';
      render();
      return;
    }

    if (view !== 'slides') return;
    if (event.key === 'ArrowLeft') {
      slideIndex = Math.max(0, slideIndex - 1);
      render();
    }
    if (event.key === 'ArrowRight') {
      if (slideIndex === FIRST_LESSON_SLIDE_COUNT - 1) view = 'rules';
      else slideIndex = Math.min(slides.length - 1, slideIndex + 1);
      render();
    }
  },
  true
);

function initThree() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x2f9fbe,
    roughness: 0.54,
    metalness: 0.08,
    transparent: true,
    opacity: 0.26
  });
  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const light = new THREE.DirectionalLight(0xffffff, 2);
  const ambient = new THREE.AmbientLight(0xffffff, 1.8);

  camera.position.z = 8;
  light.position.set(3, 4, 5);
  scene.add(light, ambient, group);

  for (let index = 0; index < 18; index += 1) {
    const cube = new THREE.Mesh(geometry, material.clone());
    cube.position.set((index % 6) - 2.5, Math.floor(index / 6) - 1, -index * 0.06);
    cube.rotation.set(index * 0.24, index * 0.17, index * 0.1);
    cube.material.opacity = 0.12 + (index % 4) * 0.04;
    group.add(cube);
  }

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function tick() {
    group.rotation.x += 0.0015;
    group.rotation.y += 0.0025;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
}

initThree();
render();
