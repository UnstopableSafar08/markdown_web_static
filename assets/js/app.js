const STORAGE_KEY = 'markdown_web_notes';
const DEBOUNCE_DELAY = 500;

// State management
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let activeNoteId = null;
let editor = null;
let saveTimeout = null;

// Monaco Loading
require.config({ paths: { vs: 'assets/js/monaco/vs' } });

require(['vs/editor/editor.main'], function () {
    monaco.editor.defineTheme('tokyo-night', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'bb9af7' },
            { token: 'string', foreground: '9ece6a' },
            { token: 'number', foreground: 'ff9e64' },
            { token: 'type', foreground: '73daca' },
        ],
        colors: {
            'editor.background': '#1a1b26',
            'editor.foreground': '#a9b1d6',
            'editorLineNumber.foreground': '#3b4261',
            'editor.lineHighlightBackground': '#24283b',
            'editor.selectionBackground': '#33467c',
            'editorCursor.foreground': '#c0caf5',
        }
    });

    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '',
        language: 'markdown',
        theme: 'tokyo-night',
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        automaticLayout: true,
        minimap: { enabled: false },
        padding: { top: 20 },
        wordWrap: 'on',
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
}

function createNewNote() {
    const now = new Date();
    const isoNow = now.toISOString();
    
    const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    
    const newNote = {
        id: Date.now().toString(),
        title: `new-note-${timestamp}`,
        content: '# New Note\n\nWrite something beautiful...',
        tags: '',
        createdAt: isoNow,
        updatedAt: isoNow
    };
    notes.unshift(newNote);
    saveNotes();
    renderNoteList();
    setActiveNote(newNote.id);
}

function setActiveNote(id) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);
    if (note && editor) {
        document.getElementById('note-title-input').value = note.title;
        document.getElementById('note-tags-input').value = note.tags || '';
        document.getElementById('created-at').innerText = `Created: ${formatDate(note.createdAt)}`;
        document.getElementById('updated-at').innerText = `Updated: ${formatDate(note.updatedAt)}`;
        editor.setValue(note.content);
        renderMarkdown(note.content);
        updateActiveInList();
    }
}

function updateActiveNote() {
    const noteIndex = notes.findIndex(n => n.id === activeNoteId);
    if (noteIndex !== -1 && editor) {
        notes[noteIndex].title = document.getElementById('note-title-input').value || 'Untitled Note';
        notes[noteIndex].tags = document.getElementById('note-tags-input').value || '';
        notes[noteIndex].content = editor.getValue();
        notes[noteIndex].updatedAt = new Date().toISOString();
        
        document.getElementById('updated-at').innerText = `Updated: ${formatDate(notes[noteIndex].updatedAt)}`;
        
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
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMarkdown(content) {
    const preview = document.getElementById('preview-container');
    if (!preview) return;

    let html = '';
    try {
        if (typeof marked !== 'undefined' && marked.parse) {
            html = marked.parse(content);
        } else if (window.marked && window.marked.parse) {
            html = window.marked.parse(content);
        } else {
            html = '<pre>' + content + '</pre>';
        }
    } catch (e) {
        html = '<pre>' + content + '</pre>';
    }

    preview.innerHTML = html;

    if (typeof hljs !== 'undefined') {
        preview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            addCopyButtonToCode(block);
        });
    }
}

function addCopyButtonToCode(block) {
    const pre = block.parentElement;
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerText = 'Copy';
    btn.onclick = () => {
        navigator.clipboard.writeText(block.innerText);
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = 'Copy', 2000);
    };
    pre.appendChild(btn);
}

