<?php
/* Secure private download handler for uploaded contact-form files. */

const DOWNLOAD_TOKEN_PATTERN = '/^[a-f0-9]{48}$/';

function private_dir(string $subdir = ''): string
{
    $base = __DIR__ . DIRECTORY_SEPARATOR . 'private';
    return $subdir === '' ? $base : $base . DIRECTORY_SEPARATOR . $subdir;
}

$token = $_GET['token'] ?? '';

if (!is_string($token) || !preg_match(DOWNLOAD_TOKEN_PATTERN, $token)) {
    http_response_code(404);
    exit('File not found.');
}

$metadataPath = private_dir('metadata') . DIRECTORY_SEPARATOR . $token . '.json';

if (!is_file($metadataPath)) {
    http_response_code(404);
    exit('File not found.');
}

$metadata = json_decode(file_get_contents($metadataPath), true);

if (!is_array($metadata) || empty($metadata['stored_name']) || empty($metadata['original_name'])) {
    http_response_code(404);
    exit('File not found.');
}

if (!empty($metadata['expires_at']) && time() > (int) $metadata['expires_at']) {
    http_response_code(410);
    exit('This download link has expired.');
}

$filePath = private_dir('uploads') . DIRECTORY_SEPARATOR . basename($metadata['stored_name']);

if (!is_file($filePath)) {
    http_response_code(404);
    exit('File not found.');
}

$downloadName = basename($metadata['original_name']);
$mime = !empty($metadata['mime']) ? $metadata['mime'] : 'application/octet-stream';
$size = filesize($filePath);

header('Content-Type: ' . $mime);
header('Content-Length: ' . $size);
header('Content-Disposition: attachment; filename="' . addcslashes($downloadName, '"\\') . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store, no-cache, must-revalidate');

readfile($filePath);
exit;
