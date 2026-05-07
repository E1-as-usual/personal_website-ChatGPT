<?php
/*
  Copy this file to:
  private/mail-config.php

  Then replace the placeholder password with the SMTP password for website@chiurciu.com.
  Keep the real password only on the cPanel server, not in public HTML, JavaScript, or a public GitHub repository.

  Recommended mailbox setup:
  - SMTP sender/login: website@chiurciu.com
  - Messages delivered to: contact@chiurciu.com
  - Reply-To is automatically set to the client's email from the form.
*/

return [
    'smtp_host' => 'mail.chiurciu.com',
    'smtp_user' => 'website@chiurciu.com',
    'smtp_pass' => 'REPLACE_WITH_WEBSITE_MAILBOX_PASSWORD',
    'smtp_port' => 587,
    'smtp_secure' => 'tls',
    'from_email' => 'website@chiurciu.com',
    'from_name' => 'Ioan Chiurciu Website',
    'to_email' => 'contact@chiurciu.com',
];
