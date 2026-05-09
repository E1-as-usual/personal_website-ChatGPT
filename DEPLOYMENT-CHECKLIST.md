# Deployment checklist

## Current launch state

The live site is hosted on Namecheap cPanel in:

```text
/home/chiuatua/public_html/
```

The old root-level `areas/` and `portfolio/` folders were moved out of public use into:

```text
public_html/_legacy_unused/
```

The active bilingual pages are under:

```text
ro/
en/
```

The root `index.html` is visually empty. The real root redirect is handled by `.htaccess`.

## Redirects and HTTPS

`.htaccess` should:

- redirect the root domain directly to `/ro/` with HTTPS using `R=302` while launch decisions are still flexible;
- force HTTPS for all other requests;
- keep `form-action 'self'` in the Content Security Policy.

Expected tests:

```bash
curl -I http://chiurciu.com/
curl -I https://chiurciu.com/
curl -I https://chiurciu.com/ro/
```

Expected behavior:

```text
http://chiurciu.com/      -> redirect to HTTPS
https://chiurciu.com/     -> redirect to https://chiurciu.com/ro/
https://chiurciu.com/ro/  -> 200 OK
```

SSL was installed manually with Let’s Encrypt through `acme.sh` and cPanel `uapi`.

Renewal should be visible with:

```bash
crontab -l
```

Look for an `acme.sh --cron` entry.

## Contact mailbox

Create/use this mailbox in cPanel:

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

Current live terminal check showed these values, which are more than enough:

```text
upload_max_filesize = 1024M
post_max_size = 1024M
max_execution_time = 0
max_input_time = -1
memory_limit = 1024M
```

The site itself intentionally limits contact-form uploads to 50 MB total for launch stability.

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

Current launch behavior:

- all accepted uploads are stored privately;
- no files are sent as email attachments;
- the email contains private download links;
- the admin page lists uploaded files;
- each admin upload row includes download, view message, and delete actions;
- uploads expire after 14 days;
- over 50 MB total is blocked by the browser and server.

Private storage:

```text
private/uploads/
private/metadata/
```

Download links are routed through:

```text
download-file.php?token=...
```

The relevant source files are:

```text
send-contact.php
js/contact-upload.js
admin/index.php
```

Visible upload-limit text is in:

```text
js/contact-upload.js
```

Server upload-limit constant is in:

```text
send-contact.php
```

## Admin behavior

Admin is available at:

```text
/admin/
```

It currently supports:

- login using `private/admin-config.php`;
- newsletter subscriber list;
- subscriber CSV export;
- uploaded file list;
- uploaded file download;
- view associated sender/message for new uploads;
- delete individual uploads;
- clean expired uploads.

Older uploads may not show sender/message context because that metadata was added later.

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

Endpoint:

```text
/daily-quote.php
```

Expected behavior:

- returns JSON containing date and quote;
- one random quote is selected server-side per day;
- all visitors see the same daily quote;
- homepage quote fades in after loading.

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

Relevant source files:

```text
private/newsletter.php
subscribe-newsletter.php
unsubscribe-newsletter.php
admin/index.php
```

## Known issue

`public_html/cv.pdf` was observed as a 0-byte file. Upload a real CV PDF over it before relying on PDF links.

## Manual content editing

Manual edits after launch should usually be limited to:

```text
HTML text
images
data/quotes.json
js/portfolio-data.js
cv.pdf
```

Do not manually edit generated server files unless intentionally repairing data:

```text
private/daily-quote.json
private/newsletter-subscribers.json
private/uploads/
private/metadata/
```

Do not commit real config files:

```text
private/mail-config.php
private/admin-config.php
```

## Test after upload or source sync

1. Open `/ro/` and `/en/`.
2. Test header links from homepage, contact page, and a nested area page.
3. Test footer links from homepage, contact page, and a nested area page.
4. Open `/daily-quote.php` and confirm it returns JSON.
5. Open `/ro/contact.html` and `/en/contact.html`.
6. Send message without file.
7. Send message with a small file such as 4 MB.
8. Send message with a medium file such as 20–30 MB.
9. Try a file over 50 MB and confirm browser blocks it.
10. Try an invalid file format and confirm it is blocked.
11. Confirm emails arrive at `contact@chiurciu.com`.
12. Confirm Reply-To goes to the client email.
13. Confirm private download link works.
14. Confirm uploaded file appears in admin.
15. Confirm admin View message works for new uploads.
16. Confirm admin Delete removes a test upload.
17. Test newsletter signup in footer.
18. Test newsletter opt-in on contact form.
19. Export subscribers CSV from admin.
20. Run expired-upload cleanup from admin.
21. Run `crontab -l` and confirm `acme.sh --cron` exists.
