<?php
// suppress warnings/notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// cors
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    exit;

}
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// read json
$input = json_decode(file_get_contents('php://input'), true);

// ensure we got movieid
if (empty($input['movie_id'])) {
    echo json_encode(["success" => false, "message" => "missing movie_id"]);
    exit;
}
$movie_id = (int)$input['movie_id'];

$csv_file = __DIR__ . "/../pipeline/dataset/movie_metadata.csv";
if (!file_exists($csv_file)) {
    echo json_encode(["success" => false, "message" => "metadata file not found"]);
    exit;
}

$found = null;
if (($handle = fopen($csv_file, 'r')) !== false) {
    fgetcsv($handle);
    while (($row = fgetcsv($handle)) !== false) {
        if ((int)$row[0] === $movie_id) {
            $found = [
                "title"  => $row[1],
                "actors" => $row[2],
                "director" => $row[3],
                "release_date" => $row[4],
                "summary" => $row[5],
                "duration" => $row[6],
            ];
            break;
        }
    }
    fclose($handle);
}

if ($found) {
    echo json_encode(["success" => true, "movie" => $found]);
} 

else {
    echo json_encode(["success" => false, "message" => "movie not found"]);
}