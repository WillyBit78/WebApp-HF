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
      const savedLogs = JSON.parse(localStorage.getItem('hf_audit_logs') || '[]');
      const errorLog = {
        id: `log-react-err-${Date.now()}`,
        fechaHora: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
        usuarioNombre: 'Sistema (ErrorBoundary)',
        usuarioRol: 'sistema',
        tipoEvento: 'error_sistema',
        descripcion: 'Error crítico de renderizado React',
        detalles: String(error?.message || error)
      };
      localStorage.setItem('hf_audit_logs', JSON.stringify([errorLog, ...savedLogs].slice(0, 200)));
    } catch (e) {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-white">Ocurrió un inconveniente temporal</h2>
            
            <p className="text-xs text-slate-400">
              La aplicación detectó una inconsistencia de estado al cambiar de pantalla. Puedes restaurar la pantalla inmediatamente con 1 clic.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/20 text-rose-300 font-mono text-[11px] text-left overflow-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
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
