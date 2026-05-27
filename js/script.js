(function () {
  const data = window.SITE_DATA;

  if (!data) {
    return;
  }

  const qs = (selector) => document.querySelector(selector);

  function setText(el, value) {
    if (el) {
      el.textContent = value;
    }
  }

  function createImage(path, alt, eager = false) {
    const img = document.createElement("img");
    img.src = path;
    img.alt = alt || "";
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    return img;
  }

  function renderSchema() {
    const schemaEl = qs("#schema-data");
    if (!schemaEl) {
      return;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: data.profile.name,
      jobTitle: data.profile.role,
      url: data.meta.siteUrl,
      sameAs: data.meta.sameAs,
      image: data.profile.image,
    };

    schemaEl.textContent = JSON.stringify(schema, null, 2);
  }

  function setupMenu() {
    const menuButton = qs(".hamburger");
    const links = qs(".nav-links");

    if (!menuButton || !links) {
      return;
    }

    menuButton.addEventListener("click", function () {
      const isActive = links.classList.toggle("active");
      menuButton.setAttribute("aria-expanded", String(isActive));
      menuButton.classList.toggle("active", isActive);
    });

    document.addEventListener("click", function (event) {
      const clickInside =
        menuButton.contains(event.target) || links.contains(event.target);
      if (!clickInside) {
        links.classList.remove("active");
        menuButton.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setupAmbientBackground() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const existingCanvas = qs(".ambient-dots");
    const canvas = existingCanvas || document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    if (!existingCanvas) {
      canvas.className = "ambient-dots";
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }

    const dots = [];
    const pointer = {
      active: false,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.4,
    };
    let width = 0;
    let height = 0;
    let devicePixelRatio = window.devicePixelRatio || 1;

    function rebuildDots() {
      dots.length = 0;

      const spacing = window.innerWidth < 760 ? 34 : 52;
      const offsetX = spacing * 0.45;
      const offsetY = spacing * 0.45;

      for (let y = offsetY; y < height; y += spacing) {
        for (let x = offsetX; x < width; x += spacing) {
          dots.push({
            homeX: x + (Math.random() - 0.5) * spacing * 0.18,
            homeY: y + (Math.random() - 0.5) * spacing * 0.18,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 0.9 + Math.random() * 0.9,
            alpha: 0.14 + Math.random() * 0.1,
          });
        }
      }
    }

    function resizeCanvas() {
      devicePixelRatio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      rebuildDots();
    }

    function animateDots() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(255, 255, 255, 0.16)";

      const radius = window.innerWidth < 760 ? 110 : 160;
      const pullStrength = 0.018;
      const springStrength = 0.045;
      const friction = 0.78;

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        let forceX = (dot.homeX - dot.x) * springStrength;
        let forceY = (dot.homeY - dot.y) * springStrength;

        if (pointer.active) {
          const deltaX = pointer.x - dot.x;
          const deltaY = pointer.y - dot.y;
          const distance = Math.hypot(deltaX, deltaY);

          if (distance < radius) {
            const attraction = 1 - distance / radius;
            const pull = attraction * attraction * pullStrength * radius;
            forceX += deltaX * pull;
            forceY += deltaY * pull;
            dot.alpha += (0.28 - dot.alpha) * 0.1;
          } else {
            dot.alpha += (0.16 - dot.alpha) * 0.05;
          }
        } else {
          dot.alpha += (0.14 - dot.alpha) * 0.05;
        }

        dot.vx = (dot.vx + forceX) * friction;
        dot.vy = (dot.vy + forceY) * friction;
        dot.x += dot.vx;
        dot.y += dot.vy;

        context.globalAlpha = dot.alpha;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      window.requestAnimationFrame(animateDots);
    }

    resizeCanvas();

    window.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") {
        return;
      }

      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    window.addEventListener("blur", function () {
      pointer.active = false;
    });

    window.addEventListener("resize", function () {
      resizeCanvas();
    });

    animateDots();
  }

  function updateTime() {
    const timeEl = qs("#current-time");
    if (!timeEl) {
      return;
    }

    const now = new Date();
    const options = {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    timeEl.textContent = new Intl.DateTimeFormat("en-US", options).format(now);
  }

  function renderSocialLinks() {
    const root = qs("#social-links");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.contacts.forEach(function (item) {
      const link = document.createElement("a");
      link.href = item.href;
      link.target = item.href.startsWith("mailto:") ? "_self" : "_blank";
      if (link.target === "_blank") {
        link.rel = "noopener noreferrer";
      }
      link.setAttribute("aria-label", item.label);

      const icon = createImage(item.icon, item.label);
      link.appendChild(icon);
      root.appendChild(link);
    });
  }

  function renderHomeHero() {
    const root = qs("#home-hero");
    if (!root) {
      return;
    }

    const image = createImage(data.profile.image, data.profile.imageAlt, true);
    image.className = "hero-image";

    const content = document.createElement("div");

    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = data.profile.role + " · " + data.profile.location;

    const title = document.createElement("h1");
    title.textContent = data.profile.name;

    const summary = document.createElement("p");
    summary.textContent = data.profile.summary;

    const details = document.createElement("p");
    details.textContent = data.profile.details.join(" ");

    const tagList = document.createElement("div");
    tagList.className = "tag-list";
    data.profile.tags.forEach(function (tagText) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagText;
      tagList.appendChild(tag);
    });

    const ctaRow = document.createElement("div");
    ctaRow.className = "cta-row";

    const primary = document.createElement("a");
    primary.className = "btn btn-primary";
    primary.href = data.profile.ctaPrimary.href;
    primary.textContent = data.profile.ctaPrimary.label;

    const secondary = document.createElement("a");
    secondary.className = "btn btn-secondary";
    secondary.href = data.profile.ctaSecondary.href;
    secondary.textContent = data.profile.ctaSecondary.label;

    ctaRow.appendChild(primary);
    ctaRow.appendChild(secondary);

    content.appendChild(kicker);
    content.appendChild(title);
    content.appendChild(summary);
    content.appendChild(details);
    content.appendChild(tagList);
    content.appendChild(ctaRow);

    root.appendChild(image);
    root.appendChild(content);
  }

  function renderCards(targetId, items, showDate) {
    const root = qs(targetId);
    if (!root || !items || !items.length) {
      return;
    }

    root.innerHTML = "";
    if (targetId === "#home-highlights-grid") {
      root.classList.add("card-strip");
    }

    items.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "card";

      let contentRoot = card;
      if (item.href) {
        const link = document.createElement("a");
        link.href = item.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.appendChild(link);
        contentRoot = link;
      }

      const image = createImage(item.image, item.imageAlt);
      contentRoot.appendChild(image);

      const body = document.createElement("div");
      body.className = "card-body";

      if (showDate && item.date) {
        const meta = document.createElement("p");
        meta.className = "card-meta";
        meta.textContent = item.date;
        body.appendChild(meta);
      }

      const title = document.createElement("h3");
      title.textContent = item.title;

      const text = document.createElement("p");
      text.textContent = item.text;

      body.appendChild(title);
      body.appendChild(text);
      contentRoot.appendChild(body);

      root.appendChild(card);
    });
  }

  function renderStack(targetId, items) {
    const root = qs(targetId);
    if (!root || !items || !items.length) {
      return;
    }

    root.innerHTML = "";

    items.forEach(function (item) {
      const article = document.createElement("article");
      article.className = "stack-item";

      const left = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.title;

      const detail = document.createElement("p");
      detail.textContent = item.subtitle
        ? item.subtitle + " · " + item.text
        : item.text;

      left.appendChild(title);
      left.appendChild(detail);

      article.appendChild(left);
      article.appendChild(createImage(item.image, item.imageAlt));

      root.appendChild(article);
    });
  }

  function renderJournal() {
    const root = qs("#journal-entries");
    if (!root || !data.journal || !data.journal.length) {
      return;
    }

    root.innerHTML = "";

    data.journal.forEach(function (entry) {
      const article = document.createElement("article");
      article.className = "journal-item";

      const date = document.createElement("p");
      date.className = "date";
      date.textContent = entry.date;

      const title = document.createElement("h3");
      title.textContent = entry.title;

      const text = document.createElement("p");
      text.textContent = entry.text;

      article.appendChild(date);
      article.appendChild(title);
      article.appendChild(text);
      root.appendChild(article);
    });
  }

  function initPage() {
    renderSchema();
    setupMenu();
    setupAmbientBackground();
    renderSocialLinks();

    setText(qs("#copyright-year"), String(new Date().getFullYear()));

    updateTime();
    setInterval(updateTime, 1000);

    renderHomeHero();
    renderCards("#home-highlights-grid", data.highlights, true);
    renderStack("#home-featured-list", data.homeNotes);
    renderJournal();

    if (data.projects) {
      renderCards("#project-link-grid", data.projects.links, false);
      renderStack("#project-featured-list", data.projects.featured);
    }

    renderStack("#gallery-art-list", data.gallery);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})();
