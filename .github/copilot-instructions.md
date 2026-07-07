# Copilot Instructions

## Project Overview

This is a frontend application deployed to GitHub Pages for validating JSON files containing textbook questions. Users upload JSON files, review questions, validate or reject each one (with reasoning), and export results to Excel. The application is stateless—no data is persisted between sessions.

### Key Principles
- **Stateless**: No data storage; browser-only state management with React Hooks
- **Client-Side Only**: No backend required; works offline
- **Type-Safe**: Full TypeScript coverage with zero errors
- **Accessible**: Responsive design supporting mobile, tablet, and desktop

---

## Implementation Details

### Technology Stack

**Frontend Framework**
- React 18.2.0 (component-based UI)
- TypeScript 5.2.2 (type safety, compile-time checks)
- Tailwind CSS 4.3.2 (utility-first styling)
- PostCSS 8.5.16 (CSS processing)

**Build & Development**
- Vite 5.0.8 (lightning-fast dev server ~150ms, optimized builds)
- @vitejs/plugin-react 4.2.1 (React Hot Module Replacement)
- Autoprefixer 10.5.2 (cross-browser CSS support)

**Data Processing**
- ExcelJS 4.4.0 (native .xlsx file generation)
- Built-in JSON parsing with client-side validation

**Deployment**
- GitHub Pages (static hosting)
- GitHub Actions (automated CI/CD in `.github/workflows/deploy.yml`)

### Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx        # Drag-drop file upload with JSON validation
│   ├── QuestionDisplay.tsx   # Type-aware question rendering
│   └── ValidationForm.tsx    # Validation/rejection UI with navigation
├── lib/
│   ├── validation.ts         # JSON parsing and schema validation
│   └── excel.ts              # Excel generation and download logic
├── types/
│   └── index.ts              # TypeScript interfaces (Question, ValidationResult, ExcelRow)
├── App.tsx                   # Main application orchestrator
├── App.css                   # Application styles
└── main.tsx                  # React entry point

