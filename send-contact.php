<?php
/*
  Contact form handler for chiurciu.com.

  Upload this file to a PHP-enabled cPanel hosting environment.
  The form sends messages to contact@chiurciu.com using the server mail function.
  If delivery is unreliable, upgrade this file later to PHPMailer + authenticated SMTP.
*/

const CONTACT_TO = 'contact@chiurciu.com';
const CONTACT_FROM = 'contact@chiurciu.com';
const MAX_FIELD_LENGTH = 4000;

function clean_text(string $value, int $maxLength = MAX_FIELD_LENGTH): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\0"], '', $value);
    $value = strip_tags($value);

    if (mb_strlen($value, 'UTF-8') > $maxLength) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return $value;
}

function redirect_back(string $lang, string $status): void
{
    $base = $lang === 'en' ? 'en/contact.html' : 'ro/contact.html';
    header('Location: ' . $base . '?status=' . rawurlencode($status));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ro/contact.html');
    exit;
}

$lang = clean_text($_POST['lang'] ?? 'ro', 10);
$lang = $lang === 'en' ? 'en' : 'ro';

// Honeypot anti-spam field. Real users should never fill this.
if (!empty($_POST['website'] ?? '')) {
    redirect_back($lang, 'ok');
}

$name = clean_text($_POST['name'] ?? '', 120);
$email = clean_text($_POST['email'] ?? '', 180);
$projectType = clean_text($_POST['projectType'] ?? '', 120);
$message = clean_text($_POST['message'] ?? '', 5000);

if ($name === '' || $email === '' || $message === '') {
    redirect_back($lang, 'missing');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_back($lang, 'invalid-email');
}

$subject = 'Contact site — ' . ($projectType !== '' ? $projectType : 'general');

$body = "Ai primit un mesaj nou de pe chiurciu.com\n\n";
$body .= "Nume: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Tip proiect: " . ($projectType !== '' ? $projectType : 'nespecificat') . "\n";
$body .= "Limba formularului: {$lang}\n\n";
$body .= "Mesaj:\n{$message}\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Ioan Chiurciu Website <' . CONTACT_FROM . '>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = mail(CONTACT_TO, $encodedSubject, $body, implode("\r\n", $headers));

redirect_back($lang, $sent ? 'ok' : 'error');
