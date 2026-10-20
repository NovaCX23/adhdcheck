// Parent screen wording. Only the three band headlines are DECIDED (docs/02 FR-34, D-03a) and the two
// supporting lines are the FR-34 PROPOSAL, copied unchanged. Everything else is a placeholder:
// TODO (Person 4 / texts owner) replace with the approved texts (shared-texts-claims-pitch.md).
export const BAND_TEXT = {
  follow_up_suggested: {
    headline: "A professional assessment is recommended",
    support: "",
  },
  no_flag: {
    headline: "No specific follow-up indicated by this activity",
    support: "This does not rule out attention difficulties. If you are still worried, talk to a healthcare professional.",
  },
  insufficient_data: {
    headline: "Not enough data from this session. You can play again.",
    support: "",
  },
} as const;

export const S = {
  appName: "ADHDCheck",
  login: {
    title: "Parent space",
    email: "Email",
    passLabel: "Password", // check-secrets: allow
    submitLogin: "Log in",
    submitSignup: "Create account",
    toSignup: "No account yet? Create one",
    toLogin: "Already have an account? Log in",
    checkEmail: "Check your email to confirm your account, then log in.",
    failed: "That did not work. Check your email and password.", // check-secrets: allow
    weak: "Choose a longer password.", // check-secrets: allow
  },
  nav: { children: "Children", logout: "Log out" },
  home: {
    title: "Your children",
    empty: "Add a child to start their first game.",
    nickname: "Nickname",
    birthYear: "Birth year",
    add: "Add child",
    addHint: "Nickname and birth year only. No real name needed.",
    open: "Open",
    lastResult: "Last result",
    noResult: "No game played yet",
  },
  demo: { label: "Demo account", reset: "Reset demo", resetting: "Resetting…", done: "Demo data restored." },
  billing: {
    title: "Family plan",
    active: "Your plan is active.",
    inactive: "Missions and progress tracking come with the family plan. Results and next steps are always free.",
    subscribe: "Subscribe (test mode)",
    manage: "Manage plan",
    unavailable: "Billing is not set up yet.",
  },
  session: {
    title: "Play a game",
    start: "Start a game on the tablet",
    scan: "Scan this code with the tablet, or open the link on it.",
    waiting: "Waiting for the game to finish…",
    expires: "The link works once and expires at",
    newResult: "New result",
    failed: "Could not create a game link. Try again.",
    cancel: "Cancel",
  },
  // FR-70 consent, placeholder wording for the texts owner (shared-texts-claims-pitch.md, step 1).
  consent: {
    title: "Camera and microphone (optional)",
    explain:
      "The game works the same with both off. If you switch one on, the tablet only counts simple things, like whether your child is looking at the screen or how noisy the room is. No photo, video or sound is kept or sent.",
    camera: "Camera",
    microphone: "Microphone",
    on: "On",
    off: "Off",
  },
  result: {
    title: "Result",
    of: "Game of",
    why: "Why",
    indicators: "What the game measured",
    quality: "Data quality",
    trials: "trials",
    anticipations: "early taps",
    nextStep: "Next step",
    // Roles from docs/02 FR-35; sentence is a placeholder.
    nextStepText: "Talk to your family doctor, a paediatrician or a child psychiatrist, and bring this result with you.",
    notValidated: "These measures are not yet compared with norms for children.",
  },
  indicator: {
    omission_rate: "Missed targets",
    commission_rate: "Taps when asked to wait",
    off_target_tap_rate: "Taps outside targets",
    rt_cv: "Response speed variation",
  },
  progress: {
    title: "Progress",
    empty: "Progress appears after a few games.",
    devices: "Games on different devices are not directly comparable.",
    missionsDone: "missions done",
  },
  missions: {
    title: "Missions",
    hint: "Wellbeing activities you choose together.",
    add: "Add",
    done: "Done",
    remove: "Remove",
    empty: "No mission chosen yet.",
  },
  child: {
    back: "All children",
    history: "Earlier games",
    delete: "Delete child and all data",
    confirmDelete: "Delete this child and every game and mission? This cannot be undone.",
  },
  error: "Something went wrong. Reload the page to try again.",
  loading: "Loading…",
} as const;