Configuration Files:
├── vite.config.ts            # Base path: /oupe-json-visualizer/
├── tsconfig.json             # Strict mode enabled
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS plugins
└── package.json              # Dependencies & build scripts
```

### Core Features

#### 1. File Upload (`src/components/FileUpload.tsx`)
- **Drag-and-drop** file upload with visual feedback
- **File browser** fallback for accessibility
- **JSON validation** on load (checks for array format, required fields: `type`, `competence`)
- **Error handling** with user-friendly messages

#### 2. Question Display (`src/components/QuestionDisplay.tsx`)
- **Type-aware rendering** for all question schemas (FIBL, ESSAY, SHRT, WROD, MTCH, WQUE, MCHS)
- **Displays**: text, options (for multiple choice), correct answer(s), assets (file references), competencies
- **Responsive layout** with cards and proper spacing
- **Mobile-friendly** text wrapping and readability

#### 3. Validation Workflow (`src/components/ValidationForm.tsx`)
- **Question counter** (X of Y) for progress tracking
- **Validate checkbox** to approve questions
- **Reject button** (requires reasoning text field)
- **Previous/Next buttons** for navigation between questions
- **Real-time status** feedback (success message on submission)
- **In-memory state** tracking (no persistence)

#### 4. Excel Export (`src/lib/excel.ts`)
- **Generates native .xlsx files** using ExcelJS
- **Column mapping** (see Excel Output Format section below)
- **Auto-incremented question IDs** (only for validated questions)
- **Styled header row** (blue background, white text)
- **Automatic download** triggered on user action
- **Timestamp inclusion** in ISO 8601 format

#### 5. JSON Validation (`src/lib/validation.ts`)
- **Schema enforcement**: Requires `type` and `competence` fields
- **Flexible competence format**: Accepts string or string array
- **Comprehensive error messages** for debugging
- **Client-side only** (no network requests)

### State Management

**React Hooks Architecture**
- `useState` for local component state (questions, validations, current index, errors)
- No Redux, Context, or external state library (kept simple and lightweight)
- **Validation state**: `{ [questionIndex]: { validated: boolean, reasoning?: string } }`

**Key State in App.tsx**:
- `questions`: Parsed question array
- `fileName`: Uploaded file name
- `currentIndex`: Currently displayed question
- `validations`: Validation results (indexed by question)
- `error`: User-facing error messages
- `isExporting`: Loading state during Excel generation

### Build Output

**Performance Metrics**:
- Build time: 2-3 seconds
- Dev server startup: ~150 ms
- JavaScript bundle: 1.1 MB minified (321 KB gzipped)
- CSS bundle: 4.6 KB minified (1.5 KB gzipped)
- **Total**: ~5-6 KB for stylesheet, reasonable overhead from ExcelJS

**Optimization**:
- Minification & tree-shaking via Vite
- CSS utility extraction by Tailwind
- Lazy loading via code-splitting (future enhancement)

### Deployment

**GitHub Pages Deployment**:
1. Workflow file: `.github/workflows/deploy.yml`
2. Triggers on: `push` to `main` branch
3. Steps:
   - Checkout code
   - Install Node.js 20 + dependencies (yarn)
   - Build: `yarn build` → generates `dist/`
   - Upload artifact
   - Deploy to GitHub Pages
4. **Result**: https://carlosbermejop.github.io/oupe-json-visualizer/

**Repository Configuration**:
- Base path set to `/oupe-json-visualizer/` in `vite.config.ts`
- Pages source: "GitHub Actions" (automatic)

---

## Excel Output Format

The exported Excel file follows `data/model_output_excel.xlsx` model:

| Column | Value | Notes |
|--------|-------|-------|
| idTitulo | `TIT001` | Fixed mock data |
| idPregunta | Auto-increment | Per validated question (1, 2, 3...) |
| idJson | Filename (no .json) | Derived from uploaded file |
| IdEstructura | (empty) | Reserved for future use |
| idTipoPregunta | `question.type` | From JSON (e.g., "MCHS", "ESSAY") |
| idIdioma | `EN` | Always English |
| IdCompetencia | `question.competence` | Comma-separated if array |
| idDificultad | `F` | Fixed mock data |
| aprobadaPor | `Test User` | Fixed reviewer name |
| revisadaEn | Current timestamp | ISO 8601 format (e.g., 2024-07-07T22:35:49.024Z) |
| validated | `true` / `false` | User's validation choice |
| reasoning | (text) | Only populated if `validated === false` |

**Implementation Details**:
- Only validated questions are exported (rejected-only items are excluded)
- Question IDs increment sequentially for each validated question
- Competence arrays are joined with `", "` separator
- Header row styled: bold white text on blue background (#FF366092)
- Downloaded filename format: `{jsonName}_validation_{timestamp}.xlsx`

---

## User Workflow

1. **Upload JSON**
   - User drags or clicks to select `.json` file
   - App validates JSON structure and required fields
   - Questions are parsed and displayed

2. **Review Questions**
   - User navigates with Previous/Next buttons
   - Progress indicator shows current position
   - All question details visible: text, options, answers, assets, competencies

3. **Validate/Reject**
   - User checks "This question is valid" → submits
   - Or user clicks "Reject" and enters reasoning → submits
   - Status updates in real-time
   - Counter displays validated/rejected/pending count

4. **Export to Excel**
   - After ≥1 validation, "Export to Excel" button enabled
   - Click to trigger Excel generation
   - `.xlsx` file downloads automatically
   - Contains all validated questions with metadata

5. **Reset**
   - Click "Reset" to clear state
   - Upload new file to repeat workflow
   - No history retained

---

## Key Design Decisions

### No Data Persistence
- **Rationale**: Stateless helper tool; simpler architecture; better privacy
- **Implementation**: All state in React component memory; clears on refresh/close

### Client-Side Only
- **Rationale**: No backend = faster deployment, cheaper hosting, offline capability
- **Implementation**: JSON parsing, validation, and Excel generation all in browser

### TypeScript Strict Mode
- **Rationale**: Compile-time error detection; better IDE support; self-documenting code
- **Implementation**: `strict: true` in tsconfig.json; no `any` types

### Tailwind CSS Utility-First
- **Rationale**: Minimal CSS overhead; responsive mobile-first design; professional appearance
- **Implementation**: Utility classes for styling; no custom CSS except App.css

### React Hooks (No Redux)
- **Rationale**: Lightweight; no complex state sync needed; reduced bundle size
- **Implementation**: `useState` for local state; props for data passing

---

## Development Guidelines

### Local Setup
```bash
cd oupe-json-visualizer
yarn install
yarn dev                # Starts at http://localhost:5173/oupe-json-visualizer/
```

### Building
```bash
yarn build              # Generates dist/ directory
yarn preview            # Preview production build locally
```

### Adding Features
- **New components**: Add to `src/components/` with TypeScript + Tailwind
- **New utilities**: Add to `src/lib/` with proper exports
- **Types**: Update `src/types/index.ts` as needed
- **Styling**: Use Tailwind classes; avoid custom CSS

### Testing
- TypeScript compiler: `yarn tsc --noEmit`
- Test with real JSON files from `data/` directory
- Verify Excel export with multiple question types

---

## Supported Question Types

All types supported via type-specific display in `QuestionDisplay.tsx`:

- **FIBL** - Fill in the blank (text field)
- **ESSAY** - Long-form essay (large text area)
- **SHRT** - Short answer (single line)
- **WROD** - Word order / reordering exercise
- **MTCH** - Matching questions (pairs)
- **WQUE** - Word question / vocabulary
- **MCHS** - Multiple choice single selection

---

## Future Enhancements

### Quick Wins
- Search/filter questions by type or competence
- Batch validation (validate all / reject all)
- Excel preview before download

### Medium Effort
- Display image assets inline
- Undo/redo validation actions
- Keyboard shortcuts (Enter to validate, Esc to reject)
- Dark mode theme

### Advanced
- Statistics dashboard (validation rate, type breakdown)
- Import multiple files in sequence
- Template customization
- Batch processing for large files

---

## Troubleshooting

**Dev server won't start**
- Clear node_modules: `rm -rf node_modules && yarn install`
- Kill port 5173: Check for existing processes

**Build fails**
- Check TypeScript: `yarn tsc --noEmit`
- Clear dist: `rm -rf dist && yarn build`

**Excel export issues**
- Check browser console (F12) for errors
- Verify ≥1 question is validated
- Try different browser (check compatibility)

**GitHub Pages not deploying**
- Verify Settings → Pages set to "GitHub Actions"
- Check Actions tab for workflow status
- Ensure code is on `main` branch

---

## File Change Log

**Initial Implementation (2024-07-07)**:
- ✅ React 18 + TypeScript setup with Vite
- ✅ Drag-drop file upload with JSON validation
- ✅ Type-aware question display renderer
- ✅ Validation form with navigation and state tracking
- ✅ Excel export with proper metadata mapping
- ✅ Tailwind CSS responsive design
- ✅ GitHub Actions CI/CD workflow
- ✅ Comprehensive README and documentation
- ✅ Production build: 1.1 MB JS (321 KB gzipped), 4.6 KB CSS (1.5 KB gzipped)