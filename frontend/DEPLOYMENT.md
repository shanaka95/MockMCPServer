# MockMCP Deployment Guide

## Domain Configuration

### Frontend Domain
- **Primary Site:** `mockmcp.com`
- **SSL:** Required (HTTPS only)
- **CDN:** Recommended for global performance

### API Domain
- **Backend API:** Uses existing endpoint URLs
- **CORS:** Must allow requests from `mockmcp.com`

## SEO Configuration Checklist

Before deploying, ensure:

### ✅ Domain Setup
- [ ] DNS points `mockmcp.com` to hosting provider
- [ ] SSL certificate is active
- [ ] `www.mockmcp.com` redirects to `mockmcp.com`
- [ ] HTTPS redirects are in place

### ✅ SEO Files
- [ ] `robots.txt` is accessible at `mockmcp.com/robots.txt`
- [ ] `sitemap.xml` is accessible at `mockmcp.com/sitemap.xml`
- [ ] `site.webmanifest` is accessible at `mockmcp.com/site.webmanifest`

### ✅ Meta Tags
- [ ] All pages have proper titles and descriptions
- [ ] Open Graph images are accessible
- [ ] Structured data validates in Google's Rich Results Test

### ✅ Performance
- [ ] Page load times under 3 seconds
- [ ] Core Web Vitals scores are good
- [ ] Images are optimized and properly sized

## Post-Deployment Steps

1. **Submit to Search Engines**
   ```bash
   # Submit sitemap to Google Search Console
   https://search.google.com/search-console
   
   # Submit to Bing Webmaster Tools
   https://www.bing.com/webmasters
   ```

2. **Verify SEO Implementation**
   ```bash
   # Test with local build
   npm run build
   npm run preview
   npm run seo:test
   ```

3. **Monitor Performance**
   - Set up Google Analytics
   - Configure Google Search Console
   - Monitor Core Web Vitals
   - Track keyword rankings

## Environment Variables

Ensure the following are set correctly:

```env
# Frontend URL
VITE_SITE_URL=https://mockmcp.com

# API URL (if different from frontend)
VITE_API_URL=https://app.mockmcp.com

# Analytics (if using)
VITE_GA_ID=G-XXXXXXXXXX
```

## Common Issues

### 1. Mixed Content Warnings
- Ensure all resources use HTTPS
- Update any hardcoded HTTP URLs

### 2. CORS Issues
- Backend must allow requests from `mockmcp.com`
- Check API CORS configuration

### 3. SEO Validation Failures
- Run `npm run seo:test` to identify issues
- Verify all meta tags render correctly

## Testing

```bash
# Build production version
npm run build

# Test locally
npm run preview

# Run SEO validation
npm run seo:test

# Generate Lighthouse report
npm run seo:lighthouse
```

## Success Metrics

After deployment, monitor:
- **Search Visibility:** Indexed pages in Google Search Console
- **Performance:** Page speed scores >90
- **Accessibility:** A11y scores >95
- **SEO:** SEO scores >95 