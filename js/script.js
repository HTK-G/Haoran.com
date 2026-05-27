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
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    let framePending = false;
    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.4;

    function applyPosition() {
      framePending = false;

      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const percentX = (targetX / width) * 100;
      const percentY = (targetY / height) * 100;
      const driftX = (targetX / width - 0.5) * 16;
      const driftY = (targetY / height - 0.5) * 10;

      root.style.setProperty("--bg-drift-x", driftX.toFixed(2) + "px");
      root.style.setProperty("--bg-drift-y", driftY.toFixed(2) + "px");
    }

    function queueUpdate(x, y) {
      targetX = x;
      targetY = y;

      if (!framePending) {
        framePending = true;
        window.requestAnimationFrame(applyPosition);
      }
    }

    applyPosition();

    window.addEventListener(
      "pointermove",
      function (event) {
        if (event.pointerType === "touch") {
          return;
        }

        if (
          Math.abs(event.clientX - targetX) < 24 &&
          Math.abs(event.clientY - targetY) < 24
        ) {
          return;
        }

        queueUpdate(event.clientX, event.clientY);
      },
      { passive: true },
    );

    window.addEventListener("pointerleave", function () {
      queueUpdate(window.innerWidth * 0.5, window.innerHeight * 0.4);
    });

    window.addEventListener("blur", function () {
      queueUpdate(window.innerWidth * 0.5, window.innerHeight * 0.4);
    });

    window.addEventListener("resize", function () {
      queueUpdate(targetX, targetY);
    });
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
