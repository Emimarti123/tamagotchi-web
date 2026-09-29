/* ---------- 1. CONFIGURATION ---------- */
const TICK_MS = 1000;
const TICKS_PER_HOUR = 6;
const TOTAL_HOURS = 24;
const TOTAL_TICKS = TOTAL_HOURS * TICKS_PER_HOUR;
const START_HOUR = 8;
const NIGHT_START = 20;
const NIGHT_END = 8;

const FEED_WINDOW_TICKS = TICKS_PER_HOUR;
const EVENT_WINDOW_TICKS = TICKS_PER_HOUR;
const EVENT_PENALTY = 30;
const MAX_MISSED_MEALS = 2;
const MAX_OVERFEED_STREAK = 3;
const FEEDBACK_TICKS = 2;

const USE_IMAGES = true;

const DIFFICULTIES = {
  easy:   { label: "Easy",   emoji: "🐣", feedInterval: 6, funDecay: 3,   hygieneDecay: 3,   eventMin: 3,   eventMax: 5 },
  medium: { label: "Medium", emoji: "🐱", feedInterval: 4, funDecay: 4.5, hygieneDecay: 4.5, eventMin: 2.5, eventMax: 4 },
  hard:   { label: "Hard",   emoji: "🐲", feedInterval: 3, funDecay: 6,   hygieneDecay: 6,   eventMin: 2,   eventMax: 3 },
};

const MESSAGES = {
  hungry: "I'm hungry! Feed me!",
  wantsPlay: "I want to play!",
  wantsBathroom: "I need to go to the bathroom!",
  fed: "Thank you!",
  overfed: (streak) => `I'm not hungry... (${streak}/${MAX_OVERFEED_STREAK})`,
  playedEvent: "That was so much fun!",
  played: "Playtime!",
  bathroomEvent: "Just in time!",
  bathroom: "All clean!",
  missedMeal: (name, count) => `${name} skipped a meal! (${count}/${MAX_MISSED_MEALS})`,
  ignoredPlay: (name) => `${name} got sad because nobody played with it.`,
  ignoredBathroom: (name) => `${name} had an accident...`,
  bored: "I'm bored...",
  dirty: "I feel dirty...",
  night: "It's night time.",
  happy: (name) => `${name} is happy!`,
  ghostMissed: (name) => `${name} was not fed ${MAX_MISSED_MEALS} times.`,
  ghostOverfed: (name) => `${name} was overfed ${MAX_OVERFEED_STREAK} times in a row.`,
  ghostBored: (name) => `${name} got too bored.`,
  ghostDirty: (name) => `${name} got too dirty.`,
};


/* ---------- 2. DOM REFERENCES ---------- */
const dom = {
  body: document.body,
  screens: document.querySelectorAll(".screen"),
  startForm: document.getElementById("start-form"),
  inputName: document.getElementById("input-name"),
  startError: document.getElementById("start-error"),
  optionVisuals: document.querySelectorAll(".option-visual"),

  petName: document.getElementById("pet-name"),
  petDifficulty: document.getElementById("pet-difficulty"),
  timeLabel: document.getElementById("time-label"),
  clock: document.getElementById("clock"),
  timeLeft: document.getElementById("time-left"),
  dayBar: document.getElementById("day-bar"),
  petVisual: document.getElementById("pet-visual"),
  message: document.getElementById("message"),

  barHunger: document.getElementById("bar-hunger"),
  valueHunger: document.getElementById("value-hunger"),
  barFun: document.getElementById("bar-fun"),
  valueFun: document.getElementById("value-fun"),
  barHygiene: document.getElementById("bar-hygiene"),
  valueHygiene: document.getElementById("value-hygiene"),

  btnFeed: document.getElementById("btn-feed"),
  btnPlay: document.getElementById("btn-play"),
  btnBath: document.getElementById("btn-bath"),

  gameoverPet: document.getElementById("gameover-pet"),
  gameoverReason: document.getElementById("gameover-reason"),
  btnRestartGameover: document.getElementById("btn-restart-gameover"),

  grade: document.getElementById("grade"),
  summaryList: document.getElementById("summary-list"),
  btnRestartSummary: document.getElementById("btn-restart-summary"),
};


