import { gsap } from 'gsap';
import * as THREE from 'three';
import './styles.css';
import { calculateNextState, formatCalculatorDisplay } from './calculator.js';
import { buildLessonSlides } from './lessonSlides.js';
import {
  createFlashcardState,
  FLASHCARDS,
  flipFlashcard,
  getFlashcard,
  resolveFlashcard
} from './flashcards.js';
import {
  checkCircleExercise,
  CIRCLE_EXERCISE,
  hasAllCircleInputsFilled
} from './circleExercise.js';
import { mountLiterDm3Scene } from './literDm3Scene.js';
import { checkNumberPuzzle, NUMBER_PUZZLE } from './numberPuzzle.js';
import { checkPaintExercise, PAINT_EXERCISE } from './paintExercise.js';
import {
  checkAnswer,
  createEndlessPracticeState,
  createFinalState,
  createPracticeState,
  formatNumber,
  isPracticeFinalShortcut,
  isSlideDevModeShortcut,
  makeEndlessQuestion,
  makeQuestionSet,
  resolveEndlessPracticeAnswer,
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
import paintQuestionImage from '../paint-question.svg';

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

let view = 'home';
let slideIndex = 0;
let practiceState = createPracticeState(20);
let finalState = createFinalState();
let endlessState = createEndlessPracticeState();
let practiceQuestions = makeQuestionSet(20, 0);
let finalQuestions = makeQuestionSet(40, 7);
let endlessQuestionIndex = 0;
let activeQuestion = null;
let lastResult = null;
let lastEndlessResult = null;
let locked = false;
let activeSlideScene = null;
let puzzleValues = Array(NUMBER_PUZZLE.rows * NUMBER_PUZZLE.cols).fill('');
let puzzleSolved = false;
let puzzleScratchpad = '';
let circleValues = Object.fromEntries(Object.keys(CIRCLE_EXERCISE.answers).map((key) => [key, '']));
let circleCheckResult = null;
let circleSolved = false;
let circleScratchpad = '';
let calculatorExpression = '';
let calculatorDisplay = '0';
let paintAnswer = '';
let paintScratchpad = '';
let paintResult = null;
let flashcardState = createFlashcardState();
let devMode = false;

function render() {
  cleanupSlideScene();

  if (view === 'home') renderHome();
  if (view === 'slides') renderSlide();
  if (view === 'extra-practice') renderExtraPractice();
  if (view === 'endless') renderEndlessPractice();
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

function renderPracticeShell(content) {
  app.innerHTML = `
    <main class="shell practice-shell">
      ${content}
    </main>
  `;
}

function renderHome() {
  renderShell(`
    <section class="screen-panel home-panel">
      <div>
        <p class="kicker">Start</p>
        <h2>Kies je route</h2>
      </div>
      <div class="start-choice-grid">
        <button class="choice-card" type="button" data-action="start-lesson">
          <span>Knop 1</span>
          <strong>Oefenen in de les</strong>
        </button>
        <button class="choice-card choice-card-yellow" type="button" data-action="extra-practice">
          <span>Knop 2</span>
          <strong>Extra oefenen en voorbereiden voor de toets</strong>
        </button>
      </div>
    </section>
  `);
}

function renderExtraPractice() {
  renderShell(`
    <section class="screen-panel exercise-menu-panel">
      <div>
        <p class="kicker">Extra oefenen</p>
        <h2>Kies een oefening</h2>
      </div>
      <div class="exercise-choice-list">
        <button class="exercise-card" type="button" data-action="start-endless">
          <span>Oefening 1</span>
          <strong>Oneindig omrekenen</strong>
          <small>L, dL, cL, mL, cm3 en dm3 door elkaar.</small>
        </button>
      </div>
      <button class="icon-button wide" type="button" data-action="home">Terug naar startscherm</button>
    </section>
  `);
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
  if (slide.variant === 'circle-table') {
    renderCircleTableSlide(slide);
    return;
  }
  if (slide.variant === 'paint-question') {
    renderPaintQuestionSlide(slide);
    return;
  }
  if (slide.variant === 'flashcards') {
    renderFlashcardSlide(slide);
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
    <section class="screen-panel blank-slide" aria-label="Lege dia"></section>
    ${renderSlideControls()}
  `);
}

function renderCircleTableSlide(slide) {
  const canCheck = hasAllCircleInputsFilled(circleValues);
  const statusText = getCircleStatusText(canCheck);

  renderShell(`
    <section class="screen-panel circle-exercise-slide">
      <div class="circle-exercise-main">
        <div class="circle-question">
          <p class="kicker">${slide.kicker}</p>
          <h2>${slide.title}</h2>
          <p class="circle-rounding-note">${slide.body}</p>
          <p class="circle-instruction">Vul de ontbrekende gegevens van de cirkels A, B en C in de tabel in.</p>
          ${renderCircleTable()}
          <div class="circle-check-row">
            <button class="primary-button" type="button" data-action="check-circle-table" ${canCheck ? '' : 'disabled'}>
              Nakijken
            </button>
            <p class="circle-status ${circleSolved ? 'is-correct' : ''}" data-circle-status>${statusText}</p>
          </div>
        </div>
        ${renderCalculator()}
      </div>
      <label class="scratchpad-label" for="circle-scratchpad">Kladblaadje</label>
      <textarea id="circle-scratchpad" class="scratchpad circle-scratchpad" spellcheck="false" aria-label="Kladblaadje voor berekeningen">${circleScratchpad}</textarea>
    </section>
    ${renderSlideControls()}
  `);
}

function renderCircleTable() {
  return `
    <table class="circle-table">
      <thead>
        <tr>
          <th></th>
          ${CIRCLE_EXERCISE.columns.map((column) => `<th>cirkel ${column}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${CIRCLE_EXERCISE.rows
          .map(
            (row) => `
              <tr>
                <th scope="row">${row.label === 'oppervlakte in cm2' ? 'oppervlakte in cm<sup>2</sup>' : row.label}</th>
                ${CIRCLE_EXERCISE.columns.map((column) => renderCircleCell(`${row.key}-${column}`)).join('')}
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderCircleCell(key) {
  const given = CIRCLE_EXERCISE.given[key];
  if (given) return `<td class="circle-given">${given}</td>`;

  const result = circleCheckResult?.fields?.[key];
  const className = result ? `is-${result.status}` : '';
  const label = key.replace('-', ' cirkel ');

  return `
    <td>
      <input
        class="${className}"
        data-circle-key="${key}"
        value="${circleValues[key] ?? ''}"
        inputmode="decimal"
        autocomplete="off"
        aria-label="${label}"
      />
    </td>
  `;
}

function renderCalculator() {
  const keys = ['clear', 'back', 'pi', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', ',', '='];

  return `
    <aside class="calculator" aria-label="Rekenmachine">
      <div class="calculator-display" data-calculator-display>${calculatorDisplay}</div>
      <div class="calculator-grid">
        ${keys
          .map(
            (key) => `<button type="button" data-calc="${key}" class="${key === '=' ? 'is-equals' : ''}">${getCalculatorButtonLabel(key)}</button>`
          )
          .join('')}
      </div>
    </aside>
  `;
}

function getCalculatorButtonLabel(key) {
  if (key === 'clear') return 'C';
  if (key === 'back') return 'Back';
  if (key === 'pi') return 'π';
  return formatCalculatorDisplay(key);
}

function getCircleStatusText(canCheck) {
  if (circleSolved) return 'Alles is goed. Je mag door naar de volgende dia.';
  if (!canCheck) return 'Vul eerst alle open vakjes in.';
  if (!circleCheckResult) return 'Alle vakjes zijn ingevuld. Je kunt nakijken.';

  const roundingCount = Object.values(circleCheckResult.fields).filter((field) => field.status === 'rounding').length;
  if (roundingCount > 0) {
    return 'Een of meer antwoorden zijn goed berekend, maar niet afgerond op 1 decimaal.';
  }
  return 'Verbeter de rode vakjes en probeer opnieuw.';
}

function renderPaintQuestionSlide(slide) {
  const feedbackClass = paintResult ? `is-${paintResult.status}` : '';
  const answerClass = paintResult?.status === 'correct' ? 'is-correct' : paintResult?.status === 'wrong' ? 'is-wrong' : '';

  renderShell(`
    <section class="screen-panel paint-question-slide">
      <div class="paint-question-copy">
        <p class="kicker">${slide.kicker}</p>
        <h2>${slide.title}</h2>
        <p>${slide.body}</p>
        <article class="paint-problem">
          <p>${PAINT_EXERCISE.question}</p>
        </article>
        <label class="scratchpad-label" for="paint-scratchpad">Kladblaadje met berekening</label>
        <textarea id="paint-scratchpad" class="scratchpad paint-scratchpad" data-paint-scratchpad spellcheck="false" aria-label="Kladblaadje voor berekening">${paintScratchpad}</textarea>
        <label class="paint-answer-label" for="paint-answer">Antwoord</label>
        <input id="paint-answer" class="paint-answer ${answerClass}" data-paint-answer value="${paintAnswer}" autocomplete="off" />
        <div class="paint-check-row">
          <button class="primary-button" type="button" data-action="check-paint-question">Nakijken</button>
          <p class="paint-feedback ${feedbackClass}" data-paint-feedback>${paintResult?.message ?? 'Maak eerst je berekening op het kladblaadje.'}</p>
        </div>
      </div>
      <figure class="paint-illustration">
        <img src="${paintQuestionImage}" alt="Illustratie van een verfblik met diameter 12 cm en hoogte 20 cm" />
      </figure>
    </section>
    ${renderSlideControls()}
  `);
}

function renderFlashcardSlide(slide) {
  const card = getFlashcard(flashcardState);
  const current = Math.min(flashcardState.index + 1, FLASHCARDS.length);
  const percent = flashcardState.completed ? 100 : (flashcardState.index / FLASHCARDS.length) * 100;

  renderShell(`
    <section class="screen-panel flashcard-slide">
      <div class="flashcard-intro">
        <p class="kicker">${slide.kicker}</p>
        <h2>${slide.title}</h2>
        <p>${slide.body}</p>
      </div>
      <div class="flashcard-game">
        <div class="flashcard-scorebar" aria-label="Flashcard voortgang">
          <span>Kaart ${current} van ${FLASHCARDS.length}</span>
          <div class="progress"><span style="width: ${percent}%"></span></div>
          <span>Wist ik: ${flashcardState.known}</span>
          <span>Oefenen: ${flashcardState.practice}</span>
        </div>
        ${
          flashcardState.completed
            ? renderFlashcardComplete()
            : `
              <button class="flashcard ${flashcardState.flipped ? 'is-flipped' : ''}" type="button" data-action="flip-flashcard" aria-label="Draai flashcard om">
                <span class="flashcard-label">${flashcardState.flipped ? 'Antwoord' : 'Vraag'}</span>
                <strong>${flashcardState.flipped ? card.back : card.front}</strong>
              </button>
              <div class="flashcard-actions">
                <button class="icon-button" type="button" data-action="flip-flashcard">${flashcardState.flipped ? 'Terug naar vraag' : 'Draai om'}</button>
                <button class="icon-button" type="button" data-action="flashcard-practice" ${flashcardState.flipped ? '' : 'disabled'}>Nog oefenen</button>
                <button class="primary-button" type="button" data-action="flashcard-known" ${flashcardState.flipped ? '' : 'disabled'}>Wist ik</button>
              </div>
            `
        }
      </div>
    </section>
    ${renderSlideControls()}
  `);

  gsap.fromTo('.flashcard', { rotateY: flashcardState.flipped ? -8 : 8, autoAlpha: 0.82 }, { rotateY: 0, autoAlpha: 1, duration: 0.34, ease: 'power2.out' });
}

function renderFlashcardComplete() {
  return `
    <section class="flashcard-complete">
      <p class="kicker">Klaar</p>
      <h3>Flashcards afgerond</h3>
      <p>Wist ik: ${flashcardState.known}. Nog oefenen: ${flashcardState.practice}.</p>
      <button class="primary-button wide" type="button" data-action="reset-flashcards">Opnieuw oefenen</button>
    </section>
  `;
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
  const cells = NUMBER_PUZZLE.solutionRows.flatMap((row) => row.split(''));

  return `
    <div class="puzzle-grid" style="--puzzle-cols: ${NUMBER_PUZZLE.cols}" aria-label="Rekenkruiswoord puzzel">
      ${cells
        .map(
          (cell, index) =>
            cell === '#'
              ? '<div class="puzzle-cell puzzle-cell-block" aria-hidden="true"></div>'
              : `
            <label class="puzzle-cell">
              ${NUMBER_PUZZLE.starts[index] ? `<span>${NUMBER_PUZZLE.starts[index]}</span>` : ''}
              <input data-puzzle-index="${index}" value="${puzzleValues[index]}" inputmode="numeric" maxlength="1" aria-label="Puzzelvak ${index + 1}" />
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
  const isLockedExercise = isCurrentSlideProgressLocked();

  return `
    <nav class="controls" aria-label="Presentatieknoppen">
      <button class="icon-button" type="button" data-action="prev" ${isFirstSlide ? 'disabled' : ''} title="Terug">
        <span aria-hidden="true">←</span><span>Terug</span>
      </button>
      <button class="primary-button" type="button" data-action="${isFirstLessonEnd ? 'rules' : 'next'}" ${isLastSlide || (isLockedExercise && !devMode) ? 'disabled' : ''}>
        <span>${isFirstLessonEnd ? 'Exit ticket' : 'Verder'}</span><span aria-hidden="true">→</span>
      </button>
    </nav>
  `;
}

function isCurrentSlideProgressLocked() {
  const variant = slides[slideIndex]?.variant;
  if (variant === 'number-puzzle') return !puzzleSolved;
  if (variant === 'circle-table') return !circleSolved;
  return false;
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

function renderEndlessPractice() {
  activeQuestion = makeEndlessQuestion(endlessQuestionIndex);
  renderPracticeShell(`
    <section class="game-layout endless-mode">
      ${renderEndlessScorebar()}
      <figure class="schema-strip">
        <img src="${schemaFullImage}" alt="Omrekenschema L dL cL mL" />
      </figure>
      ${renderQuestionCard(activeQuestion, 'Controleer', renderEndlessFeedback())}
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

function renderEndlessScorebar() {
  const progress = Math.min(100, ((endlessState.played % 20) / 20) * 100);

  return `
    <section class="scorebar endless-scorebar">
      <button class="back-link-button" type="button" data-action="home">Terug</button>
      <span>Vraag ${endlessState.played + 1}</span>
      <div class="progress"><span style="width: ${progress}%"></span></div>
      <span>Goed: ${endlessState.correct}</span>
      <span>Fout: ${endlessState.wrong}</span>
      <span>Totaal: ${endlessState.played}</span>
      <span>Record: ${endlessState.bestStreak}</span>
    </section>
  `;
}

function renderEndlessFeedback() {
  if (!lastEndlessResult) return '';

  const text = lastEndlessResult.correct
    ? `Goed. Reeks: ${endlessState.correctStreak}`
    : `Fout. Het juiste antwoord was ${formatNumber(lastEndlessResult.answer)} ${lastEndlessResult.to}.`;

  return `<p class="answer-feedback ${lastEndlessResult.correct ? 'is-correct' : 'is-wrong'}">${text}</p>`;
}

function renderQuestionCard(question, buttonLabel, extraContent = '') {
  return `
    <form class="question-card" data-action="answer">
      <p class="kicker">Reken om</p>
      ${extraContent}
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
  if (view === 'home') return 'Startscherm';
  if (view === 'slides') return 'Lespresentatie';
  if (view === 'extra-practice' || view === 'endless') return 'Extra oefenen';
  if (view.includes('final')) return 'Finale ronde';
  if (view === 'win') return 'Winscherm';
  return 'Exit ticket';
}

function getStageLabel() {
  if (view === 'home') return 'Start';
  if (view === 'extra-practice' || view === 'endless') return 'Extra';
  if (view === 'slides') return `${slideIndex + 1}/${slides.length}`;
  if (view.includes('final')) return 'Finale';
  if (view === 'win') return 'Gewonnen';
  return 'Oefenen';
}

function renderStageNavigation() {
  if (view !== 'slides') {
    return `<div class="stage-nav"><div class="stage-pill">${getStageLabel()}</div>${renderDevModeIndicator()}</div>`;
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
      ${renderDevModeIndicator()}
    </div>
  `;
}

function renderDevModeIndicator() {
  return devMode ? '<div class="stage-pill stage-pill-dev">DEV</div>' : '';
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

  if (view === 'endless') {
    lastEndlessResult = { ...activeQuestion, correct };
    endlessState = resolveEndlessPracticeAnswer(endlessState, correct);
    endlessQuestionIndex += 1;
    render();
    return;
  }

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

function startLesson() {
  locked = false;
  view = 'slides';
  slideIndex = 0;
  render();
}

function startEndlessPractice() {
  endlessState = createEndlessPracticeState();
  endlessQuestionIndex = 0;
  lastEndlessResult = null;
  view = 'endless';
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
  const calculatorKey = button.dataset.calc;
  if (calculatorKey) {
    handleCalculatorButton(calculatorKey);
    return;
  }

  if (!action) return;

  if (action === 'home') {
    locked = false;
    view = 'home';
  }
  if (action === 'start-lesson') {
    startLesson();
    return;
  }
  if (action === 'extra-practice') view = 'extra-practice';
  if (action === 'start-endless') {
    startEndlessPractice();
    return;
  }
  if (action === 'prev') slideIndex = Math.max(0, slideIndex - 1);
  if (action === 'next') slideIndex = Math.min(slides.length - 1, slideIndex + 1);
  if (action === 'jump-first-series') slideIndex = 0;
  if (action === 'jump-next-series') slideIndex = NEXT_SERIES_START_INDEX;
  if (action === 'check-puzzle') checkPuzzle();
  if (action === 'check-circle-table') checkCircleTable();
  if (action === 'check-paint-question') checkPaintQuestion();
  if (action === 'flip-flashcard') flipCurrentFlashcard();
  if (action === 'flashcard-known') answerFlashcard(true);
  if (action === 'flashcard-practice') answerFlashcard(false);
  if (action === 'reset-flashcards') resetFlashcards();
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
  if (event.target.matches('[data-paint-scratchpad]')) {
    paintScratchpad = event.target.value;
    paintResult = null;
    updatePaintFeedback('Maak eerst je berekening op het kladblaadje.');
    return;
  }

  if (event.target.matches('[data-paint-answer]')) {
    paintAnswer = event.target.value;
    paintResult = null;
    event.target.classList.remove('is-correct', 'is-wrong');
    updatePaintFeedback('Maak eerst je berekening op het kladblaadje.');
    return;
  }

  if (event.target.matches('.circle-scratchpad')) {
    circleScratchpad = event.target.value;
    return;
  }

  const circleInput = event.target.closest('[data-circle-key]');
  if (circleInput && !locked) {
    const key = circleInput.dataset.circleKey;
    circleValues[key] = circleInput.value;
    circleCheckResult = null;
    circleSolved = false;
    updateCircleCheckButton();
    return;
  }

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
    const nextInput = document.querySelector(`[data-puzzle-index="${getNextPuzzleInputIndex(index)}"]`);
    nextInput?.focus();
  }
});

function getNextPuzzleInputIndex(index) {
  const cells = NUMBER_PUZZLE.solutionRows.flatMap((row) => row.split(''));
  for (let nextIndex = index + 1; nextIndex < cells.length; nextIndex += 1) {
    if (cells[nextIndex] !== '#') return nextIndex;
  }
  return index;
}

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

function checkCircleTable() {
  if (!hasAllCircleInputsFilled(circleValues)) return;

  circleCheckResult = checkCircleExercise(circleValues);
  circleSolved = circleCheckResult.allCorrect;
  render();
}

function checkPaintQuestion() {
  paintResult = checkPaintExercise({
    answer: paintAnswer,
    scratchpad: paintScratchpad
  });
  render();
}

function flipCurrentFlashcard() {
  flashcardState = flipFlashcard(flashcardState);
  render();
}

function answerFlashcard(remembered) {
  if (!flashcardState.flipped) return;
  flashcardState = resolveFlashcard(flashcardState, remembered);
  render();
}

function resetFlashcards() {
  flashcardState = createFlashcardState();
  render();
}

function updatePaintFeedback(message) {
  const feedback = document.querySelector('[data-paint-feedback]');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = 'paint-feedback';
  }
}

function updateCircleCheckButton() {
  const button = document.querySelector('[data-action="check-circle-table"]');
  const status = document.querySelector('[data-circle-status]');
  const canCheck = hasAllCircleInputsFilled(circleValues);

  if (button) button.disabled = !canCheck;
  if (status) status.textContent = canCheck ? 'Alle vakjes zijn ingevuld. Je kunt nakijken.' : 'Vul eerst alle open vakjes in.';
}

function handleCalculatorButton(key) {
  const nextState = calculateNextState(
    { expression: calculatorExpression, display: calculatorDisplay },
    key
  );
  calculatorExpression = nextState.expression;
  calculatorDisplay = nextState.display;

  const display = document.querySelector('[data-calculator-display]');
  if (display) display.textContent = calculatorDisplay;
}

window.addEventListener(
  'keydown',
  (event) => {
    if (isSlideDevModeShortcut(event, view)) {
      event.preventDefault();
      devMode = !devMode;
      render();
      return;
    }

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
      if (isCurrentSlideProgressLocked() && !devMode) return;
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
