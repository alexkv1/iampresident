#!/usr/bin/env node
/**
 * Realtime relay for I Am President.
 *
 * This process holds NO game rules. PHP is authoritative; after it mutates a
 * match it POSTs to /emit and we fan the event out to every browser subscribed
 * to that match. Browsers connect over WebSocket and just listen (plus a tiny
 * presence/ping). If this process is down, the game still works via polling.
 *
 *   PORT=8081 INTERNAL_KEY=... node realtime/server.js
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT || '8081', 10);
const HOST = process.env.HOST || '127.0.0.1'; // bind IPv4 so PHP's 127.0.0.1 /emit reaches us
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'dev-internal-key-please-change';

// matchId -> Set<ws>
const rooms = new Map();

function join(matchId, ws) {
  if (!rooms.has(matchId)) rooms.set(matchId, new Set());
  rooms.get(matchId).add(ws);
  ws._matchId = matchId;
}
function leave(ws) {
  const set = rooms.get(ws._matchId);
  if (set) { set.delete(ws); if (!set.size) rooms.delete(ws._matchId); }
}
function broadcast(matchId, message) {
  const set = rooms.get(String(matchId));
  if (!set) return 0;
  const data = JSON.stringify(message);
  let n = 0;
  for (const ws of set) if (ws.readyState === ws.OPEN) { ws.send(data); n++; }
  return n;
}

// --- HTTP: server-to-server /emit from PHP, plus /health ---------------------
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  if (req.method === 'POST' && req.url === '/emit') {
    const auth = req.headers['authorization'] || '';
    if (auth !== 'Bearer ' + INTERNAL_KEY) {
      res.writeHead(401); res.end('unauthorized'); return;
    }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const { match_id, event, payload } = JSON.parse(body || '{}');
        const sent = broadcast(String(match_id), { event, payload, ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sent }));
      } catch (e) {
        res.writeHead(400); res.end('bad request');
      }
    });
    return;
  }
  res.writeHead(404); res.end('not found');
});

// --- WebSocket: browsers subscribe to a match -------------------------------
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const matchId = url.searchParams.get('match_id');
  if (!matchId) { ws.close(1008, 'match_id required'); return; }

  join(String(matchId), ws);
  ws.isAlive = true;
  ws.send(JSON.stringify({ event: 'connected', payload: { match_id: matchId } }));

  ws.on('message', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'pong') ws.isAlive = true;
    // Presence relay: let others know someone is viewing (no auth, informational).
    if (msg.type === 'presence') {
      broadcast(String(ws._matchId), { event: 'presence', payload: msg.payload || {} });
    }
  });

  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});

// Heartbeat: drop sockets that stopped answering.
const heartbeat = setInterval(() => {
  for (const set of rooms.values()) {
    for (const ws of set) {
      if (ws.isAlive === false) { ws.terminate(); leave(ws); continue; }
      ws.isAlive = false;
      try { ws.send(JSON.stringify({ event: 'ping' })); } catch {}
    }
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, HOST, () => {
  console.log(`[realtime] listening on ${HOST}:${PORT} (ws + /emit + /health)`);
});
