# Markdown Web: High-Fidelity Project Creation Prompt

Copy and paste the prompt below to recreate the **Markdown Web** application in any environment.

---

## The Prompt

**Subject**: Create a Premium Markdown Note-Taking Web App ("Markdown Web")

**Objective**: Build a high-performance, aesthetically stunning web application for managing Markdown notes with a focus on Glassmorphism design and professional user experience.

### 1. Technology Stack
- **Backend**: Python 3.12+ with Django 4.2+.
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), and modular JavaScript.
- **Editor**: Monaco Editor (via CDN) for rich Markdown editing.
- **Markdown Rendering**: `marked.js` with `highlight.js` (Theme: `tokyo-night-dark`).
- **Exporting**: `html2pdf.js` for PDF generation, vanilla JS for HTML export.

### 2. Core Features to Implement
- **Note Sidebar**: Dynamic list of notes with search and "New Note" creation.
- **Split-Pane Workspace**: Monaco editor on the left, real-time preview rendering on the right.
- **Autosave System**: Debounced AJAX/Fetch calls to save changes to the Django backend as the user types.
- **Tagging & Metadata**: Support for tags (comma-separated) and display of Created/Updated dates.
- **Resizable Layout**: Draggable dividers between the sidebar/editor and editor/preview panes.
- **Import/Export**: Import `.md` files; Export as `.html` or `.pdf`.
- **Delete with Confirmation**: Custom glassmorphism modal for deleting notes.

### 3. Design & Aesthetics (CRITICAL)
- **Glassmorphism**: Use `backdrop-filter: blur(15px)`, `rgba(255, 255, 255, 0.05)` backgrounds, and subtle `1px` borders.
- **Theme**: Dark Mode by default (Background: `#0f1117`, Surfaces: `#1a1b26`).
- **Typography**: Interface font 'Inter', Editor font 'Fira Code'.
- **Animations**: CSS transitions for all interactions (`0.3s ease-in-out`).
- **Visual Feedback**: Loading states for delete, success indicators for save, and hover effects for buttons.

### 4. Code Structure
- **Models**: `Note` model with `title`, `content` (TextField), `tags` (CharField), and timestamps.
- **Views**: 
  - `index`: Render main dashboard with note list.
  - `create_note`: POST to initialize a new note.
  - `update_note`: POST JSON to save content/title/tags.
  - `delete_note`: POST to remove a note.
- **Static Assets**:
  - `style.css`: Centralized design system with CSS variables.
  - `app.js`: Main logic for Monaco initialization, preview rendering, and AJAX.

### 5. Final Polishing
- Ensure the app is responsive and looks premium on macOS/Windows.
- Add "Copy Code" buttons to all code blocks in the Markdown preview.
- Include a "Sidebar Toggle" for a distraction-free writing mode.

---
**Instructions for the Assistant**: Focus on visual excellence and clean, modular code. Use semantic HTML5 and optimize for performance.
