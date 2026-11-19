<?php
// Dev-only: renders the design-system component variants for ?group= so the visual
// harness can diff them against design/components/<group>/<group>.card.html.
// STUB — to be filled in during HUD step 3 (one section per card variant).
$group = preg_replace('/[^a-z]/', '', (string)($_GET['group'] ?? 'core'));
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Components · <?= htmlspecialchars($group) ?></title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/app.css">
  <style>html,body{margin:0;background:var(--grad-page),var(--bg-page);min-height:100%}#root{padding:20px}</style>
</head>
<body>
  <div id="root"><!-- TODO step 3: render "<?= htmlspecialchars($group) ?>" component variants --></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
</body>
</html>
