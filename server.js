const express = require('express');
const path = require('path');
const { db, initSchema } = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ── Record catalog data ─────────────────────────────────────────────
const records = [
  {
    id: 1,
    title: 'Midnight in Tokyo',
    artist: 'Neon Drift',
    genre: 'Synthwave',
    year: 2023,
    price: 28.99,
    rating: 4.8,
    stock: 12,
    cover: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    accent: '#7f5af0',
    description: 'A shimmering journey through neon-lit streets. Analog synths meet digital precision in this late-night masterpiece.',
  },
  {
    id: 2,
    title: 'Coastal Frequencies',
    artist: 'The Wave Function',
    genre: 'Ambient',
    year: 2024,
    price: 24.99,
    rating: 4.5,
    stock: 8,
    cover: 'linear-gradient(135deg, #0a4b3e, #1a8870, #43cea2)',
    accent: '#43cea2',
    description: 'Field recordings from Pacific tide pools layered over warm pads and gentle arpeggios. Best experienced with headphones.',
  },
  {
    id: 3,
    title: 'Rust Belt Sessions',
    artist: 'Iron & Ember',
    genre: 'Blues Rock',
    year: 2022,
    price: 31.99,
    rating: 4.9,
    stock: 5,
    cover: 'linear-gradient(135deg, #3d1c02, #b44b1c, #e67e22)',
    accent: '#e67e22',
    description: 'Raw, unfiltered blues recorded live in a converted Detroit foundry. You can hear the room breathe on every track.',
  },
  {
    id: 4,
    title: 'Algorithm Garden',
    artist: 'Modular Dreams',
    genre: 'Electronic',
    year: 2024,
    price: 26.99,
    rating: 4.3,
    stock: 15,
    cover: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    accent: '#e94560',
    description: 'Generative compositions from a custom Eurorack system. Each pressing has a unique etching on the B-side runout.',
  },
  {
    id: 5,
    title: 'Sunday Morning Ritual',
    artist: 'Slow Pour',
    genre: 'Jazz',
    year: 2023,
    price: 29.99,
    rating: 4.7,
    stock: 3,
    cover: 'linear-gradient(135deg, #2c1810, #5d4037, #8d6e63)',
    accent: '#d4a574',
    description: 'Warm trio recordings — upright bass, brushed drums, and a slightly out-of-tune upright piano. Intentionally perfect.',
  },
  {
    id: 6,
    title: 'Post Office',
    artist: 'Letter Jacket',
    genre: 'Indie Rock',
    year: 2024,
    price: 23.99,
    rating: 4.4,
    stock: 20,
    cover: 'linear-gradient(135deg, #1b0a2e, #4a1942, #c2185b)',
    accent: '#f48fb1',
    description: 'Jangly guitars and confessional lyrics about the mundane magic of everyday life. The closer will make you cry.',
  },
  {
    id: 7,
    title: 'Permafrost',
    artist: 'Arctic Signal',
    genre: 'Post-Rock',
    year: 2023,
    price: 34.99,
    rating: 4.6,
    stock: 7,
    cover: 'linear-gradient(135deg, #d4e4ed, #8fb8d0, #5a8fa8)',
    accent: '#5a8fa8',
    description: 'Glacial builds and devastating crescendos. A double LP pressed on translucent ice-blue vinyl with a gatefold sleeve.',
  },
  {
    id: 8,
    title: 'Cassette Dreams',
    artist: 'Tape Hiss Collective',
    genre: 'Lo-fi',
    year: 2024,
    price: 19.99,
    rating: 4.2,
    stock: 25,
    cover: 'linear-gradient(135deg, #4a3728, #6d5c4e, #a89076)',
    accent: '#c8a882',
    description: 'Recorded entirely on a 4-track cassette recorder found at a yard sale. Includes a zine with hand-drawn liner notes.',
  },
  {
    id: 9,
    title: 'MultiStep API Checks',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 29.99,
    rating: 4.9,
    stock: 100,
    cover: 'linear-gradient(135deg, #6c5ce7, #a29bfe, #74b9ff)',
    accent: '#6c5ce7',
    icon: '🔗',
    description: 'Chain multiple API requests together with assertions and data passing. Perfect for complex workflow monitoring.',
  },
  {
    id: 10,
    title: 'Browser Checks',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 34.99,
    rating: 4.9,
    stock: 100,
    cover: 'linear-gradient(135deg, #0984e3, #74b9ff, #a29bfe)',
    accent: '#0984e3',
    icon: '🌐',
    description: 'Headless browser monitoring with real Chromium. Click, type, and validate just like your users do.',
  },
  {
    id: 11,
    title: 'Playwright Check Suites',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 39.99,
    rating: 5.0,
    stock: 100,
    cover: 'linear-gradient(135deg, #00b894, #55efc4, #81ecec)',
    accent: '#00b894',
    icon: '🎭',
    description: 'Run your existing Playwright tests as monitoring checks. Deploy from CLI, get alerts when they fail.',
  },
  {
    id: 12,
    title: 'TCP Monitors',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 19.99,
    rating: 4.6,
    stock: 100,
    cover: 'linear-gradient(135deg, #2d3436, #636e72, #b2bec3)',
    accent: '#636e72',
    icon: '🔌',
    description: 'Low-level TCP connection monitoring. Check if ports are open and responding from multiple locations.',
  },
  {
    id: 13,
    title: 'API Checks',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 24.99,
    rating: 4.8,
    stock: 100,
    cover: 'linear-gradient(135deg, #fd79a8, #fdcb6e, #e17055)',
    accent: '#fd79a8',
    icon: '⚡',
    description: 'Simple HTTP/HTTPS endpoint monitoring with assertions. Status codes, headers, JSON validation, and more.',
  },
  {
    id: 14,
    title: 'URL Monitors',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 22.99,
    rating: 4.7,
    stock: 100,
    cover: 'linear-gradient(135deg, #fab1a0, #ff7675, #d63031)',
    accent: '#ff7675',
    icon: '🔗',
    description: 'Quick uptime monitoring for your URLs. Get alerted when your site goes down, anywhere in the world.',
  },
  {
    id: 15,
    title: 'ICMP Monitors',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 18.99,
    rating: 4.5,
    stock: 100,
    cover: 'linear-gradient(135deg, #00cec9, #81ecec, #74b9ff)',
    accent: '#00cec9',
    icon: '📡',
    badge: 'NEW',
    description: 'Classic ping monitoring using ICMP. Check network reachability and latency from global locations.',
  },
  {
    id: 16,
    title: 'DNS Monitor',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 21.99,
    rating: 4.6,
    stock: 100,
    cover: 'linear-gradient(135deg, #a29bfe, #6c5ce7, #5f27cd)',
    accent: '#6c5ce7',
    icon: '🌍',
    description: 'Monitor DNS resolution and validate records. A, AAAA, CNAME, MX, TXT - track them all globally.',
  },
  {
    id: 17,
    title: 'Heartbeat Monitor',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 23.99,
    rating: 4.7,
    stock: 100,
    cover: 'linear-gradient(135deg, #ff6b6b, #ee5a6f, #c44569)',
    accent: '#ff6b6b',
    icon: '💓',
    description: 'Dead man switch monitoring. Your cron jobs and scheduled tasks ping us - we alert when they don\'t.',
  },
  {
    id: 18,
    title: 'Status Page',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 27.99,
    rating: 4.8,
    stock: 100,
    cover: 'linear-gradient(135deg, #4834d4, #686de0, #30336b)',
    accent: '#686de0',
    icon: '📊',
    description: 'Beautiful public or private status pages. Show real-time monitoring data to your users automatically.',
  },
  {
    id: 19,
    title: 'Rocky AI',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 44.99,
    rating: 5.0,
    stock: 100,
    cover: 'linear-gradient(135deg, #f093fb, #f5576c, #4facfe)',
    accent: '#f5576c',
    icon: '🤖',
    description: 'AI-powered test generation and debugging. Rocky writes Playwright tests, explains failures, and suggests fixes.',
  },
  {
    id: 20,
    title: 'OpenTelemetry Traces',
    artist: 'Checkly',
    genre: 'Monitoring',
    year: 2025,
    price: 36.99,
    rating: 4.9,
    stock: 100,
    cover: 'linear-gradient(135deg, #fa8231, #f77062, #fe5196)',
    accent: '#fa8231',
    icon: '🔍',
    description: 'Full distributed tracing integration. Connect your synthetic monitoring to backend traces for complete visibility.',
  },
];