/* ---------- 3. STATE AND MASCOT CREATION ---------- */
let state = null;
let timerId = null;

function createInitialState(name, difficulty) {
  return {
    name: name,
    difficulty: difficulty,
    config: DIFFICULTIES[difficulty],
    ticks: 0,
    ticksSinceMeal: 0,
    isHungry: false,
    fun: 100,
    hygiene: 100,
    missedMeals: 0,
    overfeedStreak: 0,
    activeEvent: null,
    nextEventTick: 0,
    feedback: null,
    over: false,
    stats: {
      mealsGiven: 0,
      overfeeds: 0,
      eventsAttended: 0,
      eventsIgnored: 0,
      funSum: 0,
      hygieneSum: 0,
    },
  };
}

function handleStart(event) {
  event.preventDefault();

  const selected = document.querySelector('input[name="difficulty"]:checked');
  const name = dom.inputName.value.trim();

  if (!selected) {
    dom.startError.textContent = "Choose a mascot first.";
    return;
  }
  if (name === "") {
    dom.startError.textContent = "Give your mascot a name.";
    return;
  }

  dom.startError.textContent = "";
  startGame(name, selected.value);
}

function startGame(name, difficulty) {
  state = createInitialState(name, difficulty);
  scheduleNextEvent();

  dom.petName.textContent = state.name;
  dom.petDifficulty.textContent = state.config.label;
  dom.petVisual.innerHTML = getPetVisual(difficulty, "normal");

  showScreen("screen-game");
  render();
  timerId = setInterval(tick, TICK_MS);
}


