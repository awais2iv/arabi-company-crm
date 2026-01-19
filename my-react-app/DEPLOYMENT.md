# Deployment Guide

## 🚀 Quick Start

The dashboard is currently running at: **http://localhost:5173**

## 📦 Production Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd my-react-app
vercel
```

3. Follow prompts to deploy
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

Or drag-and-drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

### Option 3: GitHub Pages

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add to package.json:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/your-repo-name"
}
```

3. Update vite.config.js:
```javascript
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})
```

4. Deploy:
```bash
npm run deploy
```

### Option 4: Traditional Hosting

1. Build the project:
```bash
npm run build
```

2. Upload `dist/` folder contents to your web host

3. Configure server to serve index.html for all routes (for SPA routing)

## ⚙️ Environment Configuration

### Production Build
```bash
npm run build
```
Creates optimized production build in `dist/` folder.

### Preview Production Build
```bash
npm run build
npm run preview
```
Serves production build locally for testing.

## 🔧 Server Configuration

### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 📊 Data Source Configuration

The dashboard currently connects to:
- **Google Sheet ID**: `1a5bFYy6IFBEDP6cHkiKq9K0OwfGCgoFSVlg4oYQbUrk`

To change the data source:
1. Open [src/useGoogleSheetData.js](src/useGoogleSheetData.js)
2. Update `SHEET_ID` constant
3. Ensure new sheet is publicly accessible

## 🌐 CORS Considerations

Google Sheets CSV export allows CORS by default for public sheets. No additional configuration needed.

## 🔒 Security Notes

- All data processing happens client-side
- No backend required
- No sensitive credentials stored
- Read-only access to Google Sheet
- Safe to deploy to public hosting

## 📈 Performance Tips

1. **Enable Compression**: Most hosts enable gzip/brotli by default
2. **CDN**: Use Cloudflare or similar for global distribution
3. **Caching**: Set cache headers for static assets
4. **Bundle Analysis**: Run `npm run build -- --analyze` to check bundle size

## 🧪 Testing Production Build Locally

```bash
# Build
npm run build

# Test
npm run preview
```

Access at: http://localhost:4173

## 📱 Mobile Testing

Use your mobile device on same network:
1. Find your computer's local IP (e.g., 192.168.1.100)
2. Start dev server with host flag: `npm run dev -- --host`
3. Access from mobile: `http://192.168.1.100:5173`

## 🔍 Troubleshooting

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `rm -rf node_modules/.vite`

### Routing Issues
- Ensure server redirects all routes to index.html
- Check base path in vite.config.js

### Data Loading Issues
- Verify Google Sheet is public
- Check browser console for CORS errors
- Test CSV URL directly in browser

## 📝 Checklist Before Deployment

- [ ] Test locally with `npm run build && npm run preview`
- [ ] Verify all routes work
- [ ] Test on mobile devices
- [ ] Check Google Sheet access
- [ ] Verify auto-refresh works
- [ ] Test with production data
- [ ] Check browser console for errors

## 🎯 Recommended Hosting Providers

1. **Vercel** - Automatic, zero-config deployment
2. **Netlify** - Easy drag-and-drop deployment
3. **Cloudflare Pages** - Global CDN included
4. **GitHub Pages** - Free for public repos
5. **AWS S3 + CloudFront** - Enterprise-grade

---

**Ready to deploy! Choose your preferred option above.**
