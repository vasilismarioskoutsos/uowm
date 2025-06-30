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

$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($userId === 0) {
    echo json_encode(['success' => false, 'message' => 'invalid user_id']);
    exit;
}

$csvFile = __DIR__ . '/../pipeline/dataset/processed/processed_ratings.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => true, 'ratings' => []]);
    exit;
}

$ratings = [];
if (($handle = fopen($csvFile, 'r')) !== false) {
    fgetcsv($handle, 0, ',', '"', '\\');
    while (($data = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (intval($data[0]) === $userId) {
            $movieId = intval($data[1]);
            $rating = floatval($data[2]);
            $ratings[$movieId] = $rating;
        }
    }
    fclose($handle);
}

// output json
echo json_encode(['success' => true, 'ratings' => $ratings]);
?>