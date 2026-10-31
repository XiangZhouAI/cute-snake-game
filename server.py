#!/usr/bin/env python3
"""Shared board for Starlight Snake.

Serves this folder and a WebSocket at /ws. The first browser is the host and
runs the game. Later browsers join that same board. No extra packages.
"""

import base64
import hashlib
import json
import os
import socket
import struct
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = "0.0.0.0"
PORT = 8080
GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_FRAME = 1_000_000
MAX_PLAYERS = 4
PALETTE = ["sunny", "lilac", "rose", "gold"]
NAMES = ["Sunny", "Lilac", "Rosie", "Goldie"]

ROOT = os.path.dirname(os.path.abspath(__file__))
lock = threading.Lock()
clients = []
next_id = 1
last_state = None


def recvn(stream, count):
    buf = b""
    while len(buf) < count:
        chunk = stream.read(count - len(buf))
        if not chunk:
            return None
        buf += chunk
    return buf


def encode_frame(text):
    data = text.encode("utf-8")
    n = len(data)
    if n < 126:
        header = bytes([0x81, n])
    elif n < 65536:
        header = bytes([0x81, 126]) + struct.pack("!H", n)
    else:
        header = bytes([0x81, 127]) + struct.pack("!Q", n)
    return header + data


def read_frame(stream):
    hdr = recvn(stream, 2)
    if not hdr:
        return None
    opcode = hdr[0] & 0x0F
    masked = (hdr[1] & 0x80) != 0
    length = hdr[1] & 0x7F
    if length == 126:
        ext = recvn(stream, 2)
        if not ext:
            return None
        length = struct.unpack("!H", ext)[0]
    elif length == 127:
        ext = recvn(stream, 8)
        if not ext:
            return None
        length = struct.unpack("!Q", ext)[0]
    if length > MAX_FRAME:
        return None
    mask = recvn(stream, 4) if masked else None
    if masked and not mask:
        return None
    payload = recvn(stream, length) if length else b""
    if payload is None:
        return None
    if mask:
        payload = bytes(payload[i] ^ mask[i % 4] for i in range(len(payload)))
    return opcode, payload


class Client:
    def __init__(self, stream, sock):
        self.stream = stream
        self.sock = sock
        self.send_lock = threading.Lock()
        self.id = None
        self.role = None
        self.name = None
        self.look = None

    def send(self, obj):
        raw = encode_frame(json.dumps(obj, separators=(",", ":")))
        with self.send_lock:
            self.sock.sendall(raw)


def host_of(group):
    for client in group:
        if client.role == "host":
            return client
    return None


def client_by_id(player_id):
    with lock:
        for client in clients:
            if client.id == player_id:
                return client
    return None


def broadcast(obj, skip=None):
    with lock:
        targets = [client for client in clients if client is not skip]
    dead = []
    for client in targets:
        try:
            client.send(obj)
        except OSError:
            dead.append(client)
    for client in dead:
        drop(client)


def drop(client):
    global last_state
    departed = None
    was_host = False
    new_host = None
    still_host = None
    with lock:
        if client not in clients:
            return
        clients.remove(client)
        departed = client.id
        was_host = client.role == "host"
        if last_state and departed:
            state = json.loads(json.dumps(last_state))
            state["snakes"] = [s for s in state.get("snakes", []) if s.get("id") != departed]
            last_state = state
        if not clients:
            last_state = None
        elif was_host:
            new_host = clients[0]
            new_host.role = "host"
            still_host = new_host
        else:
            still_host = host_of(clients)
        state_for_new = json.loads(json.dumps(last_state)) if last_state else None
    try:
        client.sock.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass
    try:
        client.sock.close()
    except OSError:
        pass
    if was_host and new_host:
        try:
            new_host.send({"type": "promote", "state": state_for_new})
        except OSError:
            drop(new_host)
    elif still_host and departed:
        try:
            still_host.send({"type": "leave", "id": departed})
        except OSError:
            drop(still_host)


def register(client):
    global next_id
    with lock:
        if len(clients) >= MAX_PLAYERS:
            return False
        idx = len(clients)
        client.id = "p%d" % next_id
        next_id += 1
        client.look = PALETTE[idx]
        client.name = NAMES[idx]
        client.role = "host" if idx == 0 else "guest"
        clients.append(client)
        current_host = host_of(clients)
        snapshot = json.loads(json.dumps(last_state)) if last_state else None
    client.send({
        "type": "welcome",
        "id": client.id,
        "role": client.role,
        "name": client.name,
        "look": client.look,
    })
    print("join %s as %s (%s)" % (client.id, client.role, client.name), flush=True)
    if client.role == "guest" and current_host:
        try:
            current_host.send({
                "type": "peer",
                "id": client.id,
                "name": client.name,
                "look": client.look,
            })
        except OSError:
            drop(current_host)
        if snapshot:
            try:
                client.send(snapshot)
            except OSError:
                drop(client)
    return True


def on_message(client, obj):
    global last_state
    if not isinstance(obj, dict):
        return
    kind = obj.get("type")
    if kind == "state" and client.role == "host":
        with lock:
            last_state = json.loads(json.dumps(obj))
        broadcast(obj, skip=client)
        return
    if kind == "input" and client.role != "host":
        current = None
        with lock:
            current = host_of(clients)
        if current:
            try:
                current.send({"type": "input", "id": client.id, "dir": obj.get("dir")})
            except OSError:
                drop(current)
        return
    if kind == "mode" and client.role != "host":
        current = None
        with lock:
            current = host_of(clients)
        if current:
            try:
                current.send({"type": "mode", "mode": obj.get("mode")})
            except OSError:
                drop(current)
        return
    if kind == "reject" and client.role == "host":
        target = client_by_id(obj.get("id"))
        if target and target is not client:
            try:
                target.send({"type": "full"})
            except OSError:
                pass
            drop(target)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if args and len(args) > 1 and str(args[1]) == "200":
            return
        super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/health":
            body = b'{"ok":true,"game":"starlight-snake"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/ws":
            self.handle_ws()
            return
        return super().do_GET()

    def handle_ws(self):
        key = self.headers.get("Sec-WebSocket-Key")
        if not key:
            self.send_error(400, "Missing WebSocket key")
            return
        accept = base64.b64encode(
            hashlib.sha1((key.strip() + GUID).encode("ascii")).digest()
        ).decode("ascii")
        try:
            self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        except OSError:
            pass
        self.wfile.write(
            (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: %s\r\n"
                "\r\n" % accept
            ).encode("ascii")
        )
        self.wfile.flush()
        client = Client(self.rfile, self.connection)
        if not register(client):
            try:
                client.send({"type": "full"})
            except OSError:
                pass
            return
        try:
            while True:
                frame = read_frame(self.rfile)
                if frame is None:
                    break
                opcode, payload = frame
                if opcode == 8:
                    break
                if opcode == 9:
                    try:
                        pong = bytearray([0x8A, len(payload)]) + payload
                        with client.send_lock:
                            self.connection.sendall(pong)
                    except OSError:
                        break
                    continue
                if opcode != 1:
                    continue
                try:
                    obj = json.loads(payload.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
                on_message(client, obj)
        finally:
            drop(client)


class Server(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    os.chdir(ROOT)
    server = Server((HOST, PORT), Handler)
    print("Starlight Snake shared board on http://%s:%d" % (HOST, PORT), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
