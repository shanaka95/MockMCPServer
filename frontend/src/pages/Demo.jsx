import { useState } from 'react'

function Demo() {
  const [copied, setCopied] = useState(false)
  
  const demoServer = {
    name: "demo-server",
    type: "streamable-http",
    url: "https://app.mockmcp.com/server/cef7c8b9-40b7-4440-9151-9a8e9c581458/mcp",
    note: "For Streamable HTTP connections, add this URL directly in your MCP Client",
    description: "Returns the real-time status of mockmcp.com"
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

  const copyConfiguration = async () => {
    const config = JSON.stringify({
      mcpServers: {
        [demoServer.name]: {
          type: demoServer.type,
          url: demoServer.url,
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
    <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot"></div>
            Live Demo Server
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
            Try Our
            <span className="text-gradient block">Demo MCP Server</span>
          </h1>
          
          <p className="text-xl text-neutral-600 leading-relaxed mb-8 max-w-3xl mx-auto">
            Experience the power of MockMCP with our live demo server that provides real-time status of mockmcp.com. 
            Connect your MCP client and ask your LLM about our service status!
          </p>
        </div>

        {/* Demo Server Card */}
        <div className="hero-card rounded-2xl p-8 mb-8 fade-in">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Server Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full pulse-dot"></div>
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Active Server</span>
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{demoServer.name}</h2>
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
                    <code className="text-sm text-neutral-700 bg-neutral-100 px-2 py-1 rounded break-all">
                      {demoServer.url}
                    </code>
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
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="relative">
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
        </div>

        {/* Usage Instructions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 fade-in">
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
        </div>

        {/* Next Steps */}
        <div className="text-center fade-in">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Ready to Build Your Own?</h2>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Create your own custom MCP servers with MockMCP. Build status checkers, 
            API proxies, data providers, and more. Configure responses and deploy in seconds.
          </p>
          <button className="btn-success px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-3 group">
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Create Your Server
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
      </div>
    </main>
  )
}

export default Demo 