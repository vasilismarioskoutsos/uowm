<?php
// suppress notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

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

// read genre id
if (!isset($_GET['genre_id'])) {
    echo json_encode(['success' => false, 'message' => 'missing genre_id']);
    exit;
}

$genre_id = trim($_GET['genre_id']);

$csvDir  = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/movie_metadata.csv';

if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'file not found']);
    exit;
}

$handle = fopen($csvFile, 'r');
if (!$handle) {
    echo json_encode(['success' => false, 'message' => 'could not read file']);
    exit;
}

$movies = [];

fgetcsv($handle, 0, ',', '"', '\\');

while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
    if (isset($row[0], $row[1], $row[7]) && trim($row[7]) === $genre_id) {
        $movies[] = [
            'id' => trim($row[0]),
            'title' => trim($row[1])
        ];
    }
}

fclose($handle);

if ($movies) {
    echo json_encode(['success' => true, 'movies' => $movies]);
} 

else {
    echo json_encode(['success' => false, 'message' => 'no movies found for this genre']);
}
?>