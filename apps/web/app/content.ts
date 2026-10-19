// Landing copy, RO + EN. Every number here comes from research/01..04 with its source.
// Wording rule (team decision 2026-10-19): orientation, never diagnosis. Never promise
// an "ADHD probability". The only outcomes are the two fixed sentences in `result`.

export type Lang = "ro" | "en";

const ro = {
  meta: { skip: "Sari la conținut" },
  nav: {
    how: "Cum funcționează",
    game: "Jocul",
    science: "Știința",
    faq: "Întrebări",
    cta: "Încearcă gratuit",
    langLabel: "Limba",
  },
  hero: {
    eyebrow: "Pentru părinții copiilor de 6–12 ani",
    pre: "Încă un mesaj de la învățătoare. Încă o seară de teme cu lacrimi.",
    title: "Nu mai ghici dacă e „doar o fază”.",
    sub: "ADHDCheck este un joc de 14 minute cu licurici. Copilul se joacă, tu răspunzi la câteva întrebări, iar la final primești un răspuns clar: merită sau nu să mergi la o evaluare de specialitate.",
    cta: "Încearcă gratuit în browser",
    secondary: "Vezi cum funcționează",
    trust: ["Fără card", "Nimic de instalat", "Date găzduite în UE"],
    phoneTitle: "Paza felinarelor",
    phoneHint: "Atinge licuricii. Lasă moliile să zboare.",
  },
  pain: {
    kicker: "Sună cunoscut?",
    title: "Știi că ceva nu e în regulă. Doar nu știi ce.",
    items: [
      "Îi spui de cinci ori să-și pună pantofii. A șasea oară ridici tonul, apoi te simți vinovat toată seara.",
      "Temele de 20 de minute durează două ore, cu pauze, plâns și caiete pierdute.",
      "La ședință auzi mereu același lucru: „E isteț, dar nu e atent.”",
      "Rudele îți spun că îi trebuie „mai multă disciplină”. Tu ai încercat deja tot.",
      "La unu noaptea ai căutat pe Google și ai găsit 40 de teste care se contrazic.",
      "Te întrebi dacă exagerezi. Sau dacă, de fapt, ai așteptat deja prea mult.",
    ],
    punch: "Partea grea nu e să simți că ceva nu merge. Partea grea e să nu știi care e următorul pas.",
  },
  cost: {
    kicker: "Prețul așteptării",
    title: "„Lasă, că trece” are un cost. Îl plătește copilul.",
    stats: [
      {
        value: "~5%",
        label: "dintre copii au ADHD. Asta înseamnă cam un copil în fiecare clasă.",
        source: "Polanczyk et al., 2007 · 102 studii, 171.756 copii",
      },
      {
        value: "4+ ani",
        label: "poate dura așteptarea pentru o evaluare a unui copil în serviciile publice din Anglia.",
        source: "ADHD Taskforce, NHS England, 2025",
      },
      {
        value: "0,67%",
        label: "dintre fete sunt identificate oficial, față de ~5% la copii în general. Fetele visătoare și liniștite sunt cele mai ușor de ratat.",
        source: "ADHD Taskforce, NHS England, 2025",
      },
      {
        value: "0,25",
        label: "este acordul dintre părinți și profesori când evaluează aceleași simptome. Fiecare vede doar o parte din copil.",
        source: "Fu et al., 2026 · 11 studii, 8.796 copii (kappa)",
      },
    ],
    punch: "Fiecare an de școală fără un răspuns e un an în care copilul începe să creadă că problema e el.",
  },
  story: {
    kicker: "O seară obișnuită",
    title: "Seara în care Ana a încetat să ghicească",
    paragraphs: [
      "Andrei are 8 ani. De doi ani, mama lui aude aceleași lucruri: „nu stă locului”, „uită tot”, „poate dacă ar fi mai serios”. Ea a ales să mai aștepte un an, ca să vadă dacă trece.",
      "Nu a trecut. Într-o seară, în loc de încă un test online, i-a dat telefonul: „Hai să-l ajutăm pe Luma să aprindă pădurea.”",
      "După 14 minute, Andrei voia să mai joace. Iar Ana avea, pentru prima dată, ceva concret în mână: o recomandare clară și un raport pe care l-a dus la medicul pediatru.",
    ],
    quote: "Nu aveam nevoie de un verdict. Aveam nevoie să știu dacă merită să cer ajutor.",
    note: "Poveste ilustrativă.",
  },
  how: {
    kicker: "Cum funcționează",
    title: "Trei pași. Douăzeci de minute. Un răspuns clar.",
    steps: [
      {
        title: "Copilul se joacă",
        time: "≈ 14 minute",
        body: "Cu Luma, păzitorul licuricilor, salvează pădurea în cinci misiuni. Fără cronometru pe ecran și fără sunete de „ai greșit”.",
      },
      {
        title: "Tu răspunzi la întrebări",
        time: "≈ 5 minute",
        body: "Completezi chestionarul NICHQ Vanderbilt pentru părinți, folosit de pediatri, despre comportamentele pe care jocul nu le poate vedea.",
      },
      {
        title: "Primești un răspuns clar",
        time: "imediat",
        body: "Una din două recomandări, explicată pe înțelesul tău, plus un raport pe care îl poți arăta medicului sau psihologului.",
      },
    ],
  },
  game: {
    kicker: "Jocul",
    title: "Pentru copil e o aventură. Pentru tine sunt 14 minute de observație atentă.",
    sub: "Fiecare misiune observă un singur lucru, ca rezultatele să fie ușor de interpretat.",
    missions: [
      { name: "Trezește licuricii", what: "Calibrare de 30 de secunde: jocul se ajustează la dispozitivul tău." },
      { name: "Paza felinarelor", what: "Atenția susținută: atinge licuricii, ignoră moliile." },
      { name: "Furtuna", what: "Distragerea: păsări care trec și tunete." },
      { name: "Cărarea stelelor", what: "Memoria de lucru: repetă drumul stelelor." },
      { name: "Podul", what: "Răbdarea: așteaptă semnalul înainte să traverseze." },
      { name: "Comoara", what: "Așteptarea: o piatră prețioasă acum sau două mai târziu." },
    ],
    measure: "Ce măsurăm de fapt: cât de constant reacționează copilul, nu cât de repede. Telefoanele au întârzieri diferite, așa că variabilitatea spune mai mult decât viteza.",
  },
  result: {
    kicker: "Rezultatul",
    title: "Fără procente care sperie. Fără etichete. Doar următorul pas.",
    sub: "La final vezi una dintre aceste două recomandări:",
    a: "Se recomandă o evaluare de specialitate.",
    b: "Activitatea nu indică o urmărire specifică.",
    reasonsTitle: "De ce, pe scurt:",
    reasons: [
      "Viteza de răspuns a variat mai mult decât ne așteptam.",
      "A atins des ecranul când jocul cerea să aștepte.",
    ],
    disclaimer: "Acesta nu este un diagnostic. Diagnosticul îl poate pune doar un specialist.",
    cardLabel: "Exemplu de raport",
    child: "Luca, 9 ani",
  },
  science: {
    kicker: "Știință, cu limitele spuse pe față",
    title: "Îți spunem exact ce poate și ce nu poate face un joc.",
    items: [
      {
        title: "Construit pe cercetare",
        body: "Fiecare misiune se bazează pe sarcini studiate la copii: variabilitatea timpului de reacție (319 studii), memoria de lucru, controlul impulsurilor.",
      },
      {
        title: "Onest despre precizie",
        body: "Nici cele mai bune teste computerizate nu pun singure un diagnostic (sensibilitate 0,75, specificitate 0,71). De aceea te ajutăm să decizi dacă mergi la un specialist, dar nu îl înlocuim.",
      },
      {
        title: "Joc și chestionar, împreună",
        body: "Cele 7 comportamente pe care un joc nu le vede (de exemplu, dacă se ridică din bancă) le afli din chestionarul pentru părinți.",
      },
    ],
    privacy: {
      title: "Datele copilului tău sunt doar ale tale",
      items: [
        "Camera și microfonul: opționale, oprite implicit",
        "Nicio imagine sau sunet nu pleacă de pe dispozitiv",
        "Doar un nume de joc și anul nașterii",
        "Servere în UE (Frankfurt)",
        "Ștergi totul cu un click",
      ],
    },
  },
  offer: {
    kicker: "Ce primești",
    title: "Tot ce îți trebuie ca să faci următorul pas cu încredere",
    items: [
      { name: "Jocul complet cu Luma", detail: "5 misiuni, ≈ 14 minute" },
      { name: "Chestionarul pentru părinți", detail: "NICHQ Vanderbilt, integrat în aplicație" },
      { name: "Raport clar pentru medic", detail: "Îl arăți la prima programare" },
      { name: "Ghid: ce să întrebi la specialist", detail: "Bonus" },
      { name: "Misiuni de concentrare pentru acasă", detail: "Le alegi tu sau specialistul" },
    ],
    priceLabel: "Prima verificare",
    price: "Gratuit",
    priceNote: "în perioada de lansare",
    cta: "Începe gratuit acum",
    guarantee: "Nu îți cerem cardul și nu există abonament ascuns. Dacă aplicația nu te ajută, îți ștergi contul și toate datele dispar.",
  },
  faq: {
    kicker: "Întrebări",
    title: "Ce întreabă părinții înainte să înceapă",
    items: [
      {
        q: "Îmi spune aplicația dacă copilul meu are ADHD?",
        a: "Nu. Doar un specialist poate pune un diagnostic. ADHDCheck îți spune dacă merită să ceri o evaluare și îți dă un raport cu care să mergi la medic.",
      },
      {
        q: "De la ce vârstă se poate juca?",
        a: "Jocul este gândit pentru copii de 6–12 ani, iar rezultatele sunt comparate în funcție de grupa de vârstă.",
      },
      {
        q: "Cât durează?",
        a: "În jur de 14 minute de joc pentru copil și 5 minute de întrebări pentru tine. Jocul se poate pune pe pauză oricând.",
      },
      {
        q: "Ce date colectați?",
        a: "Doar un nume de joc, anul nașterii și cum s-a jucat copilul (atingeri și timpi). Camera și microfonul sunt opționale și pornesc doar dacă le activezi tu. Sunt procesate direct pe dispozitiv: pleacă doar numărători și durate, niciodată imagini sau sunet. Jocul funcționează la fel și fără ele. Datele stau pe servere din UE și le poți șterge oricând.",
      },
      {
        q: "Copilul ia deja medicamente. Mai are sens?",
        a: "Poți folosi aplicația, dar îți vom cere să ne spui asta, pentru că medicamentele schimbă modul în care copilul răspunde în joc.",
      },
      {
        q: "Cât de sigure sunt rezultatele?",
        a: "Metodele din joc sunt luate din cercetarea publicată, dar pragurile nu au fost încă verificate într-un studiu clinic. Tocmai de aceea rezultatul este o recomandare, nu un verdict.",
      },
    ],
  },
  final: {
    title: "Peste 14 minute poți ști ce urmează.",
    sub: "Deschide jocul în browser, lasă-l pe Luma să facă restul și ia decizia cu un răspuns în mână, nu cu un nod în stomac.",
    browserNote: "Funcționează în browser pe tabletă, telefon sau laptop. Nu instalezi nimic.",
    formLabel: "Adresa ta de email",
    formPlaceholder: "nume@exemplu.ro",
    formCta: "Vreau acces gratuit",
    formNote: "Îți trimitem linkul imediat ce jocul e disponibil. Fără spam.",
    formSuccess: "Gata! Ești pe listă. Îți scriem imediat ce poți începe.",
    formError: "Adresa nu pare corectă. Verifică și încearcă din nou.",
    formFail: "Ceva n-a mers. Încearcă din nou peste câteva secunde.",
    sending: "Se trimite…",
    ps: "P.S. Dacă ai citit până aici, probabil că pentru tine nu e „doar o fază”. 14 minute nu te costă nimic. Încă un an de „poate trece” te poate costa mult mai mult.",
  },
  footer: {
    disclaimer: "ADHDCheck este un instrument de orientare, nu un dispozitiv de diagnostic. Nu înlocuiește evaluarea unui medic sau psiholog. Pragurile folosite sunt ilustrative și în curs de validare clinică.",
    credit: "Chestionarul pentru părinți: NICHQ Vanderbilt Assessment Scale, ediția I (2002), © American Academy of Pediatrics și NICHQ.",
    event: "Proiect realizat la hackathonul BeaHealth 2026.",
  },
  sticky: "Încearcă gratuit",
};

