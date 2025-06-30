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

// read and validate input
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)
    || empty($input['id'])
    || !isset($input['title'])
    || !isset($input['actors'])
    || !isset($input['director'])
    || !isset($input['release_date'])
    || !isset($input['summary'])
    || !isset($input['duration'])) {
    echo json_encode(['success' => false, 'message' => 'missing or invalid fields']);
    exit;
}

$movie_id = intval($input['id']);
$title = trim($input['title']);
$actors = trim($input['actors']);
$director = trim($input['director']);
$release_date = trim($input['release_date']);
$summary = trim($input['summary']);
$duration = intval($input['duration']);

$csvDir = __DIR__ . '/../pipeline/dataset';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

$csvFile = $csvDir . '/movie_metadata.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'file not found']);
    exit;
}

$allRows = [];
$updated = false;

// read all rows
if (($handle = fopen($csvFile, 'r')) !== false) {
    $headers = fgetcsv($handle, 0, ',', '"', '\\');
    $allRows[] = $headers;
    while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (intval($row[0]) === $movie_id) {
            $row[1] = $title;
            $row[2] = $actors;
            $row[3] = $director;
            $row[4] = $release_date;
            $row[5] = $summary;
            $row[6] = $duration;
            $updated = true;
        }
        $allRows[] = $row;
    }
    fclose($handle);
} 

else {
    echo json_encode(['success' => false, 'message' => 'could not read file']);
    exit;
}

if (!$updated) {
    echo json_encode(['success' => false, 'message' => 'movie not found']);
    exit;
}

// write changes
if (($handle = fopen($csvFile, 'w')) !== false) {
    foreach ($allRows as $row) {
        fputcsv($handle, $row);
    }
    fclose($handle);
    echo json_encode(['success' => true, 'message' => 'movie updated']);
} 

else {
    echo json_encode(['success' => false, 'message' => 'could not write to file']);
}
?>