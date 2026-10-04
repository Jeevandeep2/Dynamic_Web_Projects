"use strict";

/* =====================================================
   1. DIFFICULTY SETTINGS
   ===================================================== */
const DIFFICULTIES = {
  easy:   { label: "Easy",   min: 1, max: 50,  attempts: 10, hints: 3, bonus: 0   },
  medium: { label: "Medium", min: 1, max: 100, attempts: 8,  hints: 2, bonus: 50  },
  hard:   { label: "Hard",   min: 1, max: 500, attempts: 7,  hints: 1, bonus: 150 }
};

/* Petals used in the victory celebration */
const PETAL_EMOJIS = ["🌸", "🌺", "🌼", "🌷", "💮", "🏵️", "🍃"];

/* =====================================================
   2. GAME STATE
   ===================================================== */
let secretNumber = 0;
let currentDifficulty = "easy";
let attemptsLeft = 0;
let hintsLeft = 0;
let hintsUsed = 0;
let usedHintTexts = [];
let previousGuesses = [];
let gameActive = false;
let timerInterval = null;
let secondsElapsed = 0;
let currentStreak = 0;
let bestStreak = 0;
let bestScore = 0;
let petalInterval = null;   // ID of the petal rain timer

/* =====================================================
   3. DOM REFERENCES
   ===================================================== */
const difficultyCards      = document.querySelectorAll(".diff-card");
const rangeDisplay         = document.getElementById("rangeDisplay");
const attemptsDisplay      = document.getElementById("attemptsHearts");
const hintsDisplay         = document.getElementById("hintsDisplay");
const timerDisplay         = document.getElementById("timerDisplay");
const guessForm            = document.getElementById("guessForm");
const guessInput           = document.getElementById("guessInput");
const hintButton           = document.getElementById("hintButton");
const newGameButton        = document.getElementById("newGameButton");
const feedbackArea         = document.getElementById("feedbackArea");
const feedbackMessage      = document.getElementById("feedbackMessage");
const temperatureDisplay   = document.getElementById("temperatureDisplay");
const hintText             = document.getElementById("hintText");
const historyList          = document.getElementById("historyList");
const resultOverlay        = document.getElementById("resultOverlay");
const resultCard           = document.getElementById("resultCard");
const resultEmoji          = document.getElementById("resultEmoji");
const resultTitle          = document.getElementById("resultTitle");
const resultMessage        = document.getElementById("resultMessage");
const resultSecret         = document.getElementById("resultSecret");
const resultScore          = document.getElementById("resultScore");
const playAgainButton      = document.getElementById("playAgainButton");
const resetStatsButton     = document.getElementById("resetStatsButton");
const bestScoreDisplay     = document.getElementById("bestScoreDisplay");
const bestStreakDisplay    = document.getElementById("bestStreakDisplay");
const currentStreakDisplay = document.getElementById("currentStreakDisplay");
const currentStreakBox     = document.getElementById("currentStreakBox");
const mascot               = document.getElementById("mascot");
const sparkleLayer         = document.getElementById("sparkleLayer");

/* =====================================================
   4. SETUP FUNCTIONS
   ===================================================== */
function generateSecretNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startGame(difficultyKey) {
  const config = DIFFICULTIES[difficultyKey];

  // Reset round state
  currentDifficulty = difficultyKey;
  secretNumber = generateSecretNumber(config.min, config.max);
  attemptsLeft = config.attempts;
  hintsLeft = config.hints;
  hintsUsed = 0;
  usedHintTexts = [];
  previousGuesses = [];
  gameActive = true;

  // Reset UI
  stopPetalRain();
  resultOverlay.classList.add("hidden");
  resultCard.classList.remove("win", "lose");
  guessInput.disabled = false;
  guessInput.min = config.min;
  guessInput.max = config.max;
  guessInput.value = "";
  hintText.textContent = "";
  historyList.innerHTML = '<p class="history-empty">No guesses yet. Good luck! 🍀</p>';

  // Highlight the chosen difficulty card
  difficultyCards.forEach(function (card) {
    card.classList.toggle("active", card.dataset.difficulty === difficultyKey);
  });

  // Info chips + hearts
  rangeDisplay.textContent = config.min + " – " + config.max;
  hintsDisplay.textContent = hintsLeft;
  renderHearts(config.attempts, config.attempts);

  showFeedback("I'm thinking of a number between " + config.min + " and " + config.max + "…", "neutral");
  temperatureDisplay.textContent = "";

  startTimer();
  updateUI();
  guessInput.focus();
}

function resetGame() {
  startGame(currentDifficulty);
}

