import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "MockMCP - Mock MCP Server Generator",
    "description": "Create mock Model Context Protocol servers for testing AI agents and workflows in under 30 seconds. Free, reliable, no-code configuration.",
    "url": "https://mockmcp.com",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "MockMCP",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://mockmcp.com"
        }
      ]
    }
  }

  return (
    <>
      <SEOHead 
        title="Mock MCP Server Generator - Free AI Agent Testing Platform"
        description="Create mock Model Context Protocol servers for testing AI agents and workflows in under 30 seconds. No-code configuration, 100% uptime, completely free forever."
        keywords="mock MCP servers, AI agent testing, Model Context Protocol, free mock API, agent development tools, AI workflow testing"
        canonicalUrl="/"
        structuredData={structuredData}
      />
      
      <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <section className="text-center mb-16 fade-in" aria-labelledby="hero-heading">
            <div className="max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full pulse-dot" aria-hidden="true"></div>
                New: Zero-config mock servers in seconds
              </div>
              
              {/* Main Heading */}
              <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight mb-6">
                Build, Test & Deploy
                <span className="text-gradient block">Mock MCP Servers</span>
                <span className="text-neutral-600 text-4xl sm:text-5xl lg:text-6xl block mt-2">Effortlessly</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-neutral-600 leading-relaxed mb-10 max-w-3xl mx-auto">
                The fastest way to create Model Context Protocol servers for development, testing, and prototyping.
                <span className="text-neutral-800 font-medium block mt-2">No configuration required.</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link 
                  to="/signup"
                  className="btn-success px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-3 group"
                  aria-label="Create your first mock MCP server"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Your Server
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link 
                  to="/demo"
                  className="btn-outline px-8 py-4 rounded-xl text-lg font-semibold"
                  aria-label="View live demo of MockMCP"
                >
                  View Demo
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <p className="text-sm text-neutral-500 mb-12" aria-label="Key benefits">
                ✨ Free forever • 🚀 Deploy in 30 seconds • 🔒 Secure by default
              </p>
            </div>
          </section>
          
          {/* Features Grid */}
          <section className="mb-16 fade-in" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-6" role="list">
              {[
                { 
                  icon: "⚡", 
                  title: "Instant Setup", 
                  description: "Deploy mock servers in seconds with zero configuration required" 
                },
                { 
                  icon: "🎯", 
                  title: "Developer First", 
                  description: "Built specifically for developers who value speed and simplicity" 
                },
                { 
                  icon: "🔧", 
                  title: "Fully Customizable", 
                  description: "Configure responses, endpoints, and behaviors to match your needs" 
                }
              ].map((feature, index) => (
                <article key={index} className="feature-card p-6 rounded-xl text-center" role="listitem">
                  <div className="text-3xl mb-4" aria-hidden="true">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">{feature.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>
          
        </div>
      </main>
    </>
  )
}

export default Home 