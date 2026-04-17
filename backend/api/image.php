<?php
require_once 'config.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(404);
    exit;
}

$stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product || empty($product['image_url'])) {
    http_response_code(404);
    exit;
}

$img = $product['image_url'];

if (strpos($img, 'data:image') === 0) {
    list($type, $data) = explode(';', $img);
    list(, $data)      = explode(',', $data);
    $data = base64_decode($data);
    
    $mime = str_replace('data:', '', $type);
    header("Content-Type: $mime");
    header("Cache-Control: public, max-age=86400");
    echo $data;
} else {
    // If it's a relative path like 'assets/image.png'
    header("Location: /" . ltrim($img, '/'));
}
