<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// read parameters
$user = isset($_GET['user']) ? (int) $_GET['user'] : 1;
$k = isset($_GET['k']) ? (int) $_GET['k'] : 10;

// call flask
$flaskUrl = "http://localhost:5000/recommend?user={$user}&k={$k}";
$response = @file_get_contents($flaskUrl);
if ($response === false) {
    http_response_code(502);
    echo json_encode(['status'=>'error','message'=>'Bad Gateway: cannot reach recommendation service']);
    exit;
}

$data = json_decode($response, true);
if (!is_array($data) || !isset($data['recommendations'])) {
    http_response_code(502);
    echo json_encode(['status'=>'error','message'=>'Bad Gateway: invalid JSON from recommendation service']);
    exit;
}

$ids = $data['recommendations'];

// load titles
$csvFile = __DIR__ . '/../pipeline/dataset/processed/processed_movies.csv';
$handle = @fopen($csvFile, 'r');
if (!$handle) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Server error: cannot open movies file']);
    exit;
}

$header = fgetcsv($handle);

// id to title mapping
$movieMap = [];
while (($row = fgetcsv($handle)) !== false) {
    $movieMap[(int)$row[0]] = $row[1];
}
fclose($handle);

$recs = [];
foreach ($ids as $mid) {
    $i = (int)$mid;
    if (isset($movieMap[$i])) {
        $recs[] = ['id' => $i, 'title' => $movieMap[$i]];
    } else {
        $recs[] = ['id' => $i, 'title' => null];
    }
}

echo json_encode([
    'status' => 'success',
    'userId' => $user,
    'recommendations' => $recs
]);