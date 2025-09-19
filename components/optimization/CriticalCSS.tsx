export default function CriticalCSS() {
  return (
    <style>{`
      /* Critical CSS for above-the-fold content */
      
      /* Base styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        -webkit-text-size-adjust: 100%;
      }
      
      body {
        background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
        min-height: 100vh;
        color: #1e293b;
      }
      
      /* Header styles */
      .header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        position: sticky;
        top: 0;
        z-index: 50;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      /* Hero section styles */
      .hero {
        padding: 2rem 0;
      }
      
      .hero-title {
        font-size: 2.5rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .hero-subtitle {
        font-size: 1.25rem;
        text-align: center;
        color: #64748b;
        margin-bottom: 2rem;
      }
      
      /* Featured game card */
      .featured-card {
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
        background: white;
      }
      
      .featured-card:hover {
        transform: translateY(-2px);
      }
      
      /* Game grid */
      .games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 1rem 0;
      }
      
      /* Game card */
      .game-card {
        background: white;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }
      
      .game-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
      }
      
      .game-thumbnail {
        width: 100%;
        height: 160px;
        object-fit: cover;
      }
      
      .game-info {
        padding: 1rem;
      }
      
      .game-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #1e293b;
      }
      
      /* Button styles */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        text-decoration: none;
      }
      
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .btn-primary:hover {
        background: #2563eb;
      }
      
      /* Loading states */
      .loading {
        display: inline-block;
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2rem;
        }
        
        .games-grid {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .container {
          padding: 0 0.75rem;
        }
      }
      
      /* Utility classes */
      .text-center { text-align: center; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-8 { margin-bottom: 2rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .hidden { display: none; }
      
      /* Focus styles for accessibility */
      .btn:focus,
      .game-card:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    `}</style>
  )
}