let latestState = null;
let requestRunning = false;

const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const startButton = document.getElementById("startButton");
const revealButton = document.getElementById("revealButton");
const resetButton = document.getElementById("resetButton");

const gridDiv = document.getElementById("grid");
const gridSizeText = document.getElementById("gridSizeText");
const locationText = document.getElementById("locationText");
const perceptText = document.getElementById("perceptText");
const visitedText = document.getElementById("visitedText");
const safeText = document.getElementById("safeText");
const hazardText = document.getElementById("hazardText");
const stepsText = document.getElementById("stepsText");
const decisionText = document.getElementById("decisionText");
const statusText = document.getElementById("statusText");
const kbFactsArea = document.getElementById("kbFactsArea");
const lastQueryText = document.getElementById("lastQueryText");
const lastResultText = document.getElementById("lastResultText");
const explanationArea = document.getElementById("explanationArea");
const logArea = document.getElementById("logArea");

startButton.addEventListener("click", startGame);
revealButton.addEventListener("click", revealWorld);
resetButton.addEventListener("click", resetGame);

async function startGame() {
    let rows = parseInt(rowsInput.value);
    let cols = parseInt(colsInput.value);

    if (isNaN(rows) || rows < 2) {
        rows = 4;
    }
    if (isNaN(cols) || cols < 2) {
        cols = 4;
    }

    let state = await sendPostRequest("/api/start", {
        rows: rows,
        cols: cols
    });

    renderState(state);
}

async function moveToCell(row, col) {
    if (requestRunning) {
        return;
    }

    requestRunning = true;
    let state = null;

    try {
        state = await sendPostRequest("/api/move", {
            row: row,
            col: col
        });
    } finally {
        requestRunning = false;
    }

    if (state !== null) {
        renderState(state);
    }
}

async function revealWorld() {
    let state = await sendPostRequest("/api/reveal", {});
    renderState(state);
}

async function resetGame() {
    rowsInput.value = "";
    colsInput.value = "";

    let state = await sendPostRequest("/api/reset", {});
    renderState(state);
}

async function loadCurrentState() {
    let response = await fetch("/api/state");
    let state = await response.json();
    renderState(state);
}

async function sendPostRequest(url, data) {
    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

function renderState(state) {
    latestState = state;
    renderGrid(state);
    renderMetrics(state);
    renderKbPanel(state);
    renderLogs(state);
    updateButtons();
}

function renderGrid(state) {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = "repeat(" + state.cols + ", minmax(42px, 1fr))";

    for (let row = 1; row <= state.rows; row++) {
        for (let col = 1; col <= state.cols; col++) {
            let cellDiv = document.createElement("button");
            let stateText = "Unknown";
            cellDiv.className = "cell unknown";
            cellDiv.type = "button";

            if (cellExists(state.safe_cells, row, col) || cellExists(state.visited, row, col)) {
                cellDiv.className = "cell visited";
                stateText = "Safe";
            }

            if (cellExists(state.confirmed_hazards, row, col)) {
                cellDiv.className = "cell hazard";
                stateText = "Hazard";
            }

            if (state.revealed && state.actual_wumpus &&
                state.actual_wumpus.row === row && state.actual_wumpus.col === col) {
                cellDiv.className = "cell revealed-hazard";
                stateText = "Wumpus";
            }

            if (state.revealed && cellExists(state.actual_pits || [], row, col)) {
                cellDiv.className = "cell revealed-hazard";
                stateText = "Pit";
            }

            if (state.agent_row === row && state.agent_col === col && !state.game_over) {
                cellDiv.className = "cell agent";
                stateText = "Agent";
            }

            cellDiv.addEventListener("click", function () {
                moveToCell(row, col);
            });

            cellDiv.appendChild(makeCellLine("(" + row + "," + col + ")", "cell-coord"));
            cellDiv.appendChild(makeCellLine(stateText, "cell-state"));
            gridDiv.appendChild(cellDiv);
        }
    }
}

function renderMetrics(state) {
    gridSizeText.textContent = state.rows + " x " + state.cols;
    locationText.textContent = "(" + state.agent_row + ", " + state.agent_col + ")";
    perceptText.textContent = state.current_percepts.join(", ");
    visitedText.textContent = state.visited.length;
    safeText.textContent = state.safe_cells.length;
    hazardText.textContent = state.confirmed_hazards.length;
    stepsText.textContent = state.total_inference_steps;
    decisionText.textContent = getLastDecision(state);
    statusText.textContent = state.status;
    updateStatusStyle(state.status);
}

function renderKbPanel(state) {
    renderLineList(kbFactsArea, state.recent_kb_facts, "No facts added yet.");
    lastQueryText.textContent = state.last_query || "-";
    lastResultText.textContent = state.last_query_result || "-";
    renderLineList(explanationArea, state.last_resolution_steps, "No resolution explanation yet.");
}

function renderLogs(state) {
    logArea.innerHTML = "";

    let logs = state.decision_log.slice().reverse();
    for (let i = 0; i < logs.length; i++) {
        let line = document.createElement("div");
        line.className = "log-line";
        line.textContent = logs[i];
        logArea.appendChild(line);
    }
}

function renderLineList(area, items, emptyText) {
    area.innerHTML = "";

    if (!items || items.length === 0) {
        area.appendChild(makeSmallLine(emptyText));
        return;
    }

    for (let i = 0; i < items.length; i++) {
        area.appendChild(makeSmallLine(items[i]));
    }
}

function updateButtons() {
    revealButton.disabled = false;
}

function updateStatusStyle(status) {
    statusText.className = "";

    if (status.includes("Moved") || status.includes("started")) {
        statusText.className = "status-good";
    }

    if (status.includes("rejected") || status.includes("hazard")) {
        statusText.className = "status-warn";
    }
}

function getLastDecision(state) {
    if (!state.decision_log || state.decision_log.length === 0) {
        return "-";
    }

    return state.decision_log[state.decision_log.length - 1];
}

function cellExists(cells, row, col) {
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].row === row && cells[i].col === col) {
            return true;
        }
    }

    return false;
}

function makeCellLine(text, className) {
    let line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    return line;
}

function makeSmallLine(text) {
    let line = document.createElement("div");
    line.className = "small-line";
    line.textContent = text;
    return line;
}

loadCurrentState();
