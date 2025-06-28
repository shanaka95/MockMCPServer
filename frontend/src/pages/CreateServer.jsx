import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchAuthSession } from 'aws-amplify/auth'

function CreateServer() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tools: [
      {
        name: 'HelloWorld',
        description: 'Provides the server status of mockmcp.com',
        output_text: JSON.stringify({
          "status": "online",
          "message": "Hi, mockmcp.com is online and running normally.",
          "timestamp": new Date().toISOString(),
          "server": "MockMCP"
        }, null, 2),
        parameters: {
          name: {
            type: 'string',
            description: 'Your Name'
          }
        }
      }
    ]
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, loading, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handleToolChange = (index, field, value) => {
    const updatedTools = [...formData.tools]
    updatedTools[index] = {
      ...updatedTools[index],
      [field]: value
    }
    setFormData({
      ...formData,
      tools: updatedTools
    })
  }

  const prettifyJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch (error) {
      return jsonString // Return original if not valid JSON
    }
  }

  const handleOutputTextChange = (toolIndex, value, shouldPrettify = false) => {
    let finalValue = value
    
    if (shouldPrettify) {
      finalValue = prettifyJson(value)
    }
    
    handleToolChange(toolIndex, 'output_text', finalValue)
  }

  const handleParameterChange = (toolIndex, paramName, field, value) => {
    const updatedTools = [...formData.tools]
    updatedTools[toolIndex].parameters[paramName] = {
      ...updatedTools[toolIndex].parameters[paramName],
      [field]: value
    }
    setFormData({
      ...formData,
      tools: updatedTools
    })
  }

  const addTool = () => {
    setFormData({
      ...formData,
      tools: [
        ...formData.tools,
        {
          name: '',
          description: '',
          output_text: '',
          parameters: {}
        }
      ]
    })
  }

  const removeTool = (index) => {
    if (formData.tools.length > 1) {
      const updatedTools = formData.tools.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        tools: updatedTools
      })
    }
  }

  const addParameter = (toolIndex) => {
    const updatedTools = [...formData.tools]
    const paramName = `param_${Date.now()}`
    updatedTools[toolIndex].parameters[paramName] = {
      type: 'string',
      description: ''
    }
    setFormData({
      ...formData,
      tools: updatedTools
    })
  }

  const removeParameter = (toolIndex, paramName) => {
    const updatedTools = [...formData.tools]
    delete updatedTools[toolIndex].parameters[paramName]
    setFormData({
      ...formData,
      tools: updatedTools
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.tools.some(tool => !tool.name || !tool.description)) {
      setError('Please fill in all tool information')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Get the authentication session to retrieve the token
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('https://app.mockmcp.com/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setSuccess('Server created successfully!')
      
      // Reset form or redirect after success
      setTimeout(() => {
        navigate('/servers')
      }, 2000)

    } catch (error) {
      console.error('Error creating server:', error)
      setError(error.message || 'Failed to create server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10 fade-in">

          
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight mb-4">
            Build Your
            <span className="text-gradient block">MCP Server</span>
          </h1>

        </div>

        {/* Form */}
        <div className="hero-card rounded-xl p-8 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Server Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-neutral-800 border-b border-neutral-200 pb-2">
                Server Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Demo MCP Server"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Server Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what your MCP server does..."
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tools Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-200">
                <h2 className="text-2xl font-semibold text-neutral-800 pb-2 flex-1">
                  Tools Configuration
                </h2>
                <button
                  type="button"
                  onClick={addTool}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mb-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Tool
                </button>
              </div>

              {formData.tools.map((tool, toolIndex) => (
                <div key={toolIndex} className="feature-card p-6 rounded-lg space-y-4">
                  
                  {/* Tool Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-800">
                      Tool {toolIndex + 1}
                    </h3>
                    {formData.tools.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTool(toolIndex)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Tool Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tool Name *
                      </label>
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => handleToolChange(toolIndex, 'name', e.target.value)}
                        placeholder="e.g., HelloWorld"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tool Description *
                      </label>
                      <input
                        type="text"
                        value={tool.description}
                        onChange={(e) => handleToolChange(toolIndex, 'description', e.target.value)}
                        placeholder="What does this tool do?"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-neutral-700">
                        Parameters
                      </label>
                      <button
                        type="button"
                        onClick={() => addParameter(toolIndex)}
                        className="btn-outline px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Parameter
                      </button>
                    </div>

                    {Object.entries(tool.parameters || {}).map(([paramName, paramConfig]) => (
                      <div key={paramName} className="bg-neutral-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">
                            Parameter: {paramName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeParameter(toolIndex, paramName)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Type
                            </label>
                            <select
                              value={paramConfig.type}
                              onChange={(e) => handleParameterChange(toolIndex, paramName, 'type', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="array">Array</option>
                              <option value="object">Object</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={paramConfig.description}
                              onChange={(e) => handleParameterChange(toolIndex, paramName, 'description', e.target.value)}
                              placeholder="Parameter description"
                              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        Output Text *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOutputTextChange(toolIndex, tool.output_text, true)}
                        className="btn-outline px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                        title="Format as JSON"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Prettify JSON
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={tool.output_text}
                        onChange={(e) => handleOutputTextChange(toolIndex, e.target.value)}
                        onBlur={(e) => {
                          // Auto-prettify JSON on blur if it's valid JSON but not formatted
                          const value = e.target.value.trim()
                          if (value && value.startsWith('{') || value.startsWith('[')) {
                            try {
                              const parsed = JSON.parse(value)
                              const prettified = JSON.stringify(parsed, null, 2)
                              if (prettified !== value) {
                                handleOutputTextChange(toolIndex, prettified)
                              }
                            } catch {
                              // Ignore if not valid JSON
                            }
                          }
                        }}
                        placeholder="What will this tool return when called? Can be plain text or JSON..."
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        required
                      />
                      {tool.output_text && (() => {
                        try {
                          JSON.parse(tool.output_text)
                          return (
                            <div className="absolute top-2 right-2">
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Valid JSON
                              </span>
                            </div>
                          )
                        } catch {
                          return null
                        }
                      })()}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      💡 Tip: Paste JSON here and click "Prettify JSON" to format it automatically
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => navigate('/servers')}
                className="btn-outline px-6 py-3 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-success px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Server
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default CreateServer 