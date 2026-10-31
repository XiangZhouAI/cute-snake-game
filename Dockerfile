# Static Halloween snake game. No build step.
# Listens on all interfaces so a phone on the same LAN can connect.
FROM python:3-alpine

WORKDIR /game
COPY index.html style.css game.js ./

EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080", "--bind", "0.0.0.0"]
