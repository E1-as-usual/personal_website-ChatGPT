# Deployment checklist

## Contact mailbox

Create this mailbox in cPanel:

- `website@chiurciu.com` — used only by the website to send SMTP mail

Main delivery inbox:

- `contact@chiurciu.com` — receives form messages

## SMTP config

On the cPanel server, copy:

```text
private/mail-config.example.php
```

to:

```text
private/mail-config.php
```

Then fill in the real password for `website@chiurciu.com`.

Do not commit `private/mail-config.php` to GitHub.

Expected config:

```php
return [
    'smtp_host' => 'mail.chiurciu.com',
    'smtp_user' => 'website@chiurciu.com',
    'smtp_pass' => 'REAL_PASSWORD_HERE',
    'smtp_port' => 587,
    'smtp_secure' => 'tls',
    'from_email' => 'website@chiurciu.com',
    'from_name' => 'Ioan Chiurciu Website',
    'to_email' => 'contact@chiurciu.com',
];
```

## PHP / cPanel limits

Recommended cPanel PHP values:

```text
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 120
memory_limit = 128M or higher
```

## Composer / PHPMailer

The contact form uses PHPMailer when SMTP is configured.

Install dependencies locally before upload or on the server:

```bash
composer install --no-dev
```

This creates:

```text
vendor/autoload.php
```

Upload the `vendor/` folder if Composer is not available on cPanel.

## Upload behavior

Accepted formats:

- STL
- 3MF
- OBJ
- JPG / JPEG
- PNG
- WEBP
- PDF

Limits:

- Up to 15 MB total: files are attached to the email
- 15–50 MB total: files are stored privately and sent as secure download links
- Over 50 MB total: browser blocks upload and asks user to send a transfer link

Private storage:

```text
private/uploads/
private/metadata/
```

Download links are routed through:

```text
download-file.php?token=...
```

and expire after 14 days.

## Test after upload

1. Open `/ro/contact.html`
2. Send message without file
3. Send message with a small file under 15 MB
4. Send message with a medium file over 15 MB but under 50 MB
5. Try an invalid file format and confirm it is blocked
6. Try a file over 50 MB and confirm browser blocks it
7. Confirm emails arrive at `contact@chiurciu.com`
8. Confirm Reply-To goes to the client email
9. Confirm private download link works
