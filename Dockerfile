# Halloween snake game. No build step.
# The shared server listens on all interfaces so phones on the same LAN join one board.
FROM python:3-alpine

WORKDIR /game
COPY index.html style.css game.js server.py ./

EXPOSE 8080
CMD ["python3", "server.py"]
