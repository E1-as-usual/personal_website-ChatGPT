<?php
/*
  Contact form handler for chiurciu.com.

  Launch behavior:
  - Validates text fields and honeypot spam field.
  - Accepts optional files only in strict allowed formats.
  - Small uploads are attached to the email.
  - Larger uploads are stored privately and sent as secure download links.
  - Uses PHPMailer + authenticated SMTP when configured.
  - Falls back to PHP mail() only when SMTP is not configured and there are no direct attachments.

  Recommended cPanel PHP limits for launch:
  upload_max_filesize >= 64M
  post_max_size >= 64M
  max_execution_time >= 120

  Recommended mailbox setup:
  - SMTP sender/login: website@chiurciu.com
  - Messages delivered to: contact@chiurciu.com
  - Reply-To is automatically set to the client's email from the form.
*/

const CONTACT_TO = 'contact@chiurciu.com';
const CONTACT_FROM = 'website@chiurciu.com';
const MAX_FIELD_LENGTH = 4000;
const ATTACHMENT_LIMIT_BYTES = 15728640; // 15 MB total
const STORED_LINK_LIMIT_BYTES = 52428800; // 50 MB total
const DOWNLOAD_TOKEN_BYTES = 24;
const DOWNLOAD_EXPIRY_DAYS = 14;

const ALLOWED_EXTENSIONS = [
    'stl' => 'model/stl',
    '3mf' => 'model/3mf',
    'obj' => 'model/obj',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'pdf' => 'application/pdf',
];

const ALLOWED_MIME_TYPES = [
    'application/octet-stream',
    'model/stl',
    'model/3mf',
    'model/obj',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
    'application/zip',
];

function clean_text(string $value, int $maxLength = MAX_FIELD_LENGTH): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\0"], '', $value);
    $value = strip_tags($value);

    if (function_exists('mb_strlen') && mb_strlen($value, 'UTF-8') > $maxLength) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    } elseif (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }

    return $value;
}

function redirect_back(string $lang, string $status): void
{
    $base = $lang === 'en' ? '/en/contact.html' : '/ro/contact.html';
    header('Location: ' . $base . '?status=' . rawurlencode($status));
    exit;
}

function private_dir(string $subdir = ''): string
{
    $base = __DIR__ . DIRECTORY_SEPARATOR . 'private';
    return $subdir === '' ? $base : $base . DIRECTORY_SEPARATOR . $subdir;
}