export type Dict = typeof ro;

const en: Dict = {
  meta: { skip: "Skip to content" },
  nav: {
    how: "How it works",
    game: "The game",
    science: "The science",
    faq: "FAQ",
    cta: "Try it free",
    langLabel: "Language",
  },
  hero: {
    eyebrow: "For parents of children aged 6–12",
    pre: "Another note from the teacher. Another homework night in tears.",
    title: "Stop guessing if it's “just a phase”.",
    sub: "ADHDCheck is a 14-minute firefly game. Your child plays, you answer a few questions, and at the end you get a clear answer: is a professional assessment worth it or not.",
    cta: "Try it free in your browser",
    secondary: "See how it works",
    trust: ["No card needed", "Nothing to install", "Data hosted in the EU"],
    phoneTitle: "Lantern Watch",
    phoneHint: "Tap the fireflies. Let the moths fly by.",
  },
  pain: {
    kicker: "Sound familiar?",
    title: "You know something's off. You just don't know what.",
    items: [
      "You ask five times for shoes to go on. The sixth time you raise your voice, then feel guilty all evening.",
      "Twenty minutes of homework takes two hours, with breaks, tears and lost notebooks.",
      "Every parent-teacher meeting ends the same way: “Bright, but just not paying attention.”",
      "Relatives say it needs “more discipline”. You've already tried everything.",
      "At 1 a.m. you searched Google and found 40 quizzes that contradict each other.",
      "You wonder if you're overreacting. Or if you've already waited too long.",
    ],
    punch: "The hard part isn't sensing something is wrong. It's not knowing what to do next.",
  },
  cost: {
    kicker: "The price of waiting",
    title: "“It'll pass” has a cost. Your child pays it.",
    stats: [
      {
        value: "~5%",
        label: "of children have ADHD. That's roughly one child in every classroom.",
        source: "Polanczyk et al., 2007 · 102 studies, 171,756 children",
      },
      {
        value: "4+ yrs",
        label: "is how long a child can wait for an assessment in England's public services.",
        source: "ADHD Taskforce, NHS England, 2025",
      },
      {
        value: "0.67%",
        label: "of girls are officially identified, against ~5% of children overall. Quiet, dreamy girls are the easiest to miss.",
        source: "ADHD Taskforce, NHS England, 2025",
      },
      {
        value: "0.25",
        label: "is the agreement between parents and teachers rating the same symptoms. Each sees only part of the child.",
        source: "Fu et al., 2026 · 11 studies, 8,796 children (kappa)",
      },
    ],
    punch: "Every school year without an answer is a year your child spends believing they are the problem.",
  },
  story: {
    kicker: "An ordinary evening",
    title: "The evening Ana stopped guessing",
    paragraphs: [
      "Andrei is 8. For two years his mum has heard the same things: “can't sit still”, “forgets everything”, “if only he tried harder”. She decided to wait another year and see if it passed.",
      "It didn't. One evening, instead of yet another online quiz, she handed him the phone: “Let's help Luma light up the forest.”",
      "Fourteen minutes later Andrei wanted to keep playing. And for the first time Ana had something concrete: a clear recommendation and a report she took to their paediatrician.",
    ],
    quote: "I didn't need a verdict. I needed to know whether it was worth asking for help.",
    note: "Illustrative story.",
  },
  how: {
    kicker: "How it works",
    title: "Three steps. Twenty minutes. One clear answer.",
    steps: [
      {
        title: "Your child plays",
        time: "≈ 14 minutes",
        body: "With Luma the firefly keeper, they save the forest across five missions. No on-screen timer and no “wrong!” sounds.",
      },
      {
        title: "You answer questions",
        time: "≈ 5 minutes",
        body: "You fill in the NICHQ Vanderbilt parent scale, used by paediatricians, about the behaviours a game can't see.",
      },
      {
        title: "You get a clear answer",
        time: "instantly",
        body: "One of two recommendations, explained in plain words, plus a report you can show a doctor or psychologist.",
      },
    ],
  },
  game: {
    kicker: "The game",
    title: "For your child it's an adventure. For you it's 14 minutes of careful observation.",
    sub: "Each mission looks at one thing only, so results stay easy to read.",
    missions: [
      { name: "Wake the fireflies", what: "30-second calibration: the game adjusts to your device." },
      { name: "Lantern Watch", what: "Sustained attention: tap fireflies, ignore moths." },
      { name: "Storm Watch", what: "Distraction: passing birds and thunder." },
      { name: "Star Path", what: "Working memory: repeat the path of the stars." },
      { name: "Bridge Wait", what: "Patience: wait for the signal before crossing." },
      { name: "Treasure Choice", what: "Waiting: one gem now or two gems later." },
    ],
    measure: "What we actually measure: how consistently your child responds, not how fast. Phones have different delays, so variability tells us more than speed.",
  },
  result: {
    kicker: "The result",
    title: "No scary percentages. No labels. Just the next step.",
    sub: "At the end you see one of these two recommendations:",
    a: "A professional assessment is recommended.",
    b: "No specific follow-up indicated by this activity.",
    reasonsTitle: "Why, in short:",
    reasons: [
      "Response speed varied more than expected during the watch.",
      "Tapped often when the game asked to wait.",
    ],
    disclaimer: "This is not a diagnosis. Only a professional can make one.",
    cardLabel: "Sample report",
    child: "Luca, age 9",
  },
  science: {
    kicker: "Science, with the limits stated up front",
    title: "We tell you exactly what a game can and can't do.",
    items: [
      {
        title: "Built on research",
        body: "Every mission is based on tasks studied in children: reaction-time variability (319 studies), working memory, impulse control.",
      },
      {
        title: "Honest about accuracy",
        body: "Even the best computer tests can't diagnose on their own (sensitivity 0.75, specificity 0.71). That's why we help you decide whether to see a professional, never replace one.",
      },
      {
        title: "Game and questionnaire, together",
        body: "The 7 behaviours a game can't see (like leaving their seat in class) come from the parent questionnaire.",
      },
    ],
    privacy: {
      title: "Your child's data belongs to you",
      items: [
        "Camera and microphone: optional, off by default",
        "No image or sound ever leaves the device",
        "Just a nickname and birth year",
        "EU servers (Frankfurt)",
        "Delete everything in one click",
      ],
    },
  },
  offer: {
    kicker: "What you get",
    title: "Everything you need to take the next step with confidence",
    items: [
      { name: "The full Luma game", detail: "5 missions, ≈ 14 minutes" },
      { name: "The parent questionnaire", detail: "NICHQ Vanderbilt, built in" },
      { name: "A clear report for your doctor", detail: "Bring it to your first appointment" },
      { name: "Guide: what to ask the specialist", detail: "Bonus" },
      { name: "Focus missions for home", detail: "Chosen by you or the specialist" },
    ],
    priceLabel: "First check",
    price: "Free",
    priceNote: "during launch",
    cta: "Start free now",
    guarantee: "No card required and no hidden subscription. If it doesn't help, delete your account and all data is gone.",
  },
  faq: {
    kicker: "FAQ",
    title: "What parents ask before they start",
    items: [
      {
        q: "Will the app tell me if my child has ADHD?",
        a: "No. Only a professional can diagnose. ADHDCheck tells you whether an assessment is worth asking for and gives you a report to take to the doctor.",
      },
      {
        q: "What age is it for?",
        a: "The game is designed for children aged 6–12, and results are compared within age bands.",
      },
      {
        q: "How long does it take?",
        a: "About 14 minutes of play for your child and 5 minutes of questions for you. The game can be paused any time.",
      },
      {
        q: "What data do you collect?",
        a: "Only a nickname, birth year, and how your child played (taps and timings). Camera and microphone are optional and only start if you switch them on. They are processed on the device itself: only counts and durations leave it, never images or sound. The game works the same without them. Data stays on EU servers and you can delete it any time.",
      },
      {
        q: "My child already takes medication. Does it still make sense?",
        a: "You can use it, but we'll ask you to tell us, because medication changes how children respond in the game.",
      },
      {
        q: "How reliable are the results?",
        a: "The game's methods come from published research, but the thresholds have not yet been checked in a clinical study. That's exactly why the result is a recommendation, not a verdict.",
      },
    ],
  },
  final: {
    title: "In 14 minutes you can know what comes next.",
    sub: "Open the game in your browser, let Luma do the rest, and make the decision with an answer in hand, not a knot in your stomach.",
    browserNote: "Works in the browser on a tablet, phone or laptop. Nothing to install.",
    formLabel: "Your email address",
    formPlaceholder: "name@example.com",
    formCta: "Get free access",
    formNote: "We'll send you the link as soon as the game is available. No spam.",
    formSuccess: "Done! You're on the list. We'll email you as soon as you can start.",
    formError: "That address doesn't look right. Please check and try again.",
    formFail: "Something went wrong. Please try again in a few seconds.",
    sending: "Sending…",
    ps: "P.S. If you've read this far, it's probably not “just a phase” for you. 14 minutes cost you nothing. Another year of “maybe it'll pass” can cost far more.",
  },
  footer: {
    disclaimer: "ADHDCheck is an orientation tool, not a diagnostic device. It does not replace an assessment by a doctor or psychologist. Thresholds are illustrative and pending clinical validation.",
    credit: "Parent questionnaire: NICHQ Vanderbilt Assessment Scale, 1st edition (2002), © American Academy of Pediatrics and NICHQ.",
    event: "Built at the BeaHealth 2026 hackathon.",
  },
  sticky: "Try it free",
};

export const content: Record<Lang, Dict> = { ro, en };
