# Starlight Snake

The repo name `cute-snake-game` is a default and can be renamed or transferred.

## What the game is

Starlight Snake is a cute Halloween snake game in a browser. It is top-down and 2D: left, right, up, and down only. You play an orange cartoon snake with a big-eyed face and slightly chunky rounded segments. The board is a night sky with stars and a moon. Cobwebs and a few floating ghosts are just decoration.

Glowing pumpkins are solid. Bumping a pumpkin, the edge of the board, or your own body cancels that move. You stay put, you do not die, and there is no game-over screen. Play goes on.

Pip, a purple snake, shares the board. Pip hunts the candy apples and does not chase your head. If Pip gets long, it nibbles a bad treat so the board stays open. If the two snakes touch, the longer one wins and the shorter one loses about half its segments (at least one). If that would leave nothing, that snake leaves the board. You come back right away on a free spot and keep your score. Pip comes back a moment later. If you are the same length, nobody is cut: each of you stops as if the other were a wall.

Your score stays on screen the whole time. The candy apple is the good treat: it grows you by one segment and adds 10 points. Bad treats shrink you by one segment and subtract 5: a rotten apple, a flashing chili, skull candy, and a leaking green can. Your score never goes below 0. Your snake never shrinks below one segment, the head. Pip grows and shrinks only itself. Only the treats you eat change your score.

New treats can be added by registering one definition (id, drawing, score change, length change, and spawn weight). Treats are scattered on empty cells across the whole world. A larger world keeps a few more of them, still with open space. One good treat grows you and adds points. Bad treats shrink you and subtract points. They never land on you, Pip, or a pumpkin.

## World and camera

The old playfield was 12 by 12, and the page showed all of it. The default now is **Large**, 48 by 48. That is four times the old board on each side. **Medium** is 24 by 24. **Huge** is 72 by 72.

The World buttons sit above the board: Medium, Large, and Huge. Choosing a size builds a new board. Food, pumpkins, and Pip are placed across that whole world. Pumpkins stay spaced out, so the bigger maps are not a maze.

You do not see the whole world at once. The view is a window around your snake, and it moves with you. A short snake is zoomed in. The window is at least 11 cells across, so you can steer and still see nearby treats and pumpkins. If your snake grows long or stretches out, the window zooms out until the whole body fits, with a small margin. It does not zoom out to the entire map just to show a short snake. On a shared board, each person's window follows their own snake. Other snakes show up when they are inside that window.

Those sizes live in the `WORLD` object at the top of `game.js`.

## Bot moods

Pip starts **Lazy**: hunts treats and does not chase you. That is the same Pip as before.

The buttons above the board switch the mood:

- **Lazy.** Pip only hunts treats. A long Pip still nibbles a bad treat so the board stays open.
- **Aggressive.** Pip hunts you. If Pip is the shorter snake, it eats candy first, then comes after you. Touch still follows the length rule: the longer snake bites, the shorter one loses about half.
- **In between.** Nib, a mint snake, joins Pip. They hunt treats, and a longer snake will bite a shorter one. That includes the two bots.

Your controls do not change.

## Shared board

Opening the file, or the tiny static server below, is one game on that screen. Pip is there. Another phone gets its own separate game.

To play **one** board together, run `server.py` (or Docker). The first browser hosts the board. Each later phone or laptop that opens the same address gets its own snake on that board. Keep the first screen open while you play. Up to four people. The bot mood is shared.

## Controls

On a laptop, use the arrow keys or WASD. The snake cannot reverse straight into itself in one move.

Touch is part of the game, not a fallback. A phone can steer the orange snake in either of these ways:

- Swipe on the playfield: up, down, left, or right.
- Tap the on-screen directional buttons. They are large, they sit under the board, and they stay visible on a narrow screen.

Both touch methods work in a phone browser. Keyboard play stays available on a desktop.

## Play locally without Docker

You need a modern browser. That is enough to open the game. Python 3 is optional, and it is already on most computers if you want a tiny local server. You do not need npm or Node.

### Option A — open the file

Open `index.html` in this folder. Double-click it, or from this folder run:

```bash
xdg-open index.html
```

On macOS, use `open index.html`. On Windows, double-click `index.html` or run `start index.html`. This works because there is no bundler and no dev server: the page uses a normal script tag and relative paths, so `file://` is fine.

### Option B — tiny static server

From this game folder:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open <http://127.0.0.1:8080>.

Binding `0.0.0.0` also lets a phone on the same Wi-Fi open the game without Docker. Each browser still has its own board. For one shared board, use the server below instead.

### Try one screen on a phone

This is still a separate game on the phone. For the same board as the computer, use the steps in “A second phone joins the same game” instead.

1. Start the static server above so it is bound to `0.0.0.0` on port 8080.
2. Find this computer’s LAN IP. On Linux try `hostname -I`. On macOS try `ipconfig getifaddr en0`. On Windows run `ipconfig` and use the IPv4 address of the Wi-Fi adapter.
3. Put the phone on the same Wi-Fi and open `http://<lan-ip>:8080` in the phone’s browser.
4. Swipe on the board, and also tap the on-screen directional buttons. Both should steer your snake.
5. If the phone cannot connect, the computer’s firewall may need to allow TCP 8080.

## A second phone joins the same game

This is one board, not a copy on each screen. No account.

1. On the computer, from this folder, start the shared server:

```bash
python3 server.py
```

It listens on `0.0.0.0` port 8080.

2. On that same computer, open <http://127.0.0.1:8080>. Leave this tab open. It is in the game too, with its own snake.

3. Read the yellow line under the buttons. It shows the address for the other device, such as `http://192.168.1.20:8080`.

4. Put the phone on the same Wi-Fi as the computer. Open that exact address in the phone’s browser. Do not open the file, and do not use `localhost` on the phone.

5. The phone gets its own snake. Swipe the board, or tap the on-screen arrows. That steers only the phone’s snake. The computer’s keys still steer only the computer’s snake.

6. Both screens show the same food, pumpkins, Pip, and scores. Each screen’s window follows its own snake and zooms to that snake’s body. The World buttons set the size for everyone: Medium 24, Large 48, or Huge 72.

If the yellow line does not show an address, find the computer’s LAN IP yourself. On Linux try `hostname -I`. On macOS try `ipconfig getifaddr en0`. On Windows run `ipconfig` and use the Wi-Fi IPv4 address. Then open `http://<lan-ip>:8080`. If the phone cannot connect, allow TCP 8080 on the computer’s firewall.

Up to four people. If the first tab closes, someone who is still connected keeps the same board.

`server.py` is the standard library only. You do not need npm.

Opening `index.html`, or the tiny static server above, is still one player on that screen. Another phone that opens the static server gets a separate game. Use `server.py` when a second device should join.

## Docker

The container runs that same shared server and listens on `0.0.0.0` port 8080. A second phone joins the container the same way: open the yellow address on the host page, which is the computer’s LAN IP and port 8080, not an address inside the container.

From this folder:

```bash
docker build -t cute-snake-game .
docker run --name cute-snake-game -p 8080:8080 cute-snake-game
```

On this computer, open <http://127.0.0.1:8080>.

From a phone or another laptop on the same LAN, open `http://<lan-ip>:8080` using the host computer’s LAN IP, not an address inside the container. The host firewall may need to allow TCP 8080.

Stop and remove the container:

```bash
docker stop cute-snake-game
docker rm cute-snake-game
```
