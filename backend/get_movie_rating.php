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

// parse request data
$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['movie_id']) || !isset($input['user_id'])) {
    echo json_encode(["success" => false, "message" => "missing movie id or user id"]);
    exit;
}

$movie_id = (string) $input['movie_id'];
$user_id  = (string) $input['user_id'];
$csv_file = __DIR__ . "/../pipeline/dataset/processed/processed_ratings.csv";

if (!file_exists($csv_file)) {
    echo json_encode(["success" => false, "message" => "ratings file not found"]);
    exit;
}

if (!($handle = fopen($csv_file, 'r'))) {
    echo json_encode(["success" => false, "message" => "could not open file"]);
    exit;
}

fgetcsv($handle, 1000, ",", "\\");

$total = 0;
$count = 0;
$user_rating = 0.0;

// read ratings
while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
    if (count($row) < 3) continue;
    list($row_user, $row_movie, $row_rating) = array_map('trim', $row);
    $row_rating = (float) $row_rating;

    if ($row_movie === $movie_id) {
        $total += $row_rating;
        $count++;
        if ($row_user === $user_id) {
            $user_rating = $row_rating;
        }
    }
}
fclose($handle);

// compute average or default to zero
$average_rating = $count > 0 ? round($total / $count, 2) : 0.0;

// return json response
echo json_encode([
    "success" => true,
    "average_rating" => $average_rating,
    "user_rating" => $user_rating
]);