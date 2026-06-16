export function buildLessonSlides(images) {
  return [
    {
      image: images.titleImage,
      kicker: 'Paragraaf',
      title: 'Omrekenen',
      body: 'We leren inhoudsmaten omrekenen in kleine stappen.'
    },
    {
      image: images.introImage,
      kicker: 'Start',
      title: 'Inhoud in liters',
      body: 'Liter, deciliter, centiliter en milliliter horen bij elkaar.'
    },
    {
      image: images.schemaTitleImage,
      kicker: 'Stap 1',
      title: 'Het literschema',
      body: 'Dit wordt je belangrijkste gereedschap.'
    },
    {
      image: images.schemaBaseImage,
      kicker: 'Stap 2',
      title: 'De plekken',
      body: 'Zet de maten in de vaste volgorde: L, dL, cL, mL.'
    },
    {
      image: images.schemaBaseImage,
      kicker: 'Stap 2b',
      title: 'Voorvoegsels',
      variant: 'prefixes',
      body: 'Bij liter staat de L voor liter. De letter ervoor vertelt welk deel van een liter je bedoelt.',
      prefixes: [
        { prefix: 'deci', symbol: 'd', part: '1/10', liter: '0,1 L', unit: 'dL' },
        { prefix: 'centi', symbol: 'c', part: '1/100', liter: '0,01 L', unit: 'cL' },
        { prefix: 'milli', symbol: 'm', part: '1/1000', liter: '0,001 L', unit: 'mL' }
      ]
    },
    {
      image: images.schemaRightImage,
      kicker: 'Stap 3',
      title: 'Naar rechts',
      body: 'Elke stap naar rechts is keer 10.'
    },
    {
      image: images.schemaFullImage,
      kicker: 'Stap 4',
      title: 'Naar links',
      body: 'Elke stap naar links is delen door 10.'
    },
    {
      image: images.selfPracticeImage,
      kicker: 'Invullen',
      title: 'Probeer eerst zelf',
      body: 'Vul de antwoorden in en controleer daarna samen.'
    },
    {
      kicker: 'Koppeling',
      title: '1 liter = 1 dm3',
      variant: 'liter-dm3',
      body: 'Liter meet vloeistof. dm3 meet ruimte. In deze animatie zie je dat dezelfde hoeveelheid precies past.'
    },
    {
      image: images.answersSelfImage,
      kicker: 'Nakijken',
      title: 'Antwoorden',
      body: 'Vergelijk je werk en verbeter met een andere kleur.'
    },
    {
      image: images.literImage,
      kicker: 'Koppeling',
      title: '1 cm3 = 1 mL',
      body: 'Een kubieke centimeter is precies evenveel als een milliliter.'
    },
    {
      image: images.geometryImage,
      kicker: 'Grote sprong',
      title: '1 dm3 = 1 L',
      body: 'Een kubieke decimeter is precies een liter.'
    },
    {
      image: images.togetherImage,
      kicker: 'Samen oefenen',
      title: 'Maak de opdrachten',
      body: 'Gebruik het schema en let op de richting van de stappen.'
    },
    {
      image: images.exampleImage,
      kicker: 'Voorbeeld',
      title: 'Vraag stap voor stap',
      body: 'Bepaal eerst de beginmaat, daarna de eindmaat en tel de stappen.'
    },
    {
      image: images.exampleTwoImage,
      kicker: 'Voorbeeld',
      title: 'Ruimtefiguren',
      body: 'Reken cm3 eerst om via de koppeling met mL.'
    },
    {
      image: images.togetherAnswersImage,
      kicker: 'Nakijken',
      title: 'Uitwerkingen',
      body: 'Controleer de tussenstappen, niet alleen het eindantwoord.'
    },
    {
      image: images.planImage,
      kicker: 'Houvast',
      title: 'Jouw stappenplan',
      body: 'Gebruik dit bij elke nieuwe som.'
    },
    {
      image: images.summaryImage,
      kicker: 'Samenvatting',
      title: 'Klaar voor de exit ticket',
      body: 'Nu laat je zien dat je het ook zonder hulp steeds beter kunt.'
    }
  ];
}
