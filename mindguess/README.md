# 🧠🌸 MindGuess — The Number Challenge (Bloom Edition)

A polished number guessing game built with **pure HTML5, CSS3 and Vanilla JavaScript**.
The computer secretly picks a number — find it with logic, temperature feedback and hints,
then celebrate your win under a rain of falling flowers 🌸.

---

## ✨ Features

- 🌸 **Flower petal rain victory celebration** — 7 petal types, randomized size, sway, spin & fall speed
- 🏆 Glassmorphic **result modal** with **score count-up animation**
- 🎴 **Difficulty cards** (Easy 🐣 / Medium 🦊 / Hard 🐉)
- ❤️ **Attempts as hearts** that visibly *break* when used
- 🌈 Animated aurora background + twinkling starfield
- 🦾 Hand-made **SVG robot mascot** with blinking eyes (click it 😉)
- ⌨️ **Typewriter tagline** that rotates through messages
- 🌡️ Temperature feedback that scales to ANY number range
- 💡 Dynamic hints (even/odd, greater/less than, between X and Y) — never reveal the answer
- 🔥 Streak counter that **catches fire** at 3+ wins
- ⏱️ Safe single timer (`setInterval`/`clearInterval` discipline)
- 📜 Guess history, 🛡️ full input validation, 💾 localStorage statistics
- 📱 Fully responsive — phone → desktop

---

## 🛠️ Technologies Used

| Tech | Purpose |
|---|---|
| HTML5 | Semantic structure, inline SVG artwork |
| CSS3 | Glassmorphism, keyframe animations, custom properties, responsive grid |
| Vanilla JavaScript | All game logic — zero libraries |
| localStorage | Persistent best score & best streak |

**Not used:** any framework, library, backend, database, API, image file or external asset.

---

## 🎮 How the Game Works

1. Page loads → game auto-starts on **Easy**.
2. Pick a difficulty card to start that mode.
3. The app secretly generates a number in the range.
4. Type a guess → feedback: **Too High 📉 / Too Low 📈** + temperature 🔥🌡️❄️🧊.
5. Use hints 💡 (limited per difficulty).
6. Guess right before attempts run out → **petals rain down! 🌸🏆**
7. Run out → the secret is revealed; streak resets to 0.

---

## 🎚️ Difficulty Levels

| Level | Range | Attempts | Hints | Bonus |
|---|---|---|---|---|
| Easy 🐣   | 1–50  | 10 | 3 | 0   |
| Medium 🦊 | 1–100 | 8  | 2 | 50  |
| Hard 🐉   | 1–500 | 7  | 1 | 150 |

---

## 🌡️ Temperature System

Thresholds are **relative to the range size** (`difference / (max - min + 1)`), so the same
code works for 1–50 and 1–500:

| Ratio of range | Feedback |
|---|---|
| ≤ 5%  | 🔥 SUPER HOT |
| ≤ 12% | 🔥 HOT |
| ≤ 25% | 🌡️ WARM |
| ≤ 45% | ❄️ COLD |
| &gt; 45% | 🧊 FREEZING |

---

## 🌸 How the Flower Rain Works (Beginner Explanation)

1. On victory, `startPetalRain()` starts a `setInterval` that calls `createPetal()` every ~160 ms.
2. Each petal is a `&lt;div&gt;` containing a random flower emoji.
3. Random inline CSS variables are set from JavaScript:
   `--size` (16–34px), `--dur` (3.5–6s fall), `--sway` (−60px…60px side drift), and `left`.
4. The CSS keyframe `petal-fall` animates the petal from `top: -50px` to below the viewport,
   rotating and swaying using those variables.
5. `setTimeout(..., dur * 1000 + 200)` **removes** each petal after its fall, so the DOM stays clean.
6. Starting a new game or clicking Play Again calls `stopPetalRain()` (clearInterval) — exactly like the game timer.

---

## 🏆 Score Formula

```
Score = maxNumber + difficultyBonus + (attemptsLeft × 10) − (hintsUsed × 15) + max(0, 30 − seconds)
```
Clamped at 0. A loss always scores 0.

---

## 🔥 Streak System

- Win → `currentStreak + 1` · Loss → reset to 0
- Best streak & best score are stored in **localStorage**:
  `localStorage.setItem("mindguess_bestScore", String(bestScore))` — remember: it only stores **strings**, so read with `parseInt()`.
- 🗑️ Reset button clears everything.

---

## 📁 Project Structure

```
mindguess/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 🚀 How to Run

1. Install **VS Code** → create a folder `mindguess` → create the 4 files → paste the code.
2. Double-click `index.html`, **or** install the **Live Server** extension, right-click `index.html` → *Open with Live Server* (auto-refresh on save).

---

## 📚 JavaScript Concepts Learned

Variables · functions · arrays (`push`, `includes`, `filter`) · objects · `if/else` · template literals · DOM manipulation (`getElementById`, `createElement`, `innerHTML`, `classList`) · event listeners · `Math.random()`/`Math.floor()` · `setInterval`/`clearInterval` (timer **and** petal rain) · `localStorage` · `padStart` · CSS custom properties set from JS (`style.setProperty`).

## 🗺️ Learning Roadmap (do NOT add yet — future ideas)

🔊 Web Audio sound effects · 🌙 dark/light toggle · 🏅 achievements · 📅 daily challenge ·
🌐 online leaderboard (needs a backend!) · 👥 multiplayer · 📲 PWA install.

## 🐙 GitHub Upload Guide

```bash
git init
git add .
git commit -m "MindGuess Bloom Edition"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Deploy free: repo **Settings → Pages → Source: main /(root) → Save** → live at `https://YOU.github.io/mindguess/`.
*(If Pages shows the README: your file must be named exactly `index.html`, lowercase, in the repo root.)*

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| Plain page, no styles | `href="style.css"` typo? Files in same folder? Hard-refresh **Ctrl+F5**. |
| Buttons dead | Check every `id` in JS matches the HTML exactly (case-sensitive). |
| Petals not falling | Console (F12) for errors; ensure `script.js` loads at the **bottom of `&lt;body&gt;`**. |
| Timer runs 2× fast | Two intervals — `startTimer()` must call `stopTimer()` first (it does). |
| localStorage stuck | DevTools → Application → Local Storage → delete keys, or press 🗑️ Reset. |
| GitHub Pages shows README | `index.html` lowercase, in repo **root**; wait 1–2 min, hard-refresh. |

## 📄 License
Free for learning & personal projects. Made with ❤️ and 🌸 for beginners.