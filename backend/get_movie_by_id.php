<?php
// suppress warnings and notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("access-control-allow-origin: *");
    header("access-control-allow-methods: post, get, options");
    header("access-control-allow-headers: content-type");
    exit;
}

// allow cors
header("access-control-allow-origin: *");
header("access-control-allow-methods: post, options");
header("access-control-allow-headers: content-type");
header("content-type: application/json; charset=utf-8");

// parse incoming json
$input = json_decode(file_get_contents('php://input'), true);

// check for movie id
if (!isset($input['movie_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "missing movie id"
    ]);
    exit;
}

$movieId = intval($input['movie_id']);
$csvFile = __DIR__ . "/../pipeline/dataset/movie_metadata.csv";

if (!file_exists($csvFile)) {
    echo json_encode([
        "success" => false,
        "message" => "metadata file not found"
    ]);
    exit;
}

$found = null;

if (($handle = fopen($csvFile, "r")) !== false) {
    fgetcsv($handle, 1000, ",", "\\");
    while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
        if (isset($row[0]) && intval($row[0]) === $movieId) {
            $found = [
                "title" => $row[1],
                "actors" => $row[2],
                "director" => $row[3],
                "release_date" => $row[4],
                "summary" => $row[5],
                "duration" => $row[6],
                "genre_id" => intval($row[7])
            ];
            break;
        }
    }
    fclose($handle);
}

// return result
if ($found) {
    echo json_encode([
        "success" => true,
        "movie" => $found
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "movie not found"
    ]);
}