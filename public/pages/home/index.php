<?php
// Landing page (design 1c). Scrolling marketing + the "Choose your nation" hero that
// doubles as the old home: name, claimed country, match mode, Take office.
require __DIR__ . '/../../../utils/bootstrap.php';
$v = fn($p) => '/js/' . $p . '?v=' . (@filemtime(__DIR__ . '/../../js/' . $p) ?: 1);
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>I Am President — lead a nation, feed your people, dominate the world</title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/app.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
</head>
<body class="page-home">
  <div class="landing">

    <!-- ===================== Hero ===================== -->
    <div class="hero">
      <section class="panel"><div class="panel-body" style="padding:10px 16px">
        <div class="hero-topbar">
          <span class="wordmark"><span class="wm-iam">I Am</span><span class="wm-pres">President</span></span>
          <nav class="hero-nav">
            <a href="#how">How it works</a>
            <a href="#leaders">Leaders</a>
            <a href="#lobby">Lobby</a>
          </nav>
          <span class="spacer"></span>
        </div>
      </div></section>

      <div class="hero-grid">
        <div class="hero-left">
          <div class="plate"><span>Lead a nation.</span></div>
          <div class="plate plate-2"><span>Feed your people.</span></div>
          <div class="plate plate-3"><span>Dominate the world.</span></div>
          <p class="hero-lede">Spin the globe, claim a country and rule it as its real-world leader. Up to 8 players share one world, live in your browser. The first to control 60% of it wins.</p>
        </div>

        <div class="hero-right">
          <section class="panel"><div class="panel-body">
            <header class="panel-head"><h2 class="panel-title">Choose your nation</h2></header>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="globe-well">
                <div id="hero-globe" style="position:absolute;inset:0"></div>
                <div id="hero-tag" class="hidden"></div>
              </div>

              <div id="claim-status" class="claim-status unclaimed">
                <i class="ph-fill ph-hand-pointing"></i><span>Drag to rotate · click a country to claim it</span>
              </div>

              <label class="field"><span>Your name</span>
                <div class="input-wrap"><i class="input-ic ph-bold ph-user"></i>
                  <input id="name" class="input" placeholder="President…" maxlength="32" autocomplete="off"></div>
              </label>

              <label class="field"><span>Match</span>
                <div class="input-wrap"><i class="input-ic ph-bold ph-globe-hemisphere-west"></i>
                  <select id="match-mode" class="input">
                    <option value="random">Join random match</option>
                    <option value="host">Host private room</option>
                    <option value="join">Join private room</option>
                  </select>
                  <i class="input-caret ph-bold ph-caret-down"></i></div>
              </label>

              <label id="code-field" class="field hidden"><span>Room code</span>
                <div class="input-wrap"><i class="input-ic ph-bold ph-key"></i>
                  <input id="room-code" class="input input-upper" placeholder="Enter room code" maxlength="6" autocomplete="off"></div>
                <span class="field-hint">Ask the host for their code.</span>
              </label>

              <button id="take-office" class="btn btn-gold btn-slanted btn-block">
                <span><i class="ph-fill ph-flag-banner"></i>Take office</span></button>
            </div>
          </div></section>
        </div>
      </div>
    </div>

    <!-- ===================== How it works ===================== -->
    <div id="how" class="how">
      <div class="how-left">
        <div class="eyebrow"><span>How it works</span></div>
        <h2>One Day every<br>20 seconds</h2>
        <p>Every match runs on a shared clock. Each Day your people eat, your buildings produce and armies move. Fed nations grow 1% a day; starving ones shrink 1.5%. The first leader to control 60% of the world wins.</p>
      </div>
      <section class="panel"><div class="panel-body">
        <header class="panel-head"><h2 class="panel-title">Dispatches</h2></header>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div class="feed-ev fe-match_started"><i class="ph-fill ph-flag"></i><div class="fe-body">The match has begun.</div><span class="fe-day">Day 1</span></div>
          <div class="feed-ev fe-build_complete"><i class="ph-fill ph-check-circle"></i><div class="fe-body"><b class="feed-you"></b> finished a Power Plant.</div><span class="fe-day">Day 4</span></div>
          <div class="feed-ev fe-conquest"><i class="ph-fill ph-sword"></i><div class="fe-body"><b>Kim Jong Un</b> conquered Republic of Korea</div><span class="fe-day">Day 12</span></div>
          <div class="feed-ev fe-match_ended"><i class="ph-fill ph-trophy"></i><div class="fe-body"><b class="feed-you"></b> <span class="feed-verb">dominates the world!</span></div><span class="fe-day">Day 41</span></div>
        </div>
      </div></section>
    </div>

    <!-- ===================== Leaders ===================== -->
    <div id="leaders" class="leaders">
      <div class="leaders-head">
        <div class="leaders-headL">
          <div class="eyebrow"><span>Leaders</span></div>
          <h2><span id="lead-n">—</span> real leaders.<br><span id="lead-m">—</span> countries.</h2>
        </div>
        <p>Claim a seeded country and you play as its head of state, under their real title. Every other country makes you its President. Click a name to claim that country.</p>
      </div>
      <div id="lgrid-a" class="lgrid-a"></div>
      <div id="lgrid-b" class="lgrid-b"></div>
    </div>

    <!-- ===================== Lobby ===================== -->
    <div id="lobby" class="lobby-sec">
      <div class="lobby-head">
        <div class="eyebrow"><span>Lobby</span></div>
        <h2>Jump into a match</h2>
      </div>
      <div class="mode-row">
        <button class="mode-card mode-card-sky" data-mode-card="online">
          <span class="mode-card__icon"><i class="ph-fill ph-globe-hemisphere-west"></i></span>
          <span class="mode-card__body"><h3>Play Online</h3><p>Create a public match strangers can join.</p></span></button>
        <button class="mode-card mode-card-violet" data-mode-card="private">
          <span class="mode-card__icon"><i class="ph-fill ph-lock-key"></i></span>
          <span class="mode-card__body"><h3>Private Room</h3><p>Get a code to play with friends.</p></span></button>
        <button class="mode-card mode-card-gold" data-mode-card="single">
          <span class="mode-card__icon"><i class="ph-fill ph-robot"></i></span>
          <span class="mode-card__body"><h3>Single Player</h3><p>Play solo against the computer (3 AI nations).</p></span></button>
      </div>
      <section class="panel"><div class="panel-body">
        <header class="panel-head"><h2 class="panel-title">Open matches</h2></header>
        <div class="om-head">
          <span><span class="live-dot"></span>Match</span><span>Seats</span><span>Day length</span><span>Status</span><span></span>
        </div>
        <div id="open-matches"></div>
      </div></section>
    </div>

    <!-- ===================== Footer ===================== -->
    <div class="landing-footer">
      <span class="wordmark"><span class="wm-iam">I Am</span><span class="wm-pres">President</span></span>
      <p>Leader names and titles follow the current real-world office holders and are updated when governments change.</p>
      <div class="foot-links"><a href="#how">Rules</a><a href="#how">Privacy</a><a href="#how">Terms</a><a href="#how">Contact</a></div>
    </div>

  </div>

  <div id="toast"></div>

  <script src="/js/three.min.js"></script>
  <script src="/js/earcut.min.js"></script>
  <script src="<?= $v('globe.js') ?>"></script>
  <script src="<?= $v('ui.js') ?>"></script>
  <script src="<?= $v('api.js') ?>"></script>
  <script src="<?= $v('search.js') ?>"></script>
  <script src="<?= $v('home.js') ?>"></script>
</body>
</html>
