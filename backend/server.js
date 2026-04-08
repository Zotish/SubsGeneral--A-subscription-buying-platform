import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  SQLITE_PATH = './subcheap.db',
  JWT_SECRET = 'change-me-please',
  ADMIN_EMAIL = 'alexshohag87@gmail.com',
  ADMIN_PASSWORD = 'Raters@123456!!!',
  HELEKET_API_KEY = '',
  HELEKET_WEBHOOK_SECRET = '',
  HELEKET_WEBHOOK_URL = '',
  CRYPTOMOS_API_KEY = '',
  CRYPTOMOS_WEBHOOK_SECRET = '',
  CRYPTOMOS_WEBHOOK_URL = ''
} = process.env;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({ storage });

const SQL = await initSqlJs();
let db;

const loadDb = () => {
  if (fs.existsSync(SQLITE_PATH)) {
    const data = fs.readFileSync(SQLITE_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }
};

const persistDb = () => {
  const data = db.export();
  fs.writeFileSync(SQLITE_PATH, Buffer.from(data));
};

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  const idRes = db.exec('SELECT last_insert_rowid() AS id');
  const lastInsertRowid = idRes[0]?.values?.[0]?.[0] ?? null;
  persistDb();
  return { lastInsertRowid };
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
};

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

const exec = (sql) => {
  db.exec(sql);
  persistDb();
};

loadDb();

const initDb = () => {
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      isBangladeshi INTEGER NOT NULL DEFAULT 0,
      whatsapp TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      price TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in',
      description TEXT DEFAULT '',
      details TEXT DEFAULT '',
      terms TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      plans TEXT NOT NULL DEFAULT '[]',
      isTopSell INTEGER NOT NULL DEFAULT 0,
      isHotProduct INTEGER NOT NULL DEFAULT 0,
      isBestSearch INTEGER NOT NULL DEFAULT 0,
      isSpecial INTEGER NOT NULL DEFAULT 0,
      originalPrice TEXT DEFAULT '',
      relatedContent TEXT DEFAULT '',
      categoryId INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      total TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      statusHistory TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      productId INTEGER,
      name TEXT NOT NULL,
      price TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      amount TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      trxId TEXT DEFAULT '',
      note TEXT DEFAULT '',
      adminMessage TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      isActive INTEGER NOT NULL DEFAULT 1,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId INTEGER NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      imageUrl TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUrl TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT ''
    );
  `);
};

initDb();

try {
  exec("ALTER TABLE products ADD COLUMN plans TEXT NOT NULL DEFAULT '[]'");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN isTopSell INTEGER NOT NULL DEFAULT 0");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN isHotProduct INTEGER NOT NULL DEFAULT 0");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN isBestSearch INTEGER NOT NULL DEFAULT 0");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE payments ADD COLUMN adminMessage TEXT DEFAULT ''");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE users ADD COLUMN whatsapp TEXT DEFAULT ''");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE ticket_messages ADD COLUMN imageUrl TEXT DEFAULT ''");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE faqs ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN isSpecial INTEGER NOT NULL DEFAULT 0");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN originalPrice TEXT DEFAULT ''");
} catch (_) {
  // Column already exists in existing databases.
}
try {
  exec("ALTER TABLE products ADD COLUMN relatedContent TEXT DEFAULT ''");
} catch (_) {
}
try {
  exec("ALTER TABLE categories ADD COLUMN imageUrl TEXT DEFAULT ''");
} catch (_) {
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const parseHistory = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const stringifyHistory = (history) => JSON.stringify(history || []);
const parsePlans = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getPaymentInstructions = (user) => {
  const instructions = [
    {
      method: 'Crypto - Heleket (BSC)',
      details: `Send USDT to: ${process.env.HELEKET_WALLET || 'HELEKET_WALLET_ADDRESS_HERE'}`
    },
    {
      method: 'Crypto - Cryptomos (Polygon)',
      details: `Send USDT to: ${process.env.CRYPTOMOS_WALLET || 'CRYPTOMOS_WALLET_ADDRESS_HERE'}`
    }
  ];
  if (user?.isBangladeshi) {
    instructions.push({
      method: 'bKash',
      details: `

      
1.⁠ ⁠Go to your bKash app or Dial *247#
 2.⁠ ⁠Choose “Send Money”
 3.⁠ ⁠Enter below bKash Account Number
 4.⁠ ⁠Enter total amount
 6.⁠ ⁠Now enter your bKash Account PIN to confirm the transaction
 7.⁠ ⁠Copy Transaction ID from payment confirmation message and paste that Transaction ID below

