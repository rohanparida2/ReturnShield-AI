import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  analyzeProduct,
  getAlternatives,
  getEvidence,
  getProduct,
  getProducts,
} from "./api.js";

const categories = ["All gear", "Running shoes", "Apparel", "Headphones"];
const categorySlug = {
  "All gear": "all",
  "Running shoes": "running shoes",
  Apparel: "apparel",
  Headphones: "headphones",
};
const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/" aria-label="ReturnShield home">
          <span className="brand-mark"><ShieldCheck size={21} strokeWidth={2.2} /></span>
          <span>return<span className="brand-accent">shield</span></span>
        </Link>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <Link to="/">Shop</Link>
          <a href="#how-it-works">How it works</a>
          <a href="#our-promise">Our promise</a>
        </nav>
        <div className="topbar-actions">
          <button className="icon-button desktop-icon" aria-label="Search"><Search size={19} /></button>
          <button className="icon-button desktop-icon" aria-label="Saved items"><Heart size={19} /></button>
          <button className="bag-button" aria-label="Shopping bag"><ShoppingBag size={18} /><span>0</span></button>
          <button className="icon-button menu-button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Rating({ value = 4.8, count = 124 }) {
  return <span className="rating"><Star size={15} fill="currentColor" /><b>{value}</b><span>({count})</span></span>;
}

function Catalog() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState("All gear");
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch((err) => setError(err.message));
  }, []);

  const shown = useMemo(
    () => products
      .filter((product) => active === "All gear" || product.category === categorySlug[active])
      .sort((a, b) => {
        const priority = { "stride-pro-1": 0, "widecloud-walker": 1 };
        return (priority[a.id] ?? 2) - (priority[b.id] ?? 2);
      }),
    [products, active],
  );

  return (
    <main>
      <section className="catalog-hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> A smarter way to shop</span>
          <h1>Love what you buy.<br /><span>Keep what you love.</span></h1>
          <p>Real customer stories, matched to you. Find your just-right fit before it ships.</p>
          <a className="hero-link" href="#shop">Find your fit <ArrowRight size={17} /></a>
        </div>
        <div className="hero-art" aria-label="Shoes and accessories illustration">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-product-photo">
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=85" alt="Bright running shoe" />
          </div>
          <div className="hero-note"><span className="note-icon"><BadgeCheck size={16} /></span><span><b>Your fit, figured out</b><small>Before it gets to your door</small></span></div>
          <div className="hero-sparkle sparkle-one">✳</div>
          <div className="hero-sparkle sparkle-two">✦</div>
        </div>
        <div className="hero-stats">
          <span><strong>40+</strong> products picked for comfort</span>
          <i />
          <span><strong>1,200</strong> real shopper reviews</span>
          <i />
          <span><strong>Less guesswork.</strong> Better choices.</span>
        </div>
      </section>

      <section className="catalog-section" id="shop">
        <div className="section-heading">
          <div><span className="eyebrow muted-eyebrow">SHOP YOUR WAY</span><h2>Find your new favorite</h2></div>
          <button className="sort-button">Featured <ChevronDown size={16} /></button>
        </div>
        <div className="category-tabs" role="tablist" aria-label="Product category">
          {categories.map((category) => (
            <button key={category} className={active === category ? "category-tab active" : "category-tab"} onClick={() => setActive(category)}>
              {category}
            </button>
          ))}
        </div>
        {error ? <div className="notice error-notice">Could not load products: {error}</div> : null}
        <div className="product-grid">
          {shown.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
        {!shown.length && !error ? <div className="loading-catalog">Loading the good stuff…</div> : null}
      </section>
      <section className="promise-strip" id="how-it-works">
        <div className="promise-icon"><ShieldCheck size={25} /></div>
        <div><span className="eyebrow muted-eyebrow">THE RETURNS-LESS PROMISE</span><h2>Because the best return is the one you never have to make.</h2></div>
        <p>We turn customer reviews into a little more confidence at checkout. Real shoppers, your needs, a better match.</p>
        <a id="our-promise" href="#shop" aria-label="Shop products"><ArrowUpRight size={22} /></a>
      </section>
      <footer className="footer"><Link className="brand" to="/"><span className="brand-mark"><ShieldCheck size={19} /></span><span>return<span className="brand-accent">shield</span></span></Link><span>Thoughtful shopping starts here.</span><span>© 2026 ReturnShield</span></footer>
    </main>
  );
}

