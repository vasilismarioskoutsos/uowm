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
header('access-control-allow-methods: post, get, options');
header('content-type: application/json; charset=utf-8');

// read and validate input
$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['user_id']) || empty($input['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'missing user_id or new_password']);
    exit;
}

$user_id = intval($input['user_id']);
$new_password = trim($input['new_password']);

$csvDir = __DIR__ . '/../pipeline/dataset';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

$csvFile = $csvDir . '/users.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'users file not found']);
    exit;
}

$allRows = [];
$found = false;

if (($handle = fopen($csvFile, 'r')) !== false) {
    $headers = fgetcsv($handle, 0, ',', '"', '\\');
    $allRows[] = $headers;
    while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (intval($row[0]) === $user_id) {
            $row[2] = $new_password;
            $found = true;
        }
        $allRows[] = $row;
    }
    fclose($handle);
} 

else {
    echo json_encode(['success' => false, 'message' => 'could not read file']);
    exit;
}

if (!$found) {
    echo json_encode(['success' => false, 'message' => 'user not found']);
    exit;
}

// write changes
if (($handle = fopen($csvFile, 'w')) !== false) {
    foreach ($allRows as $row) {
        fputcsv($handle, $row);
    }
    fclose($handle);
    echo json_encode(['success' => true, 'message' => 'password updated']);
} 

else {
    echo json_encode(['success' => false, 'message' => 'could not write to file']);
}
?>