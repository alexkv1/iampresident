<?php
// Cookie-based auth (yuz pattern): cookie AUTH -> sessions -> users.
// This game is anonymous-first: a guest account is created on first play.

const AUTH_COOKIE = 'AUTH';

/** Resolve the current user from the AUTH cookie. Always returns a stdClass. */
function current_auth(): stdClass {
    $auth = new stdClass();
    $auth->valid = false;
    $auth->user = 0;

    $token = $_COOKIE[AUTH_COOKIE] ?? '';
    if (!preg_match('/^[a-zA-Z0-9]{32,}$/', $token)) return $auth;

    $row = db()->selectOne(
        "SELECT s.user, u.display_name, u.is_guest, u.email
           FROM `sessions` s
           JOIN `users` u ON u.id = s.user AND u.status = 1
          WHERE s.token = ? AND s.status = 1",
        [$token], 's'
    );
    if (!$row) return $auth;

    db()->execute("UPDATE `sessions` SET `last_seen` = NOW() WHERE `token` = ?", [$token], 's');

    $auth->valid        = true;
    $auth->user         = (int)$row['user'];
    $auth->display_name = $row['display_name'];
    $auth->is_guest     = (int)$row['is_guest'];
    $auth->email        = $row['email'];
    return $auth;
}

/** Require a logged-in user or stop with 401. */
function require_auth(): stdClass {
    $auth = current_auth();
    if (!$auth->valid) json_err('Not authenticated.', 401, ['auth' => false]);
    return $auth;
}

/** Create a session for a user, set the AUTH cookie, return the token. */
function start_session(int $userId): string {
    $token = random_token(96);
    db()->execute(
        "INSERT INTO `sessions` (`user`, `token`) VALUES (?, ?)",
        [$userId, $token], 'is'
    );
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(AUTH_COOKIE, $token, [
        'expires'  => time() + 60 * 60 * 24 * 30,
        'path'     => '/',
        'httponly' => true,
        'secure'   => $secure,
        'samesite' => 'Lax',
    ]);
    return $token;
}

/** Create a guest user and start a session. Returns the new auth. */
function create_guest(string $displayName): stdClass {
    $displayName = trim($displayName);
    if ($displayName === '') $displayName = 'President' . random_int(1000, 9999);
    $displayName = mb_substr($displayName, 0, 32);

    db()->execute(
        "INSERT INTO `users` (`display_name`, `is_guest`) VALUES (?, 1)",
        [$displayName], 's'
    );
    $userId = db()->lastInsertId();
    start_session($userId);

    $auth = new stdClass();
    $auth->valid = true;
    $auth->user = $userId;
    $auth->display_name = $displayName;
    $auth->is_guest = 1;
    $auth->email = null;
    return $auth;
}
