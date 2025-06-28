#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const publicDir = path.join(process.cwd(), 'public')

// SEO File Checks
const checks = [
  {
    name: 'robots.txt',
    path: path.join(publicDir, 'robots.txt'),
    required: true,
    validation: content => content.includes('User-agent:') && content.includes('Sitemap:')
  },
  {
    name: 'sitemap.xml',
    path: path.join(publicDir, 'sitemap.xml'),
    required: true,
    validation: content => content.includes('<?xml') && content.includes('<urlset')
  },
  {
    name: 'site.webmanifest',
    path: path.join(publicDir, 'site.webmanifest'),
    required: true,
    validation: content => {
      try {
        const manifest = JSON.parse(content)
        return manifest.name && manifest.short_name && manifest.icons
      } catch {
        return false
      }
    }
  },
  {
    name: 'favicon.svg',
    path: path.join(publicDir, 'favicon.svg'),
    required: true,
    validation: content => content.includes('<svg')
  }
]

console.log('🔍 Running SEO File Validation...\n')

let allPassed = true

checks.forEach(check => {
  if (fs.existsSync(check.path)) {
    const content = fs.readFileSync(check.path, 'utf-8')
    const isValid = check.validation(content)
    
    if (isValid) {
      console.log(`✅ ${check.name} - OK`)
    } else {
      console.log(`❌ ${check.name} - Invalid content`)
      allPassed = false
    }
  } else {
    console.log(`❌ ${check.name} - Missing`)
    allPassed = false
  }
})

// Check index.html for basic SEO elements
const indexPath = path.join(publicDir, '../index.html')
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8')
  
  const metaChecks = [
    { name: 'Title tag', pattern: /<title[^>]*>MockMCP.*<\/title>/ },
    { name: 'Meta description', pattern: /<meta[^>]*name="description"[^>]*content="[^"]{120,}"/ },
    { name: 'Meta keywords', pattern: /<meta[^>]*name="keywords"/ },
    { name: 'Open Graph title', pattern: /<meta[^>]*property="og:title"/ },
    { name: 'Open Graph description', pattern: /<meta[^>]*property="og:description"/ },
    { name: 'Open Graph image', pattern: /<meta[^>]*property="og:image"/ },
    { name: 'Twitter Card', pattern: /<meta[^>]*property="twitter:card"/ },
    { name: 'Canonical URL', pattern: /<link[^>]*rel="canonical"/ },
    { name: 'Structured Data', pattern: /<script[^>]*type="application\/ld\+json"/ }
  ]
  
  console.log('\n📄 Checking index.html meta tags...')
  
  metaChecks.forEach(check => {
    if (check.pattern.test(indexContent)) {
      console.log(`✅ ${check.name} - Found`)
    } else {
      console.log(`❌ ${check.name} - Missing`)
      allPassed = false
    }
  })
} else {
  console.log('❌ index.html - Missing')
  allPassed = false
}

console.log('\n' + '='.repeat(50))
if (allPassed) {
  console.log('🎉 All SEO checks passed!')
  process.exit(0)
} else {
  console.log('⚠️  Some SEO checks failed. Please review and fix.')
  process.exit(1)
} 