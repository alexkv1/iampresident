<?php
// GET /api/auth/me  -> current user, or { auth:false }.
require __DIR__ . '/../../../utils/bootstrap.php';

$auth = current_auth();
if (!$auth->valid) json_ok(['auth' => false, 'user' => null]);

json_ok([
    'auth' => true,
    'user' => ['id' => $auth->user, 'display_name' => $auth->display_name, 'is_guest' => $auth->is_guest],
]);
