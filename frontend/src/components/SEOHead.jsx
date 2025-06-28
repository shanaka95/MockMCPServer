import { Helmet } from 'react-helmet-async'

function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonicalUrl, 
  ogImage = '/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noindex = false,
  lastModified
}) {
  const fullTitle = title ? `${title} | MockMCP` : 'MockMCP - Create Mock MCP Servers in 30 Seconds | Free AI Agent Testing Platform'
  const defaultDescription = 'Create mock Model Context Protocol (MCP) servers for testing AI agents and workflows in under 30 seconds. Free, reliable, no-code configuration with 100% uptime guarantee.'
  const finalDescription = description || defaultDescription
  const defaultKeywords = 'MCP servers, mock servers, AI agent testing, Model Context Protocol, AI workflows, agent development, no-code testing, free mock API, AI testing platform'
  const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords
  const baseUrl = 'https://mockmcp.com'
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Robots directives */}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title || 'MockMCP - Create Mock MCP Servers in 30 Seconds'} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'MockMCP - Mock MCP Server Generator Interface'} />
      <meta property="og:site_name" content="MockMCP" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific tags for blog posts or updates */}
      {lastModified && <meta property="article:modified_time" content={lastModified} />}
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullCanonicalUrl} />
      <meta property="twitter:title" content={title || 'MockMCP - Create Mock MCP Servers in 30 Seconds'} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={fullOgImage} />
      <meta property="twitter:image:alt" content={title || 'MockMCP - Mock MCP Server Generator Interface'} />
      <meta property="twitter:creator" content="@MockMCP" />
      <meta property="twitter:site" content="@MockMCP" />
      
      {/* Additional Social Media */}
      <meta property="linkedin:owner" content="MockMCP" />
      
      {/* Performance and Resource Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://cdn.tailwindcss.com" />
      <link rel="dns-prefetch" href="https://mockmcp.com" />
      
      {/* Security and Privacy - Note: Security headers should be set by server, not meta tags */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://mockmcp.com https://api.mockmcp.com https://*.amazonaws.com https://cognito-idp.*.amazonaws.com;" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Mobile and Accessibility */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="MockMCP" />
      
      {/* Language and Locale */}
      <meta httpEquiv="Content-Language" content="en" />
      <link rel="alternate" hrefLang="en" href={fullCanonicalUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional Schema.org Organization data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "MockMCP",
          "url": "https://mockmcp.com",
          "logo": "https://mockmcp.com/logo.svg",
          "description": "Free mock Model Context Protocol server generator for AI agent testing and development",
          "sameAs": [
            "https://github.com/mockmcp"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "technical support",
            "url": "https://mockmcp.com/support"
          }
        })}
      </script>
    </Helmet>
  )
}

export default SEOHead 