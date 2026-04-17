const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const DB_FILE = path.join(__dirname, 'database.json');

// Helper to load data
function loadData() {
    if (fs.existsSync(DB_FILE)) {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (!data.products) data.products = [];
        return data;
    }
    return { users: [], orders: [], products: [] };
}

// Helper to save data
function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Load initial data
let db = loadData();
let USERS = db.users;
let ORDERS = db.orders;
let PRODUCTS = db.products || [];

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle API Mocks
    if (req.url.includes('/backend/api/')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
        }

        if (req.url.includes('products.php')) {
            const url = new URL(req.url, `http://localhost:${PORT}`);

            // GET
            if (req.method === 'GET') {
                const id = url.searchParams.get('id');
                const cat = url.searchParams.get('category');

                if (id) {
                    const product = PRODUCTS.find(p => p.id == id);
                    if (product) return res.end(JSON.stringify(product));
                    res.statusCode = 404;
                    return res.end(JSON.stringify({ message: 'Not found' }));
                }
                if (cat) {
                    const filtered = PRODUCTS.filter(p => p.category === cat || p.gender === cat);
                    return res.end(JSON.stringify(filtered));
                }
                return res.end(JSON.stringify(PRODUCTS));
            }

            // POST (Add)
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        if (!data.name || !data.price || !data.category) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ message: 'Missing required fields' }));
                        }

                        const newProduct = {
                            id: PRODUCTS.length > 0 ? Math.max(...PRODUCTS.map(p => p.id)) + 1 : 1,
                            name: data.name,
                            category: data.category,
                            gender: data.gender || 'Unisex',
                            price: parseFloat(data.price),
                            image_url: (data.images && data.images.length > 0) ? data.images[0] : 'assets/placeholder.png', // Main image
                            images: data.images || [],
                            sizes: data.sizes || [],
                            description: data.description || 'No description provided.'
                        };

                        PRODUCTS.push(newProduct);

                        // Save to DB
                        db.products = PRODUCTS;
                        saveData(db);

                        res.statusCode = 201;
                        return res.end(JSON.stringify({ message: 'Product added successfully', product: newProduct }));
                    } catch (e) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ message: 'Invalid JSON' }));
                    }
                });
                return;
            }

            // PUT (Update)
            if (req.method === 'PUT') {
                const id = url.searchParams.get('id');
                if (!id) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ message: 'ID required for update' }));
                }

                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        const index = PRODUCTS.findIndex(p => p.id == id);

                        if (index === -1) {
                            res.statusCode = 404;
                            return res.end(JSON.stringify({ message: 'Product not found' }));
                        }

                        // Update fields
                        PRODUCTS[index] = {
                            ...PRODUCTS[index],
                            ...data,
                            id: parseInt(id) // Ensure ID remains integer
                        };

                        // Update image_url if images provided
                        if (data.images && data.images.length > 0) {
                            PRODUCTS[index].image_url = data.images[0];
                        }

                        // Ensure price is float
                        if (data.price) PRODUCTS[index].price = parseFloat(data.price);

                        // Save to DB
                        db.products = PRODUCTS;
                        saveData(db);

                        return res.end(JSON.stringify({ message: 'Product updated successfully', product: PRODUCTS[index] }));
                    } catch (e) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ message: 'Invalid JSON' }));
                    }
                });
                return;
            }

            // DELETE
            if (req.method === 'DELETE') {
                const id = url.searchParams.get('id');
                if (!id) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ message: 'ID required' }));
                }

                const initialLength = PRODUCTS.length;
                PRODUCTS = PRODUCTS.filter(p => p.id != id);

                if (PRODUCTS.length === initialLength) {
                    res.statusCode = 404;
                    return res.end(JSON.stringify({ message: 'Product not found' }));
                }

                db.products = PRODUCTS;
                saveData(db);
                return res.end(JSON.stringify({ message: 'Product deleted' }));
            }
        }

        if (req.url.includes('auth.php')) {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const data = JSON.parse(body || '{}');
                const url = new URL(req.url, `http://localhost:${PORT}`);
                const action = url.searchParams.get('action');

                if (req.method === 'POST') {
                    if (action === 'register') {
                        if (!data.email || !data.password || !data.name) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ message: 'Missing fields' }));
                        }
                        const existing = USERS.find(u => u.email === data.email);
                        if (existing) {
                            res.statusCode = 409;
                            return res.end(JSON.stringify({ message: 'Email already exists' }));
                        }
                        const newUser = { id: USERS.length + 1, name: data.name, email: data.email, password: data.password };
                        USERS.push(newUser);
                        saveData({ users: USERS, orders: ORDERS });
                        return res.end(JSON.stringify({ message: 'User registered successfully' }));
                    }

                    if (action === 'login') {
                        const user = USERS.find(u => u.email === data.email && u.password === data.password);
                        if (user) {
                            const { password, ...safeUser } = user;
                            return res.end(JSON.stringify({
                                message: 'Login successful',
                                user: safeUser
                            }));
                        }
                        res.statusCode = 401;
                        return res.end(JSON.stringify({ message: 'Invalid credentials' }));
                    }
                }
                return res.end(JSON.stringify({ message: 'Invalid request' }));
            });
            return; // Handle async response
        }

        if (req.url.includes('orders.php')) {
            // ... (keep existing orders logic) ...
            if (req.method === 'POST') {
                // ... (existing POST logic) ...
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    const data = JSON.parse(body || '{}');
                    const newOrder = {
                        id: ORDERS.length + 1,
                        user_id: data.user_id,
                        shipping_info: data.shipping_info,
                        payment_info: data.payment_info,
                        total_amount: data.total_amount,
                        items: data.items,
                        date: new Date().toLocaleDateString()
                    };
                    ORDERS.push(newOrder);
                    saveData({ users: USERS, orders: ORDERS });

                    // Simulate Email Sending
                    console.log(`\n--- [SIMULATION] Sending Email ---`);
                    console.log(`To: ${data.email} (User ID: ${data.user_id})`);
                    console.log(`Subject: Order Confirmation #${newOrder.id}`);
                    console.log(`Body: Thank you for your order! Total: ${data.total_amount}`);
                    console.log(`--- Email Sent Successfully ---\n`);

                    return res.end(JSON.stringify({
                        message: 'Order placed successfully',
                        order_id: newOrder.id
                    }));
                });
                return;
            }
            if (req.method === 'GET') {
                const url = new URL(req.url, `http://localhost:${PORT}`);
                const userId = url.searchParams.get('user_id');
                if (userId) {
                    const userOrders = ORDERS.filter(o => o.user_id == userId);
                    return res.end(JSON.stringify(userOrders));
                }
                return res.end(JSON.stringify([]));
            }
        }

        if (req.url.includes('admin.php')) {
            const url = new URL(req.url, `http://localhost:${PORT}`);
            const pass = url.searchParams.get('password');

            if (pass === 'admin') {
                return res.end(JSON.stringify({
                    users: USERS,
                    orders: ORDERS
                }));
            } else {
                res.statusCode = 401;
                return res.end(JSON.stringify({ message: 'Unauthorized' }));
            }
        }

        return res.end(JSON.stringify({ message: 'Mock API endpoint' }));
    }

    // Serve Static Files
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    // Remove query params from file path
    filePath = filePath.split('?')[0];

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('NOTE: This is a Node.js mock server because PHP was not found.');
    console.log('API endpoints are simulated.');
});
