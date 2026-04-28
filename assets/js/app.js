const STORAGE_KEY = "markdown_web_notes";
const DEBOUNCE_DELAY = 500;

// State management
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let activeNoteId = null;
let editor = null;
let saveTimeout = null;

// Monaco Loading
require.config({ paths: { vs: "assets/js/monaco/vs" } });

require(["vs/editor/editor.main"], function () {
  monaco.editor.defineTheme("tokyo-night", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "565f89", fontStyle: "italic" },
      { token: "keyword", foreground: "bb9af7" },
      { token: "string", foreground: "9ece6a" },
      { token: "number", foreground: "ff9e64" },
      { token: "type", foreground: "73daca" },
    ],
    colors: {
      "editor.background": "#1a1b26",
      "editor.foreground": "#a9b1d6",
      "editorLineNumber.foreground": "#3b4261",
      "editor.lineHighlightBackground": "#24283b",
      "editor.selectionBackground": "#33467c",
      "editorCursor.foreground": "#c0caf5",
    },
  });

  editor = monaco.editor.create(document.getElementById("editor-container"), {
    value: "",
    language: "markdown",
    theme: "tokyo-night",
    fontSize: 14,
    fontFamily: "'Fira Code', monospace",
    automaticLayout: true,
    minimap: { enabled: false },
    padding: { top: 20 },
    wordWrap: "on",
  });

  editor.onDidChangeModelContent(() => {
    handleAutoSave();
    renderMarkdown(editor.getValue());
  });

  init();
});

function init() {
  renderNoteList();
  if (notes.length > 0) {
    setActiveNote(notes[0].id);
  } else {
    createNewNote();
  }
  setupEventListeners();
  setupResizer();
  if (window.lucide) lucide.createIcons();
  // Refresh icons after setup
  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 100);
}

function createNewNote() {
  const now = new Date();
  const isoNow = now.toISOString();

  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "-" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const newNote = {
    id: Date.now().toString(),
    title: `new-note-${timestamp}`,
    content: "# New Note\n\nWrite something beautiful...",
    tags: "",
    createdAt: isoNow,
    updatedAt: isoNow,
  };
  notes.unshift(newNote);
  saveNotes();
  renderNoteList();
  setActiveNote(newNote.id);
}

function setActiveNote(id) {
  activeNoteId = id;
  const note = notes.find((n) => n.id === id);
  if (note && editor) {
    document.getElementById("note-title-input").value = note.title;
    document.getElementById("note-tags-input").value = note.tags || "";
    document.getElementById("created-at").innerText =
      `Created: ${formatDate(note.createdAt)}`;
    document.getElementById("updated-at").innerText =
      `Updated: ${formatDate(note.updatedAt)}`;
    editor.setValue(note.content);
    renderMarkdown(note.content);
    updateActiveInList();
  }
}

function updateActiveNote() {
  const noteIndex = notes.findIndex((n) => n.id === activeNoteId);
  if (noteIndex !== -1 && editor) {
    notes[noteIndex].title =
      document.getElementById("note-title-input").value || "Untitled Note";
    notes[noteIndex].tags =
      document.getElementById("note-tags-input").value || "";
    notes[noteIndex].content = editor.getValue();
    notes[noteIndex].updatedAt = new Date().toISOString();

    document.getElementById("updated-at").innerText =
      `Updated: ${formatDate(notes[noteIndex].updatedAt)}`;

    saveNotes();
    renderNoteList();
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function handleAutoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(updateActiveNote, DEBOUNCE_DELAY);
}

function formatDate(isoStr) {
  if (!isoStr) return "--";
  const d = new Date(isoStr);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function renderMarkdown(content) {
  const preview = document.getElementById("preview-container");
  if (!preview) return;

  let html = "";
  try {
    if (typeof marked !== "undefined" && marked.parse) {
      html = marked.parse(content);
    } else if (window.marked && window.marked.parse) {
      html = window.marked.parse(content);
    } else {
      html = "<pre>" + content + "</pre>";
    }
  } catch (e) {
    html = "<pre>" + content + "</pre>";
  }

  preview.innerHTML = html;

  if (typeof hljs !== "undefined") {
    preview.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
      addCopyButtonToCode(block);
    });
  }
}

function addCopyButtonToCode(block) {
  const pre = block.parentElement;
  if (pre.querySelector(".copy-btn")) return;
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.innerText = "Copy";
  btn.onclick = () => {
    navigator.clipboard.writeText(block.innerText);
    btn.innerText = "Copied!";
    setTimeout(() => (btn.innerText = "Copy"), 2000);
  };
  pre.appendChild(btn);
}

