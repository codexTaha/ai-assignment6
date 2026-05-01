let rows = 4;
let cols = 4;

let agentRow = 1;
let agentCol = 1;

let wumpusCell = null;
let pitCells = [];

let kb = [];
let visitedCells = [];
let safeCells = [];
let unknownCells = [];
let confirmedHazardCells = [];
let currentPercepts = [];
let totalInferenceSteps = 0;
let gameOver = false;

const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const startButton = document.getElementById("startButton");
const nextButton = document.getElementById("nextButton");
const gridDiv = document.getElementById("grid");
const locationText = document.getElementById("locationText");
const perceptText = document.getElementById("perceptText");
const stepsText = document.getElementById("stepsText");
const logArea = document.getElementById("logArea");

startButton.addEventListener("click", start_new_episode);
nextButton.addEventListener("click", next_step);

function get_adjacent_cells(row, col) {
    let cells = [];

    if (row > 1) {
        cells.push({ row: row - 1, col: col });
    }
    if (row < rows) {
        cells.push({ row: row + 1, col: col });
    }
    if (col > 1) {
        cells.push({ row: row, col: col - 1 });
    }
    if (col < cols) {
        cells.push({ row: row, col: col + 1 });
    }

    return cells;
}

function make_symbol(type, row, col) {
    return type + "_" + row + "_" + col;
}

function add_clause(clause) {
    let cleanClause = remove_duplicate_literals(clause);
    let key = clause_to_key(cleanClause);

    for (let i = 0; i < kb.length; i++) {
        if (clause_to_key(kb[i]) === key) {
            return;
        }
    }

    kb.push(cleanClause);
}

function add_percept_to_kb(row, col, breeze, stench) {
    let pitSymbol = make_symbol("P", row, col);
    let wumpusSymbol = make_symbol("W", row, col);
    let breezeSymbol = make_symbol("B", row, col);
    let stenchSymbol = make_symbol("S", row, col);

    // The agent knows the current visited cell is safe.
    add_clause(["!" + pitSymbol]);
    add_clause(["!" + wumpusSymbol]);

    if (breeze) {
        add_clause([breezeSymbol]);
    } else {
        add_clause(["!" + breezeSymbol]);
    }

    if (stench) {
        add_clause([stenchSymbol]);
    } else {
        add_clause(["!" + stenchSymbol]);
    }
}

function build_world_rules() {
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            let adjacentCells = get_adjacent_cells(row, col);
            let breezeSymbol = make_symbol("B", row, col);
            let stenchSymbol = make_symbol("S", row, col);
            let breezeClause = ["!" + breezeSymbol];
            let stenchClause = ["!" + stenchSymbol];

            for (let i = 0; i < adjacentCells.length; i++) {
                let cell = adjacentCells[i];
                let pitSymbol = make_symbol("P", cell.row, cell.col);
                let wumpusSymbol = make_symbol("W", cell.row, cell.col);

                // If there is a pit near this cell, then this cell has breeze.
                add_clause(["!" + pitSymbol, breezeSymbol]);

                // If there is a Wumpus near this cell, then this cell has stench.
                add_clause(["!" + wumpusSymbol, stenchSymbol]);

                breezeClause.push(pitSymbol);
                stenchClause.push(wumpusSymbol);
            }

            // If this cell has breeze, then at least one adjacent cell may have a pit.
            add_clause(breezeClause);

            // If this cell has stench, then at least one adjacent cell may have the Wumpus.
            add_clause(stenchClause);
        }
    }
}

function negate_literal(literal) {
    if (literal.startsWith("!")) {
        return literal.substring(1);
    }

    return "!" + literal;
}

function resolve_two_clauses(clause1, clause2) {
    let resolvents = [];

    for (let i = 0; i < clause1.length; i++) {
        let literal = clause1[i];
        let opposite = negate_literal(literal);

        if (clause2.includes(opposite)) {
            let newClause = [];

            for (let j = 0; j < clause1.length; j++) {
                if (clause1[j] !== literal) {
                    newClause.push(clause1[j]);
                }
            }

            for (let k = 0; k < clause2.length; k++) {
                if (clause2[k] !== opposite) {
                    newClause.push(clause2[k]);
                }
            }

            newClause = remove_duplicate_literals(newClause);

            if (!is_tautology(newClause)) {
                resolvents.push(newClause);
            }
        }
    }

    return resolvents;
}

