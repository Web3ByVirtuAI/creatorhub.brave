import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CreatorHub.Brave - Secure Time-Locked Vaults</title>
        <meta name="description" content="Create secure time-locked cryptocurrency vaults with social recovery on Ethereum Layer 2" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom CSS */}
        <link href="/static/styles.css" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'brave-blue': {
                      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
                      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
                      800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
                    },
                    'vault-gold': {
                      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
                      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
                      800: '#92400e', 900: '#78350f', 950: '#451a03'
                    },
                    'trust-green': {
                      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
                      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
                      800: '#166534', 900: '#14532d', 950: '#052e16'
                    }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="font-brand antialiased">
        {children}
        
        {/* React and other frontend libraries */}
        <script crossOrigin="anonymous" src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossOrigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        
        {/* Ethers.js - using alternative CDN */}
        <script src="https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js"></script>
        
        {/* Core utility scripts - load order matters */}
        <script src="/static/validation.js"></script>
        <script src="/static/walletConnect.js"></script>
        <script src="/static/contracts.js"></script>
        <script src="/static/factory-loader.js"></script>
        <script src="/static/notifications.js"></script>
        <script src="/static/dashboard.js"></script>
        <script src="/static/vault-wizard.js"></script>
        
        {/* Main application - load last */}
        <script src="/static/simple-app.js"></script>
      </body>
    </html>
  )
})
