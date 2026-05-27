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

    const probeCanvas = document.createElement("canvas");
    const webglContext =
      probeCanvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      }) || probeCanvas.getContext("experimental-webgl");

    if (webglContext) {
      const existingCanvas = qs(".ambient-webgl-canvas");
      const canvas = existingCanvas || document.createElement("canvas");
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        return;
      }

      if (!existingCanvas) {
        canvas.className = "ambient-webgl-canvas";
        canvas.setAttribute("aria-hidden", "true");
        document.body.prepend(canvas);
      }

      document.body.classList.add("ambient-webgl");

      const vertexSource = [
        "attribute vec2 a_position;",
        "uniform vec2 u_pointer;",
        "uniform float u_aspect;",
        "uniform float u_radius;",
        "uniform float u_strength;",
        "uniform float u_pointSize;",
        "varying float v_alpha;",
        "void main() {",
        "  vec2 delta = u_pointer - a_position;",
        "  vec2 aspectDelta = vec2(delta.x * u_aspect, delta.y);",
        "  float distance = length(aspectDelta);",
        "  float influence = smoothstep(u_radius, 0.0, distance);",
        "  vec2 direction = normalize(delta + vec2(0.0001));",
        "  vec2 displaced = a_position + direction * influence * u_strength * 0.12;",
        "  vec2 clip = vec2(displaced.x * 2.0 - 1.0, (1.0 - displaced.y) * 2.0 - 1.0);",
        "  gl_Position = vec4(clip, 0.0, 1.0);",
        "  gl_PointSize = u_pointSize + influence * 1.6 * u_strength;",
        "  v_alpha = 0.42 + influence * 0.56;",
        "}",
      ].join("\n");

      const fragmentSource = [
        "precision mediump float;",
        "varying float v_alpha;",
        "void main() {",
        "  vec2 center = gl_PointCoord - vec2(0.5);",
        "  float distance = length(center);",
        "  float alpha = smoothstep(0.5, 0.08, distance);",
        "  gl_FragColor = vec4(vec3(1.0), alpha * v_alpha);",
        "}",
      ].join("\n");

      function createShader(type, source) {
        const shader = gl.createShader(type);
        if (!shader) {
          return null;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      }

      function createProgram(vertex, fragment) {
        const program = gl.createProgram();
        if (!program) {
          return null;
        }

        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          return null;
        }

        return program;
      }

      const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

      if (!vertexShader || !fragmentShader) {
        return;
      }

      const program = createProgram(vertexShader, fragmentShader);

      if (!program) {
        return;
      }

      const positionLocation = gl.getAttribLocation(program, "a_position");
      const pointerLocation = gl.getUniformLocation(program, "u_pointer");
      const aspectLocation = gl.getUniformLocation(program, "u_aspect");
      const radiusLocation = gl.getUniformLocation(program, "u_radius");
      const strengthLocation = gl.getUniformLocation(program, "u_strength");
      const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");
      const buffer = gl.createBuffer();
      const pointer = {
        active: false,
        x: 0.5,
        y: 0.4,
      };
      let width = 0;
      let height = 0;
      let pointCount = 0;
      let easedStrength = 0;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      function rebuildGrid() {
        const spacing = window.innerWidth < 760 ? 0.055 : 0.042;
        const offset = spacing * 0.5;
        const positions = [];

        for (let y = offset; y < 1; y += spacing) {
          for (let x = offset; x < 1; x += spacing) {
            positions.push(
              x + (Math.random() - 0.5) * spacing * 0.12,
              y + (Math.random() - 0.5) * spacing * 0.12,
            );
          }
        }

        pointCount = positions.length / 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      }

      function resizeCanvas() {
        const pixelRatio = window.devicePixelRatio || 1;
        width = window.innerWidth || 1;
        height = window.innerHeight || 1;
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        gl.viewport(0, 0, canvas.width, canvas.height);
        rebuildGrid();
      }

      function renderFrame() {
        const targetStrength = pointer.active ? 1 : 0;
        easedStrength += (targetStrength - easedStrength) * 0.12;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(pointerLocation, pointer.x, pointer.y);
        gl.uniform1f(aspectLocation, width / Math.max(height, 1));
        gl.uniform1f(radiusLocation, pointer.active ? 0.22 : 0.16);
        gl.uniform1f(strengthLocation, easedStrength);
        gl.uniform1f(pointSizeLocation, window.innerWidth < 760 ? 1.5 : 1.8);
        gl.drawArrays(gl.POINTS, 0, pointCount);
        window.requestAnimationFrame(renderFrame);
      }

      resizeCanvas();

      window.addEventListener(
        "pointermove",
        function (event) {
          if (event.pointerType === "touch") {
            return;
          }

          pointer.active = true;
          pointer.x = event.clientX / Math.max(width, 1);
          pointer.y = event.clientY / Math.max(height, 1);
        },
        { passive: true },
      );

      window.addEventListener("pointerleave", function () {
        pointer.active = false;
      });

      window.addEventListener("blur", function () {
        pointer.active = false;
      });

      window.addEventListener("resize", function () {
        resizeCanvas();
      });

      renderFrame();
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

      root.style.setProperty("--pointer-x", percentX.toFixed(2) + "%");
      root.style.setProperty("--pointer-y", percentY.toFixed(2) + "%");
      root.style.setProperty(
        "--pointer-x-2",
        (100 - percentX).toFixed(2) + "%",
      );
      root.style.setProperty(
        "--pointer-y-2",
        (100 - percentY).toFixed(2) + "%",
      );
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
