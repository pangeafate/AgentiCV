# AgenticV Frontend - Terminal CV Upload

A modern React application with a terminal-themed UI for uploading and managing CV documents. Built with Vite and integrated with Supabase for file storage.

## Features

- 🖥️ **Terminal-themed UI** - Authentic terminal look with green text on black background
- 📁 **Drag & Drop Upload** - Easy file upload with drag-and-drop support
- ☁️ **Supabase Integration** - Cloud storage for CV documents
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Mock Mode** - Works without Supabase configuration for development
- ⚡ **GitHub Pages Ready** - Configured for easy deployment

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Supabase** - Backend-as-a-service for file storage
- **React Dropzone** - File drag-and-drop functionality
- **React Hot Toast** - Terminal-styled notifications
- **JetBrains Mono** - Monospace font for terminal authenticity

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup (Optional)

For Supabase integration:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

For development without Supabase, skip this step - the app will run in mock mode.

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Supabase Setup (Optional)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be ready

### 2. Get API Credentials

1. Go to Project Settings → API
2. Copy your project URL and anon key
3. Add them to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `cv-documents`
3. Make it public to allow file downloads
4. Set file size limit to 10MB
5. Add allowed MIME types:
   - `application/pdf`
   - `application/msword` 
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Deployment to GitHub Pages

### 1. Update Configuration

Edit `package.json` homepage field:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME"
}
```

Edit `vite.config.js` base path:
```js
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/YOUR_REPOSITORY_NAME/' : '/',
})
```

### 2. Install GitHub Pages Package

```bash
npm install --save-dev gh-pages
```

### 3. Deploy

```bash
npm run build
npm run deploy
```

### 4. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to Pages section
3. Select `gh-pages` branch as source
4. Your app will be available at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

## File Structure

```
agenticv-frontend/
├── public/
├── src/
│   ├── components/
│   │   └── cv/
│   │       └── CVUploader/
│   │           └── CVUploader.jsx
│   ├── services/
│   │   └── supabase/
│   │       ├── config.js
│   │       └── cv.service.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Run ESLint

## Supported File Types

- **PDF** (.pdf) - Portable Document Format
- **DOC** (.doc) - Microsoft Word 97-2003
- **DOCX** (.docx) - Microsoft Word 2007+

Maximum file size: **10MB**

## Terminal Theme

The application uses a carefully crafted terminal theme:

- **Background**: Deep black (`#0a0a0a`)
- **Primary Text**: Bright green (`#00ff00`)
- **Secondary Text**: Amber (`#ffb000`)
- **Font**: JetBrains Mono (monospace)
- **Window**: Terminal-style with macOS-like controls

## Mock Mode

When Supabase credentials are not provided, the app automatically switches to mock mode:

- File uploads are simulated with realistic delays
- All functionality works except actual file storage
- Perfect for development and testing
- Console warnings indicate mock mode is active

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Loading

Ensure your `.env` file is in the project root and variable names start with `VITE_`:
```env
VITE_SUPABASE_URL=your-url-here
VITE_SUPABASE_ANON_KEY=your-key-here
```

### Upload Failures

1. Check Supabase bucket configuration
2. Verify file size is under 10MB
3. Ensure file type is supported
4. Check browser console for detailed errors

### GitHub Pages 404

1. Verify `homepage` in `package.json` is correct
2. Check `base` path in `vite.config.js`
3. Ensure GitHub Pages is enabled for `gh-pages` branch
4. Wait a few minutes for deployment to propagate

## Performance Features

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Images and fonts optimized
- **Lazy Loading**: Components loaded on demand
- **Caching**: Browser caching with proper headers

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [Issues](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY/issues) section
- Review this README for common solutions
- Create a new issue with detailed information

---

**Ready to upload your CV? Run `npm run dev` and start coding!** 🚀