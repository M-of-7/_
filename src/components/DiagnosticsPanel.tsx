import React, { useState } from 'react';
import { SystemDiagnostics, DiagnosticResult } from '../services/diagnostics';

interface DiagnosticsPanelProps {
  onClose: () => void;
}

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setHasRun(false);

    try {
      const diagnostics = new SystemDiagnostics();
      const testResults = await diagnostics.runAllChecks();
      setResults(testResults);
      setHasRun(true);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setResults([{
        category: 'System',
        status: 'error',
        message: 'Diagnostics crashed',
        details: error instanceof Error ? error.message : String(error)
      }]);
      setHasRun(true);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
    }
  };

  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const okCount = results.filter(r => r.status === 'ok').length;

  const categories = [...new Set(results.map(r => r.category))];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">System Diagnostics</h2>
              <p className="text-blue-100 mt-1">نظام تشخيص الأخطاء</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {hasRun && (
            <div className="mt-4 flex gap-4 text-sm">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">✓ Passed:</span> {okCount}
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">⚠ Warnings:</span> {warningCount}
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">✗ Errors:</span> {errorCount}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasRun && (
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Diagnose</h3>
              <p className="text-gray-600">Click "Run Diagnostics" to check your system</p>
            </div>
          )}

          {isRunning && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800">Running diagnostics...</h3>
              <p className="text-gray-600 mt-2">جاري فحص النظام...</p>
            </div>
          )}

          {hasRun && !isRunning && (
            <div className="space-y-6">
              {categories.map(category => {
                const categoryResults = results.filter(r => r.category === category);
                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-bold text-lg text-gray-800">{category}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {categoryResults.map((result, idx) => (
                        <div key={idx} className={`p-4 ${getStatusColor(result.status)}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl font-bold">{getStatusIcon(result.status)}</span>
                            <div className="flex-1">
                              <p className="font-semibold">{result.message}</p>
                              {result.details && (
                                <p className="text-sm mt-1 opacity-80">
                                  <strong>Details:</strong> {result.details}
                                </p>
                              )}
                              {result.fix && (
                                <div className="mt-2 bg-white/50 rounded p-2 text-sm">
                                  <strong>💡 Fix:</strong> {result.fix}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {isRunning ? 'Running...' : hasRun ? 'Run Again' : 'Run Diagnostics'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
