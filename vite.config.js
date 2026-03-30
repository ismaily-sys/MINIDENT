build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react')) return 'vendor-react'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('lucide') || id.includes('react-hot-toast')) return 'vendor-ui'
        }
      }
    }
  }
}