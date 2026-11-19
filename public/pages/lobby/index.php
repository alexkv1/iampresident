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
  <title>Lobby · I Am President</title>
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
    <div class="title" id="match-name">Lobby</div>
    <div class="pill" id="match-mode">—</div>
    <div class="pill hidden" id="join-code"></div>
    <div class="spacer"></div>
    <a class="btn btn-sm btn-ghost" href="/">Leave</a>
  </div>

  <div class="panel left-panel">
    <div class="body">
      <h2>Players</h2>
      <div id="players"></div>
    </div>
  </div>

  <div class="panel right-panel">
    <div class="body stack">
      <h2>Your nation</h2>
      <p class="muted" id="pick-hint">Spin the globe and click a country to lead.</p>
      <button class="btn" id="btn-ready">Ready up</button>
      <button class="btn btn-primary hidden" id="btn-start">Start match</button>
    </div>
  </div>

  <div class="country-tag hidden" id="country-tag">
    <div class="cname">—</div>
    <div class="clead muted" style="margin-top:4px;font-size:12px"></div>
    <div class="cattr">
      <span>Farmland<b class="t-farm">—</b></span>
      <span>Minerals<b class="t-min">—</b></span>
      <span>Oil<b class="t-oil">—</b></span>
    </div>
  </div>

  <div class="globe-hint">Drag to rotate · scroll to zoom · click a country to claim it</div>

  <?php $v = fn($p) => '/js/' . $p . '?v=' . (@filemtime(__DIR__ . '/../../js/' . $p) ?: 1); ?>
  <script src="/js/three.min.js"></script>
  <script src="/js/earcut.min.js"></script>
  <script src="<?= $v('api.js') ?>"></script>
  <script src="<?= $v('ui.js') ?>"></script>
  <script src="<?= $v('globe.js') ?>"></script>
  <script src="<?= $v('lobby.js') ?>"></script>
</body>
</html>
