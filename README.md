# Dynamic Wumpus World Knowledge-Based Agent

## Project Overview

This project is a Python-backed web application for a Dynamic Wumpus World Knowledge-Based Agent. The agent uses Propositional Logic and Resolution Refutation to decide which cells are safe before moving.

The Wumpus World is generated dynamically. The agent does not know the hidden Wumpus or pit locations at the start. As it moves, it receives Breeze and Stench percepts, tells facts to its Knowledge Base, asks logical queries, and moves only when safety is provable.

## Main Language

Python

## Core AI Logic

The core AI logic is implemented in Python in `ai_logic.py`.

Python handles:

- Wumpus World generation
- Random Wumpus and pit placement
- Percept generation
- Knowledge Base facts and rules
- CNF clauses
- Resolution Refutation
- Safe-cell deduction
- Move validation and safety decisions

## Frontend

The frontend uses HTML, CSS, and Vanilla JavaScript only for visualization and API calls.

JavaScript handles:

- Button clicks
- Calling Flask APIs with `fetch()`
- Rendering the grid
- Updating dashboard values
- Showing KB facts, resolution steps, and logs

JavaScript does not perform the AI reasoning.

## Architecture

- Flask backend runs the AI engine.
- Frontend sends button actions to Python APIs.
- Python updates the game state and returns JSON.
- JavaScript only renders the returned state.

Project structure:

```text
project_folder/
├── app.py
├── ai_logic.py
├── requirements.txt
├── README.md
├── LINKEDIN_POST.md
├── SUBMISSION_CHECKLIST.md
├── render_start_command.txt
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Why Python is used for AI Logic

The assignment requires the main AI functionality to be implemented in Python. Therefore, Wumpus World generation, percept generation, Knowledge Base, CNF clauses, Resolution Refutation, safe-cell deduction, and movement decisions are all implemented in Python.

JavaScript is used only for the web interface.

## Features

- Dynamic grid sizing
- Random pits and Wumpus
- Hidden hazards at the start
- Dynamic percept generation
- Breeze and Stench
- Knowledge Base TELL/ASK cycle
- CNF clauses
- Resolution Refutation
- Safe cell deduction
- Web grid visualization
- Real-time metrics dashboard
- Agent decision log
- KB / inference panel
- Reveal hidden world option
- Manual click-to-move gameplay

## AI Concepts Used

### Knowledge-Based Agent

The agent stores facts in a Knowledge Base and uses those facts to make movement decisions.

### Propositional Logic

The world is represented using symbols like:

- `P_1_2` means Pit at row 1, column 2
- `W_2_3` means Wumpus at row 2, column 3
- `B_1_1` means Breeze at row 1, column 1
- `S_1_1` means Stench at row 1, column 1

### Percepts

The agent receives percepts at its current cell:

- Breeze if there is an adjacent pit
- Stench if there is an adjacent Wumpus
- None if no Breeze or Stench exists

### Knowledge Base

When the agent visits a cell, it tells the KB:

- The current cell has no pit
- The current cell has no Wumpus
- Whether Breeze exists
- Whether Stench exists

### CNF

The rules are stored as CNF clauses. A clause is a list of literals, for example:

```text
["!B_1_1", "P_1_2", "P_2_1"]
```

### Resolution Refutation

The project proves queries using Resolution Refutation. This is used to prove whether a cell has no pit and no Wumpus.

### User Movement Using Logical Inference

The user clicks a neighboring cell. The Python backend checks whether the move is adjacent and whether the Knowledge Base can prove the cell is safe.

## How the Agent Works

1. Agent starts at `(1,1)`.
2. It receives percepts.
3. It tells the KB new facts.
4. The user clicks a neighboring cell.
5. Python asks if the selected cell is safe.
6. The move is accepted only if the cell is adjacent and provably safe.
7. If the cell is not safe or not adjacent, Python rejects the move and returns a status message.

Repeated movement was intentionally removed because the project is now a user-playable Wumpus World game.

## Resolution Refutation

To prove a query:

1. Add the negation of the query to a temporary copy of the KB.
2. Resolve clauses.
3. If an empty clause is produced, a contradiction is found.
4. Therefore, the original query is true.

Example query:

```text
!P_1_2
```

This asks whether cell `(1,2)` has no pit.

## Tech Stack

- Python
- Flask
- HTML
- CSS
- Vanilla JavaScript
- GitHub
- Render

## How to Run Locally

1. Create virtual environment:

```bash
python -m venv venv
```

2. Activate it:

Linux/Mac:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

3. Install requirements:

```bash
pip install -r requirements.txt
```

4. Run:

```bash
python app.py
```

5. Open:

```text
http://127.0.0.1:5000
```

## Deployment

GitHub Pages alone cannot run this project because GitHub Pages only hosts static frontend files. This project needs a Python backend.

### Render Deployment

1. Push project to GitHub.
2. Go to Render.
3. Click `New Web Service`.
4. Connect the GitHub repository.
5. Build command:

```bash
pip install -r requirements.txt
```

6. Start command:

```bash
gunicorn app:app
```

7. Deploy.

## Screenshots

- Grid Visualization Screenshot
- Metrics Dashboard Screenshot
- Resolution Log Screenshot

## Repository

GitHub: <https://github.com/codexTaha/ai-assignment6>


## Author

codexTaha
