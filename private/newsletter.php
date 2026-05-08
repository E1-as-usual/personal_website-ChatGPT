<?php
/* Shared newsletter storage helpers. */

function newsletter_private_dir(string $subdir = ''): string
{
    $base = __DIR__;
    return $subdir === '' ? $base : $base . DIRECTORY_SEPARATOR . $subdir;
}

function newsletter_data_path(): string
{
    return newsletter_private_dir('newsletter-subscribers.json');
}

function newsletter_legacy_jsonl_path(): string
{
    return newsletter_private_dir('newsletter-subscribers.jsonl');
}

function newsletter_load_subscribers(): array
{
    $path = newsletter_data_path();

    if (is_file($path)) {
        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : [];
    }

    $legacy = newsletter_legacy_jsonl_path();
    if (!is_file($legacy)) {
        return [];
    }

    $subscribers = [];
    $lines = file($legacy, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

    foreach ($lines as $line) {
        $entry = json_decode($line, true);
        if (!is_array($entry) || empty($entry['email'])) {
            continue;
        }
        $subscribers[strtolower($entry['email'])] = $entry;
    }

    return array_values($subscribers);
}

function newsletter_save_subscribers(array $subscribers): void
{
    $path = newsletter_data_path();
    file_put_contents($path, json_encode(array_values($subscribers), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function newsletter_find_index(array $subscribers, string $email): int
{
    $email = strtolower(trim($email));

    foreach ($subscribers as $index => $subscriber) {
        if (strtolower($subscriber['email'] ?? '') === $email) {
            return $index;
        }
    }

    return -1;
}

function newsletter_token(): string
{
    return bin2hex(random_bytes(20));
}

function newsletter_subscribe(string $email, string $name = '', string $lang = 'ro', string $source = 'site'): array
{
    $email = strtolower(trim($email));
    $name = trim($name);
    $lang = $lang === 'en' ? 'en' : 'ro';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('invalid-email');
    }

    $subscribers = newsletter_load_subscribers();
    $index = newsletter_find_index($subscribers, $email);
    $now = date('c');

    if ($index >= 0) {
        $subscribers[$index]['name'] = $name !== '' ? $name : ($subscribers[$index]['name'] ?? '');
        $subscribers[$index]['lang'] = $lang;
        $subscribers[$index]['source'] = $source;
        $subscribers[$index]['status'] = 'subscribed';
        $subscribers[$index]['resubscribed_at'] = $now;
        $subscribers[$index]['unsubscribe_token'] = $subscribers[$index]['unsubscribe_token'] ?? newsletter_token();
    } else {
        $subscribers[] = [
            'email' => $email,
            'name' => $name,
            'lang' => $lang,
            'source' => $source,
            'status' => 'subscribed',
            'subscribed_at' => $now,
            'unsubscribe_token' => newsletter_token(),
            'ip_hash' => hash('sha256', $_SERVER['REMOTE_ADDR'] ?? ''),
        ];
    }

    newsletter_save_subscribers($subscribers);
    return $index >= 0 ? $subscribers[$index] : end($subscribers);
}

function newsletter_unsubscribe(string $token): bool
{
    $token = trim($token);

    if ($token === '') {
        return false;
    }

    $subscribers = newsletter_load_subscribers();
    $updated = false;

    foreach ($subscribers as &$subscriber) {
        if (!empty($subscriber['unsubscribe_token']) && hash_equals($subscriber['unsubscribe_token'], $token)) {
            $subscriber['status'] = 'unsubscribed';
            $subscriber['unsubscribed_at'] = date('c');
            $updated = true;
            break;
        }
    }

    if ($updated) {
        newsletter_save_subscribers($subscribers);
    }

    return $updated;
}

function newsletter_active_subscribers(): array
{
    return array_values(array_filter(newsletter_load_subscribers(), fn ($subscriber) => ($subscriber['status'] ?? 'subscribed') === 'subscribed'));
}