/* ---------- 4. SIMULATED CLOCK ---------- */
function tick() {
  state.ticks++;

  updateHunger();
  updateStats();
  updateEvents();

  state.stats.funSum += state.fun;
  state.stats.hygieneSum += state.hygiene;

  if (checkGhost()) return;
  if (state.ticks >= TOTAL_TICKS) {
    endDay();
    return;
  }

  render();
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function getClockTime() {
  const totalMinutes = START_HOUR * 60 + state.ticks * (60 / TICKS_PER_HOUR);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

function isNight(hours) {
  return hours >= NIGHT_START || hours < NIGHT_END;
}


/* ---------- 5. HUNGER, FUN AND HYGIENE ---------- */
function getFeedTicks() {
  return state.config.feedInterval * TICKS_PER_HOUR;
}

function getHunger() {
  return Math.min(100, (state.ticksSinceMeal / getFeedTicks()) * 100);
}

function updateHunger() {
  state.ticksSinceMeal++;

  if (!state.isHungry && state.ticksSinceMeal >= getFeedTicks()) {
    state.isHungry = true;
  }

  if (state.isHungry && state.ticksSinceMeal >= getFeedTicks() + FEED_WINDOW_TICKS) {
    state.missedMeals++;
    state.isHungry = false;
    state.ticksSinceMeal = 0;
    showFeedback(MESSAGES.missedMeal(state.name, state.missedMeals));
  }
}

function updateStats() {
  state.fun = clamp(state.fun - state.config.funDecay / TICKS_PER_HOUR);
  state.hygiene = clamp(state.hygiene - state.config.hygieneDecay / TICKS_PER_HOUR);
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}


/* ---------- 6. RANDOM EVENTS ---------- */
function scheduleNextEvent() {
  const min = state.config.eventMin * TICKS_PER_HOUR;
  const max = state.config.eventMax * TICKS_PER_HOUR;
  const wait = Math.floor(Math.random() * (max - min + 1)) + min;
  state.nextEventTick = state.ticks + wait;
}

function updateEvents() {
  if (state.activeEvent) {
    const waited = state.ticks - state.activeEvent.startTick;

    if (waited >= EVENT_WINDOW_TICKS) {
      if (state.activeEvent.type === "play") {
        state.fun = clamp(state.fun - EVENT_PENALTY);
        showFeedback(MESSAGES.ignoredPlay(state.name));
      } else {
        state.hygiene = clamp(state.hygiene - EVENT_PENALTY);
        showFeedback(MESSAGES.ignoredBathroom(state.name));
      }
      state.stats.eventsIgnored++;
      state.activeEvent = null;
      scheduleNextEvent();
    }
  } else if (state.ticks >= state.nextEventTick) {
    const type = Math.random() < 0.5 ? "play" : "bathroom";
    state.activeEvent = { type: type, startTick: state.ticks };
  }
}

function resolveEvent(type) {
  if (state.activeEvent && state.activeEvent.type === type) {
    state.activeEvent = null;
    state.stats.eventsAttended++;
    scheduleNextEvent();
    return true;
  }
  return false;
}


/* ---------- 7. PLAYER ACTIONS ---------- */
function canAct() {
  return state !== null && !state.over;
}

function feed() {
  if (!canAct()) return;

  if (state.isHungry) {
    state.isHungry = false;
    state.ticksSinceMeal = 0;
    state.overfeedStreak = 0;
    state.stats.mealsGiven++;
    showFeedback(MESSAGES.fed);
  } else {
    state.overfeedStreak++;
    state.stats.overfeeds++;
    showFeedback(MESSAGES.overfed(state.overfeedStreak));
  }

  if (checkGhost()) return;
  render();
}

function play() {
  if (!canAct()) return;

  if (resolveEvent("play")) {
    state.fun = clamp(state.fun + 40);
    showFeedback(MESSAGES.playedEvent);
  } else {
    state.fun = clamp(state.fun + 15);
    showFeedback(MESSAGES.played);
  }
  render();
}

function goToBathroom() {
  if (!canAct()) return;

  if (resolveEvent("bathroom")) {
    state.hygiene = clamp(state.hygiene + 40);
    showFeedback(MESSAGES.bathroomEvent);
  } else {
    state.hygiene = clamp(state.hygiene + 15);
    showFeedback(MESSAGES.bathroom);
  }
  render();
}

function showFeedback(text) {
  state.feedback = { text: text, untilTick: state.ticks + FEEDBACK_TICKS };
}


/* ---------- 8. GAME OVER ---------- */
function checkGhost() {
  let reason = null;

  if (state.missedMeals >= MAX_MISSED_MEALS) {
    reason = MESSAGES.ghostMissed(state.name);
  } else if (state.overfeedStreak >= MAX_OVERFEED_STREAK) {
    reason = MESSAGES.ghostOverfed(state.name);
  } else if (state.fun <= 0) {
    reason = MESSAGES.ghostBored(state.name);
  } else if (state.hygiene <= 0) {
    reason = MESSAGES.ghostDirty(state.name);
  }

  if (reason) {
    gameOver(reason);
    return true;
  }
  return false;
}

function gameOver(reason) {
  stopTimer();
  state.over = true;

  dom.gameoverPet.innerHTML = getPetVisual(state.difficulty, "ghost");
  dom.gameoverReason.textContent = reason;
  setTheme(false);
  showScreen("screen-gameover");
}


/* ---------- 9. FINAL SUMMARY ---------- */
function endDay() {
  stopTimer();
  state.over = true;
  setTheme(false);
  buildSummary();
  showScreen("screen-summary");
}

function buildSummary() {
  const s = state.stats;
  const avgFun = Math.round(s.funSum / state.ticks);
  const avgHygiene = Math.round(s.hygieneSum / state.ticks);

  let score = 100;
  score -= state.missedMeals * 25;
  score -= s.overfeeds * 10;
  score -= s.eventsIgnored * 10;
  if (avgFun < 50) score -= 10;
  if (avgHygiene < 50) score -= 10;
  score = clamp(score);

  dom.grade.textContent = getGrade(score);

  const rows = [
    ["Mascot", `${state.name} (${state.config.label})`],
    ["Meals given", s.mealsGiven],
    ["Missed meals", state.missedMeals],
    ["Overfeeds", s.overfeeds],
    ["Events attended", s.eventsAttended],
    ["Events ignored", s.eventsIgnored],
    ["Average fun", `${avgFun}%`],
    ["Average hygiene", `${avgHygiene}%`],
    ["Final score", `${score}/100`],
  ];

  dom.summaryList.innerHTML = "";
  rows.forEach(([label, value]) => {
    const li = document.createElement("li");
    const spanLabel = document.createElement("span");
    const spanValue = document.createElement("strong");
    spanLabel.textContent = label;
    spanValue.textContent = value;
    li.append(spanLabel, spanValue);
    dom.summaryList.appendChild(li);
  });
}

function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}


/* ---------- 10. RENDER ---------- */
function render() {
  const { hours, minutes } = getClockTime();
  dom.clock.textContent = `${pad(hours)}:${pad(minutes)}`;

  const remainingTicks = TOTAL_TICKS - state.ticks;
  const hoursLeft = Math.floor(remainingTicks / TICKS_PER_HOUR);
  const minutesLeft = (remainingTicks % TICKS_PER_HOUR) * (60 / TICKS_PER_HOUR);
  dom.timeLeft.textContent = `${hoursLeft} h ${minutesLeft} min left`;
  dom.dayBar.style.width = `${(state.ticks / TOTAL_TICKS) * 100}%`;

  const night = isNight(hours);
  setTheme(night);
  dom.timeLabel.textContent = night ? "NIGHT" : "DAY";

  setBar(dom.barHunger, dom.valueHunger, getHunger(), true);
  setBar(dom.barFun, dom.valueFun, state.fun, false);
  setBar(dom.barHygiene, dom.valueHygiene, state.hygiene, false);

  const need = getNeed();
  dom.petVisual.classList.toggle("alert", need !== null);
  dom.message.textContent = getMessage(need, night);

  dom.btnFeed.classList.toggle("attention", need === "hungry");
  dom.btnPlay.classList.toggle("attention", need === "play");
  dom.btnBath.classList.toggle("attention", need === "bathroom");
}

function setBar(barElement, valueElement, value, highIsBad) {
  const rounded = Math.round(value);
  barElement.style.width = `${rounded}%`;
  valueElement.textContent = `${rounded}%`;

  const danger = highIsBad ? rounded >= 90 : rounded < 25;
  const warning = highIsBad ? rounded >= 60 : rounded < 50;
  barElement.classList.toggle("danger", danger);
  barElement.classList.toggle("warning", warning && !danger);
}

function getNeed() {
  if (state.isHungry) return "hungry";
  if (state.activeEvent) return state.activeEvent.type;
  return null;
}

function getMessage(need, night) {
  if (state.feedback && state.ticks < state.feedback.untilTick) {
    return state.feedback.text;
  }
  if (need === "hungry") return MESSAGES.hungry;
  if (need === "play") return MESSAGES.wantsPlay;
  if (need === "bathroom") return MESSAGES.wantsBathroom;
  if (state.fun < 30) return MESSAGES.bored;
  if (state.hygiene < 30) return MESSAGES.dirty;
  if (night) return MESSAGES.night;
  return MESSAGES.happy(state.name);
}

function getPetVisual(difficulty, look) {
  if (USE_IMAGES) {
    return `<img src="img/${difficulty}-${look}.png" alt="${difficulty} mascot">`;
  }
  return look === "ghost" ? "👻" : DIFFICULTIES[difficulty].emoji;
}

function pad(number) {
  return String(number).padStart(2, "0");
}


/* ---------- 11. SCREENS AND RESTART ---------- */
function showScreen(id) {
  dom.screens.forEach((screen) => {
    screen.classList.toggle("hidden", screen.id !== id);
  });
}

function setTheme(night) {
  dom.body.classList.toggle("night", night);
  dom.body.classList.toggle("day", !night);
}

function restart() {
  stopTimer();
  state = null;
  dom.startForm.reset();
  dom.startError.textContent = "";
  setTheme(false);
  showScreen("screen-start");
}

function loadOptionImages() {
  if (!USE_IMAGES) return;
  dom.optionVisuals.forEach((element) => {
    element.innerHTML = getPetVisual(element.dataset.pet, "normal");
  });
}


/* ---------- 12. EVENT LISTENERS ---------- */
dom.startForm.addEventListener("submit", handleStart);
dom.btnFeed.addEventListener("click", feed);
dom.btnPlay.addEventListener("click", play);
dom.btnBath.addEventListener("click", goToBathroom);
dom.btnRestartGameover.addEventListener("click", restart);
dom.btnRestartSummary.addEventListener("click", restart);

loadOptionImages();