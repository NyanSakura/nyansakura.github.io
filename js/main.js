/* ============================================
   虾言虾语 — 主脚本
   暗黑模式 · 搜索 · 页面渲染
   ============================================ */

(function () {
  'use strict';

  /* ---------- 工具函数 ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  /* ---------- 暗黑模式 ---------- */
  function initDarkMode() {
    const saved = localStorage.getItem('blog-theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // 如果没有保存过，检查系统偏好
    else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const toggle = $('#theme-toggle');
    if (toggle) {
      updateToggleIcon();
      toggle.addEventListener('click', toggleDarkMode);
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem('blog-theme') === null) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : '');
        updateToggleIcon();
      }
    });
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? '' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('blog-theme', next || 'light');
    updateToggleIcon();
  }

  function updateToggleIcon() {
    const toggle = $('#theme-toggle');
    if (!toggle) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggle.textContent = isDark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isDark ? '切换到亮色模式' : '切换到暗黑模式');
  }

  /* ---------- 搜索 ---------- */
  function initSearch() {
    const input = $('#search-input');
    if (!input) return;

    const container = $('#articles-list');
    if (!container) return;

    input.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();
      const cards = $$('.article-card', container);

      let visibleCount = 0;

      cards.forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        const excerpt = (card.dataset.excerpt || '').toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase();

        if (!query) {
          card.style.display = '';
          visibleCount++;
        } else if (title.includes(query) || excerpt.includes(query) || tags.includes(query)) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // 无结果提示
      let noResults = $('#no-results-msg');
      if (visibleCount === 0 && query) {
        if (!noResults) {
          noResults = document.createElement('p');
          noResults.id = 'no-results-msg';
          noResults.className = 'no-results';
          noResults.textContent = '没有找到匹配的文章，试试其他关键词吧 🦐';
          container.appendChild(noResults);
        }
        noResults.style.display = '';
      } else if (noResults) {
        noResults.style.display = 'none';
      }
    });
  }

  /* ---------- 首页文章列表 ---------- */
  function renderHomeArticles() {
    const container = $('#articles-list');
    if (!container) return;

    ARTICLES.forEach(article => {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.dataset.title = article.title;
      card.dataset.excerpt = article.excerpt;
      card.dataset.tags = article.tags.join(' ');

      card.innerHTML = `
        <div class="article-card-meta">
          <time class="article-card-date" datetime="${article.date}">${article.date}</time>
          <span class="article-card-dot">·</span>
          <div class="article-card-tags">
            ${article.tags.map(t => `<a href="tags.html?tag=${encodeURIComponent(t)}" class="article-card-tag">${t}</a>`).join('')}
          </div>
        </div>
        <h2 class="article-card-title">
          <a href="article.html?id=${article.id}">${article.title}</a>
        </h2>
        <p class="article-card-excerpt">${article.excerpt}</p>
        <a href="article.html?id=${article.id}" class="article-card-link">阅读全文 →</a>
      `;

      container.appendChild(card);
    });
  }

  /* ---------- 首页侧边栏标签 ---------- */
  function renderSidebarTags() {
    const container = $('#sidebar-tags');
    if (!container) return;

    const stats = getTagStats();
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);

    sorted.slice(0, 8).forEach(([tag]) => {
      const a = document.createElement('a');
      a.href = `tags.html?tag=${encodeURIComponent(tag)}`;
      a.className = 'sidebar-tag';
      a.textContent = tag;
      container.appendChild(a);
    });
  }

  /* ---------- 文章详情页 ---------- */
  function renderArticleDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    const article = ARTICLES.find(a => a.id === id);

    const container = $('#article-detail');
    if (!container) return;

    if (!article) {
      container.innerHTML = `
        <div class="article-page">
          <p class="no-results">找不到这篇文章 🦐</p>
          <p style="text-align:center;margin-top:1rem;">
            <a href="index.html" class="article-back">← 返回首页</a>
          </p>
        </div>
      `;
      document.title = '文章未找到 — 虾言虾语';
      return;
    }

    document.title = `${article.title} — 虾言虾语`;

    // 获取相关文章
    const related = getRelatedArticles(article.id);

    container.innerHTML = `
      <div class="article-page">
        <a href="index.html" class="article-back">← 返回首页</a>

        <header class="article-header">
          <div class="article-meta">
            <time class="article-meta-date" datetime="${article.date}">${article.date}</time>
            <span>·</span>
            <span>${Math.ceil(article.content.replace(/<[^>]*>/g, '').length / 400)} 分钟阅读</span>
          </div>
          <h1 class="article-title-main">${article.title}</h1>
          <div class="article-tags">
            ${article.tags.map(t => `<a href="tags.html?tag=${encodeURIComponent(t)}" class="article-tag">${t}</a>`).join('')}
          </div>
        </header>

        <div class="article-body">
          ${article.content}
        </div>

        <div class="article-divider">···</div>

        ${related.length > 0 ? `
        <section class="related-articles">
          <h3>相关文章</h3>
          <div class="related-list">
            ${related.map(r => `
              <div class="related-item">
                <a href="article.html?id=${r.id}">${r.title}</a>
                <span class="related-item-date">${r.date}</span>
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}
      </div>
    `;
  }

  /* ---------- 标签云页 ---------- */
  function renderTagsPage() {
    const container = $('#tags-content');
    if (!container) return;

    const stats = getTagStats();
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;

    // 获取 URL 参数中的活跃标签
    const params = new URLSearchParams(window.location.search);
    const activeTag = params.get('tag');

    // 渲染标签云
    const cloud = document.createElement('div');
    cloud.className = 'tags-cloud';

    sorted.forEach(([tag, count]) => {
      const size = 0.85 + (count / maxCount) * 0.7; // 0.85rem ~ 1.55rem
      const btn = document.createElement('span');
      btn.className = 'tag-cloud-item';
      if (tag === activeTag) btn.classList.add('active');
      btn.style.fontSize = `${size}rem`;
      btn.innerHTML = `${tag}<span class="count">${count}</span>`;
      btn.addEventListener('click', () => {
        window.location.search = `?tag=${encodeURIComponent(tag)}`;
      });
      cloud.appendChild(btn);
    });

    // 渲染筛选结果
    const filteredSection = document.createElement('div');
    filteredSection.className = 'tags-filtered-section';

    if (activeTag) {
      const filteredArticles = getArticlesByTag(activeTag);
      const allTagLink = document.createElement('a');
      allTagLink.href = 'tags.html';
      allTagLink.textContent = '← 显示全部标签';
      allTagLink.style.cssText = 'font-size:0.85rem;color:var(--text-secondary);border-bottom:none;display:inline-block;margin-bottom:1.5rem;';

      filteredSection.innerHTML = `
        <h2 class="tags-filtered-title">
          <span>标签「${activeTag}」下的文章</span>（${filteredArticles.length} 篇）
        </h2>
      `;
      filteredSection.prepend(allTagLink);

      const list = document.createElement('div');
      list.className = 'tag-filtered-list';

      filteredArticles.forEach(a => {
        const item = document.createElement('div');
        item.className = 'tag-filtered-item';
        item.innerHTML = `
          <a href="article.html?id=${a.id}">${a.title}</a>
          <div class="meta">${a.date} · ${a.tags.join(', ')}</div>
        `;
        list.appendChild(item);
      });

      filteredSection.appendChild(list);
    }

    container.appendChild(cloud);
    container.appendChild(filteredSection);

    // 更新 title
    if (activeTag) {
      document.title = `标签: ${activeTag} — 虾言虾语`;
    }
  }

  /* ---------- 活动导航高亮 ---------- */
  function highlightNav() {
    const path = window.location.pathname;
    $$('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && path.includes(href.replace(/\.html.*$/, ''))) {
        link.classList.add('active');
      }
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    initDarkMode();
    highlightNav();

    // 根据页面类型执行不同逻辑
    const isHome = !!$('#articles-list');
    const isArticle = !!$('#article-detail');
    const isTags = !!$('#tags-content');

    if (isHome) {
      renderHomeArticles();
      renderSidebarTags();
      initSearch();
    } else if (isArticle) {
      renderArticleDetail();
    } else if (isTags) {
      renderTagsPage();
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
