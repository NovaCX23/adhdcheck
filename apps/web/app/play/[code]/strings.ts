// TODO (Person 4): placeholder wording for the play page, to be replaced by the approved texts.
// Short, one idea per screen, nothing about results (FR-15).
export const PLAY_STRINGS = {
  checking: "One moment...",
  invalid: "This game link does not work any more. Ask your parent for a new one.",
  unavailable: "The game is not ready yet. Ask your parent.",
  ready: "Hi! Tap the button to start.",
  start: "Start",
  // FR-70 child-friendly explanation, shown only when the parent switched a sensor on.
  sensorsCamera: "Today the tablet camera helps Luma see if you are looking at the game. No photos are kept.",
  sensorsMicrophone: "Today the tablet microphone helps Luma hear if it is noisy around you. No sounds are kept.",
  sensorsBoth: "Today the tablet camera and microphone help Luma. No photos or sounds are kept.",
  playing: "",
  saving: "Well done! Saving...",
  offline: "Waiting for the internet. Keep the tablet open.",
  done: "All done, thank you! You can give the tablet back.",
} as const;
