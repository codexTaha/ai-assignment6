from flask import Flask, jsonify, render_template, request

import ai_logic
from ai_logic import get_visible_state, make_new_game, reveal_world, step_agent


app = Flask(__name__)
current_state = None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/start", methods=["POST"])
def api_start():
    global current_state

    data = request.get_json() or {}
    rows = data.get("rows", 4)
    cols = data.get("cols", 4)
    visible_state = make_new_game(rows, cols)
    current_state = ai_logic.last_created_state
    return jsonify(visible_state)


@app.route("/api/step", methods=["POST"])
def api_step():
    global current_state

    if current_state is None:
        current_state = make_internal_game(4, 4)

    return jsonify(step_agent(current_state))


@app.route("/api/reveal", methods=["POST"])
def api_reveal():
    global current_state

    if current_state is None:
        current_state = make_internal_game(4, 4)

    return jsonify(reveal_world(current_state))


@app.route("/api/state")
def api_state():
    global current_state

    if current_state is None:
        current_state = make_internal_game(4, 4)

    return jsonify(get_visible_state(current_state))


@app.route("/api/reset", methods=["POST"])
def api_reset():
    global current_state

    current_state = make_internal_game(4, 4)
    return jsonify(get_visible_state(current_state))


def make_internal_game(rows, cols):
    make_new_game(rows, cols)
    return ai_logic.last_created_state


if __name__ == "__main__":
    app.run(debug=True)
