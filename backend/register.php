<?php
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// cors
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    exit;
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? null;
$password = $input['password'] ?? null;
$role = $input['role'] ?? 'user';

// validate inputs
if (!$username || !$password) {
    echo json_encode([
        "success" => false,
        "message" => "Missing credentials"
    ]);
    exit;
}

$csvDir = __DIR__ . '/../pipeline/dataset';
$csvFile = $csvDir . '/users.csv';

if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

// check for duplicates
$users = [];
if (file_exists($csvFile)) {
    if (($handle = fopen($csvFile, "r")) !== FALSE) {
        fgetcsv($handle, 1000, ",", "\\");
        while (($data = fgetcsv($handle, 1000, ",", "\\")) !== FALSE) {
            if (isset($data[1]) && $data[1] === $username) {
                fclose($handle);
                echo json_encode([
                    "success" => false,
                    "message" => "Username already exists"
                ]);
                exit;
            }
            $users[] = $data;
        }
        fclose($handle);
    }
} else {
    file_put_contents($csvFile, "userId,username,password,role\n");
}

// new user id
$newId = 1;
if (!empty($users)) {
    $lastUser = end($users);
    $newId = intval($lastUser[0]) + 1;
}

// add new user 
if (($handle = fopen($csvFile, "a")) !== FALSE) {
    fputcsv($handle, [$newId, $username, $password, $role]);
    fclose($handle);

    echo json_encode([
        "success" => true,
        "message" => "User registered"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to open users file for writing"
    ]);
}