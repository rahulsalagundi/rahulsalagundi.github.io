/* =========================================================
   Rahul M Salagundi · portfolio runtime
   No dependencies. Every effect respects prefers-reduced-motion.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Small deterministic PRNG so the topology looks the same on every load
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  $("#year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Toast + copy
     --------------------------------------------------------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
  }
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast("✓ copied validation number");
      } catch {
        toast(b.dataset.copy);
      }
    })
  );

  /* ---------------------------------------------------------
     Top bar: rollout progress, active section, mobile menu
     --------------------------------------------------------- */
  const rollout = $("#rollout");
  function onScroll() {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    rollout.style.width = `${(p * 100).toFixed(2)}%`;
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$("[data-nav]");
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => s.id !== "hero" && sectionObs.observe(s));

  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------------------------------------------------------
     Reveal on scroll + counters
     --------------------------------------------------------- */
  $$("[data-reveal]").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i * 0.07, 0.4)}s`);
  });

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    if (REDUCED) return (el.textContent = prefix + target);
    const start = performance.now();
    (function frame(now) {
      const t = Math.min((now - start) / 1400, 1);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        revealObs.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$("[data-reveal]").forEach((el) => revealObs.observe(el));

  /* ---------------------------------------------------------
     Hero: quiet service-mesh topology
     --------------------------------------------------------- */
  (() => {
    const canvas = $("#topology");
    const ctx = canvas.getContext("2d");
    const PACKET = ["5,150,105", "2,132,199"];
    let W, H, nodes = [], edges = [], packets = [], running = false, visible = true;

    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const r = rng(7);
      const count = Math.max(18, Math.min(46, Math.floor((W * H) / 30000)));
      const cols = Math.ceil(Math.sqrt(count * (W / H)));
      const rows = Math.ceil(count / cols);
      nodes = Array.from({ length: count }, (_, i) => ({
        x: (((i % cols) + 0.5) / cols + (r() - 0.5) * 0.6 / cols) * W,
        y: ((Math.floor(i / cols) + 0.5) / rows + (r() - 0.5) * 0.6 / rows) * H,
        r: 1.8 + r() * 1.4,
      }));
      const seen = new Set();
      edges = [];
      nodes.forEach((a, i) => {
        nodes
          .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .filter((o) => o.j !== i)
          .sort((p, q) => p.d - q.d)
          .slice(0, 2)
          .forEach(({ j, d }) => {
            const k = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (seen.has(k)) return;
            seen.add(k);
            edges.push({ a: i, b: j, len: d });
          });
      });
      packets = [];
    }

    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(100,116,139,0.16)";
      ctx.beginPath();
      edges.forEach((e) => {
        ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
        ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
      });
      ctx.stroke();

      if (Math.random() < 0.12 && packets.length < 18 && edges.length) {
        const e = edges[Math.floor(Math.random() * edges.length)];
        packets.push({ e, t: 0, fwd: Math.random() > 0.5, c: PACKET[Math.random() < 0.7 ? 0 : 1], v: 0.05 / Math.max(e.len, 40) });
      }
      packets = packets.filter((p) => {
        p.t += p.v * dt;
        if (p.t >= 1) return false;
        const a = nodes[p.fwd ? p.e.a : p.e.b];
        const b = nodes[p.fwd ? p.e.b : p.e.a];
        ctx.fillStyle = `rgba(${p.c},0.75)`;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      ctx.fillStyle = "rgba(100,116,139,0.35)";
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    let last = 0;
    function frame(now) {
      if (!running) return;
      draw(Math.min(now - last, 50));
      last = now;
      requestAnimationFrame(frame);
    }
    function update() {
      const next = visible && !document.hidden && !REDUCED;
      if (next && !running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
      running = next;
    }

    build();
    if (REDUCED) draw(0);
    let rt;
    addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { build(); if (REDUCED) draw(0); }, 150);
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }).observe($("#hero"));
    document.addEventListener("visibilitychange", update);
  })();

  /* ---------------------------------------------------------
     Hero terminal typing
     --------------------------------------------------------- */
  const TERM_SCRIPT = [
    { cmd: "whoami" },
    { out: `<span class="t-ok">rahul-m-salagundi</span> <span class="t-dim">·</span> devops engineer` },
    { cmd: "kubectl get engineer rahul -o yaml" },
    { out: `<span class="t-key">kind</span>: Engineer` },
    { out: `<span class="t-key">metadata</span>:` },
    { out: `  <span class="t-key">name</span>: rahul-m-salagundi` },
    { out: `  <span class="t-key">labels</span>: { aws: certified, k8s: daily }` },
    { out: `<span class="t-key">spec</span>:` },
    { out: `  <span class="t-key">node</span>: quintype-technologies` },
    { out: `  <span class="t-key">focus</span>: [finops, security, ci-cd, ai-agents]` },
    { out: `<span class="t-key">status</span>:` },
    { out: `  <span class="t-key">phase</span>: <span class="t-ok">Running ✓</span>` },
    { cmd: "terraform plan -target=module.your_team" },
    { out: `<span class="t-ok">Plan:</span> 1 to add, 0 to change, 0 to destroy.` },
  ];
  async function typeTerminal() {
    const el = $("#heroTerm");
    const PS = `<span class="t-ps">❯</span> `;
    if (REDUCED) {
      el.innerHTML = TERM_SCRIPT.map((l) => (l.cmd ? `${PS}<span class="t-cmd">${l.cmd}</span>` : l.out)).join("\n") + `\n${PS}<span class="caret"></span>`;
      return;
    }
    let html = "";
    for (const line of TERM_SCRIPT) {
      if (line.cmd) {
        await sleep(html ? 380 : 500);
        let typed = "";
        for (const ch of line.cmd) {
          typed += ch;
          el.innerHTML = `${html}${PS}<span class="t-cmd">${typed}</span><span class="caret"></span>`;
          await sleep(22 + Math.random() * 40);
        }
        html += `${PS}<span class="t-cmd">${line.cmd}</span>\n`;
        await sleep(200);
      } else {
        html += line.out + "\n";
        el.innerHTML = html;
        await sleep(45);
      }
    }
    el.innerHTML = `${html}${PS}<span class="caret"></span>`;
  }

  /* ---------------------------------------------------------
     Pipeline graph + job logs
     --------------------------------------------------------- */
  (() => {
    const graph = $("#pipeGraph");
    const svg = $("#pipeLinks");
    const stages = $$(".stage", graph);
    const jobs = $$(".job", graph);
    const logs = $$(".joblog");

    const start = new Date(2026, 6, 1);
    const months = Math.max(1, Math.floor((Date.now() - start) / (30.44 * 864e5)));
    $("#quintypeAge").textContent = `${months}m`;

    function draw() {
      const g = graph.getBoundingClientRect();
      let paths = "";
      for (let s = 0; s < stages.length - 1; s++) {
        $$(".job", stages[s]).forEach((a) => {
          $$(".job", stages[s + 1]).forEach((b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            let d;
            if (rb.left > ra.right - 4) {
              const x1 = ra.right - g.left, y1 = ra.top + ra.height / 2 - g.top;
              const x2 = rb.left - g.left, y2 = rb.top + rb.height / 2 - g.top;
              const mx = (x1 + x2) / 2;
              d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
            } else {
              const x1 = ra.left + 24 - g.left, y1 = ra.bottom - g.top;
              const x2 = rb.left + 24 - g.left, y2 = rb.top - g.top;
              const my = (y1 + y2) / 2;
              d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
            }
            const run = b.dataset.status === "run";
            paths += `<path d="${d}"/><path class="flow${run ? " flow--run" : ""}" d="${d}"/>`;
          });
        });
      }
      svg.innerHTML = paths;
    }
    draw();
    addEventListener("resize", draw);
    if (document.fonts) document.fonts.ready.then(draw);

    function show(id) {
      jobs.forEach((j) => j.classList.toggle("is-active", j.dataset.job === id));
      logs.forEach((l) => {
        const on = l.dataset.log === id;
        l.hidden = !on;
        if (!on) return;
        const lines = $$("li", l);
        lines.forEach((li) => li.classList.remove("in"));
        lines.forEach((li, i) => setTimeout(() => li.classList.add("in"), REDUCED ? 0 : 40 + i * 80));
      });
    }
    jobs.forEach((j) => j.addEventListener("click", () => show(j.dataset.job)));

    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { show("quintype"); obs.disconnect(); }
    }, { threshold: 0.2 }).observe(graph);
  })();

  /* ---------------------------------------------------------
     Certificate validity countdown
     --------------------------------------------------------- */
  (() => {
    const days = Math.ceil((new Date(2029, 9, 24) - new Date()) / 864e5);
    $("#certDays").textContent = days > 0 ? `· ${days} days remaining` : "· expired";
  })();

  /* ---------------------------------------------------------
     InstaDeploy media tabs: demo video / architecture
     --------------------------------------------------------- */
  (() => {
    const tabs = $$(".media-tabs button");
    const video = $(".demo-video");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", String(on));
          $(`#${t.dataset.pane}`).hidden = !on;
        });
        if (tab.dataset.pane !== "paneDemo" && video) video.pause();
      })
    );
  })();

  if (REDUCED) {
    const arch = $("#archSvg");
    if (arch && arch.pauseAnimations) arch.pauseAnimations();
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */
  $$("#hero [data-reveal]").forEach((el) => el.classList.add("in"));
  typeTerminal();
})();
