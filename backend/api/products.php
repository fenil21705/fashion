<?php
// backend/api/products.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    case 'OPTIONS':
        http_response_code(200);
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}

function handleGet($pdo)
{
    try {
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();

            if ($product) {
                // Decode JSON fields
                $product['images'] = json_decode($product['images'] ?? '[]');
                $product['sizes'] = json_decode($product['sizes'] ?? '[]');
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Product not found']);
            }
        } else {
            $sql = "SELECT * FROM products";
            $params = [];

            if (isset($_GET['category'])) {
                $sql .= " WHERE category = ? OR gender = ?";
                $params[] = $_GET['category'];
                $params[] = $_GET['category'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll();

            // Decode JSON fields for all
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]');
                $p['sizes'] = json_decode($p['sizes'] ?? '[]');
            }

            echo json_encode($products);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server Error: ' . $e->getMessage()]);
    }
}

function handlePost($pdo)
{
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['name']) || !isset($data['price'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $images = isset($data['images']) ? json_encode($data['images']) : '[]';
        $sizes = isset($data['sizes']) ? json_encode($data['sizes']) : '[]';
        $mainImage = (isset($data['images']) && count($data['images']) > 0) ? $data['images'][0] : 'assets/placeholder.png';

        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, category, gender, image_url, images, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['price'],
            $data['category'] ?? 'Unisex',
            $data['gender'] ?? 'Unisex',
            $mainImage,
            $images,
            $sizes
        ]);

        $id = $pdo->lastInsertId();
        http_response_code(201);
        echo json_encode(['message' => 'Product created', 'id' => $id]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
}

function handlePut($pdo)
{
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID required']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Build dynamic update query
        $fields = [];
        $params = [];

        if (isset($data['name'])) {
            $fields[] = 'name = ?';
            $params[] = $data['name'];
        }
        if (isset($data['description'])) {
            $fields[] = 'description = ?';
            $params[] = $data['description'];
        }
        if (isset($data['price'])) {
            $fields[] = 'price = ?';
            $params[] = $data['price'];
        }
        if (isset($data['category'])) {
            $fields[] = 'category = ?';
            $params[] = $data['category'];
        }
        if (isset($data['gender'])) {
            $fields[] = 'gender = ?';
            $params[] = $data['gender'];
        }

        if (isset($data['images'])) {
            $fields[] = 'images = ?';
            $params[] = json_encode($data['images']);

            // Also update main image if images changed
            if (count($data['images']) > 0) {
                $fields[] = 'image_url = ?';
                $params[] = $data['images'][0];
            }
        }

        if (isset($data['sizes'])) {
            $fields[] = 'sizes = ?';
            $params[] = json_encode($data['sizes']);
        }

        if (empty($fields)) {
            echo json_encode(['message' => 'No fields to update']);
            return;
        }

        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
        $params[] = $id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['message' => 'Product updated']);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleDelete($pdo)
{
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID required']);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['message' => 'Product deleted']);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
}
