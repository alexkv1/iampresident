<?php
// Copy to conf.php (git-ignored) and fill in. Returns an associative array (yuz style).
return [
    // --- MySQL ---
    // Use 'localhost' to connect via the Unix socket, or an IP/host for TCP.
    'servername' => '127.0.0.1',
    'username'   => 'root',
    'password'   => '',
    'dbname'     => 'iampresident',
    'port'       => 3306,
    // 'socket'  => '/tmp/mysql.sock', // set when servername is 'localhost'

    // Shared secret for internal calls (tick worker -> PHP, PHP -> Node WS /emit).
    'internal-key' => 'change-me-to-a-long-random-string',

    // Where the Node realtime server listens for server-side /emit calls.
    'realtime-emit-url' => 'http://127.0.0.1:8081/emit',

    // Public WS URL the browser connects to (wss:// behind Apache in prod).
    'realtime-ws-url' => 'ws://127.0.0.1:8081',
];
