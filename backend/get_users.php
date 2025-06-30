<?php
// suppress warnings
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// cors
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('access-control-allow-origin: *');
    header('access-control-allow-headers: content-type');
    header('access-control-allow-methods: get, post, options');
    exit;
}

header('access-control-allow-origin: *');
header('access-control-allow-headers: content-type');
header('access-control-allow-methods: get, post, options');
header('content-type: application/json; charset=utf-8');

$csvDir  = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/users.csv';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'no users found']);
    exit;
}

$users = [];
if (($handle = fopen($csvFile, 'r')) !== false) {
    fgetcsv($handle, 0, ',', '"', '\\');
    while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (isset($row[0], $row[1], $row[3])) {
            $userId = trim($row[0]);
            $username = trim($row[1]);
            $role = trim($row[3]);
            if (in_array($role, ['upallilos', 'user'])) {
                $users[] = [
                    'id' => $userId,
                    'username'=> $username,
                    'role' => $role
                ];
            }
        }
    }
    fclose($handle);
}

echo json_encode(['success' => true, 'users' => $users]);
?>