<?php
// suppress warnings and notices
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("access-control-allow-origin: *");
    header("access-control-allow-headers: content-type");
    header("access-control-allow-methods: post, options");
    exit;
}

header("access-control-allow-origin: *");
header("access-control-allow-headers: content-type");
header("access-control-allow-methods: post, options");
header("content-type: application/json; charset=utf-8");

// parse incoming json
$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) {
    echo json_encode(["success" => false, "message" => "invalid data format"]);
    exit;
}

$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if ($username === '' || $password === '') {
    echo json_encode(["success" => false, "message" => "please fill all fields"]);
    exit;
}

$csvDir  = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/users.csv';

if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

if (!file_exists($csvFile)) {
    file_put_contents($csvFile, "userId,username,password,role\n");
}

// find highest existing id
$lastId = 0;
if (($handle = fopen($csvFile, "r")) !== false) {
    fgetcsv($handle, 1000, ",", "\\");
    while (($row = fgetcsv($handle, 1000, ",", "\\")) !== false) {
        if (isset($row[0]) && is_numeric($row[0])) {
            $lastId = max($lastId, intval($row[0]));
        }
    }
    fclose($handle);
}

// prepare new user record
$newId = $lastId + 1;
$role = 'upallilos';

if (($handle = fopen($csvFile, "a")) !== false) {
    fputcsv($handle, [$newId, $username, $password, $role]);
    fclose($handle);
    echo json_encode(["success" => true, "message" => "user added successfully"]);
} 

else {
    echo json_encode(["success" => false, "message" => "could not write to file"]);
}