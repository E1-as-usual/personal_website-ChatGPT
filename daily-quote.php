<?php
/*
  Server-side daily quote endpoint.

  Behavior:
  - Reads canonical quote data from data/quotes.json.
  - Stores one selected random quote per date in private/daily-quote.json.
  - Everyone receives the same quote for the same server date.
  - Avoids repeating yesterday's quote when possible.
*/

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

function private_path(string $file): string
{
    return __DIR__ . DIRECTORY_SEPARATOR . 'private' . DIRECTORY_SEPARATOR . $file;
}

function fail_response(): void
{
    http_response_code(500);
    echo json_encode(['error' => 'quote-unavailable']);
    exit;
}

$quotesPath = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'quotes.json';

if (!is_file($quotesPath)) {
    fail_response();
}

$quotes = json_decode(file_get_contents($quotesPath), true);

if (!is_array($quotes) || count($quotes) === 0) {
    fail_response();
}

$today = date('Y-m-d');
$storePath = private_path('daily-quote.json');
$stored = [];

if (is_file($storePath)) {
    $storedData = json_decode(file_get_contents($storePath), true);
    $stored = is_array($storedData) ? $storedData : [];
}

if (($stored['date'] ?? '') === $today && !empty($stored['quote_id'])) {
    foreach ($quotes as $quote) {
        if (($quote['id'] ?? '') === $stored['quote_id']) {
            echo json_encode(['date' => $today, 'quote' => $quote], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }
}

$previousQuoteId = $stored['quote_id'] ?? '';
$availableQuotes = [];

if (count($quotes) > 1) {
    foreach ($quotes as $quote) {
        if (($quote['id'] ?? '') !== $previousQuoteId) {
            $availableQuotes[] = $quote;
        }
    }
} else {
    $availableQuotes = $quotes;
}

$selected = $availableQuotes[random_int(0, count($availableQuotes) - 1)];
$newStored = [
    'date' => $today,
    'quote_id' => $selected['id'] ?? '',
    'selected_at' => date('c'),
];

if (!is_dir(dirname($storePath))) {
    mkdir(dirname($storePath), 0755, true);
}

file_put_contents($storePath, json_encode($newStored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

echo json_encode(['date' => $today, 'quote' => $selected], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
