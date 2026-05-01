# LinkedIn Post Draft

I built a Dynamic Wumpus World Knowledge-Based Agent for my AI assignment.

This project is a web-based agent that uses Propositional Logic to move safely in a Wumpus World-style grid. The agent does not know where the pits or Wumpus are at the start. As it moves, it receives Breeze and Stench percepts and uses them to update its Knowledge Base.

The main logic is based on CNF clauses and Resolution Refutation. Before moving, the agent asks the Knowledge Base whether an adjacent cell is safe. It only moves when it can prove that the cell has no pit and no Wumpus.

The hardest part was designing the logic rules, CNF representation, and resolution engine in a way that was simple enough to explain but still correct for the assignment. It was also interesting to connect the AI reasoning with a live web dashboard showing percepts, inference steps, KB facts, and movement decisions.

Tech used:
Python, Flask, HTML, CSS, Vanilla JavaScript, Propositional Logic, CNF, Resolution Refutation.

#ArtificialIntelligence #KnowledgeBasedAgent #PropositionalLogic #WumpusWorld #WebDevelopment #FASTNUCES