function ProductCard({ product, index }) {
  const categoriesById = { "stride-pro-1": "BEST FOR EVERYDAY", "widecloud-walker": "ROOM TO MOVE" };
  return (
    <Link className="product-card" to={`/products/${product.id}`}>
      <div className={`product-card-image product-tone-${index % 4}`}>
        <img src={product.image_url} alt={product.name} loading="lazy" />
        <span className="product-tag">{categoriesById[product.id] || (product.category === "running shoes" ? "MOVE WITH EASE" : product.category === "apparel" ? "EVERYDAY COMFORT" : "SOUND GOOD")}</span>
        <button className="favorite-button" aria-label={`Save ${product.name}`} onClick={(event) => event.preventDefault()}><Heart size={18} /></button>
        <span className="image-count">01 / 03</span>
      </div>
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <div className="card-bottom"><strong>{formatPrice(product.price)}</strong><Rating value={product.average_rating.toFixed(1)} count={product.review_count} /></div>
        <span className="card-discover">Discover your fit <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}

function ProductPage() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("9");
  const [notice, setNotice] = useState("");
  const swapped = location.state?.swapped;

  useEffect(() => {
    setProduct(null);
    setError("");
    getProduct(productId).then(setProduct).catch((err) => setError(err.message));
  }, [productId]);

  const swapTo = (alternative) => {
    navigate(`/products/${alternative.product.id}`, {
      state: {
        swapped: {
          result: alternative.result,
          context: alternative.context,
          chips: alternative.chips,
        },
      },
    });
  };

  if (error) return <main className="page-wrap"><div className="notice error-notice">{error} <Link to="/">Back to shop</Link></div></main>;
  if (!product) return <main className="page-wrap"><div className="loading-catalog">Finding your product…</div></main>;
  const gallery = [product.image_url, product.image_url, product.image_url];
  return (
    <main className="product-page page-wrap">
      <div className="breadcrumbs"><Link to="/">Shop</Link><span>/</span><span>{product.category}</span><span>/</span><b>{product.name}</b></div>
      {swapped ? <div className="swap-success"><BadgeCheck size={18} /> Smart Swap found a better fit for you. Your shopper context is still here.</div> : null}
      <div className="product-detail-grid">
        <section className="gallery-column" aria-label="Product gallery">
          <div className="main-product-image">
            <img src={gallery[activeImage]} alt={`${product.name}, view ${activeImage + 1}`} />
            <span className="gallery-label">MADE FOR YOUR EVERYDAY</span>
            <button className="gallery-arrow gallery-prev" aria-label="Previous image" onClick={() => setActiveImage((activeImage + 2) % 3)}><ArrowLeft size={18} /></button>
            <button className="gallery-arrow gallery-next" aria-label="Next image" onClick={() => setActiveImage((activeImage + 1) % 3)}><ArrowRight size={18} /></button>
          </div>
          <div className="thumbnail-row">{gallery.map((image, index) => <button key={index} className={activeImage === index ? "thumbnail active" : "thumbnail"} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`}><img src={image} alt="" /></button>)}</div>
        </section>

        <section className="buy-box">
          <span className="eyebrow muted-eyebrow">{product.category.toUpperCase()} · EVERYDAY COLLECTION</span>
          <h1>{product.name}</h1>
          <div className="buy-rating"><Rating value={product.average_rating.toFixed(1)} count={product.review_count} /><span className="rating-separator">·</span><a href="#customer-reviews">Read all reviews</a></div>
          <p className="product-price">{formatPrice(product.price)} <span>Inclusive of all taxes</span></p>
          <p className="product-description">{product.specs.details} Thoughtfully designed to keep you comfortable, wherever your day takes you.</p>
          <div className="buy-divider" />
          {product.category === "running shoes" ? <div className="size-guide-line"><span>Choose your size <span className="required">*</span></span><button>Size guide <ArrowUpRight size={14} /></button></div> : null}
          {product.category === "running shoes" ? <div className="size-options" role="group" aria-label="Choose shoe size">{["6", "7", "8", "9", "10", "11"].map((item) => <button key={item} className={size === item ? "size-option selected" : "size-option"} onClick={() => setSize(item)}>{item}</button>)}</div> : null}
          <div className="buy-actions"><button className="add-bag-button" onClick={() => setNotice("Added to your bag — great choice!")}>Add to bag <ArrowRight size={17} /></button><button className="wishlist-button" aria-label="Add to wishlist"><Heart size={19} /></button></div>
          {notice ? <div className="bag-notice" role="status">{notice}</div> : null}
          <div className="delivery-line"><span className="delivery-dot" /> Ships free · Easy 30-day returns</div>
        </section>
      </div>

      <section className="widget-anchor">
        <ReturnShieldWidget
          key={product.id}
          product={product}
          initial={swapped}
          onSwap={swapTo}
        />
      </section>
      <section className="product-info-grid" id="customer-reviews">
        <div><span className="eyebrow muted-eyebrow">THE DETAILS</span><h2>Made for moving through your day.</h2></div>
        <div className="spec-list">{Object.entries(product.specs).map(([key, value]) => <div key={key}><span>{key.replace("_", " ")}</span><p>{value}</p></div>)}</div>
      </section>
    </main>
  );
}

const chipOptions = [
  { key: "height", label: "Height", options: ["5'4\"–5'7\"", "5'8\"–5'11\"", "6'0\"+"] },
  { key: "use_case", label: "Use it for", options: ["Daily walking", "Running", "Gym & training"] },
  { key: "usual_size", label: "Usual size", options: ["Size 8", "Size 9", "Size 10"] },
  { key: "preference", label: "Fit preference", options: ["Wide fit", "Roomy toe box", "Extra cushioning"] },
];

function ReturnShieldWidget({ product, initial, onSwap }) {
  const [state, setState] = useState(initial?.result ? (initial.result.label === "LowData" ? "low-data" : initial.result.score < 50 ? "low-score" : "result") : "idle");
  const [context, setContext] = useState(initial?.context || "");
  const [chips, setChips] = useState(initial?.chips || {});
  const [result, setResult] = useState(initial?.result || null);
  const [evidence, setEvidence] = useState({});
  const [alternatives, setAlternatives] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const setChip = (key, value) => setChips((current) => ({ ...current, [key]: current[key] === value ? "" : value }));

  async function loadEvidence(analysis) {
    const ids = [...new Set(analysis.reasons.flatMap((reason) => reason.evidence_ids))];
    const entries = await Promise.all(ids.map(async (id) => [id, await getEvidence(product.id, id)]));
    setEvidence(Object.fromEntries(entries));
  }

  async function runAnalysis(overrideContext = context, overrideChips = chips) {
    setState("loading");
    setError("");
    setAlternatives([]);
    try {
      const [analysis] = await Promise.all([
        analyzeProduct({ product_id: product.id, shopper_context: overrideContext, chips: overrideChips }),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
      setResult(analysis);
      setEvidence({});
      if (analysis.label !== "LowData") await loadEvidence(analysis);
      if (analysis.label === "LowData") {
        setState("low-data");
      } else if (analysis.score < 50) {
        setState("low-score");
        const found = await getAlternatives(product.id, [overrideContext, ...Object.values(overrideChips)].filter(Boolean).join(" "));
        setAlternatives(found);
      } else {
        setState("result");
      }
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  async function smartSwap(alternative) {
    setError("");
    try {
      const swappedResult = await analyzeProduct({ product_id: alternative.product.id, shopper_context: context, chips });
      onSwap({ ...alternative, result: swappedResult, context, chips });
    } catch (err) {
      setError(err.message);
    }
  }

  const labelClass = result?.label?.toLowerCase();
  return (
    <section className={`returnshield-widget ${state !== "idle" && state !== "input" ? `widget-${state}` : ""}`} aria-labelledby="widget-title">
      <div className="widget-heading-row">
        <div className="widget-brand-mark"><ShieldCheck size={21} /></div>
        <div><span className="eyebrow widget-eyebrow">A LITTLE MORE YOU, A LOT LESS GUESSWORK</span><h2 id="widget-title">Your fit, figured out.</h2></div>
        <span className="powered-pill"><Sparkles size={13} /> AI fit check</span>
      </div>
      {state === "idle" ? (
        <div className="widget-idle">
          <div><h3>Will this work for <em>you?</em></h3><p>Tell us what matters. We’ll find the helpful bits in real customer reviews.</p></div>
          <button className="analyze-button" onClick={() => setState("input")}>Check my fit <ArrowRight size={17} /></button>
          <div className="widget-trust"><ShieldCheck size={16} /> Personal to you, powered by real reviews</div>
        </div>
      ) : null}
      {state === "input" ? (
        <div className="widget-input">
          <label htmlFor="shopper-context">What should we know about you?</label>
          <textarea id="shopper-context" rows="3" maxLength="500" placeholder="e.g. I'm 5'8, wide feet, daily walking…" value={context} onChange={(event) => setContext(event.target.value)} />
          <div className="chip-groups">
            {chipOptions.map((group) => (
              <fieldset key={group.key} className="chip-group">
                <legend>{group.label}</legend>
                <div>{group.options.map((option) => <button key={option} type="button" className={chips[group.key] === option ? "choice-chip picked" : "choice-chip"} aria-pressed={chips[group.key] === option} onClick={() => setChip(group.key, option)}>{option}</button>)}</div>
              </fieldset>
            ))}
          </div>
          <div className="input-footer"><span>Your details stay in this session.</span><button className="analyze-button" onClick={() => runAnalysis()} disabled={!context.trim() && !Object.values(chips).some(Boolean)}>Analyze my fit <ArrowRight size={17} /></button></div>
        </div>
      ) : null}
      {state === "loading" ? (
        <div className="widget-loading" aria-live="polite">
          <div className="loading-copy"><span className="loading-spinner" /><div><b>Getting to know your fit…</b><p>Reading up to 15 reviews for you, not just skimming the stars.</p></div></div>
          <div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line short" />
        </div>
      ) : null}
      {state === "error" ? (
        <div className="widget-error" role="alert"><div><b>We couldn’t finish your fit check.</b><p>{error}</p></div><button className="secondary-button" onClick={() => runAnalysis()}>Try again</button></div>
      ) : null}
      {state === "low-data" ? (
        <div className="low-data-panel">
          <div className="low-data-icon"><Search size={22} /></div>
          <div><span className="result-label low-data-label">NOT ENOUGH MATCHING REVIEWS</span><h3>We need a little more to go on.</h3><p>Try adding a detail about your fit or how you’ll use it. We’ll only make a call when the reviews are relevant.</p><button className="text-button" onClick={() => setState("input")}>Add more about you <ArrowRight size={16} /></button></div>
        </div>
      ) : null}
      {state === "result" || state === "low-score" ? (
        <div className="widget-results">
          <div className="score-row">
            <div className={`score-gauge gauge-${labelClass}`} style={{ "--score": result.score }} role="img" aria-label={`${result.score} out of 100, ${result.label} match`}><div className="gauge-center"><strong>{result.score}</strong><span>out of 100</span></div></div>
            <div className="score-copy"><span className={`result-label label-${labelClass}`}>{result.label} MATCH</span><h3>{result.label === "Low" ? "A heads-up before you buy." : result.label === "High" ? "Looking good for you." : "A few things to consider."}</h3><p>{result.label === "Low" ? "Your needs may not line up with what shoppers are reporting." : "Based on reviews that sound most like what matters to you."}</p></div>
            <button className="edit-context" onClick={() => setState("input")}>Edit details</button>
          </div>
          <div className="results-content">
            <section className="reasons-section">
              <h4><Sparkles size={15} /> What shoppers like you are saying</h4>
              <div className="reason-list">
                {result.reasons.map((reason, index) => (
                  <div className={`reason-item ${expanded[index] ? "expanded" : ""}`} key={`${reason.text}-${index}`}>
                    <button className="reason-toggle" aria-expanded={Boolean(expanded[index])} onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))}>
                      <span className="reason-number">{String(index + 1).padStart(2, "0")}</span><span>{reason.text}</span><ChevronDown size={17} />
                    </button>
                    {expanded[index] ? <div className="evidence-stack">{reason.evidence_ids.map((id) => evidence[id] ? <blockquote key={id}><span className="quote-stars">★★★★★</span><p>“{evidence[id].text}”</p><cite>Verified shopper review · {evidence[id].rating}/5</cite></blockquote> : null)}</div> : null}
                  </div>
                ))}
              </div>
            </section>
            <section className="themes-section">
              <h4>What matters in the reviews</h4>
              {result.themes.map((theme) => <ThemeBar key={theme.aspect} theme={theme} />)}
            </section>
          </div>
          {result.red_flags.length ? <div className="red-flag-strip"><span>Worth knowing</span><div>{result.red_flags.map((flag) => <span key={flag}><span className="flag-dot" />{flag}</span>)}</div></div> : null}
          <div className="widget-disclaimer"><ShieldCheck size={15} /> AI guidance based on customer reviews, not a guarantee.</div>
          {state === "low-score" ? <Alternatives alternatives={alternatives} onSwap={smartSwap} error={error} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function ThemeBar({ theme }) {
  const title = { fit: "Fit & sizing", quality: "Quality", listing_accuracy: "Listing accuracy" }[theme.aspect];
  const color = theme.sentiment === "positive" ? "theme-positive" : theme.sentiment === "negative" ? "theme-negative" : "theme-mixed";
  return <div className="theme-row"><div className="theme-label"><span>{title}</span><span className={`theme-sentiment ${color}`}>{theme.sentiment}</span></div><div className="theme-track"><span className={color} style={{ width: `${Math.max(14, theme.share * 100)}%` }} /></div></div>;
}

function Alternatives({ alternatives, onSwap, error }) {
  if (!alternatives.length) return <div className="alternatives-loading"><span className="loading-spinner" />Finding a better match in the same category…</div>;
  return (
    <section className="alternatives-section">
      <div className="alternatives-heading"><div><span className="eyebrow muted-eyebrow">A BETTER FIT MIGHT BE OUT THERE</span><h3>Better match for you</h3></div><span className="alt-count">2 considered</span></div>
      <div className="alternatives-grid">{alternatives.map((alternative) => (
        <article className="alternative-card" key={alternative.product.id}>
          <Link to={`/products/${alternative.product.id}`} className="alternative-image"><img src={alternative.product.image_url} alt={alternative.product.name} /><span className="alt-badge"><Sparkles size={12} /> MATCH</span></Link>
          <div className="alternative-info"><div><h4>{alternative.product.name}</h4><p>{formatPrice(alternative.product.price)}</p></div><div className={`alt-score alt-${alternative.label.toLowerCase()}`}>{alternative.score ?? "—"}<span>score</span></div></div>
          <p className="alternative-fit">{alternative.label === "High" ? "Roomy fit · made for all-day comfort" : alternative.label === "Medium" ? "A more comfortable option to consider" : "This may still need a closer look"}</p>
          <button className="swap-button" onClick={() => onSwap(alternative)} disabled={alternative.label === "LowData"}>Smart Swap <ArrowRight size={16} /></button>
        </article>
      ))}</div>
      {error ? <p className="swap-inline-error" role="alert">{error}</p> : null}
    </section>
  );
}

function App() {
  return <><Header /><Routes><Route path="/" element={<Catalog />} /><Route path="/products/:productId" element={<ProductPage />} /><Route path="*" element={<Catalog />} /></Routes></>;
}

export default App;
