<?php
session_start();
require_once dirname(__DIR__) . '/private/newsletter.php';

function private_dir(string $subdir = ''): string
{
    $base = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'private';
    return $subdir === '' ? $base : $base . DIRECTORY_SEPARATOR . $subdir;
}

function load_admin_config(): array
{
    $path = private_dir('admin-config.php');

    if (is_file($path)) {
        $config = require $path;
        return is_array($config) ? $config : [];
    }

    return [];
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function is_logged_in(): bool
{
    return !empty($_SESSION['admin_logged_in']);
}

$config = load_admin_config();
$adminReady = !empty($config['username']) && !empty($config['password_hash']);

if (!$adminReady || !is_logged_in()) {
    header('Location: /admin/');
    exit;
}

$notice = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete-subscriber') {
    $deleted = newsletter_delete_subscriber($_POST['email'] ?? '');
    $notice = $deleted ? 'Subscriber deleted.' : 'Subscriber could not be deleted.';
}

$subscribers = newsletter_load_subscribers();
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Newsletter admin</title>
    <link rel="stylesheet" href="/css/style.css" />
    <style>
      .admin-shell { width: min(100%, 1200px); margin: 0 auto; padding: 2rem; }
      .admin-card { border: 1px solid var(--color-line); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1rem; background: var(--color-surface); }
      .admin-table { width: 100%; border-collapse: collapse; }
      .admin-table th, .admin-table td { padding: 0.75rem 0.5rem; border-top: 1px solid var(--color-line); text-align: left; }
      .admin-link-button { border: 0; background: none; color: #8b3d14; cursor: pointer; text-decoration: underline; font: inherit; }
    </style>
  </head>
  <body>
    <main class="admin-shell">
      <section class="admin-card">
        <p class="eyebrow">Newsletter</p>
        <h1>Subscriber management</h1>
        <p><a class="button button-secondary" href="/admin/">Back to dashboard</a></p>
      </section>

      <?php if ($notice): ?>
        <section class="admin-card">
          <p><?= h($notice) ?></p>
        </section>
      <?php endif; ?>

      <section class="admin-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Subscribed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($subscribers as $subscriber): ?>
              <tr>
                <td><?= h($subscriber['email'] ?? '') ?></td>
                <td><?= h($subscriber['name'] ?? '') ?></td>
                <td><?= h($subscriber['status'] ?? 'subscribed') ?></td>
                <td><?= h($subscriber['subscribed_at'] ?? '') ?></td>
                <td>
                  <form method="post" onsubmit="return confirm('Delete this subscriber permanently?');">
                    <input type="hidden" name="action" value="delete-subscriber">
                    <input type="hidden" name="email" value="<?= h($subscriber['email'] ?? '') ?>">
                    <button class="admin-link-button" type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>
    </main>
  </body>
</html>
