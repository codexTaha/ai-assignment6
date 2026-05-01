import random


game_state = {
    "rows": 4,
    "cols": 4,
    "agent_row": 1,
    "agent_col": 1,
    "wumpus": None,
    "pits": [],
    "visited": [],
    "safe_cells": [],
    "confirmed_hazards": [],
    "kb_clauses": [],
    "recent_kb_facts": [],
    "current_percepts": [],
    "total_inference_steps": 0,
    "last_query": "",
    "last_query_result": "",
    "last_resolution_steps": [],
    "decision_log": [],
    "status": "Not started",
    "revealed": False,
    "game_over": False
}

last_created_state = None


def make_new_game(rows, cols):
    global last_created_state

    rows = int(rows)
    cols = int(cols)

    if rows < 2:
        rows = 4
    if cols < 2:
        cols = 4

    state = {
        "rows": rows,
        "cols": cols,
        "agent_row": 1,
        "agent_col": 1,
        "wumpus": None,
        "pits": [],
        "visited": [],
        "safe_cells": [],
        "confirmed_hazards": [],
        "kb_clauses": [],
        "recent_kb_facts": [],
        "current_percepts": [],
        "total_inference_steps": 0,
        "last_query": "",
        "last_query_result": "",
        "last_resolution_steps": [],
        "decision_log": [],
        "status": "New episode started.",
        "revealed": False,
        "game_over": False
    }

    all_cells = []
    start_neighbors = get_adjacent_cells(1, 1, rows, cols)

    for row in range(1, rows + 1):
        for col in range(1, cols + 1):
            if not (row == 1 and col == 1):
                all_cells.append({"row": row, "col": col})

    random.shuffle(all_cells)

    safe_start_cells = []
    later_cells = []

    for cell in all_cells:
        if cell_in_list(start_neighbors, cell["row"], cell["col"]) or cell["row"] + cell["col"] <= 4:
            later_cells.append(cell)
        else:
            safe_start_cells.append(cell)

    if len(safe_start_cells) > 0:
        state["wumpus"] = safe_start_cells[0]
    else:
        state["wumpus"] = all_cells[0]

    pit_count = int((rows * cols) * 0.20)
    if pit_count < 2 and len(all_cells) > 2:
        pit_count = 2
    elif pit_count < 1 and len(all_cells) > 1:
        pit_count = 1

    state["pits"] = []
    pit_choices = safe_start_cells[1:] + later_cells

    for cell in pit_choices:
        if len(state["pits"]) >= pit_count:
            break

        if not same_cell(cell, state["wumpus"]):
            state["pits"].append(cell)

    build_world_rules(state)
    add_cell(state["visited"], 1, 1)
    add_cell(state["safe_cells"], 1, 1)
    state["decision_log"].append("New game created with hidden Wumpus and pits.")
    state["decision_log"].append("Agent starts at (1,1).")
    sense_current_cell(state)
    state["status"] = "New episode started. Click an adjacent proven-safe cell to move."
    last_created_state = state

    return get_visible_state(state)


def get_adjacent_cells(row, col, rows, cols):
    cells = []

    if row > 1:
        cells.append({"row": row - 1, "col": col})
    if row < rows:
        cells.append({"row": row + 1, "col": col})
    if col > 1:
        cells.append({"row": row, "col": col - 1})
    if col < cols:
        cells.append({"row": row, "col": col + 1})

    return cells


def make_symbol(symbol_type, row, col):
    return symbol_type + "_" + str(row) + "_" + str(col)


def add_clause(state, clause):
    clean_result = clean_clause(clause)

    if clean_result is None:
        return False

    for old_clause in state["kb_clauses"]:
        if clause_key(old_clause) == clause_key(clean_result):
            return False

    state["kb_clauses"].append(clean_result)
    return True


def add_fact(state, literal):
    added = add_clause(state, [literal])

    if added:
        state["recent_kb_facts"].insert(0, literal)
        if len(state["recent_kb_facts"]) > 8:
            state["recent_kb_facts"].pop()

    return added


