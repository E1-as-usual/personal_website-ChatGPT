<?php
require_once __DIR__ . '/private/newsletter.php';

function clean_field(string $value, int $max = 180): string
{
    $value = trim(strip_tags(str_replace(["\r", "\0"], '', $value)));
    return strlen($value) > $max ? substr($value, 0, $max) : $value;
}

function redirect_newsletter(string $lang, string $status): void
{
    $path = $_POST['return_to'] ?? '';
    $fallback = $lang === 'en' ? '/en/contact.html' : '/ro/contact.html';

    if (!is_string($path) || $path === '' || str_starts_with($path, 'http') || !str_starts_with($path, '/')) {
        $path = $fallback;
    }

    $separator = str_contains($path, '?') ? '&' : '?';
    header('Location: ' . $path . $separator . 'newsletter=' . rawurlencode($status));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

$lang = clean_field($_POST['lang'] ?? 'ro', 10);
$lang = $lang === 'en' ? 'en' : 'ro';

if (!empty($_POST['website'] ?? '')) {
    redirect_newsletter($lang, 'ok');
}

$email = clean_field($_POST['email'] ?? '', 180);
$name = clean_field($_POST['name'] ?? '', 120);

try {
    newsletter_subscribe($email, $name, $lang, 'newsletter-form');
    redirect_newsletter($lang, 'ok');
} catch (Throwable $exception) {
    redirect_newsletter($lang, 'error');
}
