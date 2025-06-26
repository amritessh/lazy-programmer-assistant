import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Error boundary for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center min-h-screen p-5 text-center bg-dark-900 text-dark-100'>
          <h1 className='text-4xl font-bold mb-4 text-gradient'>
            Oops! Something went wrong
          </h1>
          <p className='mb-6 text-dark-300 max-w-md leading-relaxed'>
            The Lazy Programmer's Assistant encountered an error. Don't worry,
            even AIs have bad days.
          </p>
          <button
            onClick={() => window.location.reload()}
            className='px-6 py-3 rounded-lg bg-gradient-primary text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900'
          >
            Reload Page
          </button>
          <details className='mt-6 text-sm text-dark-400 max-w-2xl w-full'>
            <summary className='cursor-pointer hover:text-dark-200 transition-colors mb-2'>
              Error Details (for the curious)
            </summary>
            <pre className='mt-4 p-4 bg-dark-800 rounded-lg text-left text-xs overflow-auto max-h-40 border border-dark-700'>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
