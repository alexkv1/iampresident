<?php
require __DIR__ . '/../../../utils/bootstrap.php';
$auth = current_auth();
if (!$auth->valid) { header('Location: /'); exit; }
$matchId = (int)($_GET['match'] ?? 0);
if (!$matchId) { header('Location: /'); exit; }
$wsUrl = conf()['realtime-ws-url'] ?? '';
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>I Am President</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/app.css">
  <script>
    window.MATCH_ID = <?= $matchId ?>;
    window.MY_USER = <?= (int)$auth->user ?>;
    window.WS_URL = <?= json_encode($wsUrl) ?>;
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="globe"></div>

  <div class="panel topbar">
    <div class="title" id="nation-name">—</div>
    <div class="pill" id="tick">Day 0</div>
    <div class="spacer"></div>
    <div class="res-bar" id="hud"></div>
    <a class="btn btn-sm btn-ghost" href="/" style="margin-left:10px">Exit</a>
  </div>

  <div class="panel left-panel">
    <div class="body">
      <h2>World standings</h2>
      <div id="standings"></div>
    </div>
  </div>

  <div class="panel right-panel">
    <div class="body stack">
      <h2>Build</h2>
      <div id="build-target" class="muted">Click a country you control to build.</div>
      <div id="catalog"></div>
      <div id="my-buildings"></div>
    </div>
  </div>

  <div class="panel bottom-panel">
    <div class="body">
      <h2>Dispatches</h2>
      <div class="feed" id="feed"></div>
      <div class="chat-msgs" id="chat"></div>
      <div class="row">
        <input id="chat-input" class="input" placeholder="Message the world…" maxlength="400">
        <button class="btn btn-sm" id="chat-send">Send</button>
      </div>
    </div>
  </div>

  <div class="country-tag hidden" id="country-tag">
    <div class="cname">—</div>
    <div class="cattr">
      <span>Owner<b class="t-owner">—</b></span>
      <span>Farmland<b class="t-farm">—</b></span>
      <span>Minerals<b class="t-min">—</b></span>
      <span>Oil<b class="t-oil">—</b></span>
    </div>
  </div>

  <div class="globe-hint">Drag to rotate · scroll to zoom · click your land to build</div>

  <?php $v = fn($p) => '/js/' . $p . '?v=' . (@filemtime(__DIR__ . '/../../js/' . $p) ?: 1); ?>
  <script src="/js/three.min.js"></script>
  <script src="/js/earcut.min.js"></script>
  <script src="<?= $v('api.js') ?>"></script>
  <script src="<?= $v('ui.js') ?>"></script>
  <script src="<?= $v('globe.js') ?>"></script>
  <script src="<?= $v('game.js') ?>"></script>
</body>
</html>
