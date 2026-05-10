<?php
/*
  Contact form handler for chiurciu.com.

  Launch behavior:
  - Validates text fields and honeypot spam field.
  - Accepts optional files only in strict allowed formats.
  - Stores uploads privately and sends secure download links by email.
  - Stores contact context with upload metadata for admin review.
  - Stores explicit newsletter opt-ins using private/newsletter.php.
  - Uses PHPMailer + authenticated SMTP when configured.
  - Falls back to PHP mail() only when SMTP is not configured.
*/

require_once __DIR__ . '/private/newsletter.php';

const CONTACT_TO = 'contact@chiurciu.com';
const CONTACT_FROM = 'website@chiurciu.com';
const MAX_FIELD_LENGTH = 4000;
const STORED_LINK_LIMIT_BYTES = 52428800;
const DOWNLOAD_TOKEN_BYTES = 24;
const DOWNLOAD_EXPIRY_DAYS = 30;

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

/* remainder unchanged */
