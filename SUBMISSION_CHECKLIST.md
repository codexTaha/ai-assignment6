# Submission Checklist

## Links

- GitHub repo link: https://github.com/codexTaha/ai-assignment6
- Render live link: Add after Render deployment
- LinkedIn post link: Skipped for now

## Screenshot Checklist

- Grid visualization with a 4x4 world
- Grid visualization with a 5x5 world
- Metrics dashboard showing current percepts
- Metrics dashboard showing resolution inference steps
- KB / inference panel showing recent facts and last query
- Agent decision log after several moves
- Reveal Hidden World showing red hazards
- Rejected move message for non-adjacent or unsafe cell

## Final Testing Checklist

- Start New Episode works
- 4x4 grid works
- 5x5 grid works
- Adjacent safe cell click moves the agent
- Non-adjacent cell click is rejected
- Unknown or not-proven-safe cell click is rejected
- Reveal Hidden World works
- Reset works
- Metrics update after movement
- Resolution step count updates
- Hidden hazards are not visible before reveal or game over
- App runs as a static site
- Flask app runs locally at http://127.0.0.1:5000
- Core AI logic is in Python
- JavaScript only renders and calls APIs
- No console errors during normal use
- Git commit history shows iterative development

## Deployment Checklist

- Push final code to GitHub
- Create Render Web Service
- Connect GitHub repo
- Build command: pip install -r requirements.txt
- Start command: gunicorn app:app
- Deploy and copy live URL
