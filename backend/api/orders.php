<?php
// backend/api/orders.php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Check for specific action (e.g. update status)
    if (isset($data->action) && $data->action === 'update_status') {
        if (!isset($data->id) || !isset($data->status)) {
            http_response_code(400);
            echo json_encode(['message' => 'Order ID and Status required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$data->status, $data->id]);
            echo json_encode(['message' => 'Order status updated successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status: ' . $e->getMessage()]);
        }
        exit;
    }

    // Default POST action: Create Order
    if (!isset($data->user_id) || !isset($data->items) || !isset($data->total_amount)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing order data']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Create Order
        $shipping = isset($data->shipping_info) ? json_encode($data->shipping_info) : '{}';
        $payment = isset($data->payment_info) ? json_encode($data->payment_info) : '{}';

        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, status, shipping_info, payment_info) VALUES (?, ?, 'pending', ?, ?)");
        $stmt->execute([$data->user_id, $data->total_amount, $shipping, $payment]);
        $order_id = $pdo->lastInsertId();

        // Create Order Items
        $stmt2 = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");

        foreach ($data->items as $item) {
            $stmt2->execute([$order_id, $item->product_id, $item->quantity, $item->price]);
        }

        $pdo->commit();

        echo json_encode(['message' => 'Order placed successfully', 'order_id' => $order_id]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Failed to place order: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch Orders for a User
    $userId = $_GET['user_id'] ?? null;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['message' => 'User ID required']);
        exit;
    }

    try {
        // Fetch Orders
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $orders = $stmt->fetchAll();

        // Fetch Items for each order
        foreach ($orders as &$order) {
            $order['shipping_info'] = json_decode($order['shipping_info']);
            $order['payment_info'] = json_decode($order['payment_info']);

            $stmtItems = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
            $stmtItems->execute([$order['id']]);
            $order['items'] = $stmtItems->fetchAll();
        }

        echo json_encode($orders);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to fetch orders: ' . $e->getMessage()]);
    }



} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
