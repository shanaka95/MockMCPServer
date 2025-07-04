import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiConfig } from '../config/auth'

function Servers() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading, getAccessToken } = useAuth()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedStates, setCopiedStates] = useState({})
  const [tokenVisibility, setTokenVisibility] = useState({})
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, server: null })
  const [deleting, setDeleting] = useState(new Set())
  const [expandedTools, setExpandedTools] = useState(new Set())
  const [hoveredTool, setHoveredTool] = useState(null)
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' or 'date'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      fetchServers()
    }
  }, [isAuthenticated])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const token = await getAccessToken()
      
      const response = await fetch(`${apiConfig.mcpApiEndpoint}/servers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setServers(data || [])
    } catch (err) {
      console.error('Error fetching servers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteServer = async (server) => {
    try {
      setDeleting(prev => new Set(prev).add(server.session_id))
      const token = await getAccessToken()
      
      const response = await fetch(`${apiConfig.mcpApiEndpoint}/servers/${server.session_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete server (${response.status})`)
      }

      // Remove server from local state
      setServers(prev => prev.filter(s => s.session_id !== server.session_id))
      
      // Close confirmation dialog
      setDeleteConfirmation({ show: false, server: null })
      
    } catch (err) {
      console.error('Error deleting server:', err)
      setError(err.message)
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(server.session_id)
        return newSet
      })
    }
  }

  const confirmDelete = (server) => {
    setDeleteConfirmation({ show: true, server })
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, server: null })
  }

  const toggleToolsExpansion = (sessionId) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text, serverId, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [`${serverId}-${type}`]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [`${serverId}-${type}`]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const toggleTokenVisibility = (serverId) => {
    setTokenVisibility(prev => ({ ...prev, [serverId]: !prev[serverId] }))
  }

  const copyConfiguration = async (server) => {
    try {
      // Use the M2M token from the server data instead of user's access token
      const config = JSON.stringify({
        mcpServers: {
          [server.name]: {
            type: "streamable-http",
            url: `${apiConfig.mcpApiEndpoint}/servers/${server.session_id}/mcp`,
            headers: {
              Authorization: `Bearer ${server.m2m_token}`
            },
            note: "For Streamable HTTP connections, add this URL and Authorization header to your MCP Client"
          }
        }
      }, null, 2)
      
      await copyToClipboard(config, server.session_id, 'config')
    } catch (error) {
      console.error('Error generating configuration:', error)
      // Fallback config without auth header
      const config = JSON.stringify({
        mcpServers: {
          [server.name]: {
            type: "streamable-http", 
            url: `${apiConfig.mcpApiEndpoint}/servers/${server.session_id}/mcp`,
            note: "Warning: Unable to generate configuration with authentication header."
          }
        }
      }, null, 2)
      
      await copyToClipboard(config, server.session_id, 'config')
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter and sort servers
  const getFilteredAndSortedServers = () => {
    let filtered = servers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = servers.filter(server => 
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'date') {
        comparison = a.created_at - b.created_at
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Change field and reset to ascending
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        bgClass: 'bg-emerald-100', 
        textClass: 'text-emerald-800', 
        dotClass: 'bg-emerald-500',
        text: 'Active', 
        dot: true, 
        description: 'Server is loaded and ready to use' 
      },
      idle: { 
        bgClass: 'bg-amber-100', 
        textClass: 'text-amber-800', 
        dotClass: 'bg-amber-500',
        text: 'Idle', 
        dot: false, 
        description: 'Server is stored but not currently loaded' 
      },
      inactive: { 
        bgClass: 'bg-neutral-100', 
        textClass: 'text-neutral-800', 
        dotClass: 'bg-neutral-500',
        text: 'Inactive', 
        dot: false, 
        description: 'Server is not responding' 
      },
      expired: { 
        bgClass: 'bg-red-100', 
        textClass: 'text-red-800', 
        dotClass: 'bg-red-500',
        text: 'Expired', 
        dot: false, 
        description: 'Server has expired and needs renewal' 
      },
      removed: { 
        bgClass: 'bg-gray-100', 
        textClass: 'text-gray-600', 
        dotClass: 'bg-gray-500',
        text: 'Removed', 
        dot: false, 
        description: 'Server has been deleted' 
      }
    }
    
    const config = statusConfig[status] || statusConfig.inactive
    
    return (
      <span 
        className={`inline-flex items-center gap-1 ${config.bgClass} ${config.textClass} text-xs font-medium px-2.5 py-1 rounded-full`}
        title={config.description}
      >
        {config.dot && <div className={`w-2 h-2 ${config.dotClass} rounded-full pulse-dot`}></div>}
        {config.text}
      </span>
    )
  }

  const showToolTooltip = (tool, event) => {
    const rect = event.target.getBoundingClientRect()
    setHoveredTool({
      tool,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      }
    })
  }

  const hideToolTooltip = () => {
    setHoveredTool(null)
  }

  const ToolTooltip = ({ tool, position }) => {
    if (!tool) return null

    const hasParameters = tool.parameters && Object.keys(tool.parameters).length > 0

    return (
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-neutral-200 p-4 max-w-sm pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%) translateY(-100%)'
        }}
      >
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-neutral-200"></div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px] w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white"></div>
        
        {/* Content */}
        <div className="space-y-3">
          {/* Tool Name */}
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">{tool.name}</h3>
            <p className="text-xs text-neutral-600 mt-1">{tool.description}</p>
          </div>

          {/* Output Type */}
          <div>
            <span className="text-xs font-medium text-neutral-500">Output Type:</span>
            <span className="ml-2 inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {tool.output?.output_type === 'text' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {tool.output?.output_type === 'image' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {tool.output?.output_type === 'custom_flow' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              )}
              {tool.output?.output_type || 'text'}
            </span>
          </div>

          {/* Parameters */}
          {hasParameters && (
            <div>
              <span className="text-xs font-medium text-neutral-500 block mb-2">Parameters:</span>
              <div className="space-y-2">
                {Object.entries(tool.parameters).map(([paramName, paramConfig]) => (
                  <div key={paramName} className="bg-neutral-50 rounded p-2 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-neutral-700">{paramName}</span>
                      <span className="bg-neutral-200 text-neutral-600 px-1 rounded text-[10px]">
                        {paramConfig.type}
                      </span>
                    </div>
                    {paramConfig.description && (
                      <p className="text-neutral-600">{paramConfig.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-neutral-600">Loading your servers...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error Loading Servers</h2>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button 
              onClick={fetchServers}
              disabled={loading}
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Try Again'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
            Server
            <span className="text-gradient block">Dashboard</span>
          </h1>
          {servers.length > 0 && (
            <button
              onClick={fetchServers}
              disabled={loading}
              className="btn-outline px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 text-sm"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          )}
        </div>

        {servers.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 fade-in">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">No Servers Yet</h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              You haven't created any MCP servers yet. Get started by creating your first server or explore the demo to see how it works.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/create-server"
                className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Server
              </a>
              <a
                href="/demo"
                className="btn-outline px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Demo
              </a>
            </div>
          </div>
        ) : (
          /* Server List */
          <div className="space-y-6 fade-in">
            {/* Search and Sort Controls */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                
                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search servers by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-4 w-4 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">Sort by:</span>
                  <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleSortChange('name')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        sortBy === 'name'
                          ? 'bg-blue-100 text-blue-700 border-r border-neutral-300'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50 border-r border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortBy === 'name' && (
                          <svg className={`w-4 h-4 ${sortOrder === 'asc' ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleSortChange('date')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        sortBy === 'date'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortBy === 'date' && (
                          <svg className={`w-4 h-4 ${sortOrder === 'asc' ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>


            </div>

            {/* Servers */}
            {(() => {
              const filteredServers = getFilteredAndSortedServers()
              
              if (filteredServers.length === 0 && searchQuery.trim()) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No servers found</h3>
                    <p className="text-neutral-600 mb-4">
                      No servers match your search for "<span className="font-medium">{searchQuery}</span>"
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="btn-outline px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                )
              }
              
              return filteredServers.map((server) => (
              <div key={server.session_id} className="hero-card rounded-2xl p-8">
                <div className="grid lg:grid-cols-3 gap-8 items-center">
                  
                  {/* Server Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      {getStatusBadge(server.status)}
                      <span className="text-sm text-neutral-500">
                        Created {formatDate(server.created_at)}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">{server.name}</h2>
                    <p className="text-neutral-600 text-sm mb-4">{server.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-neutral-500">Type:</span>
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          streamable-http
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-neutral-500">Tools:</span>
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          {server.tools?.length || 0} tools
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-neutral-500 mt-1">URL:</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                            <code className="text-sm text-neutral-700 flex-1 break-all">
                              {`https://app.mockmcp.com/servers/${server.session_id}/mcp`}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(`https://app.mockmcp.com/servers/${server.session_id}/mcp`, server.session_id, 'url')}
                              className="text-neutral-500 hover:text-neutral-700 p-1 rounded"
                              title="Copy URL"
                            >
                              {copiedStates[`${server.session_id}-url`] ? (
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
                      
                      {server.m2m_token && (
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-neutral-500 mt-1">Auth Token:</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded">
                              <code className="text-sm text-neutral-700 flex-1 break-all">
                                Bearer {tokenVisibility[server.session_id] ? server.m2m_token : '••••••••••'}
                              </code>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => toggleTokenVisibility(server.session_id)}
                                  className="text-neutral-500 hover:text-neutral-700 p-1 rounded text-xs"
                                  title={tokenVisibility[server.session_id] ? "Hide token" : "Show token"}
                                >
                                  {tokenVisibility[server.session_id] ? (
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
                                  onClick={() => copyToClipboard(server.m2m_token, server.session_id, 'token')}
                                  className="text-neutral-500 hover:text-neutral-700 p-1 rounded"
                                  title="Copy token"
                                >
                                  {copiedStates[`${server.session_id}-token`] ? (
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
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => copyToClipboard(`https://app.mockmcp.com/servers/${server.session_id}/mcp`, server.session_id, 'url')}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 group"
                      >
                        {copiedStates[`${server.session_id}-url`] ? (
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
                        onClick={() => copyConfiguration(server)}
                        className="btn-outline px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                      >
                        {copiedStates[`${server.session_id}-config`] ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Copy Config
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => confirmDelete(server)}
                        disabled={deleting.has(server.session_id)}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        {deleting.has(server.session_id) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Server
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Visual Elements */}
                  <div className="relative lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                          {server.status === 'active' ? 'Server Ready' : 
                           server.status === 'idle' ? 'Server Available' : 
                           server.status === 'expired' ? 'Server Expired' : 'Server Status'}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {server.status === 'active' ? 'This server is loaded and ready to be used by your MCP client' :
                           server.status === 'idle' ? 'This server is stored and will be loaded when first accessed' :
                           server.status === 'expired' ? 'This server has expired and needs to be renewed' :
                           'This server can be connected to your MCP client'}
                        </p>
                        {server.tools && server.tools.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <p className="text-xs text-neutral-500 mb-2">Available Tools:</p>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {(expandedTools.has(server.session_id) ? server.tools : server.tools.slice(0, 3)).map((tool, index) => (
                                <span 
                                  key={index} 
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200 cursor-help transition-colors hover:bg-blue-200"
                                  onMouseEnter={(e) => showToolTooltip(tool, e)}
                                  onMouseLeave={hideToolTooltip}
                                >
                                  {tool.name}
                                </span>
                              ))}
                              {server.tools.length > 3 && (
                                <button
                                  onClick={() => toggleToolsExpansion(server.session_id)}
                                  className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 px-2 py-1 rounded font-medium border border-neutral-300 transition-colors cursor-pointer"
                                >
                                  {expandedTools.has(server.session_id) 
                                    ? 'Show less' 
                                    : `+${server.tools.length - 3} more`
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))
            })()}
          </div>
        )}

        {/* Help Section */}
        {servers.length > 0 && (
          <div className="mt-16 text-center fade-in">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Need Help?</h3>
            <p className="text-neutral-600 mb-6">
              Learn how to connect these servers to your MCP client or create new ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/demo"
                className="btn-outline px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Demo
              </a>
              <a
                href="/create-server"
                className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Server
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Delete Server</h3>
                <p className="text-sm text-neutral-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-neutral-700 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirmation.server?.name}</strong>"? 
              This will permanently remove the server and all its configurations.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={deleting.has(deleteConfirmation.server?.session_id)}
                className="btn-outline px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteServer(deleteConfirmation.server)}
                disabled={deleting.has(deleteConfirmation.server?.session_id)}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
              >
                {deleting.has(deleteConfirmation.server?.session_id) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Server'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Tooltip */}
      {hoveredTool && (
        <ToolTooltip 
          tool={hoveredTool.tool} 
          position={hoveredTool.position} 
        />
      )}
    </main>
  )
}

export default Servers 