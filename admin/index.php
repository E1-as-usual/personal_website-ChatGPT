<?php
session_start();

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

function read_jsonl(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $rows = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

    foreach ($lines as $line) {
        $item = json_decode($line, true);
        if (is_array($item)) {
            $rows[] = $item;
        }
    }

    return array_reverse($rows);
}

function read_upload_metadata(): array
{
    $dir = private_dir('metadata');

    if (!is_dir($dir)) {
        return [];
    }

    $rows = [];
    foreach (glob($dir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $file) {
        $item = json_decode(file_get_contents($file), true);
        if (is_array($item)) {
            $rows[] = $item;
        }
    }

    usort($rows, fn ($a, $b) => ($b['uploaded_at'] ?? 0) <=> ($a['uploaded_at'] ?? 0));
    return $rows;
}

$config = load_admin_config();
$error = '';

if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: /admin/');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (($config['username'] ?? '') !== '' && hash_equals($config['username'], $username) && password_verify($password, $config['password_hash'] ?? '')) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: /admin/');
        exit;
    }

    $error = 'Invalid username or password.';
}

$adminReady = !empty($config['username']) && !empty($config['password_hash']) && $config['password_hash'] !== 'REPLACE_WITH_PASSWORD_HASH';
$subscribers = is_logged_in() ? read_jsonl(private_dir('newsletter-subscribers.jsonl')) : [];
$uploads = is_logged_in() ? read_upload_metadata() : [];
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Admin — Ioan Chiurciu</title>
    <link rel="stylesheet" href="/css/style.css" />
    <style>
      .admin-shell { width: min(100%, 1100px); margin: 0 auto; padding: var(--space-xl) var(--space-md) var(--space-2xl); }
      .admin-card { border: 1px solid var(--color-line); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: 0 18px 44px var(--color-shadow); padding: var(--space-lg); margin-bottom: var(--space-md); }
      .admin-form { display: grid; gap: var(--space-md); max-width: 420px; }
      .admin-form label { display: grid; gap: var(--space-xs); color: var(--color-muted); }
      .admin-form input { width: 100%; border: 1px solid var(--color-line); border-radius: var(--radius-md); background: #fffdf8; color: var(--color-text); font: inherit; padding: 0.75rem 0.85rem; }
      .admin-table-wrap { overflow-x: auto; }
      .admin-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
      .admin-table th, .admin-table td { border-top: 1px solid var(--color-line); padding: 0.75rem 0.45rem; text-align: left; vertical-align: top; }
      .admin-muted { color: var(--color-muted); }
      .admin-top { display: flex; justify-content: space-between; gap: var(--space-md); align-items: center; }
    </style>
  </head>
  <body>
    <main class="admin-shell">
      <div class="admin-top">
        <div>
          <p class="eyebrow">Private</p>
          <h1>Admin</h1>
        </div>
        <?php if (is_logged_in()): ?><a class="button button-secondary" href="/admin/?logout=1">Log out</a><?php endif; ?>
      </div>

      <?php if (!$adminReady): ?>
        <section class="admin-card">
          <h2>Admin is not configured yet.</h2>
          <p class="admin-muted">Create <code>private/admin-config.php</code> from <code>private/admin-config.example.php</code> on the server and add a real password hash.</p>
        </section>
      <?php elseif (!is_logged_in()): ?>
        <section class="admin-card">
          <h2>Log in</h2>
          <?php if ($error): ?><p class="admin-muted"><?= h($error) ?></p><?php endif; ?>
          <form class="admin-form" method="post">
            <label>Username<input type="text" name="username" autocomplete="username" required /></label>
            <label>Password<input type="password" name="password" autocomplete="current-password" required /></label>
            <button class="button" type="submit">Log in</button>
          </form>
        </section>
      <?php else: ?>
        <section class="admin-card">
          <h2>Newsletter subscribers</h2>
          <p class="admin-muted"><?= count($subscribers) ?> saved opt-in<?= count($subscribers) === 1 ? '' : 's' ?>.</p>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>Email</th><th>Name</th><th>Language</th><th>Source</th><th>Subscribed</th></tr></thead>
              <tbody>
                <?php if (!$subscribers): ?><tr><td colspan="5" class="admin-muted">No subscribers yet.</td></tr><?php endif; ?>
                <?php foreach ($subscribers as $subscriber): ?>
                  <tr>
                    <td><?= h($subscriber['email'] ?? '') ?></td>
                    <td><?= h($subscriber['name'] ?? '') ?></td>
                    <td><?= h($subscriber['lang'] ?? '') ?></td>
                    <td><?= h($subscriber['source'] ?? '') ?></td>
                    <td><?= h($subscriber['subscribed_at'] ?? '') ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </section>

        <section class="admin-card">
          <h2>Uploaded files</h2>
          <p class="admin-muted"><?= count($uploads) ?> private upload<?= count($uploads) === 1 ? '' : 's' ?> currently tracked.</p>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>File</th><th>Size</th><th>Uploaded</th><th>Expires</th><th>Link</th></tr></thead>
              <tbody>
                <?php if (!$uploads): ?><tr><td colspan="5" class="admin-muted">No uploaded files yet.</td></tr><?php endif; ?>
                <?php foreach ($uploads as $upload): ?>
                  <tr>
                    <td><?= h($upload['original_name'] ?? '') ?></td>
                    <td><?= isset($upload['size']) ? h(round(((int) $upload['size']) / 1024 / 1024, 1) . ' MB') : '' ?></td>
                    <td><?= !empty($upload['uploaded_at']) ? h(date('Y-m-d H:i', (int) $upload['uploaded_at'])) : '' ?></td>
                    <td><?= !empty($upload['expires_at']) ? h(date('Y-m-d H:i', (int) $upload['expires_at'])) : '' ?></td>
                    <td><?php if (!empty($upload['token'])): ?><a href="/download-file.php?token=<?= h($upload['token']) ?>">Download</a><?php endif; ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </section>

        <section class="admin-card">
          <h2>Future editors</h2>
          <p class="admin-muted">Quote manager and portfolio editor are intentionally not active yet. They should be added only after the admin login and file upload flow are tested on cPanel.</p>
        </section>
      <?php endif; ?>
    </main>
  </body>
</html>
