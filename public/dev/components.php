<?php
// Dev-only: renders the design-system component variants for ?group= so the visual
// harness can diff them against design/components/<group>/<group>.card.html.
// Each builder mirrors that card's App() render list exactly (see docs/component-spec.md).
$group = preg_replace('/[^a-z]/', '', (string)($_GET['group'] ?? 'core'));
$v = fn($p) => $p . '?v=' . (@filemtime(__DIR__ . '/../' . ltrim($p, '/')) ?: 1);
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Components · <?= htmlspecialchars($group) ?></title>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="<?= $v('/css/components.css') ?>">
  <style>html,body{margin:0;background:var(--grad-page),var(--bg-page);min-height:100%}#root{padding:20px}</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" crossorigin="anonymous"></script>
  <script src="<?= $v('/js/ui-kit.js') ?>"></script>
</head>
<body>
  <div id="root"></div>
  <script>
  const GROUP = <?= json_encode($group) ?>;
  const row = (style, html) => `<div style="${style}">${html}</div>`;

  const builders = {
    core() {
      const r1 = row('display:flex;gap:12px;align-items:center;flex-wrap:wrap',
        UI.button({variant:'gold',icon:'play',slanted:true,children:'Start match'}) +
        UI.button({variant:'primary',icon:'check',children:'Ready up'}) +
        UI.button({children:'Join'}) +
        UI.button({variant:'danger',icon:'x',children:'Surrender'}) +
        UI.button({variant:'ghost',icon:'sign-out',children:'Exit'}));
      const r2 = row('display:flex;gap:12px;align-items:center;flex-wrap:wrap',
        UI.button({size:'sm',variant:'gold',children:'Join'}) +
        UI.button({size:'sm',variant:'primary',children:'Send'}) +
        UI.button({size:'sm',children:'Send'}) +
        UI.button({size:'sm',variant:'ghost',children:'Leave'}) +
        UI.button({size:'sm',disabled:true,children:'Disabled'}));
      const r3 = row('display:flex;gap:8px;align-items:center;flex-wrap:wrap',
        UI.badge({kind:'ai',children:'AI'}) + UI.badge({kind:'ready',icon:'check',children:'Ready'}) +
        UI.badge({kind:'host',children:'Host'}) + UI.badge({children:'Neutral'}) +
        UI.badge({kind:'danger',icon:'skull',children:'Defeated'}) +
        '<span style="width:12px"></span>' +
        UI.pill({children:'ONLINE'}) + UI.pill({icon:'key',children:'Code: K7QX2M'}) +
        UI.pill({solid:true,tone:'gold',icon:'sun',children:'Day 14'}) + UI.pill({solid:true,tone:'sky',children:'Lobby'}));
      const r4 = row('display:flex;gap:14px;align-items:center;color:var(--text-muted)',
        UI.icon({name:'grains',color:'var(--res-food)',size:22}) + UI.icon({name:'lightning',color:'var(--res-energy)',size:22}) +
        UI.icon({name:'diamond',color:'var(--res-minerals)',size:22}) + UI.icon({name:'coins',color:'var(--res-gold)',size:22}) +
        UI.icon({name:'drop',color:'var(--res-oil)',size:22}) + UI.icon({name:'flask',color:'var(--res-research)',size:22}) +
        UI.icon({name:'caret-down',weight:'bold'}) + UI.icon({name:'magnifying-glass',weight:'bold'}));
      return row('display:flex;flex-direction:column;gap:18px', r1 + r2 + r3 + r4);
    },

    forms() {
      const f1 = UI.field({label:'Your name', children: UI.input({placeholder:'President…', icon:'user', maxLength:32})});
      const f2 = UI.field({label:'Room code', hint:'6 characters, from your host',
        children: row('display:flex;gap:12px', UI.input({placeholder:'Enter room code', uppercase:true, maxLength:6, defaultValue:'K7QX2M'}) + UI.button({children:'Join'}))});
      const f3 = UI.field({label:'Mode', children: UI.input({as:'select', options:['Online','Private','Single player']})});
      const f4 = UI.field({label:'Chat', children: row('display:flex;gap:8px', UI.input({size:'sm', placeholder:'Message the world…'}) + UI.button({size:'sm', children:'Send'}))});
      return row("display:grid;grid-template-columns:1fr 1fr;gap:16px", f1 + f2 + f3 + f4);
    },

    surfaces() {
      const hero = UI.card({tone:'hero', padding:20, children:
        '<div style="font:var(--type-h3);text-transform:uppercase;color:#fff;text-shadow:var(--text-shadow-display)">Hero card</div>' +
        '<p style="font:var(--type-body-sm);color:var(--text-muted);margin:6px 0 14px">Main menu container with sky glow.</p>' +
        UI.button({size:'sm', variant:'gold', children:'Play'})});
      const def = UI.card({padding:20, children:
        '<div style="font:italic 800 13px/1 var(--font-display);letter-spacing:1px;text-transform:uppercase;color:var(--text-muted)">Open matches</div>' +
        '<div style="margin-top:12px;font:600 14px/1.3 var(--font-body);color:#fff">World War Wednesday</div>' +
        '<div style="font:var(--type-meta);color:var(--text-muted)">3/8 players · 20s/tick</div>'});
      const pan = UI.panel({title:'Build', actions: UI.pill({solid:true, tone:'gold', children:'Day 14'}),
        children:'<div style="font:var(--type-body-sm);color:var(--text-muted)">Frosted HUD panel that floats over the globe.</div>'});
      return row('display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start', hero + def + pan);
    },

    brand() {
      const stack = row('display:flex;flex-direction:column;gap:18px', UI.wordmark({size:'md'}) + UI.wordmark({size:'sm', layout:'inline'}));
      return row('display:flex;gap:40px;align-items:center',
        UI.wordmark({size:'lg', tagline:'Lead a nation. Feed your people. Dominate the world.'}) + stack);
    },

    hud() {
      const chips = row('display:flex;gap:10px;flex-wrap:wrap',
        UI.resourceChip({resource:'food', value:1840}) + UI.resourceChip({resource:'energy', value:412}) +
        UI.resourceChip({resource:'minerals', value:655}) + UI.resourceChip({resource:'gold', value:12480}) +
        UI.resourceChip({resource:'oil', value:188}) + UI.resourceChip({resource:'research', value:45}));
      const tags = row('display:flex;gap:16px',
        UI.countryTag({name:'Sweden', leader:'Lead as Prime Minister Ulf Kristersson', farmland:34, minerals:71, oil:4}) +
        UI.countryTag({name:'Egypt', owner:'Abdel Fattah el-Sisi', ownerColor:'var(--player-4)', farmland:12, minerals:48, oil:55}));
      return row('display:flex;flex-direction:column;gap:18px', chips + tags);
    },

    players() {
      const meta = (t, p) => UI.icon({name:'map-trifold', size:11}) + t + '<span>·</span>' + UI.icon({name:'users-three', size:11}) + p + ' pop';
      const rows =
        UI.playerRow({color:'var(--player-1)', name:'Supreme Leader Kim Jong Un', meta:meta(14,'26.4M'), me:true, badges:['host']}) +
        UI.playerRow({color:'var(--player-4)', name:'King Salman bin Abdulaziz', meta:meta(9,'35.3M'), badges:['ai']}) +
        UI.playerRow({color:'var(--player-3)', name:'President Emmanuel Macron', meta:'Leading FRA', badges:['ready']}) +
        UI.playerRow({color:'var(--player-2)', name:'President Javier Milei', meta:meta(0,'0'), defeated:true});
      return row('width:320px;padding:8px;background:var(--grad-panel);border-radius:14px;border:1px solid var(--border-glow)', rows);
    },

    build() {
      const items =
        UI.buildItem({name:'Farm', icon:'grains', tone:'var(--res-food)', cost:{gold:120, minerals:40}, days:3}) +
        UI.buildItem({name:'Mine', icon:'hammer', tone:'var(--navy-400)', cost:{gold:150, minerals:30}, days:3}) +
        UI.buildItem({name:'Oil Rig', icon:'gas-pump', tone:'var(--res-oil)', cost:{gold:200, minerals:70}, days:4}) +
        UI.buildItem({name:'Power Plant', icon:'lightning', tone:'var(--gold-600)', cost:{gold:180, minerals:80}, days:3}) +
        UI.buildItem({name:'Research Lab', icon:'flask', tone:'var(--teal-600)', cost:{gold:220, minerals:60}, days:4}) +
        UI.buildItem({name:'Bank', icon:'bank', tone:'var(--sky-500)', cost:{gold:300}, days:4, disabled:true});
      return row('display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:640px', items);
    },

    feed() {
      const left = row('',
        UI.feedEvent({type:'match_started', day:0, children:'The match has begun.'}) +
        UI.feedEvent({type:'build_complete', actor:'Ulf Kristersson', day:4, children:'completed a farm in Sweden'}) +
        UI.feedEvent({type:'ai_build', actor:'King Salman bin Abdulaziz', day:5, children:'started an oil rig'}) +
        UI.feedEvent({type:'conquest', actor:'Kim Jong Un', day:12, children:'conquered South Korea'}) +
        UI.feedEvent({type:'player_defeated', actor:'Javier Milei', day:17, children:'has been eliminated'}) +
        UI.feedEvent({type:'match_ended', actor:'Kim Jong Un', children:'dominates the world!'}));
      const right = row('',
        UI.chatMessage({name:'Emmanuel Macron', color:'var(--player-3)', children:'Anyone selling food? Paying in oil.'}) +
        UI.chatMessage({name:'Kim Jong Un', color:'var(--player-1)', children:'No.'}) +
        UI.chatMessage({name:'Ulf Kristersson', color:'var(--player-6)', children:"I have farms. Let's talk."}) +
        UI.chatMessage({children:'Javier Milei left the match.'}));
      return row('display:grid;grid-template-columns:1.2fr 1fr;gap:20px', left + right);
    },

    feedback() {
      const toasts = row('display:flex;flex-direction:column;gap:8px;align-items:flex-start',
        UI.toast({kind:'ok', children:'You are now Prime Minister Ulf Kristersson of Sweden'}) +
        UI.toast({kind:'err', children:'Not enough resources.'}) +
        UI.toast({children:'Connecting to the world…'}));
      const spinners = row('display:flex;gap:16px;align-items:center', UI.spinner({}) + UI.spinner({size:22, color:'var(--gold-400)'}));
      const topRow = row('display:flex;gap:28px;align-items:center', toasts + spinners);
      const tips = row('display:flex;gap:20px;align-items:flex-start;padding-top:6px',
        UI.tooltip({placement:'bottom', icon:'grains', tone:'var(--res-food)', title:'Food',
          body:'Feeds your people. Every million citizens eat 2 food a day. If it runs out, population shrinks 1.5% a day.',
          stats:[{label:'Now', value:'2 410'}, {label:'Per day', value:'+86', color:'var(--green-300)'}, {label:'Made by', value:'Farm'}]}) +
        UI.tooltip({placement:'left', icon:'hammer', tone:'var(--sky-500)', title:'Build', keyHint:'B',
          body:'Construct farms, mines and power plants in lands you control.'}));
      return row('display:flex;flex-direction:column;gap:22px', topRow + tips);
    },

    home() {
      const c1 = UI.modeCard({icon:'globe-hemisphere-west', tone:'sky', title:'Play Online', description:'Create a public match strangers can join.'});
      const c2 = UI.modeCard({icon:'lock-key', tone:'violet', title:'Private Room', description:'Get a code to play with friends.'});
      const c3 = '<div style="grid-column:span 2">' + UI.modeCard({icon:'robot', tone:'gold', title:'Single Player', description:'Play solo against the computer (3 AI nations).'}) + '</div>';
      return row('display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:620px', c1 + c2 + c3);
    },
  };

  $('#root').html((builders[GROUP] || (() => '<p style="color:#888">Unknown group</p>'))());
  </script>
</body>
</html>
