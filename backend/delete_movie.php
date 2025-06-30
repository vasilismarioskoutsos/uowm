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

header("access-control-allow-origin: *");
header("access-control-allow-methods: post, options");
header("access-control-allow-headers: content-type");
header("content-type: application/json; charset=utf-8");

// read incoming json
$input = json_decode(file_get_contents("php://input"), true);

// check for id
if (!isset($input['id'])) {
    echo json_encode(["success" => false, "message" => "missing id"]);
    exit;
}

$movie_id = trim($input['id']);
$csvFile  = __DIR__ . "/../pipeline/dataset/movie_metadata.csv";

if (!file_exists($csvFile)) {
    echo json_encode(["success" => false, "message" => "file not found"]);
    exit;
}

$handle = fopen($csvFile, "r");
if (!$handle) {
    echo json_encode(["success" => false, "message" => "could not open file"]);
    exit;
}

$rows  = [];
$header = fgetcsv($handle);
$found  = false;

// read all rows except the one to delete
while (($row = fgetcsv($handle)) !== false) {
    if (isset($row[0]) && trim($row[0]) === $movie_id) {
        $found = true;
        continue;
    }
    $rows[] = $row;
}
fclose($handle);

// if found rewrite file without deleted row
if ($found) {
    $output = fopen($csvFile, "w");
    fputcsv($output, $header);
    foreach ($rows as $row) {
        fputcsv($output, $row);
    }
    fclose($output);
    echo json_encode(["success" => true, "message" => "movie deleted"]);
} 

else {
    echo json_encode(["success" => false, "message" => "movie not found"]);
}