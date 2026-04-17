<?php
// backend/api/auth.php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_GET['action'])) {
        $action = $_GET['action'];

        if ($action === 'register') {
            // Registration
            if (!isset($data->name) || !isset($data->email) || !isset($data->password)) {
                http_response_code(400);
                echo json_encode(['message' => 'Missing required fields']);
                exit;
            }

            $name = $data->name;
            $email = $data->email;
            $password = password_hash($data->password, PASSWORD_BCRYPT);

            try {
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
                $stmt->execute([$name, $email, $password]);
                echo json_encode(['message' => 'User registered successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) { // Duplicate entry
                    http_response_code(409);
                    echo json_encode(['message' => 'Email already exists']);
                } else {
                    http_response_code(500);
                    echo json_encode(['message' => 'Registration failed']);
                }
            }

        } elseif ($action === 'login') {
            // Login
            if (!isset($data->email) || !isset($data->password)) {
                http_response_code(400);
                echo json_encode(['message' => 'Missing email or password']);
                exit;
            }

            $email = $data->email;
            $password = $data->password;

            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                // Generate simple token (in real app, use JWT)
                // For this demo, we'll just return user info (WARNING: insecure for production)
                unset($user['password_hash']);
                echo json_encode([
                    'message' => 'Login successful',
                    'user' => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid credentials']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid action']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Action parameter required']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
?>