function resolution_refutation(query_literal) {
    let clauses = copy_clauses(kb);
    let negatedQuery = negate_literal(query_literal);
    let explanation = [];
    let steps = 0;
    let maxSteps = 500;

    clauses.push([negatedQuery]);

    while (steps < maxSteps) {
        let newClauses = [];

        for (let i = 0; i < clauses.length; i++) {
            for (let j = i + 1; j < clauses.length; j++) {
                let resolvents = resolve_two_clauses(clauses[i], clauses[j]);

                for (let r = 0; r < resolvents.length; r++) {
                    let resolvent = resolvents[r];
                    steps++;

                    if (explanation.length < 6) {
                        explanation.push(
                            clause_to_text(clauses[i]) + " + " +
                            clause_to_text(clauses[j]) + " => " +
                            clause_to_text(resolvent)
                        );
                    }

                    if (resolvent.length === 0) {
                        return {
                            proven: true,
                            steps: steps,
                            explanation: explanation
                        };
                    }

                    if (!clause_exists(clauses, resolvent) && !clause_exists(newClauses, resolvent)) {
                        newClauses.push(resolvent);
                    }

                    if (steps >= maxSteps) {
                        break;
                    }
                }

                if (steps >= maxSteps) {
                    break;
                }
            }

            if (steps >= maxSteps) {
                break;
            }
        }

        if (newClauses.length === 0) {
            return {
                proven: false,
                steps: steps,
                explanation: explanation
            };
        }

        for (let n = 0; n < newClauses.length; n++) {
            clauses.push(newClauses[n]);
        }
    }

    explanation.push("Stopped after step limit to keep the browser responsive.");

    return {
        proven: false,
        steps: steps,
        explanation: explanation
    };
}

function ask_if_true(query_literal) {
    let result = resolution_refutation(query_literal);
    totalInferenceSteps += result.steps;
    return result;
}

function ask_if_safe(row, col) {
    let pitQuery = "!" + make_symbol("P", row, col);
    let wumpusQuery = "!" + make_symbol("W", row, col);

    let pitResult = ask_if_true(pitQuery);
    let wumpusResult = ask_if_true(wumpusQuery);

    return {
        safe: pitResult.proven && wumpusResult.proven,
        pitResult: pitResult,
        wumpusResult: wumpusResult
    };
}

function start_new_episode() {
    rows = parseInt(rowsInput.value);
    cols = parseInt(colsInput.value);

    if (isNaN(rows) || rows < 2) {
        rows = 4;
    }
    if (isNaN(cols) || cols < 2) {
        cols = 4;
    }

    agentRow = 1;
    agentCol = 1;
    kb = [];
    visitedCells = [];
    safeCells = [];
    unknownCells = [];
    confirmedHazardCells = [];
    currentPercepts = [];
    totalInferenceSteps = 0;
    gameOver = false;

    place_hazards();
    build_world_rules();

    add_to_list(visitedCells, 1, 1);
    add_to_list(safeCells, 1, 1);
    update_unknown_cells();

    logArea.innerHTML = "";
    add_log("New episode started with " + rows + " rows and " + cols + " columns.");
    add_log("Hidden Wumpus and pits were placed. The agent only knows the start cell.");

    nextButton.disabled = false;
    update_gui();
}

function place_hazards() {
    let allCells = [];

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (!(row === 1 && col === 1)) {
                allCells.push({ row: row, col: col });
            }
        }
    }

    shuffle_cells(allCells);

    wumpusCell = allCells[0];
    pitCells = [];

    let pitCount = Math.floor((rows * cols) * 0.18);
    if (pitCount < 2 && allCells.length > 2) {
        pitCount = 2;
    } else if (pitCount < 1 && allCells.length > 1) {
        pitCount = 1;
    }

    for (let i = 1; i < allCells.length && pitCells.length < pitCount; i++) {
        pitCells.push(allCells[i]);
    }
}

function next_step() {
    if (gameOver) {
        return;
    }

    let percept = get_percepts(agentRow, agentCol);
    currentPercepts = [];

    if (percept.breeze) {
        currentPercepts.push("Breeze");
    }
    if (percept.stench) {
        currentPercepts.push("Stench");
    }
    if (currentPercepts.length === 0) {
        currentPercepts.push("None");
    }

    add_percept_to_kb(agentRow, agentCol, percept.breeze, percept.stench);
    add_to_list(visitedCells, agentRow, agentCol);
    add_to_list(safeCells, agentRow, agentCol);

    add_log("Visited (" + agentRow + ", " + agentCol + ") and perceived: " + currentPercepts.join(", ") + ".");

    let adjacentCells = get_adjacent_cells(agentRow, agentCol);
    let nextCell = null;

    for (let i = 0; i < adjacentCells.length; i++) {
        let cell = adjacentCells[i];

        if (!cell_in_list(visitedCells, cell.row, cell.col)) {
            let safeCheck = ask_if_safe(cell.row, cell.col);

            add_log("Checking (" + cell.row + ", " + cell.col + "): safe = " + safeCheck.safe + ".");

            if (safeCheck.safe) {
                add_to_list(safeCells, cell.row, cell.col);
                nextCell = cell;
                break;
            }

            check_confirmed_hazard(cell.row, cell.col);
        }
    }

    if (nextCell === null) {
        add_log("No provably safe unvisited adjacent cell found.");
        gameOver = true;
        nextButton.disabled = true;
        reveal_actual_hazards();
    } else {
        agentRow = nextCell.row;
        agentCol = nextCell.col;
        add_log("Agent moved to (" + agentRow + ", " + agentCol + ").");
    }

    update_unknown_cells();
    update_gui();
}

