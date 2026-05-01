# Dynamic Wumpus World Knowledge-Based Agent

## Project Overview

This project is a web-based dynamic pathfinding agent based on the Wumpus World problem. The agent acts as a Knowledge-Based Agent because it does not know the hidden world at the start. It receives percepts as it moves, stores facts in a Knowledge Base, and uses Propositional Logic with Resolution Refutation to decide which cells are safe.

The main goal is to show how an AI agent can use logic instead of random movement. The agent only moves to a cell when it can prove that the cell has no pit and no Wumpus.

## Features

- Dynamic grid sizing
- Random pits and Wumpus placement
- Hidden hazards at the start of each episode
- Dynamic percept generation
- Breeze percept near pits
- Stench percept near the Wumpus
- Knowledge Base TELL/ASK cycle
- CNF clause representation
- Resolution Refutation algorithm
- Safe cell deduction before movement
- Web grid visualization
- Real-time metrics dashboard
- Agent decision log
- Knowledge Base and inference panel
- Reveal hidden world option
- Auto Run and Stop Auto Run controls

## AI Concepts Used

### Knowledge-Based Agent

The agent stores information about the world in a Knowledge Base and uses that knowledge to make decisions.

### Propositional Logic

The project uses symbols such as `P_1_2`, `W_2_3`, `B_1_1`, and `S_1_1` to represent facts about cells.

### Percepts

The agent receives percepts from the current cell:

- Breeze means there may be a pit in an adjacent cell.
- Stench means there may be a Wumpus in an adjacent cell.
- No Breeze and No Stench help the agent prove nearby cells are safe.

### Knowledge Base

The Knowledge Base stores facts and rules. When the agent visits a cell, it tells the KB what it knows about that cell and its percepts.

### CNF

Rules are stored as CNF clauses. A clause is an array of literals, for example:

```text
["!B_1_1", "P_1_2", "P_2_1"]
```

### Resolution Refutation

The agent asks the KB if a query is true by using resolution. If the query can be proven, the agent uses that result for movement.

### Pathfinding Using Logical Inference

The agent does not move randomly into unknown cells. It checks adjacent cells and moves only when the KB proves the cell is safe.

## How the Agent Works

1. Agent starts at `(1,1)`.
2. It receives percepts from the current cell.
3. It tells the KB new facts about the current cell.
4. It asks if adjacent cells are safe.
5. It moves only to provably safe cells.
6. It stops if no safe move is provable.

## Resolution Refutation

To prove a query `Q`, the project uses this simple process:

1. Add the negation of the query, `NOT Q`, to a temporary copy of the KB.
2. Resolve pairs of clauses.
3. If an empty clause is produced, a contradiction is found.
4. Because `NOT Q` caused a contradiction, the original query `Q` is proven true.

For example, to prove that cell `(1,2)` has no pit, the agent asks:

```text
!P_1_2
```

If the KB proves both `!P_1_2` and `!W_1_2`, the cell is marked safe.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- GitHub
- Vercel or GitHub Pages

## How to Run Locally

You can run this project as a static website.

Option 1: Open directly

1. Open the project folder.
2. Open `index.html` in your browser.

Option 2: Use VS Code Live Server

1. Open the project folder in VS Code.
2. Install the Live Server extension if needed.
3. Right click `index.html`.
4. Click `Open with Live Server`.

Option 3: Use Python local server

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deployment

### Vercel Deployment

1. Push the project to GitHub.
2. Go to Vercel.
3. Click `Add New Project`.
4. Import the GitHub repository.
5. Set Framework Preset to `Other`.
6. Leave Build Command empty.
7. Leave Output Directory empty or use the project root.
8. Click `Deploy`.

### GitHub Pages Deployment

1. Push the project to GitHub.
2. Open the repository settings.
3. Go to `Pages`.
4. Select the branch, usually `main`.
5. Select root folder.
6. Save and wait for the live URL.

## Screenshots

- Grid Visualization Screenshot
- Metrics Dashboard Screenshot
- Resolution Log Screenshot

## Repository

GitHub: <https://github.com/codexTaha/ai-assignment6>

## Author

codexTaha