def build_world_rules(state):
    rows = state["rows"]
    cols = state["cols"]

    for row in range(1, rows + 1):
        for col in range(1, cols + 1):
            adjacent_cells = get_adjacent_cells(row, col, rows, cols)
            breeze_symbol = make_symbol("B", row, col)
            stench_symbol = make_symbol("S", row, col)
            breeze_clause = ["!" + breeze_symbol]
            stench_clause = ["!" + stench_symbol]

            for cell in adjacent_cells:
                pit_symbol = make_symbol("P", cell["row"], cell["col"])
                wumpus_symbol = make_symbol("W", cell["row"], cell["col"])

                # If an adjacent pit exists, this cell has Breeze.
                add_clause(state, ["!" + pit_symbol, breeze_symbol])

                # If an adjacent Wumpus exists, this cell has Stench.
                add_clause(state, ["!" + wumpus_symbol, stench_symbol])

                breeze_clause.append(pit_symbol)
                stench_clause.append(wumpus_symbol)

            # If Breeze is true, at least one adjacent cell has a pit.
            add_clause(state, breeze_clause)

            # If Stench is true, at least one adjacent cell has Wumpus.
            add_clause(state, stench_clause)


def get_percepts(state, row, col):
    adjacent_cells = get_adjacent_cells(row, col, state["rows"], state["cols"])
    breeze = False
    stench = False

    for cell in adjacent_cells:
        if cell_in_list(state["pits"], cell["row"], cell["col"]):
            breeze = True

        if state["wumpus"]["row"] == cell["row"] and state["wumpus"]["col"] == cell["col"]:
            stench = True

    return {
        "breeze": breeze,
        "stench": stench
    }


def tell_current_cell_to_kb(state):
    row = state["agent_row"]
    col = state["agent_col"]
    percepts = get_percepts(state, row, col)
    facts_added = []

    pit_symbol = make_symbol("P", row, col)
    wumpus_symbol = make_symbol("W", row, col)
    breeze_symbol = make_symbol("B", row, col)
    stench_symbol = make_symbol("S", row, col)

    if add_fact(state, "!" + pit_symbol):
        facts_added.append("!" + pit_symbol)
    if add_fact(state, "!" + wumpus_symbol):
        facts_added.append("!" + wumpus_symbol)

    if percepts["breeze"]:
        if add_fact(state, breeze_symbol):
            facts_added.append(breeze_symbol)
    else:
        if add_fact(state, "!" + breeze_symbol):
            facts_added.append("!" + breeze_symbol)

    if percepts["stench"]:
        if add_fact(state, stench_symbol):
            facts_added.append(stench_symbol)
    else:
        if add_fact(state, "!" + stench_symbol):
            facts_added.append("!" + stench_symbol)

    state["current_percepts"] = percepts_to_list(percepts)
    state["decision_log"].append("Agent at (" + str(row) + "," + str(col) + ").")
    state["decision_log"].append("Percepts: " + percepts_to_text(percepts) + ".")

    if len(facts_added) > 0:
        state["decision_log"].append("TELL KB: " + ", ".join(facts_added))

    add_obvious_safe_facts(state, row, col, percepts, facts_added)


def add_obvious_safe_facts(state, row, col, percepts, facts_added):
    adjacent_cells = get_adjacent_cells(row, col, state["rows"], state["cols"])
    derived_facts = []

    for cell in adjacent_cells:
        pit_symbol = make_symbol("P", cell["row"], cell["col"])
        wumpus_symbol = make_symbol("W", cell["row"], cell["col"])

        # No Breeze means no adjacent cell has a pit.
        if not percepts["breeze"]:
            if add_fact(state, "!" + pit_symbol):
                derived_facts.append("!" + pit_symbol)

        # No Stench means no adjacent cell has Wumpus.
        if not percepts["stench"]:
            if add_fact(state, "!" + wumpus_symbol):
                derived_facts.append("!" + wumpus_symbol)

        if literal_known(state, "!" + pit_symbol) and literal_known(state, "!" + wumpus_symbol):
            add_cell(state["safe_cells"], cell["row"], cell["col"])

    if len(derived_facts) > 0:
        state["decision_log"].append("Derived safe facts: " + ", ".join(derived_facts))


def negate_literal(literal):
    if literal.startswith("!"):
        return literal[1:]

    return "!" + literal


def clean_clause(clause):
    result = []

    for literal in clause:
        if negate_literal(literal) in result:
            return None

        if literal not in result:
            result.append(literal)

    result.sort()
    return result


def resolve_two_clauses(clause1, clause2):
    resolvents = []

    for literal in clause1:
        opposite = negate_literal(literal)

        if opposite in clause2:
            new_clause = []

            for item in clause1:
                if item != literal:
                    new_clause.append(item)

            for item in clause2:
                if item != opposite:
                    new_clause.append(item)

            clean_result = clean_clause(new_clause)

            if clean_result is not None:
                resolvents.append(clean_result)

    return resolvents


