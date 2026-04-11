import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Button from './ui/Button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-error-bg)' }}>
              <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                出了点问题
              </h1>
              <p className="text-base mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                应用遇到了意外错误。你可以尝试刷新页面来恢复。
              </p>
              {this.state.error && import.meta.env.DEV && (
                <div className="text-left p-4 rounded-lg my-4 overflow-auto max-h-48" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <code className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {this.state.error.toString()}
                  </code>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReload} variant="primary">
                <RefreshCw size={16} className="mr-2" />
                刷新页面
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
