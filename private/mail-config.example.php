<?php
/*
  Copy this file to:
  private/mail-config.php

  Then replace the placeholder values with the SMTP settings from cPanel.
  Do not expose the real password in public pages, JavaScript, or GitHub if the repository is public.
*/

return [
    'smtp_host' => 'mail.chiurciu.com',
    'smtp_user' => 'contact@chiurciu.com',
    'smtp_pass' => 'REPLACE_WITH_MAILBOX_PASSWORD',
    'smtp_port' => 587,
    'smtp_secure' => 'tls',
    'from_email' => 'contact@chiurciu.com',
    'from_name' => 'Ioan Chiurciu Website',
    'to_email' => 'contact@chiurciu.com',
];
