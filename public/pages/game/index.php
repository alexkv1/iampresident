<?php
// In-match screen. The live game (default) requires auth + a match; prototype mock mode
// (?mock=1, also honouring ?scenario= / ?mode= / ?broke= like design/ui_kits/game/match-hud.html)
// renders the v2 HUD with mock data, no auth and no DB hit, so the visual harness can diff it
// against the mockup.
require __DIR__ . '/../../../utils/bootstrap.php';
$mock = ($_GET['mock'] ?? '') === '1';
if (!$mock) {
    $auth = current_auth();
    if (!$auth->valid) { header('Location: /'); exit; }
    $matchId = (int)($_GET['match'] ?? 0);
    if (!$matchId) { header('Location: /'); exit; }
    $wsUrl = conf()['realtime-ws-url'] ?? '';
} else {
    $matchId = 0; $wsUrl = ''; $auth = null;
}
$v = fn($p) => '/js/' . $p . '?v=' . (@filemtime(__DIR__ . '/../../js/' . $p) ?: 1);
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>I Am President</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/hud.css">
  <script>
    window.MATCH_ID = <?= (int)$matchId ?>;
    window.MY_USER = <?= $mock ? 0 : (int)$auth->user ?>;
    window.WS_URL = <?= json_encode($wsUrl) ?>;
    window.HUD_MOCK = <?= $mock ? 'true' : 'false' ?>;
  </script>
<?php if (!$mock): /* jQuery only needed by the live API layer; mock mode is pure vanilla so the page reaches networkidle fast (keeps the globe-ease timing in step with the mockup). */ ?>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
<?php endif; ?>
</head>
<body>
  <div id="hud-root">
    <!-- Globe + vignette live inside the scaled stage so markers stay pinned to countries
         at any viewport size (matches the mockup). hud.js builds the HUD panels/layers here. -->
    <div id="hud-stage">
      <div id="globe"></div>
      <div id="hud-vignette"></div>
    </div>
  </div>

  <script src="/js/three.min.js"></script>
  <script src="/js/earcut.min.js"></script>
  <script src="<?= $v('globe.js') ?>"></script>
  <script src="<?= $v('ui-kit.js') ?>"></script>
  <script src="<?= $v('hud/tips.js') ?>"></script>
  <script src="<?= $v('hud/geo.js') ?>"></script>
  <script src="<?= $v('hud/parts.js') ?>"></script>
  <?php if ($mock): ?>
  <script src="<?= $v('hud/mock.js') ?>"></script>
  <script src="<?= $v('hud/hud.js') ?>"></script>
  <?php else: ?>
  <script src="<?= $v('api.js') ?>"></script>
  <script src="<?= $v('hud/live.js') ?>"></script>
  <script src="<?= $v('hud/hud.js') ?>"></script>
  <?php endif; ?>
</body>
</html>
