<?php
// suppress warnings
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// cors
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('access-control-allow-origin: *');
    header('access-control-allow-headers: content-type');
    header('access-control-allow-methods: post, get, options');
    exit;
}

header('access-control-allow-origin: *');
header('access-control-allow-headers: content-type');
header('access-control-allow-methods: post, get, options');
header('content-type: application/json; charset=utf-8');

// read input
$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'missing user_id']);
    exit;
}
$user_id = intval($input['user_id']);

$csvDir = __DIR__ . '/../pipeline/dataset';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

$watchlistFile = $csvDir . '/watchlist.csv';
$metadataFile = $csvDir . '/movie_metadata.csv';

if (!file_exists($watchlistFile) || !file_exists($metadataFile)) {
    echo json_encode(['success' => false, 'message' => 'missing watchlist or metadata file']);
    exit;
}

// read user watchlist ids
$watchlist = [];
if (($h = fopen($watchlistFile, 'r')) !== false) {
    fgetcsv($h, 0, ',', '"', '\\');
    while (($row = fgetcsv($h, 0, ',', '"', '\\')) !== false) {
        if (intval($row[0]) === $user_id) {
            $watchlist[] = $row[1];
        }
    }
    fclose($h);
}

// read metadata and filter
$movies = [];
if (($h = fopen($metadataFile, 'r')) !== false) {
    $headers = fgetcsv($h, 0, ',', '"', '\\');
    while (($row = fgetcsv($h, 0, ',', '"', '\\')) !== false) {
        if (in_array($row[0], $watchlist, true)) {
            $movies[] = array_combine($headers, $row);
        }
    }
    fclose($h);
}

// output json
echo json_encode(['success' => true, 'movies' => $movies]);
?>