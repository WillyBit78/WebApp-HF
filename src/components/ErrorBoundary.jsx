import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>

            <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-extrabold text-white">Ocurrió un inconveniente temporal</h2>
            
            <p className="text-xs text-slate-400">
              La aplicación detectó una inconsistencia de estado en la memoria del navegador. Puedes restaurar la pantalla inmediatamente con 1 clic.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/20 text-rose-300 font-mono text-[11px] text-left overflow-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 font-bold" />
              Restaurar Pantalla
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
