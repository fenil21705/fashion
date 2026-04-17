<?php
// backend/api/admin.php
require_once 'config.php';

// Simple Authentication
$pass = $_GET['password'] ?? '';
if ($pass !== 'admin') {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit();
}

try {
    // 1. Fetch Users
    $stmtUsers = $pdo->query("SELECT id, name, email FROM users");
    $users = $stmtUsers->fetchAll();

    // 2. Fetch Orders
    $stmtOrders = $pdo->query("SELECT * FROM orders"); // shipping_info and payment_info are JSON/Text
    $orders = $stmtOrders->fetchAll();

    // 3. Attach Items to Orders
    foreach ($orders as &$order) {
        // Decode JSON fields
        $order['shipping_info'] = json_decode($order['shipping_info'] ?? '{}');
        $order['payment_info'] = json_decode($order['payment_info'] ?? '{}');

        // Fetch Items
        $stmtItems = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$order['id']]);
        $order['items'] = $stmtItems->fetchAll();
    }

    echo json_encode([
        'users' => $users,
        'orders' => $orders
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Server Error: ' . $e->getMessage()]);
}