function renderNoteList() {
  const list = document.getElementById("note-list");
  const filter = document.getElementById("search-input").value.toLowerCase();
  list.innerHTML = "";

  notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(filter) ||
        n.content.toLowerCase().includes(filter) ||
        (n.tags && n.tags.toLowerCase().includes(filter)),
    )
    .forEach((note) => {
      const item = document.createElement("div");
      item.className = `note-item ${note.id === activeNoteId ? "active" : ""}`;
      item.onclick = () => setActiveNote(note.id);
      const dateStr = formatDate(note.updatedAt);
      item.innerHTML = `<h3>${note.title}</h3><p>${dateStr} - ${note.tags ? "[" + note.tags + "] " : ""}${note.content.substring(0, 30).replace(/[#*`]/g, "")}</p>`;
      list.appendChild(item);
    });
}

function updateActiveInList() {
  document
    .querySelectorAll(".note-item")
    .forEach((i) => i.classList.remove("active"));
}

function setupResizer() {
  const resizer = document.getElementById("resizer");
  const sidebar = document.querySelector(".sidebar");
  const editorPane = document.querySelector(".editor-pane");
  const previewPane = document.querySelector(".preview-pane");
  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const sidebarWidth = sidebar.classList.contains("collapsed")
      ? 0
      : sidebar.offsetWidth;
    const availableWidth = window.innerWidth - sidebarWidth;
    const x = e.clientX - sidebarWidth;
    const percentage = (x / availableWidth) * 100;

    if (percentage > 10 && percentage < 90) {
      editorPane.style.flex = `0 0 ${percentage}%`;
      previewPane.style.flex = `0 0 ${100 - percentage}%`;
      if (editor) editor.layout();
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.cursor = "default";
  });
}

/**
 * Intelligent Text Formatting: Wraps selection in a span or updates existing style.
 */
function applyStyleToSelection(id, type, value) {
  if (!editor) return;
  const selection = editor.getSelection();
  const model = editor.getModel();
  const selectedText = model.getValueInRange(selection);

  // Regex to detect if the selection IS already a span with styling
  const spanRegex = /<span\s+style="([^"]*)"\s*>(.*)<\/span>/is;
  const match = selectedText.match(spanRegex);

  let newText;
  if (match) {
    let existingStyle = match[1];
    let innerContent = match[2];

    // Remove existing property of same type
    if (type === "color") {
      existingStyle = existingStyle.replace(/color:\s*[^;]+;?\s*/g, "").trim();
      existingStyle +=
        (existingStyle.endsWith(";") || existingStyle === "" ? "" : "; ") +
        `color: ${value};`;
    } else if (type === "font-size") {
      existingStyle = existingStyle
        .replace(/font-size:\s*[^;]+;?\s*/g, "")
        .trim();
      existingStyle +=
        (existingStyle.endsWith(";") || existingStyle === "" ? "" : "; ") +
        `font-size: ${value};`;
    }

    newText = `<span style="${existingStyle.trim()}">${innerContent}</span>`;
  } else {
    newText = `<span style="${type}: ${value}">${selectedText || (type === "color" ? "colored text" : "sized text")}</span>`;
  }

  editor.executeEdits(id, [
    {
      range: selection,
      text: newText,
      forceMoveMarkers: true,
    },
  ]);
  editor.focus();
}

function setupEventListeners() {
  document.getElementById("new-note-btn").onclick = createNewNote;
  document.getElementById("note-title-input").oninput = handleAutoSave;
  document.getElementById("note-tags-input").oninput = handleAutoSave;
  document.getElementById("search-input").oninput = renderNoteList;

  document.getElementById("toggle-sidebar").onclick = () => {
    document.querySelector(".sidebar").classList.toggle("collapsed");
    setTimeout(() => editor.layout(), 350);
  };

  // Style Ribbon Logic
  const ribbonActions = {
    "btn-bold": { prefix: "**", suffix: "**" },
    "btn-italic": { prefix: "*", suffix: "*" },
    "btn-heading-1": { prefix: "# ", suffix: "" },
    "btn-heading-2": { prefix: "## ", suffix: "" },
    "btn-list-unordered": { prefix: "- ", suffix: "" },
    "btn-list-ordered": { prefix: "1. ", suffix: "" },
    "btn-link": { prefix: "[", suffix: "](https://)" },
    "btn-image-url": {
      prefix: "![alt text](",
      suffix: "https://<your-image-link-here>)",
    },
  };

  Object.entries(ribbonActions).forEach(([id, { prefix, suffix }]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = () => {
        const selection = editor.getSelection();
        const text = editor.getModel().getValueInRange(selection);
        editor.executeEdits("ribbon", [
          {
            range: selection,
            text: prefix + text + suffix,
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      };
    }
  });

  // Image Upload Logic (Reference Link style with fixed spacing)
  const imageUploadInput = document.getElementById("image-upload-input");
  document.getElementById("btn-image-upload").onclick = () =>
    imageUploadInput.click();

  imageUploadInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      const refLabel = `image-${Date.now().toString().slice(-6)}`;

      const selection = editor.getSelection();
      const model = editor.getModel();

      // Step 1: Insert reference tag
      editor.executeEdits("image-upload", [
        {
          range: selection,
          text: `![${file.name}][${refLabel}]`,
          forceMoveMarkers: true,
        },
      ]);

      // Step 2: Append definition with MANDATORY double newline to satisfy Markdown parsers
      const lastLine = model.getLineCount();
      editor.executeEdits("image-ref", [
        {
          range: new monaco.Range(lastLine + 1, 1, lastLine + 1, 1),
          text: `\n\n[${refLabel}]: ${base64}\n`,
          forceMoveMarkers: true,
        },
      ]);

      editor.focus();
      imageUploadInput.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Color & Font Size (NOW WITH UPDATE LOGIC)
  const colorPicker = document.getElementById("note-color-picker");
  document.getElementById("btn-color").onclick = () => colorPicker.click();
  colorPicker.oninput = (e) =>
    applyStyleToSelection("color", "color", e.target.value);

  const fontSizePicker = document.getElementById("note-font-size-picker");
  document.getElementById("btn-font-size").onclick = () => {
    fontSizePicker.style.display =
      fontSizePicker.style.display === "block" ? "none" : "block";
  };
  fontSizePicker.onchange = (e) => {
    applyStyleToSelection("font-size", "font-size", e.target.value);
    fontSizePicker.style.display = "none";
  };

  // Global copy buttons
  document.getElementById("copy-markdown-btn").onclick = () => {
    if (editor) {
      navigator.clipboard.writeText(editor.getValue());
      showToast("Markdown copied to clipboard!");
    }
  };

  // Import Markdown button
  const mdImportInput = document.getElementById("md-import-input");
  document.getElementById("import-md-btn").onclick = () => mdImportInput.click();

  mdImportInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      if (editor) {
        editor.setValue(content);
        showToast("Markdown imported successfully!");
      }
      mdImportInput.value = "";
    };
    reader.readAsText(file);
  };

  document.getElementById("copy-preview-btn").onclick = () => {
    const preview = document.getElementById("preview-container");
    if (preview) {
      navigator.clipboard.writeText(preview.innerHTML);
      showToast("Preview HTML copied to clipboard!");
    }
  };

  document.getElementById("export-html-btn").onclick = () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    const preview = document.getElementById("preview-container");
    if (preview) {
      const now = new Date();
      const exportedDateTime = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Create a complete HTML document
      const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${note.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    #MainContent {
      margin: 20px 25px 0 40px;
      padding-bottom: 20px;
      color: #555;
    }

    h1, h2, h3, h4, h5, h6 {
      color: steelblue;
      font-weight: 600;
      margin-top: 1.2em;
      margin-bottom: 0.3em;
    }

    h1 {
      font-size: 34pt;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      color: rgb(123, 24, 9);
    }

    h2 {
      font-size: 24pt;
      color: rgb(227, 41, 12);
    }

    h3 {
      font-size: 18pt;
      color: rgb(13, 176, 226);
    }

    h4 {
      color: rgb(238 12 124);
      font-size: 18pt;
    }

    h5, h6 {
      color: #606060;
      font-size: 16pt;
    }

    h6 {
      color: #707070;
      font-size: 10pt;
    }

    p {
      margin: 0 0 1em 0;
      line-height: 1.6;
    }

    code {
      font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    pre {
      font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 0.875em;
      font-weight: normal;
      line-height: 1.45;
      margin: 7px 0;
      padding: 0;
      border: 1px solid silver;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre;
      word-break: break-all;
      position: relative;
      background: #252525;
    }

    pre code {
      padding: 0.8em;
      display: block;
      color: #f5f5f5;
      background: none;
      padding: 0;
    }

    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #e0e0e0;
      border: 1px solid #ccc;
      color: #333;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 10;
    }

    .copy-btn:hover {
      background: #d0d0d0;
      border-color: #999;
    }

    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin-left: 0;
      color: #666;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    a {
      color: #0366d6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    #goTopBtn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: none;
      background-color: #180b75;
      color: #edce15;
      font-weight: bolder;
      font-size: 20px;
      padding: 10px 12px;
      border-radius: 30px;
      box-shadow: red 2px 2px 4px;
      border: none;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.3s;
    }

    #goTopBtn:hover {
      opacity: 1;
    }

    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 20px;
      color: #666;
    }

    footer a {
      color: #0366d6;
    }

    /* Syntax Highlighting - Tokyo Night Dark Theme */
    pre code.hljs {
      display: block;
      overflow-x: auto;
      padding: 1em;
    }
    code.hljs {
      padding: 3px 5px;
    }
    .hljs-comment,
    .hljs-meta {
      color: #565f89;
    }
    .hljs-deletion,
    .hljs-doctag,
    .hljs-regexp,
    .hljs-selector-attr,
    .hljs-selector-class,
    .hljs-selector-id,
    .hljs-selector-pseudo,
    .hljs-tag,
    .hljs-template-tag,
    .hljs-variable.language_ {
      color: #f7768e;
    }
    .hljs-link,
    .hljs-literal,
    .hljs-number,
    .hljs-params,
    .hljs-template-variable,
    .hljs-type,
    .hljs-variable {
      color: #ff9e64;
    }
    .hljs-attribute,
    .hljs-built_in {
      color: #e0af68;
    }
    .hljs-keyword,
    .hljs-property,
    .hljs-subst,
    .hljs-title,
    .hljs-title.class_,
    .hljs-title.class_.inherited__,
    .hljs-title.function_ {
      color: #7dcfff;
    }
    .hljs-selector-tag {
      color: #73daca;
    }
    .hljs-addition,
    .hljs-bullet,
    .hljs-quote,
    .hljs-string,
    .hljs-symbol {
      color: #9ece6a;
    }
    .hljs-code,
    .hljs-formula,
    .hljs-section {
      color: #7aa2f7;
    }
    .hljs-attr,
    .hljs-char.escape_,
    .hljs-keyword,
    .hljs-name,
    .hljs-operator {
      color: #bb9af7;
    }
    .hljs-punctuation {
      color: #c0caf5;
    }
    .hljs {
      background: #1a1b26;
      color: #9aa5ce;
    }
    .hljs-emphasis {
      font-style: italic;
    }
    .hljs-strong {
      font-weight: 700;
    }
  </style>
</head>

<body>
  <div id="MainContent">
    ${preview.innerHTML}

    <footer>
        © 2026 <a href="https://notes.sagarmalla.info.np">Sagar's Notes</a> |
        <a href="https://sagarmalla.info.np/">🌍 Sagar Malla</a> |<b>
        🗓️ Exported DateTime:</b> ${exportedDateTime}
    </footer>
  </div>

  <button id="goTopBtn" onclick="scrollToTop()">TOP⬆️</button>

  <script>
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = function() {
        const pre = this.parentElement;
        const code = pre.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.innerText).then(() => {
            const originalText = this.innerText;
            this.innerText = 'Copied!';
            setTimeout(() => {
              this.innerText = originalText;
            }, 2000);
          });
        }
      };
    });

    window.onscroll = function () {
      const goTopBtn = document.getElementById("goTopBtn");
      if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        goTopBtn.style.display = "block";
      } else {
        goTopBtn.style.display = "none";
      }
    };

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  <\/script>
</body>

</html>`;

      // Create a blob and download it
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("HTML file exported successfully!");
    }
  };

  document.getElementById("delete-note-btn").onclick = () => {
    document.getElementById("delete-modal").style.display = "flex";
  };
  document.getElementById("cancel-delete").onclick = () => {
    document.getElementById("delete-modal").style.display = "none";
  };
  document.getElementById("confirm-delete").onclick = () => {
    notes = notes.filter((n) => n.id !== activeNoteId);
    saveNotes();
    document.getElementById("delete-modal").style.display = "none";
    if (notes.length > 0) setActiveNote(notes[0].id);
    else createNewNote();
    renderNoteList();
  };

  document.getElementById("export-btn").onclick = () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    const temp = document.createElement("div");
    temp.style.padding = "40px";
    temp.style.color = "#000";
    temp.style.fontFamily = "Arial, sans-serif";
    temp.innerHTML =
      `<h1>${note.title}</h1><p><small>Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}</small></p><p><strong>Tags:</strong> ${note.tags || "none"}</p><hr>` +
      renderMarkdownInternal(note.content);

    html2pdf()
      .from(temp)
      .set({
        margin: 1,
        filename: `${note.title}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      })
      .save();
  };
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "2rem";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#7aa2f7";
  toast.style.color = "#1a1b26";
  toast.style.padding = "0.75rem 1.5rem";
  toast.style.borderRadius = "8px";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "3000";
  toast.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.4)";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s";
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

function renderMarkdownInternal(content) {
  if (typeof window.marked !== "undefined" && window.marked.parse)
    return window.marked.parse(content);
  if (typeof marked !== "undefined") return marked.parse(content);
  return content;
}
