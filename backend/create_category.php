<?php
// suppress warnings and notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("access-control-allow-origin: *");
    header("access-control-allow-methods: post, options");
    header("access-control-allow-headers: content-type");
    exit;
}

// allow cors
header("access-control-allow-origin: *");
header("access-control-allow-methods: post, options");
header("access-control-allow-headers: content-type");
header("content-type: application/json; charset=utf-8");

// read validate input
$input = json_decode(file_get_contents("php://input"), true);
$genre = trim($input['genre_name'] ?? '');
if ($genre === '') {
    echo json_encode(["success" => false, "message" => "invalid genre"]);
    exit;
}

$csvDir  = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/movie_genres.csv';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

if (!file_exists($csvFile)) {
    file_put_contents($csvFile, "genre_id,genre_name\n");
}

// find last id
$lastId = -1;
if (($handle = fopen($csvFile, "r")) !== false) {
    fgetcsv($handle, 1000, ",", "\\");
    while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
        if (isset($row[0]) && is_numeric($row[0])) {
            $lastId = max($lastId, intval($row[0]));
        }
    }
    fclose($handle);
}

// append new genre
$newId = $lastId + 1;
if (($handle = fopen($csvFile, "a")) !== false) {
    fputcsv($handle, [$newId, $genre]);
    fclose($handle);
    echo json_encode(["success" => true, "message" => "genre added"]);
} 

else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "could not write file"]);
}