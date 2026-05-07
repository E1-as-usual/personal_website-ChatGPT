<?php
/*
  Copy this file to private/admin-config.php on the cPanel server.
  Replace the password hash with your own generated hash.

  Generate a hash with:
  php -r "echo password_hash('YOUR_ADMIN_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"

  Do not commit private/admin-config.php to GitHub.
*/

return [
    'username' => 'admin',
    'password_hash' => 'REPLACE_WITH_PASSWORD_HASH',
];
