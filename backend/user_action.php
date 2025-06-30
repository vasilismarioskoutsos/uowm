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
if (empty($input['user_id']) || empty($input['action'])) {
    echo json_encode(['success' => false, 'message' => 'missing user_id or action']);
    exit;
}

$user_id = intval($input['user_id']);
$action = trim($input['action']);

// only delete action supported
if ($action !== 'delete') {
    echo json_encode(['success' => false, 'message' => 'unsupported action']);
    exit;
}

$csvDir = __DIR__ . '/../pipeline/dataset';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

$csvFile = $csvDir . '/users.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'users file not found']);
    exit;
}

// read file
$lines = file($csvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if (!$lines || count($lines) < 2) {
    echo json_encode(['success' => false, 'message' => 'no users to delete']);
    exit;
}

$header = array_shift($lines);
$newLines = [];
$found = false;

foreach ($lines as $line) {
    $data = str_getcsv($line);
    if (intval($data[0]) === $user_id) {
        $found = true;
        continue;
    }
    $newLines[] = $line;
}

if (!$found) {
    echo json_encode(['success' => false, 'message' => 'user not found']);
    exit;
}

array_unshift($newLines, $header);
file_put_contents($csvFile, implode("\n", $newLines) . "\n");

echo json_encode(['success' => true, 'message' => 'user deleted']);
?>