Account Type: Personal (Send Money)
      
       ${process.env.BKASH_NUMBER || 'BKASH_NUMBER_HERE'}`
    });
    instructions.push({
      method: 'Nagad',
      details: `
1. Go to your Nagad app or Dial *167#
2. Choose “Send Money”
3. Enter Nagad Account Number
4. Enter total amount
5. Now enter your Nagad Account PIN to confirm the transaction
6. Copy Transaction ID from payment confirmation message and paste that Transaction ID below

Account Type: Personal (Send Money)
Account Number: 01979636807`
    });
  }
  return instructions;
};

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
  }
});

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = get('SELECT * FROM users WHERE id = ?', [payload.id]);
    if (!user) return res.status(401).json({ message: 'Invalid token.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only.' });
  return next();
};

const ensureAdminSeed = () => {
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = get('SELECT id FROM users WHERE email = ?', [email]);
  if (!existing) {
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    run(
      'INSERT INTO users (name, email, passwordHash, role, isBangladeshi) VALUES (?, ?, ?, ?, ?)',
      ['Admin', email, passwordHash, 'admin', 0]
    );
  }
};

const ensureDefaultCategories = () => {
  const defaults = [
    'AI Chat',
    'Writing And Academic',
    'Originality And Humanization',
    'Streaming',
    'Utilities'
  ];
  for (const name of defaults) {
    const exists = get('SELECT id FROM categories WHERE name = ?', [name]);
    if (!exists) {
      run('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slugify(name)]);
    }
  }
};

ensureAdminSeed();
ensureDefaultCategories();

const ensureDefaultPages = () => {
  const defaults = [
    { slug: 'refund-exchange', title: 'Refund & Exchange Policy' },
    { slug: 'terms-conditions', title: 'Terms & Conditions' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'order-cancellation', title: 'Order & Cancellation' },
    { slug: 'eula', title: 'EULA' },
    { slug: 'trademark', title: 'Trademark' },
    { slug: 'contact-information', title: 'Contact Information' }
  ];
  for (const item of defaults) {
    const exists = get('SELECT id FROM pages WHERE slug = ?', [item.slug]);
    if (!exists) {
      run('INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)', [item.slug, item.title, '']);
    }
  }
};

ensureDefaultPages();

app.post('/api/register', (req, res) => {
  const { name, email, password, isBangladeshi = false, whatsapp = '' } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
  const emailKey = email.toLowerCase();
  const exists = get('SELECT id FROM users WHERE email = ?', [emailKey]);
  if (exists) return res.status(409).json({ message: 'Email already registered.' });
  const passwordHash = bcrypt.hashSync(password, 10);
  const role = emailKey === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
  const result = run(
    'INSERT INTO users (name, email, passwordHash, role, isBangladeshi, whatsapp) VALUES (?, ?, ?, ?, ?, ?)',
    [name, emailKey, passwordHash, role, isBangladeshi ? 1 : 0, whatsapp]
  );
  const user = {
    id: result.lastInsertRowid,
    name,
    email: emailKey,
    role,
    isBangladeshi: !!isBangladeshi,
    whatsapp
  };
  const token = signToken(user);
  res.status(201).json({ message: 'Registered successfully.', token, user });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  const user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBangladeshi: !!user.isBangladeshi,
    whatsapp: user.whatsapp || ''
  };
  const token = signToken(payload);
  res.json({
    message: 'Login successful.',
    token,
    user: payload
  });
});

app.get('/api/me', auth, (req, res) => {
  const { id, name, email, role, isBangladeshi, whatsapp } = req.user;
  res.json({ id, name, email, role, isBangladeshi: !!isBangladeshi, whatsapp: whatsapp || '' });
});

app.get('/api/categories', (_req, res) => {
  const categories = all('SELECT * FROM categories ORDER BY name ASC');
  res.json(categories);
});

app.get('/api/products', (_req, res) => {
  const products = all(
    `SELECT p.*, c.id as categoryId, c.name as categoryName, c.slug as categorySlug
     FROM products p
     JOIN categories c ON c.id = p.categoryId`
  );
  res.json(
    products.map((p) => ({
      ...p,
      plans: parsePlans(p.plans),
      isTopSell: !!p.isTopSell,
      isHotProduct: !!p.isHotProduct,
      isBestSearch: !!p.isBestSearch,
      isSpecial: !!p.isSpecial,
      originalPrice: p.originalPrice || '',
      relatedContent: p.relatedContent || '',
      category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug }
    }))
  );
});

app.get('/api/products/:id', (req, res) => {
  const p = get(
    `SELECT p.*, c.id as categoryId, c.name as categoryName, c.slug as categorySlug
     FROM products p
     JOIN categories c ON c.id = p.categoryId
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json({
    ...p,
    plans: parsePlans(p.plans),
    isTopSell: !!p.isTopSell,
    isHotProduct: !!p.isHotProduct,
    isBestSearch: !!p.isBestSearch,
    isSpecial: !!p.isSpecial,
    originalPrice: p.originalPrice || '',
    relatedContent: p.relatedContent || '',
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug }
  });
});