// ── Async init: schema + seed inventory ─────────────────────────────
const ready = (async () => {
  await initSchema();
  const seedStmts = records.map((r) => ({
    sql: 'INSERT OR IGNORE INTO inventory (record_id, stock) VALUES (?, ?)',
    args: [r.id, r.stock],
  }));
  await db.batch(seedStmts, 'write');
})();

// Wait for init before handling any request
app.use((req, res, next) => {
  ready.then(() => next()).catch(next);
});

// ── API Routes ──────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// List all records
app.get('/api/records', async (req, res) => {
  const { q, genre, sort } = req.query;

  let results = [...records];

  // Search filter
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.artist.toLowerCase().includes(query) ||
        r.genre.toLowerCase().includes(query)
    );
  }

  // Genre filter
  if (genre) {
    results = results.filter(
      (r) => r.genre.toLowerCase() === genre.toLowerCase()
    );
  }

  // Sort
  if (sort === 'price-asc') results.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') results.sort((a, b) => b.price - a.price);
  if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  if (sort === 'newest') results.sort((a, b) => b.year - a.year);

  // Merge live stock from DB
  const { rows: stockRows } = await db.execute({ sql: 'SELECT record_id, stock FROM inventory', args: [] });
  const stockMap = Object.fromEntries(stockRows.map((r) => [r.record_id, r.stock]));
  const withStock = results.map((r) => ({ ...r, stock: stockMap[r.id] ?? r.stock }));
  res.json({ data: withStock, meta: { total: withStock.length } });
});

