<?php
// Database wrapper — mysqli + prepared statements (same shape as yuz/db.php).

class DB {
    private mysqli $conn;
    private int $lastAffected = 0;

    public function __construct() {
        $configPath = realpath(__DIR__ . '/../conf.php');
        if (!$configPath || !file_exists($configPath)) {
            throw new Exception('conf.php not found — copy conf.sample.php to conf.php.');
        }
        $config = require $configPath;

        mysqli_report(MYSQLI_REPORT_OFF);
        // host 'localhost' => mysqli uses the Unix socket; a real host => TCP.
        $this->conn = new mysqli(
            $config['servername'],
            $config['username'],
            $config['password'],
            $config['dbname'],
            (int)($config['port'] ?? 3306),
            $config['socket'] ?? null
        );

        if ($this->conn->connect_error) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Internal server error.']);
            exit;
        }
        $this->conn->set_charset('utf8mb4');
    }

    /** INSERT/UPDATE/DELETE. Returns true on success. */
    public function execute(string $query, array $params = [], string $types = ''): bool {
        $stmt = $this->conn->prepare($query);
        if (!$stmt) return false;
        if (!empty($params)) {
            if ($types === '') $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $result = $stmt->execute();
        // Capture from the statement — conn->affected_rows is unreliable for prepared stmts.
        $this->lastAffected = $stmt->affected_rows;
        $stmt->close();
        return $result;
    }

    /** SELECT. Always returns an array of assoc rows (empty if none), false on error. */
    public function select(string $query, array $params = [], string $types = ''): array|bool {
        $stmt = $this->conn->prepare($query);
        if (!$stmt) return false;
        if (!empty($params)) {
            if ($types === '') $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        if (!$stmt->execute()) { $stmt->close(); return false; }
        $result = $stmt->get_result();
        $rows = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $rows;
    }

    /** First row of a SELECT, or null. */
    public function selectOne(string $query, array $params = [], string $types = ''): ?array {
        $rows = $this->select($query, $params, $types);
        return (is_array($rows) && count($rows)) ? $rows[0] : null;
    }

    public function lastInsertId(): int { return (int)$this->conn->insert_id; }
    public function affectedRows(): int { return $this->lastAffected; }

    public function begin(): void  { $this->conn->begin_transaction(); }
    public function commit(): void { $this->conn->commit(); }
    public function rollback(): void { $this->conn->rollback(); }

    public function close(): void { $this->conn->close(); }
}
