import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/portfolio.css';

const SECTIONS = ['home', 'about', 'skills', 'experience', 'projects', 'education'] as const;

export default function Portfolio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef(0);
  const [activeSection, setActiveSection] = useState(0);

  /* ── Canvas dot-grid background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    type Dot = { x: number; y: number; a: number; s: number; d: number };
    let W = 0, H = 0, dots: Dot[] = [], rafId = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const initDots = () => {
      dots = [];
      for (let r = 0; r <= Math.ceil(H / 50); r++)
        for (let c = 0; c <= Math.ceil(W / 50); c++)
          dots.push({ x: c * 50, y: r * 50, a: Math.random(), s: 0.3 + Math.random() * 0.7, d: Math.random() > 0.5 ? 1 : -1 });
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.a += 0.005 * d.s * d.d;
        if (d.a > 0.35 || d.a < 0) d.d *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${Math.max(0, d.a * 0.25)})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };

    resize(); initDots(); draw();
    const onResize = () => { resize(); initDots(); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafId); };
  }, []);

  /* ── Typewriter ── */
  useEffect(() => {
    const phrases = [
      'Building scalable web applications.',
      'React · Node.js · TypeScript · AWS.',
      'LLM API integrations.',
      'Production-grade end-to-end ownership.',
      'Mentoring and leading eng teams.',
    ];
    let pi = 0, ci = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const el = document.getElementById('pf-tw');
    if (!el) return;

    const tick = () => {
      const p = phrases[pi];
      if (!deleting) {
        el.textContent = p.slice(0, ++ci);
        if (ci === p.length) { deleting = true; timer = setTimeout(tick, 2200); return; }
      } else {
        el.textContent = p.slice(0, --ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      }
      timer = setTimeout(tick, deleting ? 40 : 70);
    };
    timer = setTimeout(tick, 1600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Scroll tracking ── */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handler = () => {
      const idx = Math.min(Math.round(el.scrollTop / window.innerHeight), SECTIONS.length - 1);
      activeSectionRef.current = idx;
      setActiveSection(idx);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  /* ── Reveal on scroll ── */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('pf-visible'); }),
      { root: scroller, threshold: 0.12 },
    );
    document.querySelectorAll('.pf-reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ── Keyboard navigation ── */
  const scrollTo = useCallback((idx: number) => {
    scrollerRef.current?.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') scrollTo(Math.min(activeSectionRef.current + 1, SECTIONS.length - 1));
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') scrollTo(Math.max(activeSectionRef.current - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scrollTo]);

  return (
    <div className="pf-root">
      <canvas ref={canvasRef} className="pf-canvas" />

      {/* ── Top nav ── */}
      <nav className="pf-topnav">
        <div className="pf-logo">MP<em>.dev</em></div>
        <ul className="pf-navlinks">
          {SECTIONS.map((s, i) => (
            <li key={s}>
              <a href="#" onClick={e => { e.preventDefault(); scrollTo(i); }}>_{s}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Side dots ── */}
      <nav className="pf-sidedots">
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            className={`pf-dot${activeSection === i ? ' pf-dot--active' : ''}`}
            onClick={() => scrollTo(i)}
            title={s}
          />
        ))}
      </nav>

      {/* ── Scroller ── */}
      <div className="pf-scroller" ref={scrollerRef}>

        {/* ════ SECTION 1: HERO ════ */}
        <section className="pf-section" style={{ textAlign: 'center', flexDirection: 'column' }}>
          <div className="pf-floaters">
            {[
              ['pf-dot-cyan',   'React.js'],
              ['pf-dot-purple', 'TypeScript'],
              ['pf-dot-green',  'Node.js'],
              ['pf-dot-cyan',   'PostgreSQL'],
              ['pf-dot-purple', 'AWS'],
              ['pf-dot-green',  'Next.js'],
              ['pf-dot-cyan',   'LLM APIs'],
            ].map(([cls, label], i) => (
              <div key={i} className="pf-floater">
                <span className={cls}>◈</span>{label}
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="pf-hero-pre">// Full Stack Developer · 4 Years</div>
            <h1 className="pf-hero-name">
              <span className="pf-line1">MAYUR</span>
              <span className="pf-line2">PATANKAR</span>
            </h1>
            <div className="pf-hero-subtitle">
              <span id="pf-tw" />
              <span className="pf-cursor" />
            </div>
            <div className="pf-hero-cta">
              <a className="pf-btn pf-btn-cyan" href="#" onClick={e => { e.preventDefault(); scrollTo(3); }}>View Experience</a>
              <a className="pf-btn pf-btn-ghost" href="#" onClick={e => { e.preventDefault(); scrollTo(5); }}>Get In Touch</a>
              <a className="pf-btn pf-btn-ghost" href="https://mp.iamkamisama.com/profile" target="_blank" rel="noopener noreferrer">Portfolio ↗</a>
            </div>
          </div>

          <div className="pf-hero-stats">
            <div className="pf-stat"><div className="pf-stat-n">4+</div><div className="pf-stat-l">Years Exp.</div></div>
            <div className="pf-stat-sep" />
            <div className="pf-stat"><div className="pf-stat-n">3</div><div className="pf-stat-l">Companies</div></div>
            <div className="pf-stat-sep" />
            <div className="pf-stat"><div className="pf-stat-n">10+</div><div className="pf-stat-l">Modules Built</div></div>
            <div className="pf-stat-sep" />
            <div className="pf-stat"><div className="pf-stat-n">E2E</div><div className="pf-stat-l">Ownership</div></div>
          </div>

          <div className="pf-scroll-hint">
            <div className="pf-scroll-arrow" />
            <span>SCROLL</span>
          </div>
        </section>

        {/* ════ SECTION 2: ABOUT ════ */}
        <section className="pf-section">
          <div className="pf-about-inner">
            <div className="pf-reveal">
              <div className="pf-sec-header pf-sec-header--left" style={{ marginBottom: '1.5rem' }}>
                <span className="pf-sec-tag">01 / about</span>
                <h2 className="pf-sec-title">Who I Am</h2>
                <div className="pf-sec-line pf-sec-line--left" />
              </div>
              <p className="pf-about-summary">
                Full Stack Developer with <strong>4 years</strong> of experience building{' '}
                <strong>scalable web applications</strong> using React, Node.js, TypeScript, and AWS.
                Proven track across <strong>e-commerce</strong>, <strong>ESG SaaS</strong>, and{' '}
                <strong>AI-augmented platforms</strong> — delivering end-to-end features, optimizing
                performance, and mentoring junior developers. Comfortable owning complete production
                environments and collaborating directly with cross-functional and client teams.
              </p>
              <ul className="pf-contact-list">
                <li><div className="pf-ic">✉</div><a href="mailto:workmayur862@gmail.com">workmayur862@gmail.com</a></li>
                <li><div className="pf-ic">✆</div><span>+91 9137082725</span></li>
                <li><div className="pf-ic">⌖</div><span>Navi Mumbai, India</span></li>
                <li><div className="pf-ic">↗</div><a href="https://mp.iamkamisama.com/profile" target="_blank" rel="noopener noreferrer">mp.iamkamisama.com/profile</a></li>
              </ul>
            </div>

            <div className="pf-terminal pf-reveal pf-d2">
              <div className="pf-term-header">
                <div className="pf-tdot pf-tdot-r" />
                <div className="pf-tdot pf-tdot-y" />
                <div className="pf-tdot pf-tdot-g" />
                <div className="pf-term-title">mayur.json</div>
              </div>
              <div className="pf-term-body">
                <span className="pf-t-prompt">{'{'}</span><br />
                &nbsp;&nbsp;<span className="pf-t-key">"role"</span>: <span className="pf-t-str">"Full Stack Developer"</span>,<br />
                &nbsp;&nbsp;<span className="pf-t-key">"experience"</span>: <span className="pf-t-num">4</span>,<br />
                &nbsp;&nbsp;<span className="pf-t-key">"location"</span>: <span className="pf-t-str">"Navi Mumbai, India"</span>,<br />
                &nbsp;&nbsp;<span className="pf-t-key">"current"</span>: <span className="pf-t-str">"FYND – Shopsence"</span>,<br />
                &nbsp;&nbsp;<span className="pf-t-key">"expertise"</span>: [<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="pf-t-str">"React.js"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="pf-t-str">"Node.js"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="pf-t-str">"TypeScript"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="pf-t-str">"AWS"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="pf-t-str">"LLM Integration"</span><br />
                &nbsp;&nbsp;],<br />
                &nbsp;&nbsp;<span className="pf-t-key">"mentored"</span>: <span className="pf-t-num">4</span>,<br />
                &nbsp;&nbsp;<span className="pf-t-key">"open_to_work"</span>: <span className="pf-t-num">true</span><br />
                <span className="pf-t-prompt">{'}'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════ SECTION 3: SKILLS ════ */}
        <section className="pf-section">
          <div className="pf-skills-inner">
            <div className="pf-sec-header pf-reveal">
              <span className="pf-sec-tag">02 / skills</span>
              <h2 className="pf-sec-title">Technical Stack</h2>
              <div className="pf-sec-line" />
            </div>
            <div className="pf-skills-grid">
              {[
                {
                  cat: 'Languages', delay: 'pf-d1',
                  pills: [['pf-pill-c','JavaScript'],['pf-pill-c','TypeScript'],['pf-pill-o','Java']],
                },
                {
                  cat: 'Frontend', delay: 'pf-d2',
                  pills: [['pf-pill-c','React.js'],['pf-pill-c','Next.js'],['pf-pill-p','Redux'],['pf-pill-p','Redux-Saga'],['pf-pill-g','Tailwind CSS'],['pf-pill-g','MUI'],['pf-pill-o','Webpack']],
                },
                {
                  cat: 'Backend', delay: 'pf-d3',
                  pills: [['pf-pill-c','Node.js'],['pf-pill-c','Express.js'],['pf-pill-p','REST APIs'],['pf-pill-g','GraphQL'],['pf-pill-o','Prisma ORM']],
                },
                {
                  cat: 'Databases', delay: 'pf-d2',
                  pills: [['pf-pill-c','PostgreSQL'],['pf-pill-p','MySQL'],['pf-pill-o','DynamoDB']],
                },
                {
                  cat: 'Cloud / DevOps', delay: 'pf-d3',
                  pills: [['pf-pill-o','AWS EC2'],['pf-pill-o','S3'],['pf-pill-o','Lambda'],['pf-pill-o','Route 53'],['pf-pill-o','Load Balancer'],['pf-pill-o','Elastic Beanstalk'],['pf-pill-p','CI/CD'],['pf-pill-g','Docker']],
                },
                {
                  cat: 'Tools & Practices', delay: 'pf-d4',
                  pills: [['pf-pill-c','Git'],['pf-pill-c','LLM APIs'],['pf-pill-p','Jest'],['pf-pill-g','Agile/Scrum'],['pf-pill-g','ESLint']],
                },
              ].map(({ cat, delay, pills }) => (
                <div key={cat} className={`pf-skill-card pf-reveal ${delay}`}>
                  <div className="pf-skill-cat">{cat}</div>
                  <div className="pf-pills">
                    {pills.map(([cls, label]) => (
                      <span key={label} className={`pf-pill ${cls}`}>{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ SECTION 4: EXPERIENCE ════ */}
        <section className="pf-section">
          <div className="pf-exp-inner">
            <div className="pf-sec-header pf-reveal" style={{ marginBottom: '1.75rem' }}>
              <span className="pf-sec-tag">03 / experience</span>
              <h2 className="pf-sec-title">Work History</h2>
              <div className="pf-sec-line" />
            </div>
            <div className="pf-timeline">
              {/* FYND */}
              <div className="pf-exp-item pf-reveal pf-d1">
                <div className="pf-exp-header">
                  <div>
                    <p className="pf-exp-role">Software Developer <span className="pf-exp-co">@ FYND – Shopsence</span></p>
                    <div className="pf-exp-loc">📍 Mumbai</div>
                  </div>
                  <div className="pf-exp-period">Jul 2025 – Present</div>
                </div>
                <ul className="pf-exp-bullets">
                  <li>Built and owned full-stack features across <strong>Konnect</strong> (multi-channel e-commerce sync) and <strong>HireFirst</strong> (AI-augmented hiring for Reliance Industries).</li>
                  <li>Integrated <strong>LLM APIs</strong> to build a candidate-vs-job fit scoring engine; created candidate portals and hiring workflow UIs.</li>
                  <li>Engineered inventory sync dashboards, order management modules, and a <strong>timezone-aware timestamp system</strong> for US/EU global users.</li>
                  <li>Performed <strong>PostgreSQL/Prisma schema migrations</strong> and managed deployments with near-zero downtime across production and staging.</li>
                  <li>Delivered CSV export mechanisms, automated cron jobs for daily summaries, and a multi-module onboarding flow.</li>
                </ul>
                <div className="pf-exp-tags">
                  {['React.js','Node.js','TypeScript','PostgreSQL','Prisma','LLM APIs'].map(t => <span key={t} className="pf-exp-tag">{t}</span>)}
                </div>
              </div>

              {/* Zycus */}
              <div className="pf-exp-item pf-reveal pf-d2">
                <div className="pf-exp-header">
                  <div>
                    <p className="pf-exp-role">Sr. Software Developer <span className="pf-exp-co">@ Zycus Infotech</span></p>
                    <div className="pf-exp-loc">📍 Mumbai</div>
                  </div>
                  <div className="pf-exp-period">May 2023 – Jul 2025</div>
                </div>
                <ul className="pf-exp-bullets">
                  <li>Led frontend &amp; backend on a greenfield <strong>ESG SaaS product</strong> — enabling enterprise clients to track, map, and report carbon footprints from procurement data with RBAC.</li>
                  <li>Engineered <strong>high-performance data tables</strong> handling millions of records with server-side pagination, search, and filtering.</li>
                  <li>Contributed across <strong>10+ modules</strong>: seller-side, analytics, auth/RBAC, core platform, data sanity, and cron jobs — from inception to production.</li>
                  <li>Directly <strong>mentored 3–4 junior developers</strong>, establishing modular standards, code review practices, and Git workflows in a 50+ dev org.</li>
                  <li>Championed a <strong>reusable component library</strong> and shared npm packages, reducing redundant code and accelerating delivery cycles.</li>
                </ul>
                <div className="pf-exp-tags">
                  {['React.js','Node.js','TypeScript','Redux-Saga','PostgreSQL','AWS','CI/CD'].map(t => <span key={t} className="pf-exp-tag">{t}</span>)}
                </div>
              </div>

              {/* Millennial */}
              <div className="pf-exp-item pf-reveal pf-d3">
                <div className="pf-exp-header">
                  <div>
                    <p className="pf-exp-role">Software Engineer <span className="pf-exp-co">@ Millennial Healthtech (Proactive For Her)</span></p>
                    <div className="pf-exp-loc">📍 Bangalore</div>
                  </div>
                  <div className="pf-exp-period">May 2022 – Jan 2023</div>
                </div>
                <ul className="pf-exp-bullets">
                  <li>Built end-to-end features for a D2C healthcare platform — appointment booking, prescription management, coupon/referral systems, admin panel, and doctor portal.</li>
                  <li><strong>Re-architected a legacy static codebase</strong> into a scalable, API-driven system, significantly improving maintainability and response speeds.</li>
                  <li>Streamlined frontend build pipelines and reduced bug surface through reusable component patterns.</li>
                </ul>
                <div className="pf-exp-tags">
                  {['React.js','Node.js','Redux','REST APIs','MySQL'].map(t => <span key={t} className="pf-exp-tag">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ SECTION 5: PROJECTS ════ */}
        <section className="pf-section">
          <div className="pf-proj-inner">
            <div className="pf-sec-header pf-reveal">
              <span className="pf-sec-tag">04 / projects</span>
              <h2 className="pf-sec-title">Key Projects</h2>
              <div className="pf-sec-line" />
            </div>
            <div className="pf-proj-grid">
              <div className="pf-proj-card pf-reveal pf-d1">
                <div className="pf-proj-num">PROJECT 01</div>
                <div className="pf-proj-name">Professional Portfolio</div>
                <div className="pf-proj-desc">Multi-page personal portfolio deployed on a production-grade AWS setup with automated CI/CD — featuring Route 53 DNS, an Application Load Balancer, and EC2 instances.</div>
                <div className="pf-proj-tech">
                  {['Next.js','TypeScript','AWS EC2','Route 53','Load Balancer','CI/CD'].map(t => <span key={t}>{t}</span>)}
                </div>
                <a className="pf-proj-link" href="https://mp.iamkamisama.com/profile" target="_blank" rel="noopener noreferrer">mp.iamkamisama.com/profile →</a>
              </div>

              <div className="pf-proj-card pf-reveal pf-d2">
                <div className="pf-proj-num">PROJECT 02</div>
                <div className="pf-proj-name">HireFirst — AI Hiring Platform</div>
                <div className="pf-proj-desc">AI-augmented hiring platform built for Reliance Industries. Integrated LLM APIs to power a candidate-vs-job fit scoring engine, candidate portals, and end-to-end hiring workflows with full SIT and production ownership.</div>
                <div className="pf-proj-tech">
                  {['React.js','Node.js','LLM APIs','TypeScript','PostgreSQL','Prisma'].map(t => <span key={t}>{t}</span>)}
                </div>
              </div>

              <div className="pf-proj-card pf-proj-card--wide pf-reveal pf-d3">
                <div className="pf-proj-num">PROJECT 03 · PGDAC FINAL PROJECT</div>
                <div className="pf-proj-name">Clickonix — Online Electronics Store</div>
                <div className="pf-proj-desc">Full-stack 3-tier e-commerce platform with role-based authentication, real-time buyer–seller chat via WebSockets, and a comprehensive admin dashboard for inventory and order management.</div>
                <div className="pf-proj-tech">
                  {['React.js','Redux','Node.js','Spring Boot','MySQL','WebSockets'].map(t => <span key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ SECTION 6: EDUCATION & CONTACT ════ */}
        <section className="pf-section">
          <div className="pf-edu-inner">
            <div className="pf-edu-block">
              <div className="pf-sec-header pf-sec-header--left" style={{ marginBottom: '0.5rem' }}>
                <span className="pf-sec-tag">05 / education</span>
                <h2 className="pf-sec-title">Education</h2>
                <div className="pf-sec-line pf-sec-line--left" />
              </div>
              <div className="pf-edu-card pf-reveal pf-d1">
                <div className="pf-edu-degree">Post Graduate Diploma in Advanced Computing</div>
                <div className="pf-edu-inst">CDAC Mumbai</div>
                <div className="pf-edu-meta">2022</div>
                <span className="pf-edu-grade">74%</span>
              </div>
              <div className="pf-edu-card pf-reveal pf-d2">
                <div className="pf-edu-degree">B.E. in Electronics Engineering</div>
                <div className="pf-edu-inst">Shah and Anchor Kutchhi Engineering College, Mumbai</div>
                <div className="pf-edu-meta">2018</div>
              </div>
              <div className="pf-edu-card pf-reveal pf-d3" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
                <div className="pf-skill-cat" style={{ marginBottom: '0.65rem' }}>Languages Spoken</div>
                <div className="pf-langs">
                  {['English','Hindi','Marathi'].map(l => <span key={l} className="pf-lang">{l}</span>)}
                </div>
              </div>
            </div>

            <div className="pf-contact-block">
              <div className="pf-sec-header pf-sec-header--left" style={{ marginBottom: '0' }}>
                <span className="pf-sec-tag">06 / contact</span>
                <h2 className="pf-sec-title">Get In Touch</h2>
                <div className="pf-sec-line pf-sec-line--left" />
              </div>
              <div className="pf-contact-card pf-reveal pf-d2">
                <h3>Contact Details</h3>
                <div className="pf-contact-items">
                  <div className="pf-contact-item"><div className="pf-cicon">✉</div><a href="mailto:workmayur862@gmail.com">workmayur862@gmail.com</a></div>
                  <div className="pf-contact-item"><div className="pf-cicon">✆</div><span>+91 9137082725</span></div>
                  <div className="pf-contact-item"><div className="pf-cicon">⌖</div><span>Navi Mumbai, Maharashtra, India</span></div>
                  <div className="pf-contact-item"><div className="pf-cicon">↗</div><a href="https://mp.iamkamisama.com/profile" target="_blank" rel="noopener noreferrer">mp.iamkamisama.com/profile</a></div>
                </div>
              </div>
              <div
                className="pf-contact-card pf-reveal pf-d3"
                style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.06),rgba(168,85,247,0.06))', borderColor: 'rgba(0,212,255,0.2)' }}
              >
                <div className="pf-skill-cat" style={{ marginBottom: '0.65rem' }}>Currently at</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>FYND – Shopsence Retail Services</div>
                <div style={{ fontFamily: 'var(--pf-mono)', fontSize: '0.73rem', color: 'var(--pf-muted)' }}>Software Developer (Full Stack) · Mumbai</div>
                <div style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="pf-available-dot" />
                  <span style={{ fontFamily: 'var(--pf-mono)', fontSize: '0.7rem', color: 'var(--pf-green)' }}>Available for opportunities</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pf-footer-note">
            Built with <span>React · TypeScript · Tailwind</span> &nbsp;·&nbsp; Mayur Patankar &nbsp;·&nbsp; <span>2025</span>
          </div>
        </section>

      </div>{/* /scroller */}
    </div>
  );
}