def resolution_refutation(state, query_literal):
    if literal_known(state, query_literal):
        return {
            "proven": True,
            "steps": 1,
            "explanation": ["Known KB fact: " + query_literal]
        }

    if literal_known(state, negate_literal(query_literal)):
        return {
            "proven": False,
            "steps": 1,
            "explanation": ["Opposite fact is known: " + negate_literal(query_literal)]
        }

    clauses = copy_clauses(state["kb_clauses"])
    clauses.append([negate_literal(query_literal)])

    explanation = []
    steps = 0
    max_steps = 80

    while steps < max_steps:
        new_clauses = []

        for i in range(len(clauses)):
            for j in range(i + 1, len(clauses)):
                resolvents = resolve_two_clauses(clauses[i], clauses[j])

                for resolvent in resolvents:
                    steps += 1

                    if len(explanation) < 6:
                        line = clause_to_text(clauses[i]) + " + "
                        line += clause_to_text(clauses[j]) + " => "
                        line += clause_to_text(resolvent)
                        explanation.append(line)

                    if len(resolvent) == 0:
                        return {
                            "proven": True,
                            "steps": steps,
                            "explanation": explanation
                        }

                    if not clause_exists(clauses, resolvent) and not clause_exists(new_clauses, resolvent):
                        new_clauses.append(resolvent)

                    if steps >= max_steps:
                        break

                if steps >= max_steps:
                    break

            if steps >= max_steps:
                break

        if len(new_clauses) == 0:
            return {
                "proven": False,
                "steps": steps,
                "explanation": explanation
            }

        for new_clause in new_clauses:
            clauses.append(new_clause)

    explanation.append("Stopped after max step limit.")

    return {
        "proven": False,
        "steps": steps,
        "explanation": explanation
    }


def ask_if_true(state, query_literal):
    result = resolution_refutation(state, query_literal)
    state["total_inference_steps"] += result["steps"]
    state["last_query"] = "ASK KB: " + query_literal

    if result["proven"]:
        state["last_query_result"] = "Proven true"
    else:
        state["last_query_result"] = "Not proven"

    state["last_resolution_steps"] = result["explanation"]
    return result["proven"]


def ask_if_safe(state, row, col):
    pit_query = "!" + make_symbol("P", row, col)
    wumpus_query = "!" + make_symbol("W", row, col)

    state["decision_log"].append("ASK KB: Is (" + str(row) + "," + str(col) + ") safe?")

    no_pit = ask_if_true(state, pit_query)
    no_wumpus = ask_if_true(state, wumpus_query)

    state["last_query"] = "ASK KB: Is cell (" + str(row) + "," + str(col) + ") safe?"

    if no_pit and no_wumpus:
        state["last_query_result"] = "Proven safe"
        state["decision_log"].append("Result: Safe")
        return True

    state["last_query_result"] = "Not proven safe"
    state["decision_log"].append("Result: Not proven safe")
    return False


def update_safe_and_hazard_cells(state):
    for row in range(1, state["rows"] + 1):
        for col in range(1, state["cols"] + 1):
            no_pit = literal_known(state, "!" + make_symbol("P", row, col))
            no_wumpus = literal_known(state, "!" + make_symbol("W", row, col))

            if no_pit and no_wumpus:
                add_cell(state["safe_cells"], row, col)

            has_pit = literal_known(state, make_symbol("P", row, col))
            has_wumpus = literal_known(state, make_symbol("W", row, col))

            if has_pit or has_wumpus:
                add_cell(state["confirmed_hazards"], row, col)


def sense_current_cell(state):
    if state is None:
        return make_new_game(4, 4)

    if state["game_over"]:
        return get_visible_state(state)

    if agent_on_actual_hazard(state):
        state["status"] = "Agent entered an actual hazard."
        state["game_over"] = True
        return get_visible_state(state)

    tell_current_cell_to_kb(state)
    add_cell(state["visited"], state["agent_row"], state["agent_col"])
    add_cell(state["safe_cells"], state["agent_row"], state["agent_col"])
    update_safe_and_hazard_cells(state)
    trim_decision_log(state)
    return get_visible_state(state)


