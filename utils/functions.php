<?php
// Shared helpers: JSON responses, input parsing, misc. (yuz-flavoured)

/** Send a JSON success response and stop. */
function json_ok(array $data = []): never {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true] + $data);
    exit;
}

/** Send a JSON error response and stop. */
function json_err(string $message, int $code = 400, array $extra = []): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $message] + $extra);
    exit;
}

/**
 * Unified request input: merges $_GET, $_POST and a JSON body (if sent).
 * Lets the frontend use either jQuery form posts or fetch+JSON.
 */
function input(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $data = array_merge($_GET, $_POST);
    $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $json = json_decode($raw, true);
            if (is_array($json)) $data = array_merge($data, $json);
        }
    }
    return $cache = $data;
}

/** Fetch one input value with a default. */
function in(string $key, $default = null) {
    return input()[$key] ?? $default;
}

/** Require the given input keys or 400. Returns the values in order. */
function require_fields(array $keys): array {
    $data = input();
    $out = [];
    foreach ($keys as $k) {
        if (!isset($data[$k]) || $data[$k] === '') {
            json_err("Missing required field: $k", 400);
        }
        $out[] = $data[$k];
    }
    return $out;
}

/** Alphanumeric token (sessions, join codes). */
function random_token(int $length = 64): string {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $out = '';
    $max = strlen($chars) - 1;
    for ($i = 0; $i < $length; $i++) $out .= $chars[random_int(0, $max)];
    return $out;
}

/** Short uppercase join code for private rooms (unambiguous charset). */
function join_code(int $length = 6): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out = '';
    $max = strlen($chars) - 1;
    for ($i = 0; $i < $length; $i++) $out .= $chars[random_int(0, $max)];
    return $out;
}

/** Only allow a set of HTTP methods or 405. */
function require_method(string ...$methods): void {
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        json_err('Method not allowed.', 405);
    }
}

/** Notify the Node realtime server that a match changed (best-effort, non-blocking-ish). */
function realtime_emit(int $matchId, string $event, array $payload = []): void {
    $conf = conf();
    $url = $conf['realtime-emit-url'] ?? null;
    if (!$url) return;
    $body = json_encode(['match_id' => $matchId, 'event' => $event, 'payload' => $payload]);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 1,          // never let a dead WS server stall gameplay
        CURLOPT_CONNECTTIMEOUT => 1,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . ($conf['internal-key'] ?? ''),
        ],
    ]);
    curl_exec($ch);
    curl_close($ch);
}
