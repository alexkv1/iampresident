<?php
require __DIR__ . '/../../../utils/bootstrap.php';
$mock = ($_GET['vt'] ?? '') === '1';   // visual-test mode: no auth, API mocked by the harness
if (!$mock) {
    $auth = current_auth();
    if (!$auth->valid) { header('Location: /'); exit; }
    $matchId = (int)($_GET['match'] ?? 0);
    if (!$matchId) { header('Location: /'); exit; }
    $wsUrl = conf()['realtime-ws-url'] ?? '';
} else {
    $matchId = (int)($_GET['match'] ?? 0); $wsUrl = ''; $auth = null;
}
$v = fn($p) => '/js/' . $p . '?v=' . (@filemtime(__DIR__ . '/../../js/' . $p) ?: 1);
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lobby · I Am President</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/app.css">
  <script>
    window.MATCH_ID = <?= (int)$matchId ?>;
    window.MY_USER = <?= $mock ? 0 : (int)$auth->user ?>;
    // Always use the domain/origin the page was served from (correct scheme + host),
    // proxied to the realtime relay at /ws — never a hardcoded VM IP.
    window.WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="globe"></div>

  <!-- Top bar -->
  <section class="panel topbar"><div class="panel-body" style="padding:10px 16px">
    <div class="row">
      <span class="tb-name" id="match-name">Lobby</span>
      <span class="pill" id="match-mode">—</span>
      <span class="pill pill-gold hidden" id="join-code"><i class="ph-fill ph-key"></i><span></span></span>
      <span class="spacer"></span>
      <span class="tb-meta" id="match-meta"></span>
      <a class="btn btn-sm btn-ghost" href="/"><span><i class="ph-fill ph-sign-out"></i>Leave</span></a>
    </div>
  </div></section>

  <!-- Players -->
  <section class="panel lobby-left"><div class="panel-body">
    <header class="panel-head"><h2 class="panel-title">Players</h2></header>
    <div id="players" style="display:flex;flex-direction:column;gap:4px"></div>
  </div></section>

  <!-- Invite friends (host private room only) -->
  <section class="panel lobby-invite hidden" id="invite-panel"><div class="panel-body">
    <header class="panel-head"><h2 class="panel-title">Invite friends</h2></header>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="code-box"><span id="invite-code">——————</span></div>
      <div class="invite-btns">
        <button class="btn btn-sm btn-block" id="copy-code"><span><i class="ph-fill ph-copy"></i>Copy code</span></button>
        <button class="btn btn-sm btn-ghost btn-block" id="copy-link"><span><i class="ph-fill ph-link"></i>Copy invite link</span></button>
      </div>
      <p class="invite-note">Friends pick Join private room on the home screen and enter this code.</p>
    </div>
  </div></section>

  <!-- Your nation -->
  <section class="panel lobby-right"><div class="panel-body">
    <header class="panel-head"><h2 class="panel-title">Your nation</h2></header>
    <div style="display:flex;flex-direction:column;gap:14px" id="nation-body">
      <div id="nation-head" class="hidden">
        <div class="nation-name" id="nation-name">—</div>
        <div class="nation-persona" id="nation-persona"></div>
      </div>
      <p class="nation-note" id="nation-switch">Click another country on the globe to switch.</p>
      <p class="nation-note hidden" id="nation-hint">Spin the globe and click a country to lead.</p>
      <button class="btn btn-block" id="btn-ready"><span>Ready up</span></button>
      <button class="btn btn-gold btn-slanted btn-block hidden" id="btn-start"><span><i class="ph-fill ph-play"></i>Start match</span></button>
      <p class="nation-note sm hidden" id="host-note">You're the host. Start when your friends are ready.</p>
      <p class="nation-note sm hidden" id="guest-note"></p>
    </div>
  </div></section>

  <!-- Hover tag -->
  <div class="lobby-tag hidden" id="country-tag"></div>

  <div class="globe-hint"><i class="ph-fill ph-hand-grabbing"></i>Drag to rotate · scroll to zoom · click a country to claim it</div>

  <script src="/js/three.min.js"></script>
  <script src="/js/earcut.min.js"></script>
  <script src="<?= $v('api.js') ?>"></script>
  <script src="<?= $v('ui.js') ?>"></script>
  <script src="<?= $v('globe.js') ?>"></script>
  <script src="<?= $v('lobby.js') ?>"></script>
</body>
</html>
