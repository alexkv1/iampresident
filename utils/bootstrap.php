<?php
// Single include for API endpoints and CLI tools.
//   require __DIR__ . '/../../../utils/bootstrap.php';   (from public/api/<domain>/<action>.php)

declare(strict_types=1);

require_once __DIR__ . '/DB.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/Auth/Verify.php';
require_once __DIR__ . '/game_helpers.php';

/** Config array (cached). */
function conf(): array {
    static $c = null;
    if ($c === null) $c = require __DIR__ . '/../conf.php';
    return $c;
}

/** Shared DB instance for the request/process. */
function db(): DB {
    static $db = null;
    if ($db === null) $db = new DB();
    return $db;
}
