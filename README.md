# AgentiCV Frontend

## Overview
Terminal-themed React application for AI-powered CV upload and analysis. Built with Vite, Supabase, and modern React patterns.

## 🚀 Features
- **Terminal-style UI** - Retro computing interface with dark theme
- **Drag & Drop Upload** - Intuitive CV file upload with validation
- **Supabase Integration** - Secure cloud storage for CV files
- **Real-time Progress** - Upload progress with terminal-style feedback
- **Responsive Design** - Works on desktop and mobile devices
- **GitHub Pages Ready** - Automated deployment workflow

## 🛠️ Tech Stack
- **Frontend**: React 18 + Vite
- **Storage**: Supabase (BaaS)
- **UI**: Custom terminal-themed CSS
- **File Handling**: react-dropzone
- **Notifications**: react-hot-toast
- **Deployment**: GitHub Pages

## 📋 Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project (for cloud storage)
- GitHub repository (for deployment)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agenticv-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set up Supabase Storage**
   - Create a new bucket named `cv-uploads`
   - Set bucket to public access
   - Configure RLS policies as needed

## 🚀 Development

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## 📁 Project Structure

```
agenticv-frontend/
├── src/
│   ├── components/
│   │   └── cv/
│   │       └── CVUploader/           # CV upload component
│   │           ├── CVUploader.jsx    # Main component (< 150 lines)
│   │           ├── CVUploader-README.md
│   │           └── index.js
│   ├── services/
│   │   └── supabase/                 # Supabase integration
│   │       ├── config.js             # Supabase client config
│   │       ├── cv.service.js         # CV operations
│   │       └── README.md
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Terminal-themed styles
├── .github/workflows/
│   └── deploy.yml                    # GitHub Pages deployment
├── package.json                      # Dependencies & scripts
├── vite.config.js                    # Vite configuration
└── README.md                         # This file
```

## 🎨 Component Architecture

### CVUploader Component
- **Purpose**: Terminal-themed file upload with Supabase integration
- **Size**: < 150 lines (following README-driven development)
- **Features**:
  - Drag & drop functionality
  - File validation (PDF, DOC, DOCX, max 10MB)
  - Progress indication
  - Success/error handling
  - File deletion capability

### Terminal Theme
- **Color Scheme**: Black background with green/red/yellow accents
- **Typography**: JetBrains Mono (monospace)
- **Components**: Terminal windows, panels, buttons
- **Responsive**: Mobile-first design

## 🔐 Supabase Configuration

### Storage Setup
1. Create bucket: `cv-uploads`
2. Set public access for file retrieval
3. Configure appropriate RLS policies

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### File Constraints
- **Max Size**: 10MB per file
- **Formats**: PDF, DOC, DOCX
- **Storage**: Unique filename generation
- **Access**: Public URLs for file access

## 🚀 Deployment

### Quick Deploy to pangeafate/AgentiCV

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/pangeafate/AgentiCV.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to https://github.com/pangeafate/AgentiCV/settings/pages
   - Under "Build and deployment", select "GitHub Actions"
   
3. **Set Secrets (Optional - works without them):**
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - If not set, app will use placeholder values

4. **Access your site:**
   - https://pangeafate.github.io/AgentiCV/

### GitHub Pages (Automated)
1. Push code to `main` branch
2. GitHub Actions automatically builds and deploys
3. Set repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Manual Deployment
```bash
npm run build
npm run deploy
```

### Custom Domain (Optional)
1. Add CNAME file to `public/` folder
2. Configure DNS records
3. Enable HTTPS in GitHub Pages settings

## 🧪 Testing

**File Upload Testing:**
- Test with valid files (PDF, DOC, DOCX)
- Test file size limits (> 10MB should fail)
- Test invalid file types
- Test drag & drop functionality
- Test upload cancellation

**UI Testing:**
- Terminal theme consistency
- Mobile responsiveness
- Toast notifications
- Loading states

## 🎯 File Size Guidelines

Following README-driven development principles:

| File Type | Warning | Must Split |
|-----------|---------|------------|
| React Components | 100 lines | 150 lines |
| Services | 150 lines | 200 lines |
| CSS | No limit | Organize by feature |

## 🔍 Performance

**Optimizations:**
- Lazy loading for large components
- File size validation before upload
- Progress indication for better UX
- Proper error boundaries

**Metrics:**
- Initial load: < 3 seconds
- File upload: Progress feedback
- Mobile performance: 60fps scrolling

## 🐛 Troubleshooting

### Common Issues

**Upload Fails:**
- Check Supabase credentials
- Verify bucket permissions
- Check file size/type constraints
- Check network connectivity

**Build Errors:**
- Verify all environment variables
- Check dependency versions
- Clear node_modules and reinstall

**Deployment Issues:**
- Check GitHub secrets configuration
- Verify build output in Actions
- Check base URL in vite.config.js

### Debug Mode
```bash
# Enable verbose logging
VITE_DEBUG=true npm run dev
```

## 🤝 Contributing

1. Follow README-driven development
2. Keep components under 150 lines
3. Write tests for new features
4. Update documentation
5. Use terminal theme consistently

## 📄 License
MIT License - feel free to use for your projects

## 🔗 Links
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Dropzone](https://react-dropzone.js.org/)
- [GitHub Pages](https://pages.github.com/)

## 📞 Support
For issues and questions, please create a GitHub issue or check the component README files in the respective directories.

---

**Built with ❤️ using terminal aesthetics and modern web technologies**