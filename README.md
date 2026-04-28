---
# Markdown Web | Premium Note-Taking

A premium, glassmorphic Markdown note-taking application with live preview, syntax highlighting, and export capabilities.

## Features

- **Live Markdown Preview**: Real-time rendering of Markdown to HTML with split-pane view
- **Syntax Highlighting**: Code blocks with Tokyo Night Dark theme
- **Multiple Export Options**:
  - Export as HTML with syntax highlighting
  - Export as PDF
  - Copy Markdown to clipboard
  - Copy HTML preview to clipboard
- **Import Support**: Import existing Markdown files
- **Local Storage**: Notes are saved automatically to browser's local storage
- **Search**: Search through notes by title, content, or tags
- **Tags**: Organize notes with tags
- **Responsive Design**: Collapsible sidebar for mobile-friendly experience
- **Rich Text Formatting**: Bold, italic, headings, lists, links, images, text color, and font size
- **Code Block Copy**: One-click copy button for code blocks
- **Scroll-to-Top**: Floating button for easy navigation in exported HTML

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Markdown Parser**: Marked.js
- **Syntax Highlighting**: Highlight.js with Tokyo Night Dark theme
- **Code Editor**: Monaco Editor (VS Code's editor)
- **PDF Export**: html2pdf.js
- **Icons**: Lucide Icons
- **Fonts**: Inter (body text), Fira Code (code)

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build process or server required - works entirely in the browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/UnstopableSafar08/markdown_web_static.git
   ```

2. Open `index.html` in your web browser:
   ```bash
   open index.html
   ```

Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Usage

### Creating Notes

1. Click the "New Note" button in the sidebar
2. Enter a title for your note
3. Start writing Markdown in the editor pane
4. See the live preview in the right pane

### Formatting

Use the style ribbon buttons or Markdown syntax:

- **Bold**: `**text**` or Ctrl+B
- **Italic**: `*text*` or Ctrl+I
- **Headings**: `# Heading 1`, `## Heading 2`
- **Lists**: `- item` or `1. item`
- **Links**: `[text](url)`
- **Images**: `![alt](url)` or upload via button

### Exporting

- **HTML**: Click the "HTML" button to export as a standalone HTML file
- **PDF**: Click the "PDF" button to export as PDF
- **Copy MD**: Copy raw Markdown to clipboard
- **Copy HTML**: Copy rendered HTML to clipboard

### Importing

Click the "Import MD" button to import an existing Markdown file.

## Keyboard Shortcuts

- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic

## Project Structure

```
markdown_web_static/
├── assets/
│   ├── css/
│   │   ├── style.css              # Main stylesheet
│   │   └── tokyo-night-dark.min.css # Syntax highlighting theme
│   ├── js/
│   │   ├── app.js                 # Main application logic
│   │   ├── marked.min.js          # Markdown parser
│   │   ├── highlight.min.js       # Syntax highlighter
│   │   ├── html2pdf.bundle.min.js # PDF export
│   │   ├── lucide.min.js          # Icons
│   │   └── monaco/                # Monaco editor files
│   └── img/
│       └── favicon.ico
├── index.html                     # Main HTML file
└── README.md                      # This file
```

## Customization

### Colors

Edit CSS variables in `assets/css/style.css`:

```css
:root {
  --bg-dark: #0f1117;
  --surface-dark: #1a1b26;
  --accent: #7aa2f7;
  /* ... */
}
```

### Fonts

Change fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

## License

This project is open source and available under the MIT License.

## Author

**Sagar Malla**

- GitHub: [@UnstopableSafar08](https://github.com/UnstopableSafar08)
- Website: [sagarmalla.info.np](https://sagarmalla.info.np/)
- Notes: [notes.sagarmalla.info.np](https://notes.sagarmalla.info.np)

## Acknowledgments

- [Marked.js](https://marked.js.org/) for Markdown parsing
- [Highlight.js](https://highlightjs.org/) for syntax highlighting
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Lucide](https://lucide.dev/) for beautiful icons
- [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) for the color scheme
