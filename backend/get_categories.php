<?php
// suppress warnings and notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("access-control-allow-origin: *");
    header("access-control-allow-methods: get, options");
    header("access-control-allow-headers: content-type");
    exit;
}

// allow cors
header("access-control-allow-origin: *");
header("content-type: application/json; charset=utf-8");

$csvFile = __DIR__ . '/../pipeline/dataset/movie_genres.csv';

if (!file_exists($csvFile)) {
    echo json_encode([
        "success" => false,
        "message" => "categories file not found"
    ]);
    exit;
}

// read categories from csv
$categories = [];
if (($handle = fopen($csvFile, "r")) !== false) {
    fgetcsv($handle, 1000, ",", "\\");
    while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
        if (isset($row[0], $row[1])) {
            $categories[] = [
                "genre_id" => $row[0],
                "genre_name" => $row[1]
            ];
        }
    }
    fclose($handle);
}

// return categories list
echo json_encode([
    "success" => true,
    "categories" => $categories
]);