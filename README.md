# Dynamic Pathfinding Agent

This is Step 1 of the AI assignment.

The project is a Vanilla HTML, CSS, and JavaScript web app. It creates a Wumpus World style grid where an agent moves using a simple Knowledge Base and Propositional Logic resolution.

## Features in Step 1

- Dynamic row and column input
- Random Wumpus and pit placement
- Hidden hazards at the start
- Breeze and Stench percepts
- Simple CNF clause Knowledge Base
- Resolution refutation for logic queries
- Safe cell checking using:
  - no pit
  - no Wumpus
- Basic web GUI
- Step-by-step agent movement

## How to Run

Open `index.html` in a browser.

You can also run a local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Files

- `index.html` - page structure
- `style.css` - simple GUI styling
- `script.js` - world, KB, resolution, and movement logic
- `README.md` - project notes
