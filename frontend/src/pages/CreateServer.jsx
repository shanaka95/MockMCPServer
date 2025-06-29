import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchAuthSession } from 'aws-amplify/auth'
import SEOHead from '../components/SEOHead'

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
        output_type: 'text', // 'text', 'image', 'custom'
        output_text: JSON.stringify({
          "status": "online",
          "message": "Hi, mockmcp.com is online and running normally.",
          "timestamp": new Date().toISOString(),
          "server": "MockMCP"
        }, null, 2),
        output_image: {
          s3_key: '',
          s3_bucket: '',
          filename: '',
          preview: ''
        },
        output_custom: {
          flow_type: '',
          configuration: ''
        },
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
  const [uploadingImages, setUploadingImages] = useState(new Set())

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Create Mock MCP Server - MockMCP",
    "description": "Create and configure your custom mock Model Context Protocol server with no-code tools. Deploy in 30 seconds with custom responses and endpoints.",
    "url": "https://mockmcp.com/create-server",
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
          "name": "Create Server",
          "item": "https://mockmcp.com/create-server"
        }
      ]
    }
  }

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

  const handleImageUpload = async (toolIndex, file) => {
    if (!file) return

    // Add this tool to uploading set
    setUploadingImages(prev => new Set([...prev, toolIndex]))
    setError('') // Clear any previous errors

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)
      
      // Get authentication token
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Upload to backend
      const response = await fetch('https://app.mockmcp.com/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_data: base64,
          filename: file.name
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Update the form data with the uploaded image S3 key
      const updatedTools = [...formData.tools]
      updatedTools[toolIndex].output_image = {
        s3_key: result.key,
        s3_bucket: result.bucket,
        filename: file.name,
        preview: base64 // Store base64 for preview
      }
      
      setFormData({
        ...formData,
        tools: updatedTools
      })

    } catch (error) {
      console.error('Error uploading image:', error)
      setError(`Failed to upload image: ${error.message}`)
    } finally {
      // Remove this tool from uploading set
      setUploadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(toolIndex)
        return newSet
      })
    }
  }

  const handleRemoveImage = (toolIndex) => {
    const updatedTools = [...formData.tools]
    updatedTools[toolIndex].output_image = {
      s3_key: '',
      s3_bucket: '',
      filename: '',
      preview: ''
    }
    
    setFormData({
      ...formData,
      tools: updatedTools
    })

    // Reset the file input
    const fileInput = document.getElementById(`image-upload-${toolIndex}`)
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
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
          output_type: 'text',
          output_text: '',
          output_image: {
            s3_key: '',
            s3_bucket: '',
            filename: '',
            preview: ''
          },
          output_custom: {
            flow_type: '',
            configuration: ''
          },
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

      // Clean up form data for submission (remove preview fields)
      const cleanedFormData = {
        ...formData,
        tools: formData.tools.map(tool => ({
          ...tool,
          output_image: tool.output_image ? {
            s3_key: tool.output_image.s3_key,
            s3_bucket: tool.output_image.s3_bucket
          } : tool.output_image
        }))
      }

      const response = await fetch('https://app.mockmcp.com/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedFormData)
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
      <>
        <SEOHead 
          title="Create Mock MCP Server - No-Code Configuration"
          description="Create and configure your custom mock Model Context Protocol server with intuitive no-code tools. Deploy instantly with custom responses and endpoints."
          keywords="create MCP server, no-code MCP, configure mock server, custom MCP endpoints"
          canonicalUrl="/create-server"
          structuredData={structuredData}
        />
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" role="main">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SEOHead 
        title="Create Mock MCP Server - No-Code Configuration"
        description="Create and configure your custom mock Model Context Protocol server with intuitive no-code tools. Deploy instantly with custom responses and endpoints."
        keywords="create MCP server, no-code MCP, configure mock server, custom MCP endpoints"
        canonicalUrl="/create-server"
        structuredData={structuredData}
      />
      
      <main className="min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8" role="main">
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
                      <div className="flex items-center justify-between mb-2  h-[30px]">
                        <label className="block text-sm font-medium text-neutral-700">
                          Output Configuration *
                        </label>
                        {tool.output_type === 'text' && (
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
                        )}
                      </div>
                      
                      {/* Output Type Tabs */}
                      <div className="mb-4">
                        <div className="flex border-b border-neutral-200">
                          <button
                            type="button"
                            onClick={() => handleToolChange(toolIndex, 'output_type', 'text')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              tool.output_type === 'text'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Text/JSON
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolChange(toolIndex, 'output_type', 'image')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              tool.output_type === 'image'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Image
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToolChange(toolIndex, 'output_type', 'custom')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              tool.output_type === 'custom'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                              </svg>
                              Custom Flow
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="relative">
                        {tool.output_type === 'text' && (
                          <>
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
                              className="w-full h-[180px] px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
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
                            <p className="text-xs text-neutral-500 mt-1">
                              💡 Tip: Paste JSON here and click "Prettify JSON" to format it automatically
                            </p>
                          </>
                        )}

                        {tool.output_type === 'image' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Upload Image
                              </label>
                              
                              {/* Show upload area if no image is uploaded and not uploading */}
                              {!tool.output_image?.s3_key && !uploadingImages.has(toolIndex) && (
                                <div className="flex items-center justify-center w-full">
                                  <label 
                                    htmlFor={`image-upload-${toolIndex}`}
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                  >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <svg className="w-8 h-8 mb-4 text-neutral-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                      </svg>
                                      <p className="mb-2 text-sm text-neutral-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                      </p>
                                      <p className="text-xs text-neutral-500">PNG, JPG or GIF (MAX. 10MB)</p>
                                    </div>
                                    <input 
                                      id={`image-upload-${toolIndex}`}
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(toolIndex, e.target.files[0])}
                                    />
                                  </label>
                                </div>
                              )}

                              {/* Show uploading state */}
                              {uploadingImages.has(toolIndex) && (
                                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                  <p className="mb-2 text-sm text-blue-600 font-medium">
                                    Uploading image...
                                  </p>
                                  <p className="text-xs text-blue-500">Please wait</p>
                                </div>
                              )}

                              {/* Show uploaded image preview */}
                              {tool.output_image?.s3_key && !uploadingImages.has(toolIndex) && (
                                <div className="border-2 border-green-200 rounded-lg bg-green-50 p-4">
                                  <div className="flex items-start gap-4">
                                    {/* Image preview */}
                                    <div className="flex-shrink-0">
                                      {tool.output_image.preview ? (
                                        <img 
                                          src={tool.output_image.preview} 
                                          alt="Uploaded preview" 
                                          className="w-20 h-20 object-cover rounded border"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 bg-neutral-200 rounded border flex items-center justify-center">
                                          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>

                                    {/* Image info and actions */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-green-800 font-medium">Image uploaded successfully</span>
                                      </div>
                                      
                                      {tool.output_image.filename && (
                                        <p className="text-sm text-neutral-600 mb-3 truncate">
                                          {tool.output_image.filename}
                                        </p>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImage(toolIndex)}
                                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove image
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {tool.output_type === 'custom' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Flow Type
                              </label>
                              <select
                                value={tool.output_custom?.flow_type || ''}
                                onChange={(e) => handleToolChange(toolIndex, 'output_custom', {
                                  ...tool.output_custom,
                                  flow_type: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select flow type...</option>
                                <option value="webhook">Webhook</option>
                                <option value="api_call">API Call</option>
                                <option value="database">Database Query</option>
                                <option value="file_operation">File Operation</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Configuration
                              </label>
                              <textarea
                                value={tool.output_custom?.configuration || ''}
                                onChange={(e) => handleToolChange(toolIndex, 'output_custom', {
                                  ...tool.output_custom,
                                  configuration: e.target.value
                                })}
                                placeholder="Enter configuration details..."
                                rows={4}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                              />
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Custom flow functionality will be implemented in a future update
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                  disabled={isSubmitting || uploadingImages.size > 0}
                  className="btn-success px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : uploadingImages.size > 0 ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading images...
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
    </>
  )
}

export default CreateServer 