import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          aws: ['aws-amplify'],
          helmet: ['react-helmet-async']
        }
      }
    },
    // Generate source maps for production debugging
    sourcemap: true,
  },
  server: {
    // Set port to 3000 to match CORS configuration
    port: 3000,
    // Hot module replacement for development
    hmr: true,
    // Allow external connections for testing
    host: true,
  },
  // SEO and performance optimizations
  define: {
    // Remove development-only code in production
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  // Preload critical resources
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
  },
})
