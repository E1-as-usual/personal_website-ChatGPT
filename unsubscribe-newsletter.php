<?php
require_once __DIR__ . '/private/newsletter.php';

$token = $_GET['token'] ?? '';
$ok = is_string($token) && newsletter_unsubscribe($token);
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Newsletter — Ioan Chiurciu</title>
    <link rel="stylesheet" href="/css/style.css" />
  </head>
  <body>
    <main>
      <section class="section-shell hero">
        <div class="hero-content reveal is-visible">
          <p class="eyebrow">Newsletter</p>
          <h1><?= $ok ? 'Unsubscribed' : 'Link unavailable' ?></h1>
          <p class="lead"><?= $ok ? 'You have been unsubscribed from occasional updates.' : 'This unsubscribe link is invalid or has already been changed.' ?></p>
          <div class="hero-actions">
            <a class="button button-secondary" href="/">Back to site</a>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
