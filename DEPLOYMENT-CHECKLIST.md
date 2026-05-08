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

## Admin config

On the cPanel server, copy:

```text
private/admin-config.example.php
```

to:

```text
private/admin-config.php
```

Generate a password hash with:

```bash
php -r "echo password_hash('YOUR_ADMIN_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
```

Then paste the hash into `private/admin-config.php`.

Admin URL:

```text
/admin/
```

Do not commit `private/admin-config.php` to GitHub.

## PHP / cPanel requirements

Use PHP 7.4 or newer. PHP 8.x is preferred.

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

## Required root PHP routes

These files must stay in the website root, directly inside `public_html/`:

```text
send-contact.php
daily-quote.php
subscribe-newsletter.php
unsubscribe-newsletter.php
download-file.php
```

The admin dashboard folder must also be uploaded:

```text
admin/
```

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

## Daily quote behavior

Quotes are edited in:

```text
data/quotes.json
```

The server stores the selected daily quote in:

```text
private/daily-quote.json
```

That file is generated automatically and should not be committed to Git.

## Newsletter behavior

Subscribers are stored in:

```text
private/newsletter-subscribers.json
```

That file is generated automatically and should not be committed to Git.

Subscribers can be exported from:

```text
/admin/
```

## Test after upload

1. Open `/ro/` and `/en/`
2. Test header links from homepage, contact page, and a nested area page
3. Test footer links from homepage, contact page, and a nested area page
4. Open `/daily-quote.php` and confirm it returns JSON
5. Open `/ro/contact.html`
6. Send message without file
7. Send message with a small file under 15 MB
8. Send message with a medium file over 15 MB but under 50 MB
9. Try an invalid file format and confirm it is blocked
10. Try a file over 50 MB and confirm browser blocks it
11. Confirm emails arrive at `contact@chiurciu.com`
12. Confirm Reply-To goes to the client email
13. Confirm private download link works
14. Test newsletter signup in footer
15. Test newsletter opt-in on contact form
16. Open `/admin/` and test login
17. Export subscribers CSV from admin
18. Run expired-upload cleanup from admin
