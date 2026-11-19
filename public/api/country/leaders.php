<?php
// GET /api/country/leaders  -> { leaders: { CODE: {name, title} } }
// Public reference data used by the lobby/game UI (leader shown on hover, etc.).
require __DIR__ . '/../../../utils/bootstrap.php';

$map = [];
foreach (db()->select("SELECT `code`, `name`, `title` FROM `country_leaders`") ?: [] as $r) {
    $map[$r['code']] = ['name' => $r['name'], 'title' => $r['title']];
}
json_ok(['leaders' => $map]);