app.get('/api/slides', (_req, res) => {
  const slides = all(
    'SELECT * FROM slides WHERE isActive = 1 ORDER BY sortOrder ASC, id DESC'
  );
  res.json(slides);
});

app.get('/api/faqs', (_req, res) => {
  const faqs = all(
    'SELECT * FROM faqs WHERE isActive = 1 ORDER BY sortOrder ASC, id DESC'
  );
  res.json(faqs);
});

app.get('/api/reviews', (_req, res) => {
  const reviews = all('SELECT * FROM reviews WHERE isActive = 1 ORDER BY sortOrder ASC, id DESC');
  res.json(reviews);
});

app.get('/api/pages/:slug', (req, res) => {
  const page = get('SELECT * FROM pages WHERE slug = ?', [req.params.slug]);
  if (!page) return res.status(404).json({ message: 'Not found.' });
  res.json(page);
});

app.get('/api/orders', auth, (req, res) => {
  const orders = all('SELECT * FROM orders WHERE userId = ? ORDER BY id DESC', [req.user.id]);
  const instructions = getPaymentInstructions(req.user);
  const mapped = orders.map((o) => ({
    ...o,
    statusHistory: parseHistory(o.statusHistory),
    items: all('SELECT * FROM order_items WHERE orderId = ?', [o.id]),
    lastPayment: get(
      'SELECT status, adminMessage, method, amount, trxId, note, createdAt FROM payments WHERE orderId = ? ORDER BY id DESC LIMIT 1',
      [o.id]
    ),
    paymentInstructions: instructions
  }));
  res.json(mapped);
});

app.get('/api/orders/:id', auth, (req, res) => {
  const order = get('SELECT * FROM orders WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({
    ...order,
    statusHistory: parseHistory(order.statusHistory),
    items: all('SELECT * FROM order_items WHERE orderId = ?', [order.id]),
    lastPayment: get(
      'SELECT status, adminMessage, method, amount, trxId, note, createdAt FROM payments WHERE orderId = ? ORDER BY id DESC LIMIT 1',
      [order.id]
    ),
    paymentInstructions: getPaymentInstructions(req.user)
  });
});

app.post('/api/orders', auth, (req, res) => {
  const { items = [], total = '', productId, paymentId } = req.body || {};
  let finalItems = items;
  let finalTotal = total;

  if (productId) {
    const product = get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    finalItems = [{ productId: product.id, name: product.name, price: product.price }];
    finalTotal = product.price;
  }

  if (!paymentId) return res.status(400).json({ message: 'Payment proof required.' });
  const payment = get('SELECT * FROM payments WHERE id = ? AND userId = ?', [paymentId, req.user.id]);
  if (!payment || payment.orderId !== 0) {
    return res.status(400).json({ message: 'Invalid payment proof.' });
  }

  const history = stringifyHistory([{ status: 'Pending', at: new Date().toISOString(), note: 'Order created' }]);
  const result = run('INSERT INTO orders (userId, total, status, statusHistory) VALUES (?, ?, ?, ?)', [
    req.user.id,
    finalTotal,
    'Pending',
    history
  ]);
  const orderId = result.lastInsertRowid;
  for (const item of finalItems) {
    run('INSERT INTO order_items (orderId, productId, name, price) VALUES (?, ?, ?, ?)', [
      orderId,
      item.productId || null,
      item.name,
      item.price
    ]);
  }
  run('UPDATE payments SET orderId = ?, status = ? WHERE id = ?', [orderId, 'PendingVerification', paymentId]);
  const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
  res.status(201).json({
    ...order,
    statusHistory: parseHistory(order.statusHistory),
    items: all('SELECT * FROM order_items WHERE orderId = ?', [orderId]),
    paymentInstructions: getPaymentInstructions(req.user)
  });
});

app.post('/api/payments', auth, (req, res) => {
  const { orderId, amount, method, trxId = '', note = '' } = req.body || {};
  if (!orderId || !amount || !method) return res.status(400).json({ message: 'Missing fields.' });
  const order = get('SELECT * FROM orders WHERE id = ? AND userId = ?', [orderId, req.user.id]);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  const result = run(
    'INSERT INTO payments (orderId, userId, amount, method, status, trxId, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderId, req.user.id, amount, method, 'PendingVerification', trxId, note]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.post('/api/payments/prepay', auth, (req, res) => {
  const { amount, method, trxId = '', note = '' } = req.body || {};
  if (!amount || !method || !trxId) return res.status(400).json({ message: 'Missing fields.' });
  const result = run(
    'INSERT INTO payments (orderId, userId, amount, method, status, trxId, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [0, req.user.id, amount, method, 'ProofSubmitted', trxId, note]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/profile', auth, (req, res) => {
  const { name, isBangladeshi, whatsapp = '' } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  run('UPDATE users SET name = ?, isBangladeshi = ?, whatsapp = ? WHERE id = ?', [
    name,
    isBangladeshi ? 1 : 0,
    whatsapp,
    req.user.id
  ]);
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBangladeshi: !!user.isBangladeshi,
    whatsapp: user.whatsapp || ''
  });
});

app.get('/api/payment-instructions', auth, (req, res) => {
  res.json(getPaymentInstructions(req.user));
});

app.post('/api/change-password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords are required.' });
  const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const ok = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Current password is incorrect.' });
  const hash = bcrypt.hashSync(newPassword, 10);
  run('UPDATE users SET passwordHash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ message: 'Password updated.' });
});

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  const user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  run('DELETE FROM reset_tokens WHERE userId = ?', [user.id]);
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  run('INSERT INTO reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)', [user.id, token, expiresAt]);
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${appUrl}/forgot-password?token=${token}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  smtpTransport
    .sendMail({
      from,
      to: user.email,
      subject: 'Password reset request',
      text: `Use this link to reset your password: ${resetLink}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    })
    .then(() => res.json({ message: 'Reset email sent.' }))
    .catch(() => res.status(500).json({ message: 'Failed to send reset email.' }));
});

app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required.' });
  const row = get('SELECT * FROM reset_tokens WHERE token = ?', [token]);
  if (!row) return res.status(404).json({ message: 'Invalid token.' });
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    run('DELETE FROM reset_tokens WHERE id = ?', [row.id]);
    return res.status(400).json({ message: 'Token expired.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  run('UPDATE users SET passwordHash = ? WHERE id = ?', [hash, row.userId]);
  run('DELETE FROM reset_tokens WHERE id = ?', [row.id]);
  res.json({ message: 'Password reset successful.' });
});

app.get('/api/admin/categories', auth, requireAdmin, (_req, res) => {
  const categories = all('SELECT * FROM categories ORDER BY name ASC');
  res.json(categories);
});

app.post('/api/admin/categories', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  const exists = get('SELECT id FROM categories WHERE name = ?', [name]);
  if (exists) return res.status(400).json({ message: 'Category exists.' });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const result = run('INSERT INTO categories (name, slug, imageUrl) VALUES (?, ?, ?)', [name, slugify(name), imageUrl]);
  res.status(201).json({ id: result.lastInsertRowid, name, slug: slugify(name), imageUrl });
});

app.put('/api/admin/categories/:id', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  const existing = get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Not found.' });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (existing.imageUrl || '');
  run('UPDATE categories SET name = ?, slug = ?, imageUrl = ? WHERE id = ?', [name, slugify(name), imageUrl, req.params.id]);
  const category = get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  res.json(category);
});

app.delete('/api/admin/categories/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/products', auth, requireAdmin, (_req, res) => {
  const products = all(
    `SELECT p.*, c.id as categoryId, c.name as categoryName, c.slug as categorySlug
     FROM products p
     JOIN categories c ON c.id = p.categoryId`
  );
  res.json(
    products.map((p) => ({
      ...p,
      plans: parsePlans(p.plans),
      isTopSell: !!p.isTopSell,
      isHotProduct: !!p.isHotProduct,
      isBestSearch: !!p.isBestSearch,
      isSpecial: !!p.isSpecial,
      originalPrice: p.originalPrice || '',
      relatedContent: p.relatedContent || '',
      category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug }
    }))
  );
});

app.get('/api/admin/slides', auth, requireAdmin, (_req, res) => {
  const slides = all('SELECT * FROM slides ORDER BY sortOrder ASC, id DESC');
  res.json(slides);
});

app.get('/api/admin/faqs', auth, requireAdmin, (_req, res) => {
  const faqs = all('SELECT * FROM faqs ORDER BY sortOrder ASC, id DESC');
  res.json(faqs);
});

app.post('/api/admin/faqs', auth, requireAdmin, (req, res) => {
  const { question, answer, sortOrder = 0, isActive = 1 } = req.body || {};
  if (!question || !answer) return res.status(400).json({ message: 'Question and answer are required.' });
  const result = run(
    'INSERT INTO faqs (question, answer, sortOrder, isActive) VALUES (?, ?, ?, ?)',
    [question, answer, Number(sortOrder) || 0, Number(isActive) ? 1 : 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/admin/faqs/:id', auth, requireAdmin, (req, res) => {
  const faq = get('SELECT * FROM faqs WHERE id = ?', [req.params.id]);
  if (!faq) return res.status(404).json({ message: 'Not found.' });
  const { question, answer, sortOrder, isActive } = req.body || {};
  const updated = {
    question: question ?? faq.question,
    answer: answer ?? faq.answer,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) || 0 : faq.sortOrder,
    isActive: isActive !== undefined ? (Number(isActive) ? 1 : 0) : faq.isActive
  };
  run(
    'UPDATE faqs SET question=?, answer=?, sortOrder=?, isActive=? WHERE id=?',
    [updated.question, updated.answer, updated.sortOrder, updated.isActive, req.params.id]
  );
  res.json({ ok: true });
});

app.delete('/api/admin/faqs/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM faqs WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/reviews', auth, requireAdmin, (_req, res) => {
  const reviews = all('SELECT * FROM reviews ORDER BY sortOrder ASC, id DESC');
  res.json(reviews);
});

app.post('/api/admin/reviews', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { sortOrder = 0, isActive = 1 } = req.body || {};
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  if (!imageUrl) return res.status(400).json({ message: 'Image required.' });
  const result = run(
    'INSERT INTO reviews (imageUrl, sortOrder, isActive) VALUES (?, ?, ?)',
    [imageUrl, Number(sortOrder) || 0, Number(isActive) ? 1 : 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/admin/reviews/:id', auth, requireAdmin, upload.single('image'), (req, res) => {
  const review = get('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
  if (!review) return res.status(404).json({ message: 'Not found.' });
  const { sortOrder, isActive } = req.body || {};
  const updated = {
    imageUrl: req.file ? `/uploads/${req.file.filename}` : review.imageUrl,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) || 0 : review.sortOrder,
    isActive: isActive !== undefined ? (Number(isActive) ? 1 : 0) : review.isActive
  };
  run('UPDATE reviews SET imageUrl=?, sortOrder=?, isActive=? WHERE id=?', [
    updated.imageUrl,
    updated.sortOrder,
    updated.isActive,
    req.params.id
  ]);
  res.json({ ok: true });
});

app.delete('/api/admin/reviews/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/pages', auth, requireAdmin, (_req, res) => {
  const pages = all('SELECT * FROM pages ORDER BY id ASC');
  res.json(pages);
});

app.put('/api/admin/pages/:slug', auth, requireAdmin, (req, res) => {
  const page = get('SELECT * FROM pages WHERE slug = ?', [req.params.slug]);
  if (!page) return res.status(404).json({ message: 'Not found.' });
  const { title, content } = req.body || {};
  run('UPDATE pages SET title=?, content=? WHERE slug=?', [
    title ?? page.title,
    content ?? page.content,
    req.params.slug
  ]);
  res.json({ ok: true });
});

app.get('/api/tickets', auth, (req, res) => {
  const tickets = all('SELECT * FROM tickets WHERE userId = ? ORDER BY id DESC', [req.user.id]);
  res.json(tickets);
});

app.get('/api/tickets/:id', auth, (req, res) => {
  const ticket = get('SELECT * FROM tickets WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  if (!ticket) return res.status(404).json({ message: 'Not found.' });
  const messages = all('SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY id ASC', [ticket.id]);
  res.json({ ...ticket, messages });
});

app.post('/api/tickets', auth, upload.single('file'), (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ message: 'Subject and message required.' });
  const result = run('INSERT INTO tickets (userId, subject) VALUES (?, ?)', [req.user.id, subject]);
  const ticketId = result.lastInsertRowid;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  run('INSERT INTO ticket_messages (ticketId, sender, message, imageUrl) VALUES (?, ?, ?, ?)', [
    ticketId,
    'user',
    message,
    imageUrl
  ]);
  res.status(201).json({ id: ticketId });
});

app.post('/api/tickets/:id/messages', auth, upload.single('file'), (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ message: 'Message required.' });
  const ticket = get('SELECT * FROM tickets WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
  if (!ticket) return res.status(404).json({ message: 'Not found.' });
  if (ticket.status !== 'open') return res.status(400).json({ message: 'Ticket is closed.' });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  run('INSERT INTO ticket_messages (ticketId, sender, message, imageUrl) VALUES (?, ?, ?, ?)', [
    ticket.id,
    'user',
    message,
    imageUrl
  ]);
  res.json({ ok: true });
});

app.get('/api/admin/tickets', auth, requireAdmin, (_req, res) => {
  const tickets = all(
    'SELECT t.*, u.email as userEmail FROM tickets t JOIN users u ON u.id = t.userId ORDER BY t.id DESC'
  );
  res.json(tickets);
});

app.get('/api/admin/tickets/:id', auth, requireAdmin, (req, res) => {
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ message: 'Not found.' });
  const messages = all('SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY id ASC', [ticket.id]);
  res.json({ ...ticket, messages });
});

app.post('/api/admin/tickets/:id/messages', auth, requireAdmin, upload.single('file'), (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ message: 'Message required.' });
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ message: 'Not found.' });
  if (ticket.status !== 'open') return res.status(400).json({ message: 'Ticket is closed.' });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  run('INSERT INTO ticket_messages (ticketId, sender, message, imageUrl) VALUES (?, ?, ?, ?)', [
    ticket.id,
    'admin',
    message,
    imageUrl
  ]);
  res.json({ ok: true });
});

app.post('/api/admin/tickets/:id/close', auth, requireAdmin, (req, res) => {
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ message: 'Not found.' });
  if (ticket.status === 'closed') return res.json({ ok: true });
  run('UPDATE tickets SET status = ? WHERE id = ?', ['closed', ticket.id]);
  res.json({ ok: true });
});

app.post('/api/admin/slides', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { title, body = '', isActive = '1', sortOrder = '0' } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const result = run(
    'INSERT INTO slides (title, body, imageUrl, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)',
    [title, body, imageUrl, Number(isActive) ? 1 : 0, Number(sortOrder) || 0]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/admin/slides/:id', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { title, body, isActive, sortOrder } = req.body || {};
  const slide = get('SELECT * FROM slides WHERE id = ?', [req.params.id]);
  if (!slide) return res.status(404).json({ message: 'Not found.' });
  const updated = {
    title: title ?? slide.title,
    body: body ?? slide.body,
    isActive: isActive !== undefined ? (Number(isActive) ? 1 : 0) : slide.isActive,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) || 0 : slide.sortOrder,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : slide.imageUrl
  };
  run(
    'UPDATE slides SET title=?, body=?, imageUrl=?, isActive=?, sortOrder=? WHERE id=?',
    [updated.title, updated.body, updated.imageUrl, updated.isActive, updated.sortOrder, req.params.id]
  );
  res.json({ ok: true });
});

app.delete('/api/admin/slides/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM slides WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/admin/products', auth, requireAdmin, upload.single('image'), (req, res) => {
  const {
    name,
    price,
    categoryId,
    status = 'in',
    description = '',
    details = '',
    terms = '',
    plans,
    isTopSell = 0,
    isHotProduct = 0,
    isBestSearch = 0,
    isSpecial = 0,
    originalPrice = '',
    relatedContent = ''
  } = req.body || {};
  if (!name || !price || !categoryId) return res.status(400).json({ message: 'Missing fields.' });
  const catId = Number(categoryId);
  const category = get('SELECT id FROM categories WHERE id = ?', [catId]);
  if (!category) return res.status(400).json({ message: 'Invalid category.' });
  const slug = slugify(name);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  let plansValue = '[]';
  if (plans) {
    try {
      const parsed = JSON.parse(plans);
      plansValue = JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch {
      return res.status(400).json({ message: 'Invalid plans.' });
    }
  }
  try {
    const result = run(
      `INSERT INTO products (name, slug, price, status, description, details, terms, imageUrl, plans, isTopSell, isHotProduct, isBestSearch, isSpecial, originalPrice, relatedContent, categoryId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        price,
        status,
        description,
        details,
        terms,
        imageUrl,
        plansValue,
        Number(isTopSell) ? 1 : 0,
        Number(isHotProduct) ? 1 : 0,
        Number(isBestSearch) ? 1 : 0,
        Number(isSpecial) ? 1 : 0,
        originalPrice,
        relatedContent,
        catId
      ]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ message: 'Product create failed.', error: String(err?.message || err) });
  }
});

app.put('/api/admin/products/:id', auth, requireAdmin, upload.single('image'), (req, res) => {
  const { name, price, categoryId, status, description, details, terms, plans, isTopSell, isHotProduct, isBestSearch, isSpecial, originalPrice, relatedContent } = req.body || {};
  if (categoryId) {
    const catId = Number(categoryId);
    const category = get('SELECT id FROM categories WHERE id = ?', [catId]);
    if (!category) return res.status(400).json({ message: 'Invalid category.' });
  }
  const product = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ message: 'Not found.' });
  const catId = categoryId ? Number(categoryId) : product.categoryId;
  let plansValue = product.plans;
  if (plans !== undefined) {
    try {
      const parsed = JSON.parse(plans);
      plansValue = JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch {
      return res.status(400).json({ message: 'Invalid plans.' });
    }
  }
  const updated = {
    name: name ?? product.name,
    slug: name ? slugify(name) : product.slug,
    price: price ?? product.price,
    status: status ?? product.status,
    description: description ?? product.description,
    details: details ?? product.details,
    terms: terms ?? product.terms,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : product.imageUrl,
    plans: plansValue,
    isTopSell: isTopSell !== undefined ? (Number(isTopSell) ? 1 : 0) : product.isTopSell,
    isHotProduct: isHotProduct !== undefined ? (Number(isHotProduct) ? 1 : 0) : product.isHotProduct,
    isBestSearch: isBestSearch !== undefined ? (Number(isBestSearch) ? 1 : 0) : product.isBestSearch,
    isSpecial: isSpecial !== undefined ? (Number(isSpecial) ? 1 : 0) : product.isSpecial,
    originalPrice: originalPrice ?? product.originalPrice,
    relatedContent: relatedContent ?? product.relatedContent,
    categoryId: catId
  };
  run(
    `UPDATE products SET name=?, slug=?, price=?, status=?, description=?, details=?, terms=?, imageUrl=?, plans=?, isTopSell=?, isHotProduct=?, isBestSearch=?, isSpecial=?, originalPrice=?, relatedContent=?, categoryId=?
     WHERE id=?`,
    [
      updated.name,
      updated.slug,
      updated.price,
      updated.status,
      updated.description,
      updated.details,
      updated.terms,
      updated.imageUrl,
      updated.plans,
      updated.isTopSell,
      updated.isHotProduct,
      updated.isBestSearch,
      updated.isSpecial,
      updated.originalPrice,
      updated.relatedContent,
      updated.categoryId,
      req.params.id
    ]
  );
  res.json({ ok: true });
});

app.delete('/api/admin/products/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/users', auth, requireAdmin, (_req, res) => {
  const users = all('SELECT id, name, email, role, isBangladeshi, whatsapp FROM users');
  res.json(users.map((u) => ({ ...u, isBangladeshi: !!u.isBangladeshi, whatsapp: u.whatsapp || '' })));
});

app.put('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  const { role, name } = req.body || {};
  const user = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ message: 'Not found.' });
  const nextName = name ?? user.name;
  const nextRole = role ?? user.role;
  run('UPDATE users SET name = ?, role = ? WHERE id = ?', [nextName, nextRole, req.params.id]);
  res.json({ id: user.id, name: nextName, email: user.email, role: nextRole, isBangladeshi: !!user.isBangladeshi });
});

app.delete('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'User deleted.' });
});

app.get('/api/admin/orders', auth, requireAdmin, (_req, res) => {
  const orders = all('SELECT * FROM orders ORDER BY id DESC');
  res.json(
    orders.map((o) => ({
      ...o,
      statusHistory: parseHistory(o.statusHistory),
      items: all('SELECT * FROM order_items WHERE orderId = ?', [o.id]),
      user: get('SELECT id, name, email FROM users WHERE id = ?', [o.userId])
    }))
  );
});

app.post('/api/admin/orders', auth, requireAdmin, (req, res) => {
  const { userId, items = [], total = '' } = req.body || {};
  const history = stringifyHistory([{ status: 'Pending', at: new Date().toISOString(), note: 'Order created by admin' }]);
  const result = run('INSERT INTO orders (userId, total, status, statusHistory) VALUES (?, ?, ?, ?)', [
    userId,
    total,
    'Pending',
    history
  ]);
  const orderId = result.lastInsertRowid;
  for (const item of items) {
    run('INSERT INTO order_items (orderId, productId, name, price) VALUES (?, ?, ?, ?)', [
      orderId,
      item.productId || null,
      item.name,
      item.price
    ]);
  }
  res.status(201).json({ id: orderId });
});