def try_user_move(state, target_row, target_col):
    if state is None:
        return make_new_game(4, 4)

    target_row = int(target_row)
    target_col = int(target_col)
    state["decision_log"].append("User selected move to (" + str(target_row) + "," + str(target_col) + ").")

    if state["game_over"]:
        state["status"] = "Move rejected: game is already over."
        state["decision_log"].append(state["status"])
        trim_decision_log(state)
        return get_visible_state(state)

    adjacent_cells = get_adjacent_cells(
        state["agent_row"],
        state["agent_col"],
        state["rows"],
        state["cols"]
    )

    if not cell_in_list(adjacent_cells, target_row, target_col):
        state["status"] = "Move rejected: you can only move to adjacent cells."
        state["decision_log"].append(state["status"])
        trim_decision_log(state)
        return get_visible_state(state)

    safe = ask_if_safe(state, target_row, target_col)

    if not safe:
        state["status"] = "Move rejected: cell (" + str(target_row) + "," + str(target_col) + ") is not provably safe by the KB."
        state["decision_log"].append(state["status"])
        trim_decision_log(state)
        return get_visible_state(state)

    state["agent_row"] = target_row
    state["agent_col"] = target_col
    add_cell(state["visited"], target_row, target_col)
    add_cell(state["safe_cells"], target_row, target_col)
    state["status"] = "Moved to (" + str(target_row) + "," + str(target_col) + ")."
    state["decision_log"].append("Move accepted: " + state["status"])

    sense_current_cell(state)
    state["status"] = "Moved to (" + str(target_row) + "," + str(target_col) + ")."
    trim_decision_log(state)
    return get_visible_state(state)


def reveal_world(state):
    if state is None:
        return make_new_game(4, 4)

    state["revealed"] = True
    state["status"] = "Hidden world revealed."
    state["decision_log"].append("Reveal Hidden World clicked.")
    trim_decision_log(state)
    return get_visible_state(state)


def get_visible_state(state):
    visible_state = {
        "rows": state["rows"],
        "cols": state["cols"],
        "agent_row": state["agent_row"],
        "agent_col": state["agent_col"],
        "visited": state["visited"],
        "safe_cells": state["safe_cells"],
        "confirmed_hazards": state["confirmed_hazards"],
        "current_percepts": state["current_percepts"],
        "total_inference_steps": state["total_inference_steps"],
        "recent_kb_facts": state["recent_kb_facts"],
        "last_query": state["last_query"],
        "last_query_result": state["last_query_result"],
        "last_resolution_steps": state["last_resolution_steps"],
        "decision_log": state["decision_log"],
        "status": state["status"],
        "revealed": state["revealed"],
        "game_over": state["game_over"]
    }

    if state["revealed"]:
        visible_state["actual_wumpus"] = state["wumpus"]
        visible_state["actual_pits"] = state["pits"]

    return visible_state


def add_cell(cell_list, row, col):
    if not cell_in_list(cell_list, row, col):
        cell_list.append({"row": row, "col": col})


def cell_in_list(cell_list, row, col):
    for cell in cell_list:
        if cell["row"] == row and cell["col"] == col:
            return True

    return False


def same_cell(cell1, cell2):
    return cell1["row"] == cell2["row"] and cell1["col"] == cell2["col"]


def literal_known(state, literal):
    for clause in state["kb_clauses"]:
        if len(clause) == 1 and clause[0] == literal:
            return True

    return False


def copy_clauses(clauses):
    copied = []

    for clause in clauses:
        copied.append(clause[:])

    return copied


def clause_key(clause):
    return "|".join(sorted(clause))


def clause_exists(clauses, clause):
    key = clause_key(clause)

    for old_clause in clauses:
        if clause_key(old_clause) == key:
            return True

    return False


def clause_to_text(clause):
    if len(clause) == 0:
        return "EMPTY"

    return "[" + " OR ".join(clause) + "]"


def percepts_to_list(percepts):
    result = []

    if percepts["breeze"]:
        result.append("Breeze")
    if percepts["stench"]:
        result.append("Stench")
    if len(result) == 0:
        result.append("None")

    return result


def percepts_to_text(percepts):
    breeze_text = "No Breeze"
    stench_text = "No Stench"

    if percepts["breeze"]:
        breeze_text = "Breeze"
    if percepts["stench"]:
        stench_text = "Stench"

    return breeze_text + ", " + stench_text


def agent_on_actual_hazard(state):
    if cell_in_list(state["pits"], state["agent_row"], state["agent_col"]):
        return True

    if state["wumpus"]["row"] == state["agent_row"] and state["wumpus"]["col"] == state["agent_col"]:
        return True

    return False


def trim_decision_log(state):
    if len(state["decision_log"]) > 60:
        state["decision_log"] = state["decision_log"][-60:]
