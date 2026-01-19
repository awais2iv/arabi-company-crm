import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { cancelImport, clearImport, setShowDetails } from '@/features/importProgress/importProgressSlice';
import { X } from 'lucide-react';

const GlobalImportProgress = () => {
  const dispatch = useDispatch();
  const { isImporting, progress, cancelled, showDetails } = useSelector((state) => state.importProgress);

  const handleCancel = () => {
    dispatch(cancelImport());
  };

  const handleClearImport = () => {
    dispatch(clearImport());
  };

  if (!progress) return null;

  return (
    <>
      {/* Import Progress Overlay - Always on top */}
      {isImporting && (
        <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-2xl p-4 min-w-[400px] max-w-[600px] z-[9999]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">
              {cancelled ? 'Import Cancelled' : 'Importing Work Orders'}
            </h3>
            <div className="flex items-center gap-2">
              {(progress.errors?.length > 0 || progress.warnings?.length > 0) && (
                <button
                  onClick={() => dispatch(setShowDetails(true))}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  View Details
                </button>
              )}
              {!cancelled && (
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleClearImport}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                cancelled ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(progress.processed / progress.total) * 100}%` }}
            />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>{progress.processed} / {progress.total} processed</span>
              {cancelled && <span className="text-red-600">Cancelled</span>}
            </div>
            {progress.errors?.length > 0 && (
              <p className="text-red-600">
                ❌ {progress.errors.length} error(s)
              </p>
            )}
            {progress.warnings?.length > 0 && (
              <p className="text-yellow-600">
                ⚠️ {progress.warnings.length} warning(s)
              </p>
            )}
            {progress.errors?.length === 0 && progress.warnings?.length === 0 && (
              <p className="text-green-600">
                ✅ No issues detected
              </p>
            )}
          </div>
        </div>
      )}

      {/* Errors List Modal - Always on top */}
      {showDetails && progress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Import Details</h3>
              <button
                onClick={() => dispatch(setShowDetails(false))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Errors Section */}
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    ❌ Errors ({progress.errors?.length || 0})
                  </h4>
                  {progress.errors?.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {progress.errors.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-red-800">Row {error.row}</div>
                          <div className="text-sm text-red-700 mt-1">
                            {error.error || error.message || 'Unknown error'}
                          </div>
                          {error.type === 'creation_error' && (
                            <div className="text-xs text-red-600 mt-1">
                              Data: {JSON.stringify(error.data, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No errors</p>
                  )}
                </div>

                {/* Warnings Section */}
                <div>
                  <h4 className="font-medium text-yellow-700 mb-2">
                    ⚠️ Warnings ({progress.warnings?.length || 0})
                  </h4>
                  {progress.warnings?.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {progress.warnings.map((warning, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="font-medium text-yellow-800">Row {warning.row}</div>
                          <div className="text-sm text-yellow-700 mt-1">{warning.message}</div>
                          {warning.type === 'missing_fields' && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Missing: {warning.fields?.join(', ')}
                            </div>
                          )}
                          {warning.type === 'parse_errors' && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Issues: {warning.errors?.join('; ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No warnings</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => dispatch(setShowDetails(false))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalImportProgress;
