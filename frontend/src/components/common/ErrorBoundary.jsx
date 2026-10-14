import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          paddingTop: 'calc(env(safe-area-inset-top, 24px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 20px)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#ffffff',
          minHeight: '100vh',
          boxSizing: 'border-box',
          color: '#1E293B'
        }}>
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#B91C1C' }}>Đã xảy ra sự cố hiển thị</h2>
            <p style={{ margin: 0, fontSize: '15px', color: '#7F1D1D' }}>
              Ứng dụng vừa gặp sự cố hiển thị. Chi tiết lỗi kỹ thuật bên dưới:
            </p>
          </div>
          <details style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#DC2626', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>Chi tiết kỹ thuật</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Tải lại trang
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('diaplus_role_mode_v1');
                  sessionStorage.clear();
                } catch {
                  /* ignore */
                }
                window.location.href = '/dashboard';
              }}
              style={{
                padding: '10px 20px',
                background: '#64748b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Đặt lại chế độ & về Trang chủ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