function get_percepts(row, col) {
    let adjacentCells = get_adjacent_cells(row, col);
    let breeze = false;
    let stench = false;

    for (let i = 0; i < adjacentCells.length; i++) {
        let cell = adjacentCells[i];

        if (cell_in_list(pitCells, cell.row, cell.col)) {
            breeze = true;
        }

        if (wumpusCell.row === cell.row && wumpusCell.col === cell.col) {
            stench = true;
        }
    }

    return {
        breeze: breeze,
        stench: stench
    };
}

function check_confirmed_hazard(row, col) {
    let pitSymbol = make_symbol("P", row, col);
    let wumpusSymbol = make_symbol("W", row, col);
    let pitResult = ask_if_true(pitSymbol);
    let wumpusResult = ask_if_true(wumpusSymbol);

    if (pitResult.proven || wumpusResult.proven) {
        add_to_list(confirmedHazardCells, row, col);
        add_log("Hazard confirmed at (" + row + ", " + col + ") by the KB.");
    }
}

function reveal_actual_hazards() {
    add_to_list(confirmedHazardCells, wumpusCell.row, wumpusCell.col);

    for (let i = 0; i < pitCells.length; i++) {
        add_to_list(confirmedHazardCells, pitCells[i].row, pitCells[i].col);
    }

    add_log("Episode stopped. Actual hazards are now shown.");
}

function update_unknown_cells() {
    unknownCells = [];

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (!cell_in_list(visitedCells, row, col) &&
                !cell_in_list(safeCells, row, col) &&
                !cell_in_list(confirmedHazardCells, row, col)) {
                unknownCells.push({ row: row, col: col });
            }
        }
    }
}

function update_gui() {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = "repeat(" + cols + ", minmax(42px, 1fr))";

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            let cellDiv = document.createElement("div");
            cellDiv.className = "cell unknown";
            cellDiv.textContent = row + "," + col;

            if (cell_in_list(confirmedHazardCells, row, col)) {
                cellDiv.className = "cell hazard";
                cellDiv.textContent = get_hazard_name(row, col);
            }

            if (cell_in_list(visitedCells, row, col) || cell_in_list(safeCells, row, col)) {
                cellDiv.className = "cell visited";
                cellDiv.textContent = "Safe";
            }

            if (agentRow === row && agentCol === col && !gameOver) {
                cellDiv.className = "cell agent";
                cellDiv.textContent = "Agent";
            }

            gridDiv.appendChild(cellDiv);
        }
    }

    locationText.textContent = "(" + agentRow + ", " + agentCol + ")";
    if (currentPercepts.length === 0) {
        perceptText.textContent = "Not sensed yet";
    } else {
        perceptText.textContent = currentPercepts.join(", ");
    }
    stepsText.textContent = totalInferenceSteps;
}

function get_hazard_name(row, col) {
    if (wumpusCell.row === row && wumpusCell.col === col) {
        return "Wumpus";
    }

    if (cell_in_list(pitCells, row, col)) {
        return "Pit";
    }

    return "Hazard";
}

function add_log(message) {
    let line = document.createElement("div");
    line.className = "log-line";
    line.textContent = message;
    logArea.prepend(line);
}

function add_to_list(list, row, col) {
    if (!cell_in_list(list, row, col)) {
        list.push({ row: row, col: col });
    }
}

function cell_in_list(list, row, col) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].row === row && list[i].col === col) {
            return true;
        }
    }

    return false;
}

function shuffle_cells(cells) {
    for (let i = cells.length - 1; i > 0; i--) {
        let randomIndex = Math.floor(Math.random() * (i + 1));
        let temp = cells[i];
        cells[i] = cells[randomIndex];
        cells[randomIndex] = temp;
    }
}

function copy_clauses(clauses) {
    let copied = [];

    for (let i = 0; i < clauses.length; i++) {
        copied.push(clauses[i].slice());
    }

    return copied;
}

function remove_duplicate_literals(clause) {
    let result = [];

    for (let i = 0; i < clause.length; i++) {
        if (!result.includes(clause[i])) {
            result.push(clause[i]);
        }
    }

    return result.sort();
}

function is_tautology(clause) {
    for (let i = 0; i < clause.length; i++) {
        if (clause.includes(negate_literal(clause[i]))) {
            return true;
        }
    }

    return false;
}

function clause_exists(clauses, clause) {
    let key = clause_to_key(clause);

    for (let i = 0; i < clauses.length; i++) {
        if (clause_to_key(clauses[i]) === key) {
            return true;
        }
    }

    return false;
}

function clause_to_key(clause) {
    return clause.slice().sort().join("|");
}

function clause_to_text(clause) {
    if (clause.length === 0) {
        return "EMPTY";
    }

    return "[" + clause.join(" OR ") + "]";
}

start_new_episode();
