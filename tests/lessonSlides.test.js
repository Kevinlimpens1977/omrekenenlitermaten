import { describe, expect, it } from 'vitest';
import { buildLessonSlides } from '../src/lessonSlides.js';

const images = {
  titleImage: 'title.jpg',
  introImage: 'intro.jpg',
  schemaTitleImage: 'schema-title.jpg',
  schemaBaseImage: 'schema-base.jpg',
  schemaRightImage: 'schema-right.jpg',
  schemaFullImage: 'schema-full.jpg',
  selfPracticeImage: 'self.jpg',
  answersSelfImage: 'answers.jpg',
  literImage: 'liter.jpg',
  geometryImage: 'geometry.jpg',
  togetherImage: 'together.jpg',
  exampleImage: 'example.jpg',
  exampleTwoImage: 'example-two.jpg',
  togetherAnswersImage: 'together-answers.jpg',
  planImage: 'plan.jpg',
  summaryImage: 'summary.jpg'
};

describe('lesson slides', () => {
  it('places the prefix explanation slide between the places slide and moving right', () => {
    const slides = buildLessonSlides(images);
    const titles = slides.map((slide) => slide.title);

    expect(titles).toContain('Voorvoegsels');
    expect(titles.indexOf('Voorvoegsels')).toBe(titles.indexOf('De plekken') + 1);
    expect(titles.indexOf('Naar rechts')).toBe(titles.indexOf('Voorvoegsels') + 1);
    expect(slides.slice(0, 18)).toHaveLength(18);
  });

  it('explains deci, centi and milli as parts of one liter', () => {
    const slides = buildLessonSlides(images);
    const prefixSlide = slides.find((slide) => slide.title === 'Voorvoegsels');

    expect(prefixSlide.variant).toBe('prefixes');
    expect(prefixSlide.prefixes).toEqual([
      { prefix: 'deci', symbol: 'd', part: '1/10', liter: '0,1 L', unit: 'dL' },
      { prefix: 'centi', symbol: 'c', part: '1/100', liter: '0,01 L', unit: 'cL' },
      { prefix: 'milli', symbol: 'm', part: '1/1000', liter: '0,001 L', unit: 'mL' }
    ]);
  });

  it('places the liter-dm3 3D slide between self practice and answers', () => {
    const slides = buildLessonSlides(images);
    const titles = slides.map((slide) => slide.title);
    const literDm3Slide = slides.find((slide) => slide.title === '1 liter = 1 dm3');

    expect(literDm3Slide.variant).toBe('liter-dm3');
    expect(titles.indexOf('1 liter = 1 dm3')).toBe(titles.indexOf('Probeer eerst zelf') + 1);
    expect(titles.indexOf('Antwoorden')).toBe(titles.indexOf('1 liter = 1 dm3') + 1);
  });

  it('shows the conversion schema above the self practice assignments', () => {
    const slides = buildLessonSlides(images);
    const selfPracticeSlide = slides.find((slide) => slide.title === 'Probeer eerst zelf');

    expect(selfPracticeSlide.supportImage).toBe(images.schemaFullImage);
    expect(selfPracticeSlide.supportAlt).toBe('Omrekenschema L dL cL mL');
  });

  it('adds the interactive slides after slide 18', () => {
    const slides = buildLessonSlides(images);

    expect(slides).toHaveLength(22);
    expect(slides[18]).toMatchObject({
      variant: 'number-puzzle',
      title: 'Rekenkruiswoord'
    });
    expect(slides[19]).toMatchObject({
      variant: 'circle-table',
      title: 'Cirkels A, B en C',
      body: 'Rond af op 1 decimaal.'
    });
    expect(slides[20]).toMatchObject({
      variant: 'paint-question',
      title: 'Laatste vraag: verfblik'
    });
    expect(slides[21]).toMatchObject({
      variant: 'flashcards',
      title: 'Begrippen oefenen'
    });
  });
});
