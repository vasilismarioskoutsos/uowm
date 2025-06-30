<?php
// suppress notices 
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

// read json
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? null;
$password = $input['password'] ?? null;

if (!$username || !$password) {
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit;
}

function readUsersCSV($filename) {
    $users = [];
    if (($handle = fopen($filename, "r")) !== FALSE) {
        fgetcsv($handle, 1000, ",", "\\"); // skip headers
        while (($data = fgetcsv($handle, 1000, ",", "\\")) !== FALSE) {
            if (count($data) < 4) continue;
            $users[] = [
                "id" => $data[0],
                "username" => $data[1],
                "password" => $data[2],
                "role" => $data[3]
            ];
        }
        fclose($handle);
    }
    return $users;
}

$csvFile = __DIR__ . '/../pipeline/dataset/users.csv';
if (!file_exists($csvFile)) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Αρχείο χρηστών δεν βρέθηκε: $csvFile"
    ]);
    exit;
}

$users = readUsersCSV($csvFile);

// authenticate
foreach ($users as $user) {
    if ($user["username"] === $username && $user["password"] === $password) {
        echo json_encode([
            "status" => "success",
            "user" => [
                "id" => $user["id"],
                "username" => $user["username"],
                "role" => $user["role"]
            ]
        ]);
        exit;
    }
}

echo json_encode([
    "status" => "error",
    "message" => "Invalid credentials"
]);