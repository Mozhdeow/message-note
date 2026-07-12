<?php

header("Access-Control-Allow-Origin: http://localhost:3001");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Range, Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$file = $_GET['file'] ?? '';

$file = basename($file);

if (!$file) {
    http_response_code(400);
    echo "Missing file";
    exit;
}

$path = __DIR__ . "/uploads/" . $file;

if (!file_exists($path) || !is_file($path)) {
    http_response_code(404);
    echo "File not found";
    exit;
}

$size = filesize($path);
$start = 0;
$end = $size - 1;
$length = $size;

$mime = mime_content_type($path) ?: "audio/mpeg";

header("Content-Type: " . $mime);
header("Accept-Ranges: bytes");

if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];

    if (preg_match('/bytes=(\d*)-(\d*)/', $range, $matches)) {
        if ($matches[1] !== '') {
            $start = intval($matches[1]);
        }

        if ($matches[2] !== '') {
            $end = intval($matches[2]);
        }

        if ($end > $size - 1) {
            $end = $size - 1;
        }

        if ($start > $end || $start >= $size) {
            header("Content-Range: bytes */" . $size);
            http_response_code(416);
            exit;
        }

        $length = $end - $start + 1;

        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
        header("Content-Length: " . $length);
    }
} else {
    header("Content-Length: " . $size);
}

$fp = fopen($path, "rb");

if (!$fp) {
    http_response_code(500);
    echo "Could not open file";
    exit;
}

fseek($fp, $start);

$bufferSize = 8192;
$bytesSent = 0;

while (!feof($fp) && $bytesSent < $length) {
    $remaining = $length - $bytesSent;
    $readSize = min($bufferSize, $remaining);

    echo fread($fp, $readSize);
    flush();

    $bytesSent += $readSize;
}

fclose($fp);
exit;