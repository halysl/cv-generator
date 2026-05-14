(function main() {
  const stateText = document.getElementById("status-text");
  const statusDetail = document.getElementById("status-detail");
  const fileInput = document.getElementById("file-input");
  const printButton = document.getElementById("print-button");
  const resumePage = document.getElementById("resume-page");
  const basicSection = document.getElementById("basic-section");
  const skillsSection = document.getElementById("skills-section");
  const projectsSection = document.getElementById("projects-section");
  const workSection = document.getElementById("work-section");
  const educationSection = document.getElementById("education-section");
  const summarySection = document.getElementById("summary-section");
  const titleTemplate = document.getElementById("section-title-template");

  const statusMap = {
    idle: {
      className: "status-pill status-pill--idle",
      detail: "先加载一个 TOML 配置文件，再检查是否接近一页。",
    },
    ok: {
      className: "status-pill status-pill--ok",
      detail: "当前内容处于一页内，适合直接导出。",
    },
    warn: {
      className: "status-pill status-pill--warn",
      detail: "内容接近一页上限，建议优先压缩项目经历或工作经历。",
    },
    danger: {
      className: "status-pill status-pill--danger",
      detail: "内容已经超过一页，建议减少项目/工作描述，或改短个人评价。",
    },
  };

  const defaultResume = {
    basic: {
      name: "示例姓名",
      role: "前端工程师",
      phone: "138-0000-0000",
      email: "hello@example.com",
      website: "https://example.com",
      city: "上海",
      extras: ["GitHub: github.com/example", "博客: blog.example.com"],
    },
    skills: [
      { category: "语言", items: ["JavaScript", "TypeScript", "HTML", "CSS"] },
      { category: "框架", items: ["React", "Vue", "Node.js"] },
      { category: "工程化", items: ["Vite", "Webpack", "Vitest", "Playwright"] },
    ],
    projects: [
      {
        name: "简历生成器",
        description:
          "基于原生 HTML、CSS、JavaScript 构建单页简历渲染工具，支持本地配置文件加载与 A4 预览。",
        contributions: [
          "设计 TOML 配置结构，降低内容维护成本。",
          "实现状态提示与打印导出链路，保证纸面输出一致性。",
        ],
      },
    ],
    work_experiences: [
      {
        company: "示例科技",
        position: "高级前端工程师",
        period: "2022.03 - 至今",
        details: [
          "负责内部平台的前端架构整理与组件抽象，提升新页面交付速度。",
          "推动页面性能治理和打印场景适配，支撑简历、报表等文档化输出。",
        ],
      },
    ],
    education: {
      school: "示例大学",
      major: "软件工程",
      period: "2016 - 2020",
    },
    summary: {
      text:
        "偏好简洁稳定的工程方案，关注信息组织、输出一致性和交付效率，能独立完成从需求拆解到前端落地的全过程。",
    },
  };

  fileInput.addEventListener("change", handleFileSelect);
  printButton.addEventListener("click", () => window.print());
  initialize();

  async function initialize() {
    try {
      const response = await fetch("./resume.template.toml");
      if (!response.ok) {
        throw new Error(`无法读取模版文件，状态码 ${response.status}`);
      }

      const raw = await response.text();
      const parsed = parseToml(raw);
      renderResume(normalizeResume(parsed));
      statusDetail.textContent = "已自动加载仓库内的 resume.template.toml，可直接替换为你的配置文件。";
    } catch (error) {
      renderResume(defaultResume);
      updateStatus(
        "idle",
        "未能自动读取 resume.template.toml。直接加载了内置示例数据，你仍然可以手动选择 TOML 文件。"
      );
    }
  }

  async function handleFileSelect(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = parseToml(raw);
      const normalized = normalizeResume(parsed);
      renderResume(normalized);
      statusDetail.textContent = `已加载配置文件：${file.name}`;
    } catch (error) {
      updateStatus(
        "danger",
        "配置文件解析失败，请检查 TOML 语法，尤其是引号、数组和多行字符串。"
      );
      statusDetail.textContent = String(error && error.message ? error.message : error);
    } finally {
      event.target.value = "";
    }
  }

  function renderResume(resume) {
    renderBasic(resume.basic || {});
    renderSkills((resume.skills || []).slice(0, 12));
    renderProjects((resume.projects || []).slice(0, 3));
    renderWork((resume.work_experiences || []).slice(0, 3));
    renderEducation(resume.education || {});
    renderSummary(resume.summary || {});
    requestAnimationFrame(evaluatePageStatus);
  }

  function renderBasic(basic) {
    const extras = Array.isArray(basic.extras) ? basic.extras.filter(Boolean) : [];
    const metaItems = [basic.website, basic.city].concat(extras).filter(Boolean);

    basicSection.innerHTML = `
      <div class="resume-name-row">
        <h1 class="resume-name">${escapeHtml(basic.name || "")}</h1>
        <span class="resume-role">${escapeHtml(basic.role || "")}</span>
      </div>
      <div class="resume-contact-row">
        ${renderInlineItems([basic.phone, basic.email])}
      </div>
      <div class="resume-meta-row">
        ${renderInlineItems(metaItems)}
      </div>
    `;
  }

  function renderSkills(skills) {
    skillsSection.innerHTML = "";
    if (!skills.length) {
      return;
    }

    skillsSection.appendChild(createSectionTitle("技术栈"));
    const grid = document.createElement("div");
    grid.className = "skills-grid";
    grid.id = "skills-grid";

    skills.forEach((group) => {
      const row = document.createElement("div");
      row.className = "skill-group";
      row.innerHTML = `
        <div class="skill-group__name">${escapeHtml(group.category || "")}</div>
        <div>${escapeHtml(joinItems(group.items))}</div>
      `;
      grid.appendChild(row);
    });

    skillsSection.appendChild(grid);
  }

  function renderProjects(projects) {
    projectsSection.innerHTML = "";
    if (!projects.length) {
      return;
    }

    projectsSection.appendChild(createSectionTitle("项目经历"));
    const list = document.createElement("div");
    list.className = "entry-list";

    projects.forEach((project) => {
      const card = document.createElement("article");
      card.className = "entry-card";
      card.innerHTML = `
        <div class="entry-card__header">
          <h3 class="entry-card__title">${escapeHtml(project.name || "")}</h3>
        </div>
        <p class="entry-card__body">${escapeHtml(project.description || "")}</p>
        ${renderBulletList(project.contributions)}
      `;
      list.appendChild(card);
    });

    projectsSection.appendChild(list);
  }

  function renderWork(workExperiences) {
    workSection.innerHTML = "";
    if (!workExperiences.length) {
      return;
    }

    workSection.appendChild(createSectionTitle("工作经历"));
    const list = document.createElement("div");
    list.className = "entry-list";

    workExperiences.forEach((job) => {
      const title = [job.company, job.position].filter(Boolean).join(" / ");
      const card = document.createElement("article");
      card.className = "entry-card";
      card.innerHTML = `
        <div class="entry-card__header">
          <h3 class="entry-card__title">${escapeHtml(title)}</h3>
          <span class="entry-card__meta">${escapeHtml(job.period || "")}</span>
        </div>
        ${renderBulletList(job.details)}
      `;
      list.appendChild(card);
    });

    workSection.appendChild(list);
  }

  function renderEducation(education) {
    educationSection.innerHTML = "";
    const text = [education.school, education.major, education.period]
      .filter(Boolean)
      .join(" / ");
    if (!text) {
      return;
    }

    educationSection.appendChild(createSectionTitle("教育背景"));
    const paragraph = document.createElement("p");
    paragraph.className = "education-text";
    paragraph.textContent = text;
    educationSection.appendChild(paragraph);
  }

  function renderSummary(summary) {
    summarySection.innerHTML = "";
    if (!summary.text) {
      return;
    }

    summarySection.appendChild(createSectionTitle("个人评价"));
    const paragraph = document.createElement("p");
    paragraph.className = "summary-text";
    paragraph.textContent = summary.text;
    summarySection.appendChild(paragraph);
    const spacer = document.createElement("div");
    spacer.className = "resume-footer-spacer";
    summarySection.appendChild(spacer);
  }

  function evaluatePageStatus() {
    const pageHeight = resumePage.clientHeight;
    const contentHeight = resumePage.scrollHeight;
    const ratio = contentHeight / pageHeight;
    const skillsGrid = document.getElementById("skills-grid");

    if (skillsGrid) {
      skillsGrid.classList.toggle("skills-grid--compact", ratio > 0.94);
    }

    const compactContentHeight = resumePage.scrollHeight;
    const compactRatio = compactContentHeight / pageHeight;

    if (compactRatio > 1) {
      updateStatus("danger");
      return;
    }

    if (compactRatio > 0.94) {
      updateStatus("warn");
      return;
    }

    updateStatus("ok");
  }

  function updateStatus(level, overrideDetail) {
    const config = statusMap[level] || statusMap.idle;
    const labelMap = {
      idle: "未加载配置文件",
      ok: "一页内",
      warn: "接近上限",
      danger: "已超页",
    };

    stateText.className = config.className;
    stateText.textContent = labelMap[level] || labelMap.idle;
    statusDetail.textContent = overrideDetail || config.detail;
  }

  function createSectionTitle(text) {
    const fragment = titleTemplate.content.cloneNode(true);
    fragment.querySelector(".section-title__text").textContent = text;
    return fragment;
  }

  function renderInlineItems(items) {
    return items
      .filter(Boolean)
      .map((item) => `<span>${escapeHtml(item)}</span>`)
      .join("");
  }

  function renderBulletList(items) {
    const entries = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!entries.length) {
      return "";
    }

    return `<ul class="bullet-list">${entries
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>`;
  }

  function joinItems(items) {
    return Array.isArray(items) ? items.filter(Boolean).join(" / ") : "";
  }

  function normalizeResume(source) {
    return {
      basic: {
        name: toStringSafe(source.basic && source.basic.name),
        role: toStringSafe(source.basic && source.basic.role),
        phone: toStringSafe(source.basic && source.basic.phone),
        email: toStringSafe(source.basic && source.basic.email),
        website: toStringSafe(source.basic && source.basic.website),
        city: toStringSafe(source.basic && source.basic.city),
        extras: toStringArray(source.basic && source.basic.extras),
      },
      skills: Array.isArray(source.skills)
        ? source.skills.map((item) => ({
            category: toStringSafe(item.category),
            items: toStringArray(item.items),
          }))
        : [],
      projects: Array.isArray(source.projects)
        ? source.projects.map((item) => ({
            name: toStringSafe(item.name),
            description: toStringSafe(item.description),
            contributions: toStringArray(item.contributions),
          }))
        : [],
      work_experiences: Array.isArray(source.work_experiences)
        ? source.work_experiences.map((item) => ({
            company: toStringSafe(item.company),
            position: toStringSafe(item.position),
            period: toStringSafe(item.period),
            details: toStringArray(item.details),
          }))
        : [],
      education: {
        school: toStringSafe(source.education && source.education.school),
        major: toStringSafe(source.education && source.education.major),
        period: toStringSafe(source.education && source.education.period),
      },
      summary: {
        text: toStringSafe(source.summary && source.summary.text),
      },
    };
  }

  function toStringSafe(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value).trim();
  }

  function toStringArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map(toStringSafe).filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function parseToml(input) {
    const lines = input.replace(/\r\n/g, "\n").split("\n");
    const root = {};
    let currentContext = root;
    let pendingArray = null;

    for (let index = 0; index < lines.length; index += 1) {
      let line = stripComment(lines[index]).trim();
      if (!line) {
        continue;
      }

      if (pendingArray) {
        line = handlePendingArray(line, pendingArray);
        if (pendingArray.open) {
          continue;
        }
        pendingArray = null;
        continue;
      }

      if (line.startsWith("[[") && line.endsWith("]]")) {
        const path = line.slice(2, -2).trim();
        currentContext = createArrayTable(root, path);
        continue;
      }

      if (line.startsWith("[") && line.endsWith("]")) {
        const path = line.slice(1, -1).trim();
        currentContext = createTable(root, path);
        continue;
      }

      const equalIndex = findUnquoted(line, "=");
      if (equalIndex === -1) {
        throw new Error(`第 ${index + 1} 行缺少键值分隔符 "="`);
      }

      const key = line.slice(0, equalIndex).trim();
      const rawValue = line.slice(equalIndex + 1).trim();
      if (!key) {
        throw new Error(`第 ${index + 1} 行存在空键名`);
      }

      if (rawValue.startsWith("[") && !isArrayClosed(rawValue)) {
        pendingArray = {
          key,
          target: currentContext,
          lines: [rawValue],
          open: true,
        };
        continue;
      }

      currentContext[key] = parseValue(rawValue);
    }

    if (pendingArray && pendingArray.open) {
      throw new Error("数组未正确闭合");
    }

    return root;
  }

  function handlePendingArray(line, pendingArray) {
    pendingArray.lines.push(line);
    const merged = pendingArray.lines.join(" ");
    if (isArrayClosed(merged)) {
      pendingArray.target[pendingArray.key] = parseValue(merged);
      pendingArray.open = false;
      return "";
    }

    return merged;
  }

  function stripComment(line) {
    let quote = null;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' || char === "'") {
        if (quote === char) {
          quote = null;
        } else if (!quote) {
          quote = char;
        }
      }

      if (char === "#" && !quote) {
        return line.slice(0, index);
      }
    }

    return line;
  }

  function findUnquoted(line, targetChar) {
    let quote = null;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if ((char === '"' || char === "'") && line[index - 1] !== "\\") {
        if (quote === char) {
          quote = null;
        } else if (!quote) {
          quote = char;
        }
      }

      if (char === targetChar && !quote) {
        return index;
      }
    }

    return -1;
  }

  function createTable(root, path) {
    const segments = path.split(".").map((item) => item.trim()).filter(Boolean);
    let cursor = root;

    segments.forEach((segment) => {
      if (!isObject(cursor[segment])) {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    });

    return cursor;
  }

  function createArrayTable(root, path) {
    const segments = path.split(".").map((item) => item.trim()).filter(Boolean);
    const leaf = segments.pop();
    const parent = segments.length ? createTable(root, segments.join(".")) : root;

    if (!Array.isArray(parent[leaf])) {
      parent[leaf] = [];
    }

    const item = {};
    parent[leaf].push(item);
    return item;
  }

  function parseValue(rawValue) {
    const value = rawValue.trim();

    if (!value) {
      return "";
    }

    if (value.startsWith('"""') && value.endsWith('"""')) {
      return value.slice(3, -3).trim();
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return unescapeQuoted(value.slice(1, -1), value[0]);
    }

    if (value.startsWith("[") && value.endsWith("]")) {
      return parseArray(value);
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }

    return value;
  }

  function parseArray(value) {
    const body = value.slice(1, -1).trim();
    if (!body) {
      return [];
    }

    const items = [];
    let token = "";
    let quote = null;

    for (let index = 0; index < body.length; index += 1) {
      const char = body[index];
      if ((char === '"' || char === "'") && body[index - 1] !== "\\") {
        if (quote === char) {
          quote = null;
        } else if (!quote) {
          quote = char;
        }
      }

      if (char === "," && !quote) {
        items.push(parseValue(token.trim()));
        token = "";
        continue;
      }

      token += char;
    }

    if (token.trim()) {
      items.push(parseValue(token.trim()));
    }

    return items;
  }

  function unescapeQuoted(value, quoteType) {
    if (quoteType === "'") {
      return value;
    }

    return value
      .replaceAll("\\n", "\n")
      .replaceAll('\\"', '"')
      .replaceAll("\\\\", "\\");
  }

  function isArrayClosed(value) {
    let depth = 0;
    let quote = null;

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
        if (quote === char) {
          quote = null;
        } else if (!quote) {
          quote = char;
        }
      }

      if (quote) {
        continue;
      }

      if (char === "[") {
        depth += 1;
      } else if (char === "]") {
        depth -= 1;
      }
    }

    return depth === 0;
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
})();
