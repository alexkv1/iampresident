<?php
// POST /api/auth/guest  { name? }  -> create (or reuse) a guest session.
require __DIR__ . '/../../../utils/bootstrap.php';
require_method('POST');

$auth = current_auth();
if ($auth->valid) {
    json_ok(['user' => ['id' => $auth->user, 'display_name' => $auth->display_name, 'is_guest' => $auth->is_guest]]);
}

$name = (string)in('name', '');
$auth = create_guest($name);
json_ok(['user' => ['id' => $auth->user, 'display_name' => $auth->display_name, 'is_guest' => $auth->is_guest]]);