// Draw the attempt hearts (filled ❤️ = remaining, 💔 look = used)
function renderHearts(total, left) {
  let html = "";
  for (let i = 0; i < total; i++) {
    const lost = i >= left;
    html += '<span class="heart' + (lost ? " lost" : "") + '">❤️</span>';
}
  attemptsDisplay.innerHTML = html;
}

// Animate the most recent heart breaking
function breakHeart(total, left) {
  renderHearts(total, left);
  const hearts = attemptsDisplay.querySelectorAll(".heart");
  const index = left; // the heart that was just lost
  if (hearts[index]) hearts[index].classList.add("breaking");
}

/* =====================================================
   5. TIMER (never two timers at once!)
   ===================================================== */
function startTimer() {
  stopTimer();
  secondsElapsed = 0;
  updateTimerDisplay();
  timerInterval = setInterval(function () {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(secondsElapsed);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* =====================================================
   6. GUESS LOGIC
   ===================================================== */
function makeGuess(event) {
  event.preventDefault();
  if (!gameActive) {
    showFeedback("The game is over — press Play Again!", "error");
    return;
  }

  const config = DIFFICULTIES[currentDifficulty];
  const rawValue = guessInput.value;

  if (rawValue === "")            { rejectGuess("Please enter a number first!"); return; }
  const guess = Number(rawValue);
  if (!Number.isInteger(guess))   { rejectGuess("Whole numbers only — no decimals!"); return; }
  if (guess < config.min || guess > config.max) {
    rejectGuess("Your guess must be between " + config.min + " and " + config.max + ".");
    return;
  }
  if (previousGuesses.includes(guess)) {
    rejectGuess("You already tried " + guess + "! No attempt was used.");
    return;
  }

  checkGuess(guess, config);
}

function rejectGuess(message) {
  showFeedback(message, "error");
  guessInput.classList.remove("shake");
  void guessInput.offsetWidth;   // restart the CSS animation
  guessInput.classList.add("shake");
}

function checkGuess(guess, config) {
  previousGuesses.push(guess);
  attemptsLeft--;
  breakHeart(config.attempts, attemptsLeft);

  const temperature = getTemperature(guess, secretNumber, config.min, config.max);
  temperatureDisplay.textContent = temperature;

  if (guess === secretNumber) {
    updateHistory(guess, "🎉 Correct", temperature);
    handleWin();
  } else {
    const direction = guess > secretNumber ? "📉 Too High" : "📈 Too Low";
    showFeedback(direction + "! Try again.", "neutral");
    updateHistory(guess, direction, temperature);
    if (attemptsLeft === 0) handleLoss();
  }

  updateUI();
  guessInput.value = "";
  guessInput.focus();
}

/* =====================================================
   7. TEMPERATURE (scales to ANY range)
   ===================================================== */
function getTemperature(guess, secret, min, max) {
  const difference = Math.abs(guess - secret);
  const ratio = difference / (max - min + 1);
  if (ratio <= 0.05) return "🔥 SUPER HOT";
  if (ratio <= 0.12) return "🔥 HOT";
  if (ratio <= 0.25) return "🌡️ WARM";
  if (ratio <= 0.45) return "❄️ COLD";
  return "🧊 FREEZING";
}

/* =====================================================
   8. HINTS
   ===================================================== */
function generateHint() {
  if (!gameActive)  { showFeedback("The game is over — no more hints!", "error"); return; }
  if (hintsLeft <= 0) { showFeedback("No hints left for this difficulty!", "error"); return; }

  const config = DIFFICULTIES[currentDifficulty];
  const candidates = [];

  candidates.push(secretNumber % 2 === 0 ? "The number is EVEN." : "The number is ODD.");

  const lowerBound = secretNumber - (1 + Math.floor(Math.random() * 5));
  if (lowerBound >= config.min && lowerBound < secretNumber) {
    candidates.push("The number is greater than " + lowerBound + ".");
  }

  const upperBound = secretNumber + (1 + Math.floor(Math.random() * 5));
  if (upperBound <= config.max && upperBound > secretNumber) {
    candidates.push("The number is less than " + upperBound + ".");
  }

  const span = Math.max(4, Math.floor((config.max - config.min) * 0.08));
  const a = Math.max(config.min, secretNumber - span);
  const b = Math.min(config.max, secretNumber + span);
  if (b - a >= 2 && a !== secretNumber && b !== secretNumber) {
    candidates.push("The number is between " + a + " and " + b + ".");
  }

  const fresh = candidates.filter(function (h) { return usedHintTexts.indexOf(h) === -1; });
  const chosen = fresh.length > 0
    ? fresh[Math.floor(Math.random() * fresh.length)]
    : candidates[0];

  usedHintTexts.push(chosen);
  hintsLeft--;
  hintsUsed++;
  hintsDisplay.textContent = hintsLeft;
  hintText.textContent = "💡 " + chosen;
  updateUI();
}

/* =====================================================
   9. HISTORY
   ===================================================== */
function updateHistory(guess, direction, temperature) {
  const empty = historyList.querySelector(".history-empty");
  if (empty) empty.remove();

  const row = document.createElement("div");
  row.className = "history-row";

  let dirClass = "direction-low";
  if (direction.indexOf("High") !== -1) dirClass = "direction-high";
  if (direction.indexOf("Correct") !== -1) dirClass = "direction-correct";

  row.innerHTML =
    '<span class="attempt-num">#' + previousGuesses.length + '</span>' +
    '<span class="guess-value">' + guess + '</span>' +
    '<span class="' + dirClass + '">' + direction + '</span>' +
    '<span class="temp-cell">' + temperature + '</span>';

  historyList.insertBefore(row, historyList.firstChild); // newest on top
}

/* =====================================================
   10. SCORE & STREAK
   ===================================================== */
function calculateScore() {
  const config = DIFFICULTIES[currentDifficulty];
  const base = config.max;
  const attemptBonus = attemptsLeft * 10;
  const hintPenalty = hintsUsed * 15;
  const timeBonus = Math.max(0, 30 - secondsElapsed);
  return Math.max(0, base + config.bonus + attemptBonus - hintPenalty + timeBonus);
}

function handleWin() {
  gameActive = false;
  stopTimer();

  const score = calculateScore();
  currentStreak++;
  if (currentStreak > bestStreak) bestStreak = currentStreak;
  if (score > bestScore) bestScore = score;

  saveStatistics();
  updateStatsBar();

  showFeedback("🎉 CORRECT! You found it in " + formatTime(secondsElapsed) + "!", "success");
  temperatureDisplay.textContent = "🎯 BULLSEYE!";

  resultEmoji.textContent = "🎉";
  resultTitle.textContent = "You Win!";
  resultMessage.textContent = "Beautiful! Your streak is now " + currentStreak + ".";
  resultSecret.textContent = secretNumber;
  resultCard.classList.add("win");
  resultCard.classList.remove("lose");
  resultOverlay.classList.remove("hidden");

  animateScore(score);     // count-up effect
  startPetalRain();        // 🌸 FLOWERS! 🌸

  endRoundUI();
}

function handleLoss() {
  gameActive = false;
  stopTimer();
  currentStreak = 0;
  saveStatistics();
  updateStatsBar();

  showFeedback("😢 Out of attempts!", "error");

  resultEmoji.textContent = "💥";
  resultTitle.textContent = "You Lose!";
  resultMessage.textContent = "So close! Start a new game to rebuild your streak.";
  resultSecret.textContent = secretNumber;
  resultScore.textContent = "0";
  resultCard.classList.add("lose");
  resultCard.classList.remove("win");
  resultOverlay.classList.remove("hidden");

  endRoundUI();
}

function endRoundUI() {
  guessInput.disabled = true;
  hintButton.disabled = true;
}

// Count the score up from 0 like a real arcade game
function animateScore(target) {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const tick = setInterval(function () {
    current += step;
    if (current >= target) { current = target; clearInterval(tick); }
    resultScore.textContent = current;
  }, 30);
}

/* =====================================================
   11. 🌸 FLOWER PETAL RAIN
   setInterval spawns a new petal every ~160ms.
   Each petal is a <div> with random inline CSS
   variables (--size, --dur, --sway, --delay) that
   the CSS keyframe "petal-fall" reads. Petals
   remove themselves when the animation ends, so
   the page never fills up with dead elements.
   ===================================================== */
function startPetalRain() {
  stopPetalRain();
  petalInterval = setInterval(function () {
    if (document.hidden) return; // don't spawn while tab is hidden
    createPetal();
  }, 160);
}

function stopPetalRain() {
  if (petalInterval !== null) {
    clearInterval(petalInterval);
    petalInterval = null;
  }
}

function createPetal() {
  const petal = document.createElement("div");
  petal.className = "petal";
  petal.textContent = PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)];

  const size  = 16 + Math.random() * 18;          // 16px – 34px
  const dur   = 3.5 + Math.random() * 2.5;        // 3.5s – 6s fall time
  const sway  = (Math.random() * 120 - 60).toFixed(0) + "px"; // -60px..60px drift

  petal.style.left = Math.random() * 100 + "vw";
  petal.style.setProperty("--size", size.toFixed(0) + "px");
  petal.style.setProperty("--dur", dur.toFixed(2) + "s");
  petal.style.setProperty("--sway", sway);
  petal.style.setProperty("--delay", "0s");

  document.body.appendChild(petal);

  // Clean up: remove the petal once its fall is finished
  setTimeout(function () { petal.remove(); }, dur * 1000 + 200);
}

/* =====================================================
   12. UI HELPERS
   ===================================================== */
function showFeedback(message, type) {
  feedbackMessage.textContent = message;
  feedbackArea.classList.remove("success", "error", "pop");
  if (type === "success") feedbackArea.classList.add("success");
  if (type === "error")   feedbackArea.classList.add("error");
  void feedbackArea.offsetWidth;
  feedbackArea.classList.add("pop");
}

function updateUI() {
  hintsDisplay.textContent = hintsLeft;
  hintButton.disabled = hintsLeft === 0;
  // Streak catches fire at 3+ wins 🔥
  currentStreakBox.classList.toggle("on-fire", currentStreak >= 3);
}

function updateStatsBar() {
  bestScoreDisplay.textContent = bestScore;
  bestStreakDisplay.textContent = bestStreak;
  currentStreakDisplay.textContent = currentStreak;
}

/* =====================================================
   13. SPARKLES + TYPEWRITER + MASCOT EASTER EGG
   ===================================================== */
function buildSparkles() {
  for (let i = 0; i < 24; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = "✦";
    s.style.left = Math.random() * 100 + "vw";
    s.style.top  = Math.random() * 100 + "vh";
    s.style.setProperty("--tw", (2 + Math.random() * 3).toFixed(1) + "s");
    s.style.setProperty("--fs", (8 + Math.random() * 10).toFixed(0) + "px");
    s.style.animationDelay = (-Math.random() * 4).toFixed(1) + "s";
    sparkleLayer.appendChild(s);
  }
}

/* Typewriter effect for the tagline */
const TAGLINES = [
  "The Number Challenge — can you read my mind?",
  "Easy to learn. Impossible to put down.",
  "HOT or FREEZING? Trust your instincts. 🌡️",
  "Every win grows your streak. Every loss burns it. 🔥"
];
function startTypewriter() {
  const el = document.getElementById("typewriter");
  let line = 0, char = 0, deleting = false;

  setInterval(function () {
    const text = TAGLINES[line];
    if (!deleting) {
      char++;
      if (char === text.length) { deleting = true; return; } // pause happens naturally
    } else {
      char--;
      if (char === 0) { deleting = false; line = (line + 1) % TAGLINES.length; }
    }
    el.textContent = text.slice(0, char);
  }, deleting ? 30 : 55);
}

/* Click the mascot for a motivational wiggle 😄 */
const MASCOT_QUOTES = [
  "You got this! 💪", "Trust the temperature… 🌡️", "I believe in you! ⭐",
  "Hint: I'm not telling. 🤖", "One more guess! 🍀", "Focus, human! 🧠"
];
mascot.addEventListener("click", function () {
  mascot.classList.remove("wiggle");
  void mascot.getBoundingClientRect();
  mascot.classList.add("wiggle");
  showFeedback(MASCOT_QUOTES[Math.floor(Math.random() * MASCOT_QUOTES.length)], "neutral");
});

/* =====================================================
   14. LOCALSTORAGE
   ===================================================== */
function saveStatistics() {
  localStorage.setItem("mindguess_bestScore", String(bestScore));
  localStorage.setItem("mindguess_bestStreak", String(bestStreak));
}

function loadStatistics() {
  const s = localStorage.getItem("mindguess_bestScore");
  const t = localStorage.getItem("mindguess_bestStreak");
  bestScore  = s !== null ? parseInt(s, 10) : 0;
  bestStreak = t !== null ? parseInt(t, 10) : 0;
  updateStatsBar();
}

function resetStatistics() {
  bestScore = 0; bestStreak = 0; currentStreak = 0;
  localStorage.removeItem("mindguess_bestScore");
  localStorage.removeItem("mindguess_bestStreak");
  updateStatsBar();
  updateUI();
  showFeedback("Statistics cleared. Fresh start! ✨", "neutral");
}

/* =====================================================
   15. EVENT LISTENERS
   ===================================================== */
guessForm.addEventListener("submit", makeGuess);
hintButton.addEventListener("click", generateHint);
newGameButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", resetGame);
resetStatsButton.addEventListener("click", resetStatistics);

/* Difficulty cards — click any card to start that mode */
difficultyCards.forEach(function (card) {
  card.addEventListener("click", function () {
    startGame(card.dataset.difficulty);
  });
});

/* =====================================================
   16. INIT — runs once when the page loads
   ===================================================== */
buildSparkles();
startTypewriter();
loadStatistics();
startGame("easy");