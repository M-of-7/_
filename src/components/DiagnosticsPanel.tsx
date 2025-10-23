import React, { useState, useEffect } from 'react';
import { runDiagnostics, type DiagnosticResult, type DiagnosticAction } from '../services/diagnostics';
import SpinnerIcon from './icons/SpinnerIcon';

interface DiagnosticsPanelProps {
  onClose: () => void;
}

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ onClose }) => {
  const [results, setResults] = useState<Array<DiagnosticResult | DiagnosticAction>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<{ [key: number]: { status: 'running' | 'success' | 'error'; message: string } }>({});


  useEffect(() => {
    const performCheck = async () => {
      setIsLoading(true);
      const { results } = await runDiagnostics();
      setResults(results);
      setIsLoading(false);
    };
    performCheck();
  }, []);

  const getStatusClasses = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };
  
  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
    }
  };

  const handleActionClick = async (action: () => Promise<{ success: boolean; message: string }>, index: number) => {
    setActionStatus(prev => ({ ...prev, [index]: { status: 'running', message: 'Executing...' } }));
    const result = await action();
    setActionStatus(prev => ({ ...prev, [index]: { status: result.success ? 'success' : 'error', message: result.message } }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-800 text-white">
          <h3 className="font-bold text-lg">System Diagnostics</h3>
          <button onClick={onClose} className="text-white hover:text-slate-200 text-2xl font-bold">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <SpinnerIcon className="w-12 h-12 text-slate-500" />
              <p className="mt-4 text-slate-600">Running checks...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((result, index) => {
                const action = (result as DiagnosticAction).action;
                return (
                    <div key={index} className={`p-4 rounded-md border ${getStatusClasses(result.status).replace('bg', 'border')}`}>
                        <div className={`font-bold text-lg flex items-center gap-3 ${getStatusClasses(result.status).replace('bg-opacity-20', '').replace('bg', 'text')}`}>
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-mono ${getStatusClasses(result.status)}`}>{getStatusIcon(result.status)}</span>
                        <span>{result.category}: {result.message}</span>
                        </div>
                        {result.details && <p className="mt-2 text-sm text-slate-600 pl-9"><strong>Details:</strong> {result.details}</p>}
                        {result.fix && <p className="mt-1 text-sm text-slate-600 pl-9"><strong>Suggested Fix:</strong> <code className="bg-slate-200 p-1 rounded text-xs">{result.fix}</code></p>}
                        {action && (
                            <div className="pl-9 mt-3">
                                <button
                                    onClick={() => handleActionClick(action, index)}
                                    disabled={actionStatus[index]?.status === 'running'}
                                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    {actionStatus[index]?.status === 'running' ? 'Running...' : 'Run Action'}
                                </button>
                                {actionStatus[index] && (
                                    <div className={`mt-2 p-2 rounded text-sm ${actionStatus[index].status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {actionStatus[index].message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPanel;