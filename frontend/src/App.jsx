import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

const API_URL = 'https://api.subsgeneral.com';


const parsePrice = (value) => {
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? 0 : num;
};

const DEFAULT_CATEGORIES = [
  'AI Chat',
  'Writing And Academic',
  'Originality And Humanization',
  'Streaming',
  'Utilities'
];

const renderMarkdown = (value = '') => {
  const escape = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  let text = escape(value);
  text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  text = text.replace(/\n/g, '<br/>');
  return { __html: text };
};

const authFetch = (token, path, options = {}) => {
  const headers = options.headers || {};
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`
    }
  });
};

function Layout({ children, user, onLogout, cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState([]);
  const location = useLocation();
  const showFooter = location.pathname === '/' && user?.role !== 'admin';

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((data) => setMenuCategories(Array.isArray(data) ? data : []))
      .catch(() => setMenuCategories([]));
  }, []);

  return (
    <div className="page">
      <header className="topbar new-topbar">
        <div className="left-controls">
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="brand">
            <img className="brand-logo" src="/asset/subsgeneral_4K_fullpill-2.jpg" alt="SubsGeneral logo" />
          </div>
        </div>
        <div className="top-actions">
          {user?.role !== 'admin' && <Link className="btn outline" to="/cart">Cart ({cartCount})</Link>}
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Link className="btn outline" to="/admin">Admin</Link>
              ) : (
                <Link className="btn outline" to="/dashboard">Dashboard</Link>
              )}
              {user.role !== 'admin' && <Link className="btn outline" to="/support">Support</Link>}
              <Link className="btn outline" to="/profile">Profile</Link>
              <button className="btn" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn outline" to="/login">Login</Link>
              <Link className="btn" to="/register">Register</Link>
            </>
          )}
        </div>
        <div className="top-home-link">
          <Link to="/">Home</Link>
        </div>
      </header>
        <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
          <div className="side-menu-header">
            <h3>Categories</h3>
            <button className="icon-btn close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              ✕
            </button>
          </div>
          <div className="side-menu-list">
            {menuCategories.map((c) => (
            <Link key={c.id ?? c._id} to={`/category/${c.slug}`} onClick={() => setMenuOpen(false)}>
              {c.name}
            </Link>
            ))}
          </div>
        </div>
      {menuOpen && <div className="side-menu-backdrop" onClick={() => setMenuOpen(false)}></div>}
      {children}
      {showFooter && (
        <footer className="footer new-footer">
          <div className="footer-grid">
            <div>
              <div className="brand">
                
                <span className="brand-text">SubsGeneral</span>
              </div>
              <p>Subscriptions made easy with local and crypto payments.</p>
              <div className="social-row">
                <a href="https://facebook.com/SubsGeneral" className="social-icon" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M15 3h-3a5 5 0 0 0-5 5v3H4v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3V3z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/SubsGeneral" className="social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.3-2.3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                </a>
                <a href="http://www.youtube.com/@SubsGeneral" className="social-icon" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M22 7.5c0-1.4-1.1-2.5-2.5-2.7C17.6 4.5 12 4.5 12 4.5s-5.6 0-7.5.3C3.1 5 2 6.1 2 7.5v9c0 1.4 1.1 2.5 2.5 2.7 1.9.3 7.5.3 7.5.3s5.6 0 7.5-.3c1.4-.2 2.5-1.3 2.5-2.7v-9zm-12 8V9l6 3-6 3z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@subsgeneral" className="social-icon" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M14.5 3c.5 2.1 2.1 3.7 4.5 4.1v3a8.1 8.1 0 0 1-4.5-1.5v7.4a5.5 5.5 0 1 1-5.5-5.5c.4 0 .8 0 1.1.1v3a2.5 2.5 0 1 0 1.4 2.3V3h3z"/>
                  </svg>
                </a>
                <a href="https://x.com/yourtrulyalex" className="social-icon" aria-label="X">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M4 4h4.2l4.1 5.5L16.9 4H20l-5.9 7.6L20 20h-4.2l-4.6-6.2L6.9 20H4l6.5-8.4L4 4z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Our Policy</h4>
              <ul>
                <li><Link to="/policy/refund-exchange">Refund & Exchange Policy</Link></li>
                <li><Link to="/policy/terms-conditions">Terms & Conditions</Link></li>
                <li><Link to="/policy/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/policy/order-cancellation">Order & Cancellation</Link></li>
                <li><Link to="/policy/eula">EULA</Link></li>
                <li><Link to="/policy/trademark">Trademark</Link></li>
                <li><Link to="/policy/contact-information">Contact Information</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026, SubsGeneral - OTT Subscriptions BD</span>
            
          </div>
        </footer>
      )}
      <a
        className="floating-chat"
        href="https://wa.me/8801857169996"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp chat"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 3.5A10.9 10.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.8c0 2.1.5 4.1 1.5 5.9L0 24l6.5-1.7a12 12 0 0 0 5.5 1.4h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.2-3.4-8.4ZM12 21.2h-.1c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.9 1 1-3.8-.2-.4a9.1 9.1 0 0 1-1.4-4.9C1.9 6.6 6.6 2 12.1 2a9 9 0 0 1 6.4 2.6 9 9 0 0 1 2.6 6.4c0 5.6-4.6 10.2-10.1 10.2Zm5.6-7.7c-.3-.2-1.7-.8-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.2-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.3-.5c.1-.2.1-.4 0-.6-.1-.2-.7-1.6-1-2.2-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7 0 1.6 1.2 3.2 1.4 3.4.2.2 2.4 3.7 5.9 5.1.8.3 1.4.5 1.9.6.8.2 1.5.2 2.1.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
        </svg>
      </a>
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar={false} newestOnTop />
    </div>
  );
}

function HeroBanner() {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/slides`)
      .then((r) => r.json())
      .then((data) => setSlides(Array.isArray(data) && data.length ? data : []))
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [slides.length]);

  const current = slides[active] || {
    title: 'Subscription is now more easy',
    body: 'Bangladesh"s fast delivary and payment platform ',
    imageUrl: ''
  };

  return (
    <section className="hero fanflix-hero">
      {current.imageUrl && (
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${API_URL}${current.imageUrl})` }}
        />
      )}
      <div className="hero-overlay" />
      <div className="hero-content"></div>
      <div className="slider-dots">
        {(slides.length ? slides : [current]).map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === active ? 'active' : ''}`}
            onClick={() => setActive(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function ProductSection({ title, items, onAddToCart }) {
  return (
    <section className="product-section">
      <div className="section-title">
        <span className="section-dot"></span>
        <h2>{title}</h2>
      </div>
      <div className="product-grid">
        {items.map((item) => (
          <div className="product-card" key={item.id}>
            <div
              className={`product-image ${item.status === 'out' ? 'is-muted' : ''} ${item.imageUrl ? 'has-image' : ''}`}
              style={item.imageUrl ? { backgroundImage: `url(${API_URL}${item.imageUrl})` } : undefined}
            >
              <div className="grid-bg"></div>
              <div className="product-logo">{item.name.split(' ')[0]}</div>
              {item.status === 'out' && <span className="status">Out of Stock</span>}
            </div>
            <div className="product-body">
              <h3>{item.name}</h3>
              <p className="price">{item.price}</p>
              <div className="row-actions">
                <Link className={`btn outline ${item.status === 'out' ? 'disabled' : ''}`} to={`/product/${item.id}`}>
                  View Product
                </Link>
                <button
                  className={`btn outline ${item.status === 'out' ? 'disabled' : ''}`}
                  onClick={() => item.status !== 'out' && onAddToCart({ ...item, productId: item.id })}
                  disabled={item.status === 'out'}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Products({ onAddToCart }) {
  const [active, setActive] = useState(DEFAULT_CATEGORIES[0]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [cats, prods] = await Promise.all([
        fetch(`${API_URL}/api/categories`).then((r) => r.json()),
        fetch(`${API_URL}/api/products`).then((r) => r.json())
      ]);
      if (Array.isArray(cats) && cats.length > 0) {
        const names = cats.map((c) => c.name);
        setCategoriesList(names);
        setActive((prev) => (names.includes(prev) ? prev : names[0]));
      }
      if (Array.isArray(prods)) setProductsList(prods);
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    categoriesList.forEach((cat) => map.set(cat, []));
    productsList.forEach((item) => {
      const catName = item.category?.name || 'Uncategorized';
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)?.push({
        id: item.id ?? item._id,
        name: item.name,
        price: item.price,
        status: item.status,
        imageUrl: item.imageUrl || ''
      });
    });
    return map;
  }, [categoriesList, productsList]);

  return (
    <>
      <section id="products" className="products">
        <h2>Products</h2>
        <div className="tabs">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              className={`tab ${active === cat ? 'active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="payment-pill">
          Payment Methods: Crypto, BKash, Nagad.
        </div>
      </section>
      {categoriesList.map((cat) => (
        <div key={cat} style={{ display: active === cat ? 'block' : 'none' }}>
          <ProductSection title={cat} items={grouped.get(cat) || []} onAddToCart={onAddToCart} />
        </div>
      ))}
    </>
  );
}

function CategoryPage({ onAddToCart }) {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [cats, prods] = await Promise.all([
        fetch(`${API_URL}/api/categories`).then((r) => r.json()),
        fetch(`${API_URL}/api/products`).then((r) => r.json())
      ]);
      const found = (cats || []).find((c) => c.slug === slug);
      setCategory(found || null);
      const filtered = (prods || []).filter((p) => p.category?.slug === slug);
      setItems(
        filtered.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          status: item.status,
          imageUrl: item.imageUrl || ''
        }))
      );
    };
    load();
  }, [slug]);

  return (
    <main className="category-page">
      <section className="section-head">
        <h2>{category?.name || 'Category'}</h2>
        <p></p>
      </section>
      <ProductSection title="" items={items} onAddToCart={onAddToCart} />
    </main>
  );
}

function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setProduct(data);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (product) setSelectedPlan(0);
  }, [product?.id, product?._id]);

  if (notFound) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Product not found</h2>
          <Link className="btn" to="/">Back to products</Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Loading product...</h2>
        </div>
      </main>
    );
  }

  const defaultPlans = [
    { label: '1 Month', price: product.price || '' },
    { label: '2 Months', price: '' },
    { label: '3 Months', price: '' }
  ];
  const plans = Array.isArray(product.plans) && product.plans.length > 0 ? product.plans : defaultPlans;
  const resolvePlan = () => {
    const active = plans[selectedPlan] || plans[0] || {};
    return {
      label: active.label || '',
      price: active.price || product.price || ''
    };
  };

  const addToCart = () => {
    const { label, price } = resolvePlan();
    const productId = product.id ?? product._id;
    const suffix = label ? ` - ${label}` : '';
    const cartId = `${productId}:${label || 'default'}`;
    onAddToCart({
      id: cartId,
      productId,
      name: `${product.name}${suffix}`,
      price: price || product.price,
      imageUrl: product.imageUrl || '',
      planLabel: label
    });
    setMessage('Added to cart.');
    toast.success('Added to cart.');
  };

  const buyNow = () => {
    const { label, price } = resolvePlan();
    const productId = product.id ?? product._id;
    const suffix = label ? ` - ${label}` : '';
    const cartId = `${productId}:${label || 'default'}`;
    onAddToCart({
      id: cartId,
      productId,
      name: `${product.name}${suffix}`,
      price: price || product.price,
      imageUrl: product.imageUrl || '',
      planLabel: label
    });
    navigate('/checkout');
  };

  return (
    <main className="detail">
      <div className="detail-card">
        <div className="detail-left">
          <div className="detail-image">
            <div className="grid-bg"></div>
            {product.imageUrl ? (
              <img src={`${API_URL}${product.imageUrl}`} alt={product.name} />
            ) : (
              <div className="detail-logo">{product.name.split(' ')[0]}</div>
            )}
          </div>
          <div className="detail-thumbs">
            <span className="thumb"></span>
            <span className="thumb"></span>
            <span className="thumb"></span>
          </div>
        </div>
        <div className="detail-right">
          <div className="pill">Original Subscription</div>
          <h2>{product.name}</h2>
          <div className="plan-grid">
            {plans.map((plan, idx) => (
              <button
                key={`${plan.label}-${idx}`}
                type="button"
                className={`plan-box ${idx === selectedPlan ? 'active' : ''}`}
                onClick={() => setSelectedPlan(idx)}
              >
                <p>{plan.label || `Plan ${idx + 1}`}</p>
                <span>{plan.price || '—'}</span>
              </button>
            ))}
          </div>
          <div className="payment-pill">Payment Methods: Crypto, bKash, Nagad.</div>
          <div className="row-actions">
            <button className="btn" onClick={buyNow}>Buy Now</button>
            <button className="btn outline" onClick={addToCart}>Add to Cart</button>
          </div>
          {message && <div className="message-box">{message}</div>}
          <div className="info-box">
            All important details are shared below. Please review before making payment.
          </div>
          <div className="related">
            <h3>Related Products</h3>
            <div className="related-item">{product.name}</div>
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h3>Details</h3>
        <p className="muted">
          {product.details || 'No extra details provided for this service yet.'}
        </p>
      </section>

      <section className="detail-section">
        <h3>Terms & Conditions</h3>
        <p className="muted">
          {product.terms || 'No terms provided for this service yet.'}
        </p>
      </section>
    </main>
  );
}

function Home({ onAddToCart }) {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/faqs`)
      .then((r) => r.json())
      .then((data) => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => setFaqs([]));
  }, []);

  return (
    <main>
      <HeroBanner />
      <section className="explore-banner">
        <div className="explore-card">
          <h2>Explore</h2>
          <p>All products and special offers in one place.</p>
          <Link className="btn outline" to="/explore">View All Products</Link>
        </div>
      </section>
      <section className="explore-banner">
        <div className="explore-card">
          <h2>Reviews</h2>
          <p>See customer review screenshots.</p>
          <Link className="btn outline" to="/reviews">View Reviews</Link>
        </div>
      </section>
      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {/* {faqs.length === 0 && (
            <details>
            <summary>FAQ will appear here</summary>
            <p>Admin can add or update FAQs from the admin panel.</p>
          </details>
          )} */}
          {faqs.map((item) => (
            <details key={item.id}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function Explore({ onAddToCart }) {
  return (
    <main className="category-page">
      <Products onAddToCart={onAddToCart} />
    </main>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, []);

  return (
    <main className="category-page">
      <section className="section-head">
        <h2>Reviews</h2>
        <p>All uploaded review images.</p>
      </section>
      <div className="product-grid">
        {reviews.map((r) => (
          <div className="product-card" key={r.id} onClick={() => setActive(r)}>
            <div
              className="product-image has-image"
              style={{ backgroundImage: `url(${API_URL}${r.imageUrl})` }}
            />
          </div>
        ))}
      </div>
      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <img src={`${API_URL}${active.imageUrl}`} alt="review" />
          </div>
        </div>
      )}
    </main>
  );
}

function PolicyPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/pages/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.message) {
          setMessage(data.message);
        } else {
          setPage(data);
        }
      })
      .catch(() => setMessage('Not found.'));
  }, [slug]);

  if (message) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>{message}</h2>
        </div>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Loading...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="detail">
      <div className="detail-card">
        <h2>{page.title}</h2>
        <div className="muted" dangerouslySetInnerHTML={renderMarkdown(page.content || 'No content yet.')} />
      </div>
    </main>
  );
}

function Register({ onAuth }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    isBangladeshi: false
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      onAuth(data);
      setMessage('Account created. Redirecting...');
      toast.success('Account created.');
      setForm({ name: '', email: '', password: '', whatsapp: '', isBangladeshi: false });
      navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setMessage(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p>Register to access exclusive subscription deals.</p>
        <form onSubmit={onSubmit}>
          <label>
            Full name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            Email address
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={onChange} required />
          </label>
          <label>
            WhatsApp number
            <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="+8801XXXXXXXXX" />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.isBangladeshi}
              onChange={(e) => setForm({ ...form, isBangladeshi: e.target.checked })}
            />
Are you a Bangladeshi Citizen?          </label>
          <button className="btn" type="submit">Create Account</button>
        </form>
        {message && <p className="message-box">{message}</p>}
        <p className="small">
          Already have an account? <Link to="/login">Login here</Link>.
        </p>
      </div>
    </div>
  );
}

function Login({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onAuth(data);
      setMessage('Login successful. Redirecting...');
      toast.success('Login successful.');
      setForm({ email: '', password: '' });
      navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setMessage(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Log in to manage your subscriptions.</p>
        <form onSubmit={onSubmit}>
          <label>
            Email address
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={onChange} required />
          </label>
          <button className="btn" type="submit">Login</button>
        </form>
        {message && <p className="message-box">{message}</p>}
        <p className="small">
          Need an account? <Link to="/register">Register here</Link>.
        </p>
        <p className="small">
          Forgot password? <Link to="/forgot-password">Reset here</Link>.
        </p>
      </div>
    </div>
  );
}

function SupportTickets({ user, token }) {
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [createFile, setCreateFile] = useState(null);
  const [replyFile, setReplyFile] = useState(null);

  const loadTickets = useCallback(() => {
    if (!token) return;
    authFetch(token, '/api/tickets')
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]));
  }, [token]);

  const loadTicket = useCallback((id) => {
    if (!token) return;
    authFetch(token, `/api/tickets/${id}`)
      .then((r) => r.json())
      .then((data) => setActive(data))
      .catch(() => setActive(null));
  }, [token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const createTicket = async () => {
    if (!subject.trim() || !message.trim()) return;
    const body = new FormData();
    body.append('subject', subject);
    body.append('message', message);
    if (createFile) body.append('file', createFile);
    const res = await authFetch(token, '/api/tickets', { method: 'POST', body });
    if (!res.ok) {
      toast.error('Ticket create failed.');
      return;
    }
    toast.success('Ticket created.');
    setSubject('');
    setMessage('');
    setCreateFile(null);
    loadTickets();
  };

  const sendReply = async () => {
    if (!active?.id || !reply.trim()) return;
    const body = new FormData();
    body.append('message', reply);
    if (replyFile) body.append('file', replyFile);
    const res = await authFetch(token, `/api/tickets/${active.id}/messages`, {
      method: 'POST',
      body
    });
    if (!res.ok) {
      toast.error('Message send failed.');
      return;
    }
    toast.success('Message sent.');
    setReply('');
    setReplyFile(null);
    loadTicket(active.id);
  };

  if (!user) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Please log in to access tickets.</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Support Tickets</h2>
        <div className="admin-form">
          <input
            placeholder="Ticket subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Describe your issue"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input type="file" onChange={(e) => setCreateFile(e.target.files?.[0] || null)} />
          <button className="btn" onClick={createTicket}>Create Ticket</button>
        </div>
        <div className="admin-list">
          {tickets.map((t) => (
            <div key={t.id} className="admin-item admin-row">
              <div>
                <strong>{t.subject}</strong>
                <div className="muted">Status: {t.status}</div>
              </div>
              <button className="btn outline" onClick={() => loadTicket(t.id)}>Open</button>
            </div>
          ))}
        </div>
        {active && (
          <div className="detail-section">
            <h3>Ticket: {active.subject}</h3>
            <div className="chat-box">
              {active.messages?.map((m) => (
                <div key={m.id} className={`chat-line ${m.sender}`}>
                  <strong>{m.sender}:</strong> {m.message}
                  {m.imageUrl && (
                    <div className="chat-attachment">
                      <img src={`${API_URL}${m.imageUrl}`} alt="attachment" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {active.status === 'open' ? (
              <div className="admin-form">
                <input
                  placeholder="Write a reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <input type="file" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} />
                <button className="btn outline" onClick={sendReply}>Send</button>
              </div>
            ) : (
              <div className="muted">This ticket is closed.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, [location.search]);

  const requestToken = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || raw || 'Request failed');
      setToken(data.token || '');
      setMessage('Reset token created. Use it to set a new password.');
      toast.success('Reset token created.');
    } catch (err) {
      setMessage(err.message);
      toast.error(err.message);
    }
  };

  const resetPassword = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.message || raw || 'Reset failed');
      setMessage('Password reset successful. You can log in now.');
      toast.success('Password reset successful.');
      setNewPassword('');
    } catch (err) {
      setMessage(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h2>Forgot password</h2>
        <p>Request a reset token and set a new password.</p>
        <div className="admin-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="row-actions">
            <button className="btn outline" onClick={requestToken}>Get Reset Token</button>
            <button className="btn outline" onClick={requestToken}>Resend</button>
          </div>
        </div>
        <div className="admin-form">
          <input
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button className="btn" onClick={resetPassword}>Reset Password</button>
        </div>
        {message && <p className="message-box">{message}</p>}
      </div>
    </div>
  );
}

function Dashboard({ user, token }) {
  const [orders, setOrders] = useState([]);

  const loadOrders = useCallback(() => {
    if (!token) return;
    authFetch(token, '/api/orders')
      .then((res) => res.json())
      .then(setOrders)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(loadOrders, 8000);
    return () => clearInterval(id);
  }, [token, loadOrders]);

  if (!user) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Please log in to access your dashboard.</h2>
          <Link className="btn" to="/login">Go to Login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Welcome, {user.email}</h2>
        <p>Your orders and tracking timeline are shown below.</p>
        <div className="dashboard-grid">
          {orders.length === 0 && <div className="dash-box">No orders yet.</div>}
          {orders.map((order) => {
            const adminMsg = order.lastPayment?.adminMessage;
            const fallbackMsg =
              order.lastPayment?.status === 'Verified'
                ? 'Payment verified. Please contact admin for delivery.'
                : order.lastPayment?.status === 'Rejected'
                  ? 'Payment rejected. Please submit correct payment and try again.'
                  : 'No admin message yet.';
            return (
              <div className="dash-box" key={order.id ?? order._id}>
                <h3>Order #{String(order.id ?? order._id).slice(-6)}</h3>
                <p>Status: {order.status}</p>
                <Link
                  className="btn outline"
                  to={`/order/${order.id ?? order._id}`}
                >
                  View Details
                </Link>
                {order.lastPayment && (
                  <div className="muted">
                    Last Payment: {order.lastPayment.method} — {order.lastPayment.amount} ({order.lastPayment.status})
                  </div>
                )}
                {order.lastPayment && (
                  <div className="message-box">
                    <strong>Admin Message:</strong> {adminMsg || fallbackMsg}
                  </div>
                )}
                <div className="timeline">
                  {order.statusHistory?.map((entry, idx) => (
                    <div className="timeline-item" key={idx}>
                    <span className="dot"></span>
                    <div>
                      <strong>{entry.status}</strong>
                      <div className="muted">{new Date(entry.at).toLocaleString()}</div>
                      {entry.note && <div className="muted">{entry.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </main>
  );
}

function Cart({ cartItems, onRemove, onClear }) {
  const total = cartItems.reduce((sum, item) => sum + parsePrice(item.price), 0);
  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Your Cart</h2>
        {cartItems.length === 0 && <p>No items in cart.</p>}
        <div className="cart-list">
          {cartItems.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <div className="muted">{item.price}</div>
              </div>
              <button className="btn outline" onClick={() => onRemove(item.id)}>Remove</button>
            </div>
          ))}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <span>Total: {total > 0 ? `${total} Taka` : 'See items'}</span>
            <div className="row-actions">
              <Link className="btn outline" to="/checkout">Checkout</Link>
              <button className="btn outline" onClick={onClear}>Clear Cart</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Checkout({ cartItems, onClear }) {
  const [message, setMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [proofId, setProofId] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const navigate = useNavigate();
  const total = cartItems.reduce((sum, item) => sum + parsePrice(item.price), 0);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) return;
    authFetch(token, '/api/payment-instructions')
      .then((res) => res.json())
      .then((data) => setInstructions(Array.isArray(data) ? data : []))
      .catch(() => setInstructions([]));
  }, []);

  const placeOrder = async () => {
    const token = localStorage.getItem('gc_token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      setMessage('Cart is empty.');
      toast.error('Cart is empty.');
      return;
    }
    if (!proofId) {
      setMessage('Please submit payment proof first.');
      toast.error('Please submit payment proof first.');
      return;
    }
    const items = cartItems.map((item) => ({
      productId: item.productId ?? item.id,
      name: item.name,
      price: item.price
    }));
    const res = await authFetch(token, '/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items, total: `${total} Taka`, paymentId: proofId })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || 'Order failed.');
      toast.error(data.message || 'Order failed.');
      return;
    }
    onClear();
    setCreatedOrder(data);
    toast.success('Order placed successfully.');
  };

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Checkout</h2>
        <div className="cart-list">
          {cartItems.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <div className="muted">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
        <PaymentForm
          token={localStorage.getItem('gc_token')}
          isBangladeshi={JSON.parse(localStorage.getItem('gc_user') || '{}')?.isBangladeshi}
          instructions={instructions}
          submitLabel="Submit Payment Proof"
          onSubmitted={(data) => {
            setProofId(data?.id || null);
            setMessage('Payment proof submitted. Now place your order.');
            toast.success('Payment proof submitted.');
          }}
        />
        <div className="cart-footer">
          <span>Total: {total > 0 ? `${total} Taka` : 'See items'}</span>
          <div className="row-actions">
            <button className="btn" onClick={placeOrder} disabled={!proofId}>
              Place Order
            </button>
            {createdOrder && (
              <button
                className="btn outline"
                onClick={() => navigate(`/order/${createdOrder.id ?? createdOrder._id}`)}
              >
                View Order
              </button>
            )}
          </div>
        </div>
        {message && <div className="message-box">{message}</div>}
      </div>
    </main>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('gc_token');
      if (!token) return;
      const res = await authFetch(token, `/api/orders/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Order not found.');
        return;
      }
      const data = await res.json();
      setOrder(data);
      setInstructions(data.paymentInstructions || []);
    };
    load();
  }, [id]);

  if (message) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>{message}</h2>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Loading order...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Order #{String(order.id ?? order._id).slice(-6)}</h2>
        <p>Status: {order.status}</p>
        {order.lastPayment && (
          <div className="message-box">
            <strong>Admin Message:</strong>{' '}
            {order.lastPayment.adminMessage ||
              (order.lastPayment.status === 'Verified'
                ? 'Payment verified. Please contact admin for delivery.'
                : order.lastPayment.status === 'Rejected'
                  ? 'Payment rejected. Please submit correct payment and try again.'
                  : 'No admin message yet.')}
          </div>
        )}
        <div className="cart-list">
          {order.items.map((item, idx) => (
            <div className="cart-item" key={idx}>
              <div>
                <strong>{item.name}</strong>
                <div className="muted">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="timeline">
          {order.statusHistory?.map((entry, idx) => (
            <div className="timeline-item" key={idx}>
              <span className="dot"></span>
              <div>
                <strong>{entry.status}</strong>
                <div className="muted">{new Date(entry.at).toLocaleString()}</div>
                {entry.note && <div className="muted">{entry.note}</div>}
              </div>
            </div>
          ))}
        </div>
        {instructions.length > 0 && (
          <div className="detail-section">
            <h3>Payment Instructions</h3>
            <ul>
              {instructions.map((ins) => (
                <li key={ins.method}>
                  <strong>{ins.method}:</strong> {ins.details}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

function Profile({ user, onUpdateUser }) {
  const [name, setName] = useState(user?.name || '');
  const [isBangladeshi, setIsBangladeshi] = useState(!!user?.isBangladeshi);
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  const saveProfile = async () => {
    const token = localStorage.getItem('gc_token');
    if (!token) return;
    const res = await authFetch(token, '/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, isBangladeshi, whatsapp })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || 'Update failed.');
      return;
    }
    onUpdateUser(data);
    setMessage('Profile updated.');
  };

  const changePassword = async () => {
    const token = localStorage.getItem('gc_token');
    if (!token) return;
    const res = await authFetch(token, '/api/change-password', {
      method: 'POST',
      body: JSON.stringify(pass)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || 'Password change failed.');
      return;
    }
    setPass({ currentPassword: '', newPassword: '' });
    setMessage('Password updated.');
  };

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Profile</h2>
        <div className="admin-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isBangladeshi}
              onChange={(e) => setIsBangladeshi(e.target.checked)}
            />
            Bangladeshi residence (enable bKash)
          </label>
          <button className="btn" onClick={saveProfile}>Save Profile</button>
        </div>
        <div className="admin-form">
          <input
            type="password"
            placeholder="Current password"
            value={pass.currentPassword}
            onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })}
          />
          <input
            type="password"
            placeholder="New password"
            value={pass.newPassword}
            onChange={(e) => setPass({ ...pass, newPassword: e.target.value })}
          />
          <button className="btn outline" onClick={changePassword}>Change Password</button>
        </div>
        {message && <div className="message-box">{message}</div>}
      </div>
    </main>
  );
}

function PaymentForm({ orderId, token, isBangladeshi, instructions, onSubmitted, submitLabel = 'Send Payment' }) {
  const [form, setForm] = useState({ amount: '', method: '', trxId: '', note: '' });
  const [message, setMessage] = useState('');
  const selectedInstruction = instructions.find((i) => i.method === form.method);

  const submit = async () => {
    setMessage('');
    const path = orderId ? '/api/payments' : '/api/payments/prepay';
    const body = orderId ? { orderId, ...form } : { ...form };
    const res = await authFetch(token, path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || 'Payment submission failed.');
      toast.error(data.message || 'Payment submission failed.');
      return;
    }
    setMessage('Payment submitted for verification.');
    toast.success('Payment submitted for verification.');
    setForm({ amount: '', method: '', trxId: '', note: '' });
    if (onSubmitted) onSubmitted(data);
  };

  return (
    <div className="payment-form">
      <h4>Submit Payment</h4>
      <div className="payment-grid">
        <input
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
        >
          <option key="m0" value="">Select method</option>
          <option key="m1" value="Crypto - Heleket (BSC)">Crypto - Heleket (BSC)</option>
          <option key="m2" value="Crypto - Cryptomos (Polygon)">Crypto - Cryptomos (Polygon)</option>
          {isBangladeshi && <option key="m3" value="bKash">bKash</option>}
          {isBangladeshi && <option key="m4" value="Nagad">Nagad</option>}
        </select>
        <input
          placeholder="Transaction ID"
          value={form.trxId}
          onChange={(e) => setForm({ ...form, trxId: e.target.value })}
        />
        <input
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      {selectedInstruction && (
        <div className="payment-instruction">
          <strong>Send to:</strong>
          <div className="payment-text">{selectedInstruction.details}</div>
        </div>
      )}
      <button className="btn outline" onClick={submit}>{submitLabel}</button>
      {message && <div className="message-box">{message}</div>}
    </div>
  );
}

function AdminPanel({ user, token }) {
  const [tab, setTab] = useState('Products');
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, payments: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [userEditMap, setUserEditMap] = useState({});
  const [slidesList, setSlidesList] = useState([]);
  const [newSlide, setNewSlide] = useState({ title: '', body: '', isActive: true, sortOrder: 0, file: null });
  const [faqsList, setFaqsList] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', sortOrder: 0, isActive: true });
  const [editingFaqId, setEditingFaqId] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [newReview, setNewReview] = useState({ sortOrder: 0, isActive: true, file: null });
  const [pagesList, setPagesList] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [ticketsList, setTicketsList] = useState([]);
  const [activeAdminTicket, setActiveAdminTicket] = useState(null);
  const [adminTicketMessage, setAdminTicketMessage] = useState('');
  const [adminTicketFile, setAdminTicketFile] = useState(null);

  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    categoryId: '',
    status: 'in',
    details: '',
    terms: '',
    file: null,
    plans: [
      { label: '1 Month', price: '' },
      { label: '2 Months', price: '' },
      { label: '3 Months', price: '' }
    ]
  });
  const [adminMessage, setAdminMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingProductId, setEditingProductId] = useState('');
  const [orderStatusMap, setOrderStatusMap] = useState({});
  const [newPayment, setNewPayment] = useState({ orderId: '', userId: '', amount: '', method: '', status: '' });
  const [paymentNoteMap, setPaymentNoteMap] = useState({});
  const normalizePlans = (plans, fallbackPrice) => {
    const cleaned = (plans || [])
      .map((p) => ({
        label: String(p.label || '').trim(),
        price: String(p.price || '').trim()
      }))
      .filter((p) => p.label && p.price);
    if (cleaned.length === 0 && String(fallbackPrice || '').trim()) {
      return [{ label: '1 Month', price: String(fallbackPrice).trim() }];
    }
    return cleaned;
  };

  const loadAll = async () => {
    if (!token) return;
    const [cats, prods, orders, users, payments, statsData, faqs, reviews, pages, tickets] = await Promise.all([
      authFetch(token, '/api/admin/categories').then((r) => r.json()),
      authFetch(token, '/api/admin/products').then((r) => r.json()),
      authFetch(token, '/api/admin/orders').then((r) => r.json()),
      authFetch(token, '/api/admin/users').then((r) => r.json()),
      authFetch(token, '/api/admin/payments').then((r) => r.json()),
      authFetch(token, '/api/admin/stats').then((r) => r.json()),
      authFetch(token, '/api/admin/faqs').then((r) => r.json()),
      authFetch(token, '/api/admin/reviews').then((r) => r.json()),
      authFetch(token, '/api/admin/pages').then((r) => r.json()),
      authFetch(token, '/api/admin/tickets').then((r) => r.json())
    ]);
    const slides = await authFetch(token, '/api/admin/slides').then((r) => r.json());
    setCategoriesList(cats);
    setProductsList(prods);
    setOrdersList(orders);
    setUsersList(users);
    setPaymentsList(payments);
    setFaqsList(faqs || []);
    setReviewsList(reviews || []);
    setPagesList(pages || []);
    setTicketsList(tickets || []);
    if (statsData) setStats(statsData);
    if (slides) setSlidesList(slides);
  };

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  if (!user || user.role !== 'admin') {
    return (
      <main className="detail">
        <div className="detail-card">
          <h2>Admin access required.</h2>
          <Link className="btn" to="/login">Go to Login</Link>
        </div>
      </main>
    );
  }

  const submitCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await authFetch(token, '/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCategory })
    });
    if (!res.ok) {
      toast.error('Category add failed.');
      return;
    }
    setNewCategory('');
    toast.success('Category added.');
    loadAll();
  };

  const submitProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) return;
    const body = new FormData();
    const plans = normalizePlans(newProduct.plans, newProduct.price);
    body.append('name', newProduct.name);
    body.append('price', newProduct.price);
    body.append('categoryId', newProduct.categoryId);
    body.append('status', newProduct.status);
    body.append('details', newProduct.details || '');
    body.append('terms', newProduct.terms || '');
    body.append('plans', JSON.stringify(plans));
    if (newProduct.file) body.append('image', newProduct.file);
    const res = await authFetch(token, '/api/admin/products', {
      method: 'POST',
      body
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdminMessage(data.message || 'Product create failed.');
      toast.error(data.message || 'Product create failed.');
      return;
    }
    setAdminMessage('Product added.');
    toast.success('Product added.');
    setNewProduct({
      name: '',
      price: '',
      categoryId: '',
      status: 'in',
      details: '',
      terms: '',
      file: null,
      plans: [
        { label: '1 Month', price: '' },
        { label: '2 Months', price: '' },
        { label: '3 Months', price: '' }
      ]
    });
    loadAll();
  };

  const updateOrderStatus = async (orderId, fallbackStatus) => {
    const current = orderStatusMap[orderId];
    const nextStatus = current?.status || fallbackStatus;
    if (!nextStatus) return;
    const res = await authFetch(token, `/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: nextStatus, note: current?.note || '' })
    });
    if (!res.ok) {
      toast.error('Order status update failed.');
      return;
    }
    toast.success('Order status updated.');
    loadAll();
  };

  const submitPayment = async () => {
    const { orderId, userId, amount, method, status } = newPayment;
    if (!orderId || !userId || !amount || !method || !status) return;
    const res = await authFetch(token, '/api/admin/payments', {
      method: 'POST',
      body: JSON.stringify(newPayment)
    });
    if (!res.ok) {
      toast.error('Payment add failed.');
      return;
    }
    toast.success('Payment added.');
    setNewPayment({ orderId: '', userId: '', amount: '', method: '', status: '' });
    loadAll();
  };

  const submitFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const body = {
      question: newFaq.question,
      answer: newFaq.answer,
      sortOrder: newFaq.sortOrder,
      isActive: newFaq.isActive ? 1 : 0
    };
    if (editingFaqId) {
      const res = await authFetch(token, `/api/admin/faqs/${editingFaqId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        toast.error('FAQ update failed.');
        return;
      }
      toast.success('FAQ updated.');
    } else {
      const res = await authFetch(token, '/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        toast.error('FAQ add failed.');
        return;
      }
      toast.success('FAQ added.');
    }
    setEditingFaqId('');
    setNewFaq({ question: '', answer: '', sortOrder: 0, isActive: true });
    loadAll();
  };

  const editFaq = (faq) => {
    setEditingFaqId(faq.id);
    setNewFaq({
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder || 0,
      isActive: !!faq.isActive
    });
  };

  const deleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    const res = await authFetch(token, `/api/admin/faqs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('FAQ delete failed.');
      return;
    }
    toast.success('FAQ deleted.');
    loadAll();
  };

  const submitReview = async () => {
    if (!newReview.file) return;
    const body = new FormData();
    body.append('sortOrder', String(newReview.sortOrder || 0));
    body.append('isActive', newReview.isActive ? '1' : '0');
    body.append('image', newReview.file);
    const res = await authFetch(token, '/api/admin/reviews', { method: 'POST', body });
    if (!res.ok) {
      toast.error('Review upload failed.');
      return;
    }
    toast.success('Review added.');
    setNewReview({ sortOrder: 0, isActive: true, file: null });
    loadAll();
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    const res = await authFetch(token, `/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Review delete failed.');
      return;
    }
    toast.success('Review deleted.');
    loadAll();
  };

  const savePage = async () => {
    if (!editingPage) return;
    const res = await authFetch(token, `/api/admin/pages/${editingPage.slug}`, {
      method: 'PUT',
      body: JSON.stringify({ title: editingPage.title, content: editingPage.content })
    });
    if (!res.ok) {
      toast.error('Page update failed.');
      return;
    }
    toast.success('Page updated.');
    setEditingPage(null);
    loadAll();
  };

  const loadAdminTicket = async (id) => {
    const res = await authFetch(token, `/api/admin/tickets/${id}`);
    if (!res.ok) {
      toast.error('Ticket load failed.');
      return;
    }
    const data = await res.json();
    setActiveAdminTicket(data);
  };

  const sendAdminTicket = async () => {
    if (!activeAdminTicket?.id || !adminTicketMessage.trim()) return;
    const body = new FormData();
    body.append('message', adminTicketMessage);
    if (adminTicketFile) body.append('file', adminTicketFile);
    const res = await authFetch(token, `/api/admin/tickets/${activeAdminTicket.id}/messages`, {
      method: 'POST',
      body
    });
    if (!res.ok) {
      toast.error('Message send failed.');
      return;
    }
    toast.success('Message sent.');
    setAdminTicketMessage('');
    setAdminTicketFile(null);
    loadAdminTicket(activeAdminTicket.id);
  };

  const closeAdminTicket = async () => {
    if (!activeAdminTicket?.id) return;
    const res = await authFetch(token, `/api/admin/tickets/${activeAdminTicket.id}/close`, {
      method: 'POST'
    });
    if (!res.ok) {
      toast.error('Close failed.');
      return;
    }
    toast.success('Ticket closed.');
    loadAll();
    loadAdminTicket(activeAdminTicket.id);
  };

  const startEditProduct = (p) => {
    setEditingProductId(p.id ?? p._id);
    setNewProduct({
      name: p.name,
      price: p.price,
      categoryId: (p.category?.id ?? p.category?._id) || '',
      status: p.status,
      details: p.details || '',
      terms: p.terms || '',
      file: null,
      plans: Array.isArray(p.plans) && p.plans.length > 0
        ? p.plans
        : [
            { label: '1 Month', price: p.price || '' },
            { label: '2 Months', price: '' },
            { label: '3 Months', price: '' }
          ]
    });
    setPreviewUrl(p.imageUrl ? `${API_URL}${p.imageUrl}` : '');
  };

  const saveEditProduct = async () => {
    if (!editingProductId) return;
    const body = new FormData();
    const plans = normalizePlans(newProduct.plans, newProduct.price);
    body.append('name', newProduct.name);
    body.append('price', newProduct.price);
    body.append('categoryId', newProduct.categoryId);
    body.append('status', newProduct.status);
    body.append('details', newProduct.details || '');
    body.append('terms', newProduct.terms || '');
    body.append('plans', JSON.stringify(plans));
    if (newProduct.file) body.append('image', newProduct.file);
    const res = await authFetch(token, `/api/admin/products/${editingProductId}`, {
      method: 'PUT',
      body
    });
    if (!res.ok) {
      toast.error('Product update failed.');
      return;
    }
    toast.success('Product updated.');
    setEditingProductId('');
    setNewProduct({
      name: '',
      price: '',
      categoryId: '',
      status: 'in',
      details: '',
      terms: '',
      file: null,
      plans: [
        { label: '1 Month', price: '' },
        { label: '2 Months', price: '' },
        { label: '3 Months', price: '' }
      ]
    });
    setPreviewUrl('');
    loadAll();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const res = await authFetch(token, `/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Product delete failed.');
      return;
    }
    toast.success('Product deleted.');
    loadAll();
  };

  const onFilePick = (file) => {
    if (!file) return;
    setNewProduct((prev) => ({ ...prev, file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    const res = await authFetch(token, `/api/admin/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Category delete failed.');
      return;
    }
    toast.success('Category deleted.');
    loadAll();
  };

  const updatePaymentStatus = async (id, status) => {
    const res = await authFetch(token, `/api/admin/payments/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminMessage: paymentNoteMap[id] || '' })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAdminMessage(data.message || 'Payment status update failed.');
      toast.error(data.message || 'Payment status update failed.');
      return;
    }
    setAdminMessage(`Payment ${id} updated to ${status}.`);
    toast.success(`Payment ${status}.`);
    loadAll();
  };

  const filtered = (list, fields) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) =>
      fields.some((field) => String(field(item) || '').toLowerCase().includes(q))
    );
  };

  const paginate = (list) => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const pagedProducts = paginate(filtered(productsList, [(p) => p.name, (p) => p.price, (p) => p.status]));
  const pagedCategories = paginate(filtered(categoriesList, [(c) => c.name]));
  const pagedOrders = paginate(filtered(ordersList, [(o) => o.id ?? o._id, (o) => o.status]));
  const pagedUsers = paginate(filtered(usersList, [(u) => u.email, (u) => u.role]));
  const pagedPayments = paginate(filtered(paymentsList, [(p) => p.id ?? p._id, (p) => p.status, (p) => p.amount]));

  const totalPages = (list) => Math.max(1, Math.ceil(list.length / pageSize));

  return (
    <main className="dashboard">
      <div className="dashboard-card">
        <h2>Admin Panel</h2>
        <div className="stats-grid">
          <div className="stat-card">Users: {stats.users}</div>
          <div className="stat-card">Products: {stats.products}</div>
          <div className="stat-card">Orders: {stats.orders}</div>
          <div className="stat-card">Payments: {stats.payments}</div>
        </div>
        <input
          className="admin-search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="tabs admin-tabs">
          {['Products', 'Categories', 'Orders', 'Users', 'Payments', 'Slides', 'FAQs', 'Reviews', 'Pages', 'Tickets'].map((label) => (
            <button key={label} className={`tab ${tab === label ? 'active' : ''}`} onClick={() => setTab(label)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'Categories' && (
          <div className="admin-section">
            <div className="admin-form">
              <input
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="btn" onClick={submitCategory}>Add Category</button>
            </div>
            <div className="admin-list">
              {pagedCategories.map((c) => (
                <div key={c.id ?? c._id} className="admin-item admin-row">
                  <span>{c.name}</span>
                  <button className="btn outline" onClick={() => deleteCategory(c.id ?? c._id)}>Delete</button>
                </div>
              ))}
            </div>
            <Pagination page={page} total={totalPages(filtered(categoriesList, [(c) => c.name]))} onPage={setPage} />
          </div>
        )}

        {tab === 'Products' && (
          <div className="admin-section">
            <div className="admin-form grid-form">
              <input
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
              <input
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
              {newProduct.plans.map((plan, idx) => (
                <div className="plan-row" key={`plan-${idx}`}>
                  <input
                    placeholder={`Plan ${idx + 1} label`}
                    value={plan.label}
                    onChange={(e) => {
                      const next = [...newProduct.plans];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setNewProduct({ ...newProduct, plans: next });
                    }}
                  />
                  <input
                    placeholder={`Plan ${idx + 1} price`}
                    value={plan.price}
                    onChange={(e) => {
                      const next = [...newProduct.plans];
                      next[idx] = { ...next[idx], price: e.target.value };
                      setNewProduct({ ...newProduct, plans: next });
                    }}
                  />
                  <button
                    type="button"
                    className="btn outline small"
                    onClick={() => {
                      if (newProduct.plans.length <= 1) return;
                      const next = newProduct.plans.filter((_, i) => i !== idx);
                      setNewProduct({ ...newProduct, plans: next });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn outline"
                onClick={() =>
                  setNewProduct((prev) => ({
                    ...prev,
                    plans: [...prev.plans, { label: '', price: '' }]
                  }))
                }
              >
                Add Plan Row
              </button>
              <select
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categoriesList.map((c) => (
                  <option key={c.id ?? c._id} value={c.id ?? c._id}>{c.name}</option>
                ))}
              </select>
              <select
                value={newProduct.status}
                onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
              >
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <textarea
                placeholder="Details (shown on product page)"
                value={newProduct.details}
                onChange={(e) => setNewProduct({ ...newProduct, details: e.target.value })}
              />
              <textarea
                placeholder="Terms & Conditions (shown on product page)"
                value={newProduct.terms}
                onChange={(e) => setNewProduct({ ...newProduct, terms: e.target.value })}
              />
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFilePick(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  type="file"
                  onChange={(e) => onFilePick(e.target.files?.[0] || null)}
                />
                <span>Drag image here or click to upload</span>
                {previewUrl && <img src={previewUrl} alt="Preview" />}
              </div>
              {editingProductId ? (
                <button className="btn" onClick={saveEditProduct}>Save Changes</button>
              ) : (
                <button className="btn" onClick={submitProduct}>Add Product</button>
              )}
            </div>
            {adminMessage && <div className="message-box">{adminMessage}</div>}
            <div className="admin-list">
              {pagedProducts.map((p) => (
                <div key={p.id ?? p._id} className="admin-item admin-row">
                  <span>{p.name} — {p.price} ({p.status})</span>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => startEditProduct(p)}>Edit</button>
                    <button className="btn outline" onClick={() => deleteProduct(p.id ?? p._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={totalPages(filtered(productsList, [(p) => p.name, (p) => p.price, (p) => p.status]))} onPage={setPage} />
          </div>
        )}

        {tab === 'Orders' && (
          <div className="admin-section">
            <div className="admin-list">
              {pagedOrders.map((o) => (
                <div key={o.id ?? o._id} className="admin-item">
                  <div className="admin-row">
                    <span>{o.id ?? o._id} — {o.status}</span>
                    <button className="btn outline" onClick={() => updateOrderStatus(o.id ?? o._id, o.status)}>Update</button>
                  </div>
                  <div className="admin-form grid-form">
                    <select
                      value={orderStatusMap[o.id ?? o._id]?.status || o.status}
                      onChange={(e) =>
                        setOrderStatusMap((prev) => ({
                          ...prev,
                          [o.id ?? o._id]: { ...prev[o.id ?? o._id], status: e.target.value }
                        }))
                      }
                    >
                    {['Pending', 'Paid', 'Processing', 'Delivered', 'Completed', 'Cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    </select>
                    <input
                      placeholder="Note"
                      value={orderStatusMap[o.id ?? o._id]?.note || ''}
                      onChange={(e) =>
                        setOrderStatusMap((prev) => ({
                          ...prev,
                          [o.id ?? o._id]: { ...prev[o.id ?? o._id], note: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={totalPages(filtered(ordersList, [(o) => o.id ?? o._id, (o) => o.status]))} onPage={setPage} />
          </div>
        )}

        {tab === 'Users' && (
          <div className="admin-section">
            <div className="admin-list">
              {pagedUsers.map((u) => (
                <div key={u.id ?? u._id} className="admin-item admin-row">
                  <div>
                    <strong>{u.email}</strong>
                    <div className="muted">Role: {u.role}</div>
                    <div className="muted">WhatsApp: {u.whatsapp || '-'}</div>
                    <input
                      className="inline-input"
                      placeholder="Edit name"
                      value={userEditMap[u.id ?? u._id]?.name ?? u.name ?? ''}
                      onChange={(e) =>
                        setUserEditMap((prev) => ({
                          ...prev,
                          [u.id ?? u._id]: { ...prev[u.id ?? u._id], name: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn outline"
                      onClick={() =>
                        authFetch(token, `/api/admin/users/${u.id ?? u._id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ name: userEditMap[u.id ?? u._id]?.name || u.name })
                        }).then(loadAll)
                      }
                    >
                      Save
                    </button>
                    <button className="btn outline" onClick={() => authFetch(token, `/api/admin/users/${u.id ?? u._id}`, { method: 'PUT', body: JSON.stringify({ role: 'admin' }) }).then(loadAll)}>Make Admin</button>
                    <button className="btn outline" onClick={() => authFetch(token, `/api/admin/users/${u.id ?? u._id}`, { method: 'PUT', body: JSON.stringify({ role: 'user' }) }).then(loadAll)}>Make User</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={totalPages(filtered(usersList, [(u) => u.email, (u) => u.role]))} onPage={setPage} />
          </div>
        )}

        {tab === 'Payments' && (
          <div className="admin-section">
            <div className="admin-form grid-form">
              <input
                placeholder="Order ID"
                value={newPayment.orderId}
                onChange={(e) => setNewPayment({ ...newPayment, orderId: e.target.value })}
              />
              <input
                placeholder="User ID"
                value={newPayment.userId}
                onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
              />
              <input
                placeholder="Amount"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
              <input
                placeholder="Method"
                value={newPayment.method}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
              />
              <input
                placeholder="Status"
                value={newPayment.status}
                onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })}
              />
              <button className="btn" onClick={submitPayment}>Add Payment</button>
            </div>
            <div className="admin-list">
              {pagedPayments.map((p) => (
                <div key={p.id ?? p._id} className="admin-item admin-row">
                  <div>
                    <strong>{p.id ?? p._id}</strong>
                    <div className="muted">Order: {p.orderId} | User: {p.userId}</div>
                    <div className="muted">Method: {p.method} | Amount: {p.amount}</div>
                    <div className="muted">Trx: {p.trxId || '-'} | Note: {p.note || '-'}</div>
                    {p.adminMessage && <div className="muted">Admin msg: {p.adminMessage}</div>}
                    <input
                      className="inline-input"
                      placeholder="Admin message (sent to user)"
                      value={paymentNoteMap[p.id ?? p._id] ?? ''}
                      onChange={(e) =>
                        setPaymentNoteMap((prev) => ({
                          ...prev,
                          [p.id ?? p._id]: e.target.value
                        }))
                      }
                    />
                  </div>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => updatePaymentStatus(p.id ?? p._id, 'Verified')}>Verify</button>
                    <button className="btn outline" onClick={() => updatePaymentStatus(p.id ?? p._id, 'Rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={totalPages(filtered(paymentsList, [(p) => p.id ?? p._id, (p) => p.status, (p) => p.amount]))} onPage={setPage} />
          </div>
        )}

        {tab === 'FAQs' && (
          <div className="admin-section">
            <div className="admin-form grid-form">
              <input
                placeholder="Question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              />
              <input
                placeholder="Sort order"
                value={newFaq.sortOrder}
                onChange={(e) => setNewFaq({ ...newFaq, sortOrder: e.target.value })}
              />
              <textarea
                placeholder="Answer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={newFaq.isActive}
                  onChange={(e) => setNewFaq({ ...newFaq, isActive: e.target.checked })}
                />
                Active
              </label>
              <button className="btn" onClick={submitFaq}>
                {editingFaqId ? 'Save FAQ' : 'Add FAQ'}
              </button>
            </div>
            <div className="admin-list">
              {faqsList.map((f) => (
                <div key={f.id} className="admin-item admin-row">
                  <div>
                    <strong>{f.question}</strong>
                    <div className="muted">Order: {f.sortOrder} | {f.isActive ? 'Active' : 'Hidden'}</div>
                    <div className="muted">{f.answer}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => editFaq(f)}>Edit</button>
                    <button className="btn outline" onClick={() => deleteFaq(f.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Reviews' && (
          <div className="admin-section">
            <div className="admin-form grid-form">
              <input
                placeholder="Sort order"
                value={newReview.sortOrder}
                onChange={(e) => setNewReview({ ...newReview, sortOrder: e.target.value })}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={newReview.isActive}
                  onChange={(e) => setNewReview({ ...newReview, isActive: e.target.checked })}
                />
                Active
              </label>
              <div className="dropzone">
                <input type="file" onChange={(e) => setNewReview({ ...newReview, file: e.target.files?.[0] || null })} />
                <span>Upload review image</span>
              </div>
              <button className="btn" onClick={submitReview}>Add Review</button>
            </div>
            <div className="admin-list">
              {reviewsList.map((r) => (
                <div key={r.id} className="admin-item admin-row">
                  <span>Review #{r.id} (order {r.sortOrder})</span>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => deleteReview(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Pages' && (
          <div className="admin-section">
            <div className="admin-list">
              {pagesList.map((p) => (
                <div key={p.slug} className="admin-item admin-row">
                  <div>
                    <strong>{p.title}</strong>
                    <div className="muted">Slug: {p.slug}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => setEditingPage(p)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
            {editingPage && (
              <div className="admin-form">
                <div className="muted">Markdown supported (e.g., # Title, **bold**, - list).</div>
                <input
                  placeholder="Title"
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                />
                <textarea
                  placeholder="Content"
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                />
                <div className="row-actions">
                  <button className="btn" onClick={savePage}>Save Page</button>
                  <button className="btn outline" onClick={() => setEditingPage(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Tickets' && (
          <div className="admin-section">
            <div className="admin-list">
              {ticketsList.map((t) => (
                <div key={t.id} className="admin-item admin-row">
                  <div>
                    <strong>{t.subject}</strong>
                    <div className="muted">User: {t.userEmail}</div>
                    <div className="muted">Status: {t.status}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn outline" onClick={() => loadAdminTicket(t.id)}>Open</button>
                  </div>
                </div>
              ))}
            </div>
            {activeAdminTicket && (
              <div className="detail-section">
                <h3>Ticket: {activeAdminTicket.subject}</h3>
                <div className="chat-box">
                  {activeAdminTicket.messages?.map((m) => (
                    <div key={m.id} className={`chat-line ${m.sender}`}>
                      <strong>{m.sender}:</strong> {m.message}
                      {m.imageUrl && (
                        <div className="chat-attachment">
                          <img src={`${API_URL}${m.imageUrl}`} alt="attachment" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {activeAdminTicket.status === 'open' ? (
                  <div className="admin-form">
                    <input
                      placeholder="Reply"
                      value={adminTicketMessage}
                      onChange={(e) => setAdminTicketMessage(e.target.value)}
                    />
                    <input type="file" onChange={(e) => setAdminTicketFile(e.target.files?.[0] || null)} />
                    <div className="row-actions">
                      <button className="btn outline" onClick={sendAdminTicket}>Send</button>
                      <button className="btn" onClick={closeAdminTicket}>Close Ticket</button>
                    </div>
                  </div>
                ) : (
                  <div className="muted">Ticket is closed.</div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'Slides' && (
          <div className="admin-section">
            <div className="admin-form grid-form">
              <input
                placeholder="Slide title"
                value={newSlide.title}
                onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
              />
              <input
                placeholder="Sort order (0..)"
                value={newSlide.sortOrder}
                onChange={(e) => setNewSlide({ ...newSlide, sortOrder: e.target.value })}
              />
              <textarea
                placeholder="Slide body"
                value={newSlide.body}
                onChange={(e) => setNewSlide({ ...newSlide, body: e.target.value })}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={newSlide.isActive}
                  onChange={(e) => setNewSlide({ ...newSlide, isActive: e.target.checked })}
                />
                Active
              </label>
              <div className="dropzone">
                <input type="file" onChange={(e) => setNewSlide({ ...newSlide, file: e.target.files?.[0] || null })} />
                <span>Drag image here or click to upload</span>
              </div>
              <button
                className="btn"
                onClick={async () => {
                  if (!newSlide.title) return;
                  const body = new FormData();
                  body.append('title', newSlide.title);
                  body.append('body', newSlide.body);
                  body.append('isActive', newSlide.isActive ? '1' : '0');
                  body.append('sortOrder', String(newSlide.sortOrder || 0));
                  if (newSlide.file) body.append('image', newSlide.file);
                  const res = await authFetch(token, '/api/admin/slides', { method: 'POST', body });
                  if (res.ok) {
                    setNewSlide({ title: '', body: '', isActive: true, sortOrder: 0, file: null });
                    loadAll();
                  }
                }}
              >
                Add Slide
              </button>
            </div>
            <div className="admin-list">
              {slidesList.map((s) => (
                <div key={s.id} className="admin-item admin-row">
                  <span>{s.title} (order {s.sortOrder})</span>
                  <div className="row-actions">
                    <button
                      className="btn outline"
                      onClick={async () => {
                        await authFetch(token, `/api/admin/slides/${s.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({
                            title: s.title,
                            body: s.body,
                            isActive: s.isActive ? 0 : 1,
                            sortOrder: s.sortOrder
                          })
                        });
                        loadAll();
                      }}
                    >
                      {s.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn outline"
                      onClick={async () => {
                        await authFetch(token, `/api/admin/slides/${s.id}`, { method: 'DELETE' });
                        loadAll();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Pagination({ page, total, onPage }) {
  return (
    <div className="pagination">
      <button className="btn outline" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
        Prev
      </button>
      <span>Page {page} / {total}</span>
      <button className="btn outline" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total}>
        Next
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gc_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gc_token') || '');
  const [cartItems, setCartItems] = useState([]);

  const handleAuth = (data) => {
    if (data?.token) {
      localStorage.setItem('gc_token', data.token);
      setToken(data.token);
    }
    if (data?.user) {
      localStorage.setItem('gc_user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gc_user');
    localStorage.removeItem('gc_token');
    setUser(null);
    setToken('');
  };

  const addToCart = (item) => {
    setCartItems((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const updateUser = (next) => {
    localStorage.setItem('gc_user', JSON.stringify(next));
    setUser(next);
  };

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout} cartCount={cartItems.length}>
        <Routes>
          <Route path="/" element={<Home onAddToCart={addToCart} />} />
          <Route path="/product/:id" element={<ProductDetail onAddToCart={addToCart} />} />
          <Route path="/register" element={<Register onAuth={handleAuth} />} />
          <Route path="/login" element={<Login onAuth={handleAuth} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/category/:slug" element={<CategoryPage onAddToCart={addToCart} />} />
          <Route path="/explore" element={<Explore onAddToCart={addToCart} />} />
          <Route path="/dashboard" element={<Dashboard user={user} token={token} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUser={updateUser} />} />
          <Route path="/cart" element={<Cart cartItems={cartItems} onRemove={removeFromCart} onClear={clearCart} />} />
          <Route path="/checkout" element={<Checkout cartItems={cartItems} onClear={clearCart} />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/support" element={<SupportTickets user={user} token={token} />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/policy/:slug" element={<PolicyPage />} />
          <Route path="/admin" element={<AdminPanel user={user} token={token} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