// Get single record
app.get('/api/records/:id', async (req, res) => {
  const record = records.find((r) => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const { rows } = await db.execute({ sql: 'SELECT stock FROM inventory WHERE record_id = ?', args: [record.id] });
  const inv = rows[0];
  res.json({ ...record, stock: inv ? inv.stock : record.stock });
});

// Get genres
app.get('/api/genres', (req, res) => {
  const genres = [...new Set(records.map((r) => r.genre))].sort();
  res.json(genres);
});

// ── Cart (persisted in DB for serverless compatibility) ─────────────

app.get('/api/cart', async (req, res) => {
  const { rows: cartRows } = await db.execute({ sql: 'SELECT record_id, quantity FROM cart', args: [] });
  const items = cartRows.map((row) => {
    const record = records.find((r) => r.id === row.record_id);
    return { recordId: row.record_id, quantity: row.quantity, record };
  });
  const total = items.reduce(
    (sum, item) => sum + (item.record?.price ?? 0) * item.quantity,
    0
  );
  res.json({ items, total: Math.round(total * 100) / 100, count: items.length });
});

app.post('/api/cart', async (req, res) => {
  const { recordId, quantity = 1 } = req.body;
  const record = records.find((r) => r.id === recordId);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }

  await db.execute({
    sql: `INSERT INTO cart (record_id, quantity) VALUES (?, ?)
          ON CONFLICT(record_id) DO UPDATE SET quantity = quantity + excluded.quantity`,
    args: [recordId, quantity],
  });

  res.status(201).json({ message: 'Added to cart', recordId, quantity });
});

app.delete('/api/cart', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM cart', args: [] });
  res.json({ message: 'Cart cleared' });
});

// ── Checkout ─────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  try {
    const { name, email, address } = req.body || {};
    if (!name || !email || !address) {
      return res.status(400).json({ error: 'Name, email, and shipping address are required' });
    }

    // Read cart
    const { rows: cartItems } = await db.execute({ sql: 'SELECT record_id, quantity FROM cart', args: [] });
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate stock and build order
    const orderItems = [];
    let total = 0;

    for (const item of cartItems) {
      const record = records.find((r) => r.id === item.record_id);
      if (!record) throw new Error(`Record ${item.record_id} not found`);

      const { rows } = await db.execute({ sql: 'SELECT stock FROM inventory WHERE record_id = ?', args: [item.record_id] });
      const inv = rows[0];
      if (!inv || inv.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${record.title}"`);
      }

      orderItems.push({ recordId: item.record_id, title: record.title, quantity: item.quantity, price: record.price });
      total += record.price * item.quantity;
    }

    total = Math.round(total * 100) / 100;
    const customer = { name, email, address };

    // Atomic write: decrement stock, insert order, clear cart
    const writeStmts = cartItems.map((item) => ({
      sql: 'UPDATE inventory SET stock = stock - ? WHERE record_id = ?',
      args: [item.quantity, item.record_id],
    }));
    writeStmts.push({
      sql: 'INSERT INTO orders (items, total, status, customer) VALUES (?, ?, ?, ?)',
      args: [JSON.stringify(orderItems), total, 'confirmed', JSON.stringify(customer)],
    });
    writeStmts.push({ sql: 'DELETE FROM cart', args: [] });

    const results = await db.batch(writeStmts, 'write');
    // Order insert is the second-to-last statement
    const orderResult = results[results.length - 2];

    res.status(201).json({ orderId: Number(orderResult.lastInsertRowid), items: orderItems, total, customer });
  } catch (err) {
    if (err.message === 'Cart is empty') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.startsWith('Insufficient stock')) {
      return res.status(409).json({ error: err.message });
    }
    console.error('Checkout failed:', err.message);
    res.status(503).json({ error: 'Checkout service unavailable. Please try again.' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [parseInt(req.params.id)] });
  const order = rows[0];
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ ...order, items: JSON.parse(order.items), customer: JSON.parse(order.customer) });
});

// ── Start server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Export app for Vercel's @vercel/node
module.exports = app;

// Start if run directly (local dev)
if (require.main === module) {
  ready.then(() => {
    app.listen(PORT, () => {
      console.log(`🦝 Raccoon Records running at http://localhost:${PORT}`);
    });
  });
}
