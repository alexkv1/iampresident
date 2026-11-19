<?php
// Dev router for the PHP built-in server so clean URLs match Apache/.htaccess:
//   php -S 127.0.0.1:8000 -t public public/router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$root = __DIR__;

// Real file (css/js/assets/*.php) -> let the server handle it.
$path = realpath($root . $uri);
if ($path && is_file($path) && str_starts_with($path, $root)) return false;

// Extensionless API: /api/match/create -> /api/match/create.php
if (is_file($root . $uri . '.php')) { require $root . $uri . '.php'; return true; }

// Pretty page route: /lobby -> /pages/lobby/index.php
if ($uri !== '/' && is_file($root . '/pages' . $uri . '/index.php')) {
    require $root . '/pages' . $uri . '/index.php'; return true;
}

// Home
require $root . '/index.php';
return true;
