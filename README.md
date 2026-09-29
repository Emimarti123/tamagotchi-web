# tamagotchi-web
Virtual mascot based on the tamagotchi mascot. 
# Web Mascot

A virtual pet web application built with HTML, CSS and  JavaScript. The player chooses a mascot, gives it a name and takes care of it during one simulated day.

Author: Emiliano Martinez Sandoval

**Live demo:** https://emimarti123.github.io/tamagotchi-web/

---

## How to run

### Option 1: online
Open the live demo link above. No installation is needed.

### Option 2: locally
1. Clone the repository:
   git clone https://github.com/Emimarti123/tamagotchi-web.git
   ```
2. Open the project folder.
3. Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox).

No server, libraries or dependencies are required.

---

## Features

### Mascot creation
- Three mascots to choose from, each one with its own difficulty:

  | Mascot | Difficulty | Eats every | Stats decay | Random events |
  |---|---|---|---|---|
  | 1 | Easy | 6 h | 3 pts/h | every 3–5 h |
  | 2 | Medium | 4 h | 4.5 pts/h | every 2.5–4 h |
  | 3 | Hard | 3 h | 6 pts/h | every 2–3 h |

- The player must choose a mascot and write a name (validated before starting).

### Simulated clock
- **6 real seconds = 1 simulated hour** (the full day lasts 144 seconds).
- The day runs from **08:00 to 08:00** of the next day.
- Shows the simulated time, the remaining time and a day progress bar.
- **Day / night mode**: from 20:00 to 08:00 the interface switches to night colors.

### Indicators
- **Hunger**: rises over time; at 100% the mascot asks for food.
- **Fun**: decreases over time.
- **Hygiene**: decreases over time.
- Bars change color (green, yellow, red) depending on their value.

### Random events
- The mascot randomly asks to **play** or to **go to the bathroom**.
- The player has 1 simulated hour to respond; if ignored, the related indicator drops by 30 points.

### Buttons
- **Feed**, **Play** and **Bathroom**, each with its own response message.
- The button the mascot needs pulses, and the mascot shakes, while it is asking for something.

### Consequences (Game Over)
The mascot turns into a **ghost** if:
- It is **not fed 2 times** (accumulated) when it was hungry.
- It is **overfed 3 times in a row** (fed when it was not hungry).
- **Fun** or **hygiene** reaches 0.

A Game Over screen shows the reason and a button to play again.

### Final summary
After 24 simulated hours, a summary shows meals given, missed meals, overfeeds, events attended and ignored, average fun and hygiene, a final score (0–100) and a grade (A–F).

---

## Project structure

```
tamagotchi-web/
├── index.html       # Structure of the 4 screens
├── css/
│   └── styles.css   # Design, day/night mode, animations, responsive
├── js/
│   └── app.js       # Game logic
├── img/             # Pixel art mascots (normal and ghost versions)
└── README.md
```

## Technologies
- HTML5
- CSS3 (custom properties, grid, flexbox, animations)
- JavaScript (ES6, no frameworks)
- GitHub Pages (deployment)