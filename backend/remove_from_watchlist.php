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

// read input data
$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['user_id']) || empty($input['movie_id'])) {
    echo json_encode(['success' => false, 'message' => 'missing user_id or movie_id']);
    exit;
}

$user_id = trim($input['user_id']);
$movie_id = trim($input['movie_id']);

$csvDir = __DIR__ . '/../pipeline/dataset';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

$csvFile = $csvDir . '/watchlist.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'watchlist file not found']);
    exit;
}

$rows  = [];
$found = false;

// read file and filter
if (($handle = fopen($csvFile, 'r')) !== false) {
    $headers = fgetcsv($handle, 0, ',', '"', '\\');
    while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (trim($row[0]) === $user_id && trim($row[1]) === $movie_id) {
            $found = true;
            continue;
        }
        $rows[] = $row;
    }
    fclose($handle);
} 

else {
    echo json_encode(['success' => false, 'message' => 'could not read file']);
    exit;
}

if ($found) {
    if (($handle = fopen($csvFile, 'w')) !== false) {
        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
        echo json_encode(['success' => true]);
    } 
    else {
        echo json_encode(['success' => false, 'message' => 'could not write to file']);
    }
} 

else {
    echo json_encode(['success' => false, 'message' => 'entry not found']);
}
?>