function ensure_private_dirs(): void
{
    foreach ([private_dir(), private_dir('uploads'), private_dir('metadata')] as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

function get_upload_entries(): array
{
    if (empty($_FILES['attachments']) || !isset($_FILES['attachments']['name']) || !is_array($_FILES['attachments']['name'])) {
        return [];
    }

    $entries = [];
    $count = count($_FILES['attachments']['name']);

    for ($i = 0; $i < $count; $i++) {
        if ($_FILES['attachments']['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $entries[] = [
            'name' => $_FILES['attachments']['name'][$i],
            'type' => $_FILES['attachments']['type'][$i] ?? '',
            'tmp_name' => $_FILES['attachments']['tmp_name'][$i],
            'error' => $_FILES['attachments']['error'][$i],
            'size' => (int) $_FILES['attachments']['size'][$i],
        ];
    }

    return $entries;
}

function validate_uploads(array $uploads): array
{
    $validated = [];
    $totalSize = 0;

    foreach ($uploads as $upload) {
        if ($upload['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('upload-error');
        }

        if (!is_uploaded_file($upload['tmp_name'])) {
            throw new RuntimeException('invalid-file');
        }

        $originalName = basename($upload['name']);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (!isset(ALLOWED_EXTENSIONS[$extension])) {
            throw new RuntimeException('invalid-file');
        }

        $mime = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = finfo_file($finfo, $upload['tmp_name']) ?: '';
                finfo_close($finfo);
            }
        }

        if ($mime !== '' && !in_array($mime, ALLOWED_MIME_TYPES, true)) {
            throw new RuntimeException('invalid-file');
        }

        $totalSize += $upload['size'];

        if ($totalSize > STORED_LINK_LIMIT_BYTES) {
            throw new RuntimeException('upload-too-large');
        }

        $validated[] = [
            'original_name' => $originalName,
            'extension' => $extension,
            'mime' => $mime !== '' ? $mime : ($upload['type'] ?: ALLOWED_EXTENSIONS[$extension]),
            'tmp_name' => $upload['tmp_name'],
            'size' => $upload['size'],
        ];
    }

    return [$validated, $totalSize];
}

function store_uploads_with_links(array $files): array
{
    ensure_private_dirs();
    $links = [];

    foreach ($files as $file) {
        $token = bin2hex(random_bytes(DOWNLOAD_TOKEN_BYTES));
        $storedName = $token . '.' . $file['extension'];
        $target = private_dir('uploads') . DIRECTORY_SEPARATOR . $storedName;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            throw new RuntimeException('upload-error');
        }

        $metadata = [
            'token' => $token,
            'original_name' => $file['original_name'],
            'stored_name' => $storedName,
            'mime' => $file['mime'],
            'size' => $file['size'],
            'uploaded_at' => time(),
            'expires_at' => time() + DOWNLOAD_EXPIRY_DAYS * 24 * 60 * 60,
        ];

        file_put_contents(private_dir('metadata') . DIRECTORY_SEPARATOR . $token . '.json', json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $links[] = [
            'name' => $file['original_name'],
            'size' => $file['size'],
            'url' => site_base_url() . '/download-file.php?token=' . rawurlencode($token),
        ];
    }

    return $links;
}

function site_base_url(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'chiurciu.com';
    return $scheme . '://' . $host;
}

function format_bytes(int $bytes): string
{
    return round($bytes / 1024 / 1024, 1) . ' MB';
}

function load_mail_config(): array
{
    $configPath = private_dir('mail-config.php');

    if (file_exists($configPath)) {
        $config = require $configPath;
        return is_array($config) ? $config : [];
    }

    return [
        'smtp_host' => getenv('SMTP_HOST') ?: '',
        'smtp_user' => getenv('SMTP_USER') ?: '',
        'smtp_pass' => getenv('SMTP_PASS') ?: '',
        'smtp_port' => (int) (getenv('SMTP_PORT') ?: 587),
        'smtp_secure' => getenv('SMTP_SECURE') ?: 'tls',
        'from_email' => getenv('SMTP_FROM_EMAIL') ?: CONTACT_FROM,
        'from_name' => getenv('SMTP_FROM_NAME') ?: 'Ioan Chiurciu Website',
        'to_email' => getenv('CONTACT_TO') ?: CONTACT_TO,
    ];
}

function send_with_phpmailer(array $config, string $subject, string $body, string $replyEmail, string $replyName, array $attachments): bool
{
    $autoload = __DIR__ . '/vendor/autoload.php';

    if (!file_exists($autoload)) {
        return false;
    }

    require_once $autoload;

    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        return false;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = $config['smtp_host'];
        $mail->SMTPAuth = true;
        $mail->Username = $config['smtp_user'];
        $mail->Password = $config['smtp_pass'];
        $mail->Port = (int) $config['smtp_port'];
        $mail->SMTPSecure = $config['smtp_secure'] === 'ssl' ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($config['from_email'] ?: CONTACT_FROM, $config['from_name'] ?: 'Ioan Chiurciu Website');
        $mail->addAddress($config['to_email'] ?: CONTACT_TO);
        $mail->addReplyTo($replyEmail, $replyName);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->isHTML(false);

        foreach ($attachments as $attachment) {
            $mail->addAttachment($attachment['tmp_name'], $attachment['original_name']);
        }

        return $mail->send();
    } catch (Throwable $exception) {
        error_log('PHPMailer error: ' . $exception->getMessage());
        return false;
    }
}

function send_with_mail(string $subject, string $body, string $replyEmail, string $replyName): bool
{
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'From: Ioan Chiurciu Website <' . CONTACT_FROM . '>';
    $headers[] = 'Reply-To: ' . $replyName . ' <' . $replyEmail . '>';
    $headers[] = 'X-Mailer: PHP/' . phpversion();

    return mail(CONTACT_TO, $encodedSubject, $body, implode("\r\n", $headers));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /ro/contact.html');
    exit;
}

$lang = clean_text($_POST['lang'] ?? 'ro', 10);
$lang = $lang === 'en' ? 'en' : 'ro';

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

try {
    $uploads = get_upload_entries();
    [$validatedUploads, $totalUploadSize] = validate_uploads($uploads);
} catch (RuntimeException $exception) {
    redirect_back($lang, $exception->getMessage() === 'upload-too-large' ? 'upload-too-large' : 'invalid-file');
}

$attachments = [];
$downloadLinks = [];

try {
    if (!empty($validatedUploads) && $totalUploadSize <= ATTACHMENT_LIMIT_BYTES) {
        $attachments = $validatedUploads;
    } elseif (!empty($validatedUploads)) {
        $downloadLinks = store_uploads_with_links($validatedUploads);
    }
} catch (Throwable $exception) {
    error_log('Upload storage error: ' . $exception->getMessage());
    redirect_back($lang, 'error');
}

$subject = 'Contact site — ' . ($projectType !== '' ? $projectType : 'general');

$body = "Ai primit un mesaj nou de pe chiurciu.com\n\n";
$body .= "Nume: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Tip proiect: " . ($projectType !== '' ? $projectType : 'nespecificat') . "\n";
$body .= "Limba formularului: {$lang}\n\n";
$body .= "Mesaj:\n{$message}\n\n";

if (!empty($attachments)) {
    $body .= "Fișiere atașate direct:\n";
    foreach ($attachments as $file) {
        $body .= '- ' . $file['original_name'] . ' (' . format_bytes($file['size']) . ")\n";
    }
    $body .= "\n";
}

if (!empty($downloadLinks)) {
    $body .= "Fișiere încărcate ca link privat, valabile " . DOWNLOAD_EXPIRY_DAYS . " zile:\n";
    foreach ($downloadLinks as $link) {
        $body .= '- ' . $link['name'] . ' (' . format_bytes($link['size']) . '): ' . $link['url'] . "\n";
    }
    $body .= "\n";
}

$config = load_mail_config();
$hasSmtp = !empty($config['smtp_host']) && !empty($config['smtp_user']) && !empty($config['smtp_pass']);

$sent = false;

if ($hasSmtp) {
    $sent = send_with_phpmailer($config, $subject, $body, $email, $name, $attachments);
}

if (!$sent && empty($attachments)) {
    $sent = send_with_mail($subject, $body, $email, $name);
}

redirect_back($lang, $sent ? 'ok' : 'error');
