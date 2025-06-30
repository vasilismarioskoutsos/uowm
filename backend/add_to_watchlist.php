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

// cors
header("access-control-allow-origin: *");
header("access-control-allow-methods: post, options");
header("access-control-allow-headers: content-type");
header("content-type: application/json; charset=utf-8");

// read json input
$input = json_decode(file_get_contents("php://input"), true);
$userId  = isset($input['user_id'])  ? intval($input['user_id'])  : null;
$movieId = isset($input['movie_id']) ? intval($input['movie_id']) : null;

if ($userId === null || $movieId === null) {
    echo json_encode(["success" => false, "message" => "please fill all fields"]);
    exit;
}

$csvDir  = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/watchlist.csv';
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

if (!file_exists($csvFile)) {
    file_put_contents($csvFile, "userId,movieId\n");
}

// check duplicates
$exists = false;
$rows = [];
if (($handle = fopen($csvFile, "r")) !== false) {
    fgetcsv($handle, 1000, ",", "\\");
    while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
        if (isset($row[0], $row[1]) && intval($row[0]) === $userId && intval($row[1]) === $movieId) {
            $exists = true;
            break;
        }
    }
    fclose($handle);
}

if ($exists) {
    echo json_encode(["success" => false, "message" => "movie already in watchlist"]);
    exit;
}

if (($handle = fopen($csvFile, "a")) !== false) {
    fputcsv($handle, [$userId, $movieId]);
    fclose($handle);
    echo json_encode(["success" => true, "message" => "movie added to watchlist"]);
} 

else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "could not write file"]);
}