app.post('/api/admin/orders/:id/status', auth, requireAdmin, (req, res) => {
  const { status, note = '' } = req.body || {};
  if (!status) return res.status(400).json({ message: 'Status required.' });
  const order = get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  const history = parseHistory(order.statusHistory);
  history.push({ status, at: new Date().toISOString(), note });
  run('UPDATE orders SET status = ?, statusHistory = ? WHERE id = ?', [status, stringifyHistory(history), req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/orders/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM order_items WHERE orderId = ?', [req.params.id]);
  run('DELETE FROM payments WHERE orderId = ?', [req.params.id]);
  run('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/payments', auth, requireAdmin, (_req, res) => {
  const payments = all('SELECT * FROM payments ORDER BY id DESC');
  res.json(payments);
});

app.post('/api/admin/payments', auth, requireAdmin, (req, res) => {
  const { orderId, userId, amount, method, status, trxId = '', note = '' } = req.body || {};
  if (!orderId || !userId || !amount || !method || !status) return res.status(400).json({ message: 'Missing fields.' });
  const result = run(
    'INSERT INTO payments (orderId, userId, amount, method, status, trxId, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderId, userId, amount, method, status, trxId, note]
  );
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/admin/payments/:id', auth, requireAdmin, (req, res) => {
  const { amount, method, status, trxId, note } = req.body || {};
  run('UPDATE payments SET amount=?, method=?, status=?, trxId=?, note=? WHERE id=?', [
    amount,
    method,
    status,
    trxId,
    note,
    req.params.id
  ]);
  res.json({ ok: true });
});

app.post('/api/admin/payments/:id/status', auth, requireAdmin, (req, res) => {
  const { status, adminMessage = '' } = req.body || {};
  const payment = get('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!payment) return res.status(404).json({ message: 'Not found.' });
  if (['Verified', 'Rejected', 'Cancelled'].includes(payment.status)) {
    return res.status(400).json({ message: 'Payment status already finalized.' });
  }
  const message =
    adminMessage ||
    (status === 'Verified'
      ? `Payment verified. Please contact admin on WhatsApp: ${process.env.ADMIN_WHATSAPP || 'WHATSAPP_NUMBER_HERE'}`
      : `Payment rejected. Please submit correct payment and try again. Contact: ${process.env.ADMIN_WHATSAPP || 'WHATSAPP_NUMBER_HERE'}`);
  run('UPDATE payments SET status = ?, adminMessage = ? WHERE id = ?', [status, message, req.params.id]);

  const order = get('SELECT * FROM orders WHERE id = ?', [payment.orderId]);
  if (order) {
    const history = parseHistory(order.statusHistory);
    if (status === 'Verified') {
      history.push({ status: 'Paid', at: new Date().toISOString(), note: 'Payment verified' });
      run('UPDATE orders SET status=?, statusHistory=? WHERE id=?', [
        'Paid',
        stringifyHistory(history),
        order.id
      ]);
    } else if (status === 'Rejected') {
      history.push({ status: 'Cancelled', at: new Date().toISOString(), note: 'Payment rejected' });
      run('UPDATE orders SET status=?, statusHistory=? WHERE id=?', [
        'Cancelled',
        stringifyHistory(history),
        order.id
      ]);
    }
  }
  res.json({ ok: true });
});

app.delete('/api/admin/payments/:id', auth, requireAdmin, (req, res) => {
  run('DELETE FROM payments WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/admin/stats', auth, requireAdmin, (_req, res) => {
  const users = get('SELECT COUNT(*) as count FROM users').count;
  const products = get('SELECT COUNT(*) as count FROM products').count;
  const orders = get('SELECT COUNT(*) as count FROM orders').count;
  const payments = get('SELECT COUNT(*) as count FROM payments').count;
  res.json({ users, products, orders, payments });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/payments/config', auth, (_req, res) => {
  res.json({
    heleket: { enabled: !!HELEKET_API_KEY, webhookUrl: HELEKET_WEBHOOK_URL },
    cryptomos: { enabled: !!CRYPTOMOS_API_KEY, webhookUrl: CRYPTOMOS_WEBHOOK_URL }
  });
});

app.post('/api/webhooks/heleket', express.json(), (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/webhooks/cryptomos', express.json(), (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
