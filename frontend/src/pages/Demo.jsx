import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

function Demo() {
  const [copied, setCopied] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [showToken, setShowToken] = useState(false)
  
  const demoServer = {
    name: "demo-server",
    type: "streamable-http",
    url: "https://app.mockmcp.com/servers/fpFnWsRviXla/mcp",
    note: "For Streamable HTTP connections, add this URL and Authorization header to your MCP Client",
    description: "Returns the real-time status of mockmcp.com",
    token: "mcp_m2m_vR1nI9aiaqRCv8Lj6OT0XdPgmvDtccQzpv8Kdc2k6oY_96e802af942bdd84"
  }

  const demoTools = [
    {
      name: "Greet_me",
      description: "Greet the user",
      parameters: {
        name: {
          type: "string",
          description: "Your Name"
        }
      },
      output: {
        type: "custom_flow",
        flow_type: "javascript"
      }
    },
    {
      name: "generate_car", 
      description: "Generates an image of a car",
      parameters: {},
      output: {
        type: "image",
        s3_bucket: "sam-app-mockmcp-images",
        s3_key: "tool-images/GT Azure Dynamic Desktop.jpg"
      }
    },
    {
      name: "Generate_bike",
      description: "Generates an image of a bike", 
      parameters: {},
      output: {
        type: "image",
        s3_bucket: "sam-app-mockmcp-images",
        s3_key: "tool-images/bike-909690_1280.jpg"
      }
    },
    {
      name: "mockmcp_status",
      description: "Get the server status of MockMCP",
      parameters: {},
      output: {
        type: "custom_flow",
        flow_type: "javascript"
      }
    }
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "MockMCP Demo - Try Live MCP Server",
    "description": "Experience MockMCP with our live demo server. Test Model Context Protocol connections and see real-time server status responses.",
    "url": "https://mockmcp.com/demo",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "MockMCP Demo Server",
      "description": "Live demonstration of MockMCP's MCP server capabilities",
      "applicationCategory": "DeveloperApplication"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://mockmcp.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Demo",
          "item": "https://mockmcp.com/demo"
        }
      ]
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(demoServer.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(demoServer.token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  const copyConfiguration = async () => {
    const config = JSON.stringify({
      mcpServers: {
        [demoServer.name]: {
          type: demoServer.type,
          url: demoServer.url,
          headers: {
            Authorization: `Bearer ${demoServer.token}`
          },
          note: demoServer.note
        }
      }
    }, null, 2)
    
    try {
      await navigator.clipboard.writeText(config)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <>
      <SEOHead 
        title="Live Demo - Try MockMCP MCP Server"
        description="Experience MockMCP with our live demo server. Test Model Context Protocol connections, see real-time responses, and learn how to integrate MCP servers with AI agents."
        keywords="MCP demo, live demo, Model Context Protocol demo, AI agent testing demo, mock server example"
        canonicalUrl="/demo"
        structuredData={structuredData}
      />
      
      <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <section className="text-center mb-12 fade-in" aria-labelledby="demo-heading">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot"></div>
            Live Demo Server
          </div>
          
          <h1 id="demo-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
            Try Our
            <span className="text-gradient block">Demo MCP Server</span>
          </h1>
          
          <p className="text-xl text-neutral-600 leading-relaxed mb-8 max-w-3xl mx-auto">
            Experience the power of MockMCP with our live demo server that provides real-time status of mockmcp.com. 
            Connect your MCP client and ask your LLM about our service status!
          </p>
        </section>

        {/* Demo Server Card */}
        <section className="hero-card rounded-2xl p-8 mb-8 fade-in" aria-labelledby="demo-server-heading">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            
            {/* Server Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full pulse-dot"></div>
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Active Server</span>
              </div>
              
              <h2 id="demo-server-heading" className="text-2xl font-bold text-neutral-900 mb-2">{demoServer.name}</h2>
              <p className="text-neutral-600 text-sm mb-4">{demoServer.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-500">Type:</span>
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    {demoServer.type}
                  </span>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-neutral-500 mt-1">URL:</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                      <code className="text-sm text-neutral-700 flex-1 break-all">
                        {demoServer.url}
                      </code>
                      <button 
                        onClick={copyToClipboard}
                        className="text-neutral-500 hover:text-neutral-700 p-1 rounded"
                        title="Copy URL"
                      >
                        {copied ? (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-neutral-500 mt-1">Auth Token:</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                      <code className="text-sm text-neutral-700 flex-1 break-all">
                        Bearer {showToken ? demoServer.token : '••••••••••'}
                      </code>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={toggleTokenVisibility}
                          className="text-neutral-500 hover:text-neutral-700 p-1 rounded text-xs"
                          title={showToken ? "Hide token" : "Show token"}
                        >
                          {showToken ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button 
                          onClick={copyToken}
                          className="text-neutral-500 hover:text-neutral-700 p-1 rounded"
                          title="Copy token"
                        >
                          {copiedToken ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 group"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy URL
                    </>
                  )}
                </button>
                
                <button 
                  onClick={copyConfiguration}
                  className="btn-outline px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Copy Config
                </button>
              </div>
            </div>

            {/* Visual Elements */}
            <div className="relative lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-6 border border-blue-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Status Server Ready</h3>
                  <p className="text-sm text-neutral-600">
                    This server provides real-time status information about mockmcp.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Tools */}
        <section className="mb-12 fade-in" aria-labelledby="available-tools">
          <div className="text-center mb-8">
            <h2 id="available-tools" className="text-2xl font-bold text-neutral-900 mb-4">Available Tools</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              This demo server provides {demoTools.length} tools that your MCP client can call. 
              Ask your LLM to use these tools to interact with the server.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoTools.map((tool, index) => (
              <div key={index} className="feature-card p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    {tool.output.type === 'image' ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-800 truncate">{tool.name}</h3>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{tool.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Output:</span>
                    <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs">
                      {tool.output.type === 'image' ? '🖼️' : '⚙️'} {tool.output.type}
                    </span>
                  </div>
                  
                  {Object.keys(tool.parameters).length > 0 && (
                    <div>
                      <span className="text-neutral-500">Parameters:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries(tool.parameters).map(([paramName, paramInfo]) => (
                          <div key={paramName} className="bg-neutral-50 px-2 py-1 rounded text-xs">
                            <span className="font-medium text-neutral-700">{paramName}</span>
                            <span className="text-neutral-500"> ({paramInfo.type})</span>
                            {paramInfo.description && (
                              <div className="text-neutral-600 text-xs mt-0.5">{paramInfo.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {Object.keys(tool.parameters).length === 0 && (
                    <div className="text-neutral-500">
                      No parameters required
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="grid md:grid-cols-3 gap-6 mb-12 fade-in" aria-labelledby="usage-instructions">
          <div className="feature-card p-6 rounded-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">Copy Configuration</h3>
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4 flex-grow">
              Copy the server URL or complete configuration to your clipboard
            </p>
            <div className="bg-neutral-50 rounded-lg p-3 text-xs mt-auto">
              <code className="text-neutral-700">
                Click "Copy URL" or "Copy Config" above
              </code>
            </div>
          </div>

          <div className="feature-card p-6 rounded-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">Add to MCP Client</h3>
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4 flex-grow">
              {demoServer.note}
            </p>
            <div className="bg-neutral-50 rounded-lg p-3 text-xs mt-auto">
              <code className="text-neutral-700">
                Paste URL in your MCP client configuration
              </code>
            </div>
          </div>

          <div className="feature-card p-6 rounded-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">Ask Your LLM</h3>
            </div>
            <p className="text-neutral-600 text-sm leading-relaxed mb-4 flex-grow">
              Ask your LLM about the status of mockmcp.com - it will call this server to get real-time information
            </p>
            <div className="bg-neutral-50 rounded-lg p-3 text-xs mt-auto">
              <code className="text-neutral-700">
                "What's the status of mockmcp.com?"
              </code>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="text-center fade-in" aria-labelledby="next-steps">
          <h2 id="next-steps" className="text-2xl font-bold text-neutral-900 mb-4">Ready to Build Your Own?</h2>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Create your own custom MCP servers with MockMCP. Build status checkers, 
            API proxies, data providers, and more. Configure responses and deploy in seconds.
          </p>
          <Link 
            to="/create-server"
            className="btn-success px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-3 group"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Create Your Server
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
        
      </div>
    </main>
    </>
  )
}

export default Demo 