function renderNoteList() {
    const list = document.getElementById('note-list');
    const filter = document.getElementById('search-input').value.toLowerCase();
    list.innerHTML = '';
    
    notes.filter(n => n.title.toLowerCase().includes(filter) || n.content.toLowerCase().includes(filter) || (n.tags && n.tags.toLowerCase().includes(filter)))
         .forEach(note => {
            const item = document.createElement('div');
            item.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
            item.onclick = () => setActiveNote(note.id);
            const dateStr = formatDate(note.updatedAt);
            item.innerHTML = `<h3>${note.title}</h3><p>${dateStr} - ${note.tags ? '[' + note.tags + '] ' : ''}${note.content.substring(0, 30).replace(/[#*`]/g, '')}</p>`;
            list.appendChild(item);
         });
}

function updateActiveInList() {
    document.querySelectorAll('.note-item').forEach(i => i.classList.remove('active'));
}

function setupResizer() {
    const resizer = document.getElementById('resizer');
    const sidebar = document.querySelector('.sidebar');
    const editorPane = document.querySelector('.editor-pane');
    const previewPane = document.querySelector('.preview-pane');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const sidebarWidth = sidebar.classList.contains('collapsed') ? 0 : sidebar.offsetWidth;
        const availableWidth = window.innerWidth - sidebarWidth;
        const x = e.clientX - sidebarWidth;
        const percentage = (x / availableWidth) * 100;
        
        if (percentage > 10 && percentage < 90) {
            editorPane.style.flex = `0 0 ${percentage}%`;
            previewPane.style.flex = `0 0 ${100 - percentage}%`;
            if (editor) editor.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = 'default';
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
        if (type === 'color') {
            existingStyle = existingStyle.replace(/color:\s*[^;]+;?\s*/g, '').trim();
            existingStyle += (existingStyle.endsWith(';') || existingStyle === '' ? '' : '; ') + `color: ${value};`;
        } else if (type === 'font-size') {
            existingStyle = existingStyle.replace(/font-size:\s*[^;]+;?\s*/g, '').trim();
            existingStyle += (existingStyle.endsWith(';') || existingStyle === '' ? '' : '; ') + `font-size: ${value};`;
        }
        
        newText = `<span style="${existingStyle.trim()}">${innerContent}</span>`;
    } else {
        newText = `<span style="${type}: ${value}">${selectedText || (type === 'color' ? 'colored text' : 'sized text')}</span>`;
    }
    
    editor.executeEdits(id, [{
        range: selection,
        text: newText,
        forceMoveMarkers: true
    }]);
    editor.focus();
}

function setupEventListeners() {
    document.getElementById('new-note-btn').onclick = createNewNote;
    document.getElementById('note-title-input').oninput = handleAutoSave;
    document.getElementById('note-tags-input').oninput = handleAutoSave;
    document.getElementById('search-input').oninput = renderNoteList;
    
    document.getElementById('toggle-sidebar').onclick = () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        setTimeout(() => editor.layout(), 350);
    };

    // Style Ribbon Logic
    const ribbonActions = {
        'btn-bold': { prefix: '**', suffix: '**' },
        'btn-italic': { prefix: '*', suffix: '*' },
        'btn-heading-1': { prefix: '# ', suffix: '' },
        'btn-heading-2': { prefix: '## ', suffix: '' },
        'btn-list-unordered': { prefix: '- ', suffix: '' },
        'btn-list-ordered': { prefix: '1. ', suffix: '' },
        'btn-link': { prefix: '[', suffix: '](https://)' },
        'btn-image-url': { prefix: '![alt text](', suffix: 'https://<your-image-link-here>)' }
    };

    Object.entries(ribbonActions).forEach(([id, { prefix, suffix }]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                const selection = editor.getSelection();
                const text = editor.getModel().getValueInRange(selection);
                editor.executeEdits('ribbon', [{
                    range: selection,
                    text: prefix + text + suffix,
                    forceMoveMarkers: true
                }]);
                editor.focus();
            };
        }
    });

    // Image Upload Logic (Reference Link style with fixed spacing)
    const imageUploadInput = document.getElementById('image-upload-input');
    document.getElementById('btn-image-upload').onclick = () => imageUploadInput.click();

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
            editor.executeEdits('image-upload', [{
                range: selection,
                text: `![${file.name}][${refLabel}]`,
                forceMoveMarkers: true
            }]);

            // Step 2: Append definition with MANDATORY double newline to satisfy Markdown parsers
            const lastLine = model.getLineCount();
            editor.executeEdits('image-ref', [{
                range: new monaco.Range(lastLine + 1, 1, lastLine + 1, 1),
                text: `\n\n[${refLabel}]: ${base64}\n`,
                forceMoveMarkers: true
            }]);

            editor.focus();
            imageUploadInput.value = '';
        };
        reader.readAsDataURL(file);
    };

    // Color & Font Size (NOW WITH UPDATE LOGIC)
    const colorPicker = document.getElementById('note-color-picker');
    document.getElementById('btn-color').onclick = () => colorPicker.click();
    colorPicker.oninput = (e) => applyStyleToSelection('color', 'color', e.target.value);

    const fontSizePicker = document.getElementById('note-font-size-picker');
    document.getElementById('btn-font-size').onclick = () => {
        fontSizePicker.style.display = fontSizePicker.style.display === 'block' ? 'none' : 'block';
    };
    fontSizePicker.onchange = (e) => {
        applyStyleToSelection('font-size', 'font-size', e.target.value);
        fontSizePicker.style.display = 'none';
    };

    // Global copy buttons
    document.getElementById('copy-markdown-btn').onclick = () => {
        if (editor) {
            navigator.clipboard.writeText(editor.getValue());
            showToast('Markdown copied to clipboard!');
        }
    };

    document.getElementById('copy-preview-btn').onclick = () => {
        const preview = document.getElementById('preview-container');
        if (preview) {
            navigator.clipboard.writeText(preview.innerHTML);
            showToast('Preview HTML copied to clipboard!');
        }
    };

    document.getElementById('delete-note-btn').onclick = () => {
        document.getElementById('delete-modal').style.display = 'flex';
    };
    document.getElementById('cancel-delete').onclick = () => {
        document.getElementById('delete-modal').style.display = 'none';
    };
    document.getElementById('confirm-delete').onclick = () => {
        notes = notes.filter(n => n.id !== activeNoteId);
        saveNotes();
        document.getElementById('delete-modal').style.display = 'none';
        if (notes.length > 0) setActiveNote(notes[0].id);
        else createNewNote();
        renderNoteList();
    };

    document.getElementById('export-btn').onclick = () => {
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;
        
        const temp = document.createElement('div');
        temp.style.padding = '40px';
        temp.style.color = '#000';
        temp.style.fontFamily = 'Arial, sans-serif';
        temp.innerHTML = `<h1>${note.title}</h1><p><small>Created: ${formatDate(note.createdAt)} | Updated: ${formatDate(note.updatedAt)}</small></p><p><strong>Tags:</strong> ${note.tags || 'none'}</p><hr>` + renderMarkdownInternal(note.content);
        
        html2pdf().from(temp).set({
            margin: 1,
            filename: `${note.title}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).save();
    };
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#7aa2f7';
    toast.style.color = '#1a1b26';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '3000';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4)';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function renderMarkdownInternal(content) {
    if (typeof window.marked !== 'undefined' && window.marked.parse) return window.marked.parse(content);
    if (typeof marked !== 'undefined') return marked.parse(content);
    return content;
}
