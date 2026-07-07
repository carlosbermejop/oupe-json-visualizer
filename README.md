# 📊 JSON Question Validator

A frontend application for validating JSON files containing textbook questions and exporting the results to Excel. Built with React, TypeScript, and Vite.

## 🎯 Overview

This tool helps users:
1. **Upload** JSON files containing question data
2. **Visualize** questions with type-specific renderers
3. **Validate or reject** each question with optional reasoning
4. **Export** validation results to Excel in a structured format
5. **Download** the generated Excel file

No data is stored in the application—it's a stateless helper tool.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
yarn build
```

The application will be built to the `dist/` directory, ready for deployment to GitHub Pages.

## 📁 Project Structure

```
oupe-json-visualizer/
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx        # File upload with drag-and-drop
│   │   ├── QuestionDisplay.tsx   # Question renderer
│   │   └── ValidationForm.tsx    # Validation/rejection form
│   ├── lib/
│   │   ├── validation.ts         # JSON parsing and validation
│   │   └── excel.ts              # Excel export logic
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # React entry point
│   └── App.css                   # Application styles
├── data/                         # JSON schema templates
│   ├── FIBL.json                # Fill-in-the-blank question schema
│   ├── ESSAY.json               # Essay question schema
│   ├── SHRT.json                # Short answer schema
│   ├── WROD.json                # Word order schema
│   ├── MTCH.json                # Matching schema
│   ├── WQUE.json                # Word question schema
│   ├── MCHS.json                # Multiple choice single selection schema
│   └── model_output_excel.xlsx  # Excel output template
├── index.html                   # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── package.json                # Dependencies and scripts
```

## 📋 Supported Question Types

The application supports the following question schemas (found in `data/` directory):

- **FIBL** - Fill in the blank
- **ESSAY** - Essay questions
- **SHRT** - Short answer
- **WROD** - Word order
- **MTCH** - Matching
- **WQUE** - Word question
- **MCHS** - Multiple choice (single selection)

## 🔄 Workflow

1. **Upload JSON File**
   - Drag and drop a JSON file or click to browse
   - File must be a valid JSON array of question objects
   - Each question must have `type` and `competence` fields

2. **Review Questions**
   - Navigate between questions using Previous/Next buttons
   - View complete question details including options and correct answers
   - See asset references (e.g., images)

3. **Validate Each Question**
   - Check the "This question is valid" checkbox to validate
   - Click "Reject" to mark as invalid (requires reasoning)
   - Fill in rejection reason explaining why the question is problematic

4. **Export to Excel**
   - After validating at least one question, click "Export to Excel"
   - Excel file follows the `model_output_excel.xlsx` format with:
     - Question metadata (type, competence, difficulty)
     - Validation status
     - Rejection reasoning if applicable
     - Timestamp of review
   - Download starts automatically

5. **Start Over**
   - Click "Reset" to upload a new file and start fresh
   - No data is persisted between sessions

## 📊 Excel Export Format

The exported Excel file includes the following columns:

| Column | Value | Notes |
|--------|-------|-------|
| idTitulo | TIT001 | Mock data (fixed) |
| idPregunta | Auto-increment | Increases per validated question |
| idJson | Filename | Derived from uploaded JSON filename |
| IdEstructura | (blank) | For future use |
| idTipoPregunta | question.type | From JSON field |
| idIdioma | EN | Always English |
| IdCompetencia | question.competence | From JSON field (comma-separated if multiple) |
| idDificultad | F | Mock data (fixed) |
| aprobadaPor | Test User | Fixed reviewer name |
| revisadaEn | Current timestamp | ISO 8601 format |
| validated | true/false | User's validation choice |
| reasoning | (text) | Only populated if rejected |

## 🛠 Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 4
- **JSON Parsing**: Native JSON + custom validation
- **Excel Export**: ExcelJS 4
- **Deployment**: GitHub Pages (automated via GitHub Actions)

## 🌐 Deployment

### GitHub Pages Setup

1. The repository must have GitHub Pages enabled in settings
2. Configure `main` branch as the publishing source (or GitHub Actions)
3. On every push to `main`, the workflow automatically:
   - Builds the application
   - Deploys to GitHub Pages at `https://carlosbermejop.github.io/oupe-json-visualizer/`

### Manual Deployment

To deploy to a different hosting service:

```bash
yarn build
# Upload dist/ directory to your hosting provider
```

## 📝 JSON File Format

Example JSON file structure:

```json
[
  {
    "type": "MCHS",
    "competence": ["reading", "comprehension"],
    "text": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correct": "Paris",
    "assets": []
  },
  {
    "type": "ESSAY",
    "competence": "writing",
    "text": "Describe your favorite book...",
    "assets": ["image1.jpg"]
  }
]
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop and tablet devices
- **Drag & Drop**: Easy file upload experience
- **Type-Safe**: Full TypeScript support
- **Modern Styling**: Tailwind CSS for clean, professional appearance
- **Progress Tracking**: Visual indicators for validated/rejected/pending questions
- **Sticky Form**: Validation form stays visible while scrolling through questions

## 📦 Build Performance

- **Chunk Size**: ~1.1 MB (minified), ~321 KB (gzipped)
- **Build Time**: ~2-3 seconds
- **CSS**: ~4.6 KB (minified), ~1.5 KB (gzipped)
- **Zero Backend**: Fully client-side application

## 🔐 Data Privacy

- No data is sent to external servers
- All processing happens in the browser
- No data is stored locally
- Browser cache can be cleared to remove any temporary data

## 📄 License

This project is part of the OUPE initiative.

## 🤝 Contributing

For questions or issues, please open an issue in the repository.

---

**Last Updated**: 2024-07-07  
**Built with ❤️ using React, TypeScript, and Vite**
