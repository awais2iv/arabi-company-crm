// src/pages/workOrders/WorkOrdersSpreadsheet.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetWorkOrdersQuery, useUpdateWorkOrderMutation, useDeleteWorkOrderMutation, useCreateWorkOrderMutation, useLazyGetWorkOrderByIdQuery } from '@/features/workOrders/workOrdersApiSlice';
import { 
  Plus, Download, Save, Trash2, RefreshCw, Filter, 
  ChevronLeft, ChevronRight, Settings, ArrowLeft, Search, X, Upload
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { startImport, updateProgress, cancelImport as cancelImportAction, completeImport } from '@/features/importProgress/importProgressSlice';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const WorkOrdersSpreadsheet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const { isImporting, cancelled: importCancelled } = useSelector((state) => state.importProgress);
  const currentUserName = currentUser ? 
    (currentUser.name || currentUser.username || currentUser.email || 'Unknown User') : 
    'Unknown User';
  
  const [page, setPage] = useState(1); // Keep for potential future use, but not used now
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState({});
  const [newRowErrors, setNewRowErrors] = useState({});
  const [previousCell, setPreviousCell] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const importAbortController = useRef(null);
  const cellInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: workOrdersData, isLoading, refetch } = useGetWorkOrdersQuery({ page: 1, limit: 1000 }); // Show all records, not paginated
  const [updateWorkOrder] = useUpdateWorkOrderMutation();
  const [deleteWorkOrder] = useDeleteWorkOrderMutation();
  const [createWorkOrder, { isLoading: isCreating }] = useCreateWorkOrderMutation();
  const [getWorkOrderById, { isFetching: isFinding }] = useLazyGetWorkOrderByIdQuery();

  const workOrders = workOrdersData?.data?.workOrders || [];
  const pagination = workOrdersData?.data?.pagination || {};

  // Dropdown options (same as modal)
  const workOrderStatuses = [
    'Completed',
    'Quotation',
    'Need Tomorrow',
    'Need S.V',
    'Under Observ.',
    'Pending',
    'preventive pending',
    'S.N.R / Un Comp.',
    'No Body At Site',
    'Cancel / No Need',
    'No Answer',
    'Will Call Later',
    'Need Other Day'
  ];
  const jobStatusOptions = ['Attend', 'Not Attend'];
  const areaCodeOptions = ['AREA 1', 'AREA 2', 'AREA 3', 'Others'];

  // Column definitions
  const columns = [
    { id: 'workOrderNumber', label: 'WO Number', width: 120, editable: true },
    { id: 'customerName', label: 'Customer Name', width: 180, editable: true },
    { id: 'customerPhone', label: 'Phone', width: 130, editable: true },
    { id: 'visitInstDate', label: 'Visit Date', width: 120, editable: true, type: 'date' },
    { id: 'workOrderType', label: 'WO Type', width: 120, editable: true },
    { id: 'area', label: 'Area', width: 150, editable: true },
    { id: 'areaCode', label: 'Area Code', width: 100, editable: true, type: 'select', options: areaCodeOptions },
    { id: 'supervisor', label: 'Supervisor', width: 150, editable: true },
    { id: 'technician', label: 'Technician', width: 150, editable: true },
    { id: 'workOrderStatus', label: 'WO Status', width: 120, editable: true, type: 'select', options: workOrderStatuses },
    { id: 'jobStatus', label: 'Job Status', width: 120, editable: true, type: 'select', options: jobStatusOptions },
    { id: 'hours', label: 'Hours', width: 80, editable: true, type: 'number' },
    { id: 'distribution', label: 'Distribution', width: 120, editable: true },
    { id: 'description', label: 'Description', width: 250, editable: true },
    { id: 'rescheduleReason', label: 'Reschedule Date', width: 130, editable: true, type: 'date' },
  ];

  useEffect(() => {
    setLocalData(workOrders);
  }, [workOrders]);

  // Filter data based on search term
  const filteredData = localData.filter(row => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      row.workOrderNumber?.toLowerCase().includes(search) ||
      row.customerName?.toLowerCase().includes(search) ||
      row.customerPhone?.toLowerCase().includes(search) ||
      row.area?.toLowerCase().includes(search) ||
      row.technician?.toLowerCase().includes(search) ||
      row.supervisor?.toLowerCase().includes(search) ||
      row.workOrderStatus?.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
    }
  }, [editingCell]);

  // Handle keyboard navigation with auto-save
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (!selectedCell) return;
      if (editingCell && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(e.key)) return;

      const { rowIndex, colIndex } = selectedCell;
      let newRowIndex = rowIndex;
      let newColIndex = colIndex;
      let shouldMove = false;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRowIndex = Math.max(0, rowIndex - 1);
          shouldMove = true;
          break;
        case 'ArrowDown':
        case 'Enter':
          e.preventDefault();
          newRowIndex = Math.min(filteredData.length - 1, rowIndex + 1);
          shouldMove = true;
          break;
        case 'ArrowLeft':
          if (!editingCell || cellInputRef.current?.selectionStart === 0) {
            e.preventDefault();
            newColIndex = Math.max(0, colIndex - 1);
            shouldMove = true;
          }
          break;
        case 'ArrowRight':
          if (!editingCell || cellInputRef.current?.selectionStart === cellInputRef.current?.value?.length) {
            e.preventDefault();
            newColIndex = Math.min(columns.length - 1, colIndex + 1);
            shouldMove = true;
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            newColIndex = Math.max(0, colIndex - 1);
          } else {
            newColIndex = Math.min(columns.length - 1, colIndex + 1);
          }
          shouldMove = true;
          break;
        case 'Escape':
          e.preventDefault();
          handleCancelEdit();
          return;
        case 'Delete':
          if (!editingCell) {
            e.preventDefault();
            if (window.confirm('Delete this row?')) {
              handleDeleteRow(rowIndex);
            }
          }
          return;
        default:
          return;
      }

      if (shouldMove) {
        // Save current cell before moving
        if (editingCell && hasChanges) {
          await handleSaveCell();
        }
        setSelectedCell({ rowIndex: newRowIndex, colIndex: newColIndex });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, filteredData, columns, hasChanges]);

  const handleStartEdit = (rowIndex, colIndex) => {
    const column = columns[colIndex];
    if (!column.editable) return;

    const row = filteredData[rowIndex];
    const value = getCellValue(row, column);
    
    setEditingCell({ rowIndex, colIndex });
    setEditValue(value);
    setHasChanges(false);
  };

  const handleCellClick = async (rowIndex, colIndex) => {
    // If clicking on a different cell, save the previous one first
    if (editingCell && hasChanges && 
        (editingCell.rowIndex !== rowIndex || editingCell.colIndex !== colIndex)) {
      await handleSaveCell();
    }

    setSelectedCell({ rowIndex, colIndex });
    setPreviousCell(editingCell);
    
    // Start editing immediately if cell is editable
    const column = columns[colIndex];
    if (column.editable) {
      handleStartEdit(rowIndex, colIndex);
    }
  };

  const getCellValue = (row, column) => {
    const value = row[column.id];
    if (!value) return '';
    
    if (column.type === 'date' && value) {
      return new Date(value).toISOString().split('T')[0];
    }
    
    return value;
  };

  const handleSaveCell = async () => {
    if (!editingCell || !hasChanges) {
      setEditingCell(null);
      setEditValue('');
      setHasChanges(false);
      return;
    }

    const { rowIndex, colIndex } = editingCell;
    const row = filteredData[rowIndex];
    const column = columns[colIndex];
    const oldValue = getCellValue(row, column);

    // Don't save if value hasn't changed
    if (oldValue === editValue) {
      setEditingCell(null);
      setEditValue('');
      setHasChanges(false);
      return;
    }

    // Update local data immediately for responsive UI
    const originalIndex = localData.findIndex(item => item._id === row._id);
    const updatedData = [...localData];
    updatedData[originalIndex] = {
      ...updatedData[originalIndex],
      [column.id]: editValue
    };
    setLocalData(updatedData);

    // Save to backend
    try {
      await updateWorkOrder({
        id: row._id,
        data: { [column.id]: editValue }
      }).unwrap();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
      setLocalData(workOrders); // Revert on error
    }

    setEditingCell(null);
    setEditValue('');
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setHasChanges(false);
  };

  const handleDeleteRow = async (rowIndex) => {
    const row = filteredData[rowIndex];
    
    try {
      await deleteWorkOrder(row._id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete work order');
    }
  };

  const handleAddRow = () => {
    setShowNewRow(true);
    setNewRowData({
      workOrderNumber: '',
      customerName: '',
      customerPhone: '',
      visitInstDate: new Date().toISOString().split('T')[0],
      workOrderType: '',
      area: '',
      areaCode: '',
      supervisor: '',
      technician: '',
      workOrderStatus: 'Pending',
      jobStatus: 'Not Attend',
      hours: '',
      distribution: '',
      description: '',
      rescheduleReason: '',
      agentName: currentUserName
    });
    setNewRowErrors({});
  };

  const handleNewRowChange = (field, value) => {
    setNewRowData(prev => ({ ...prev, [field]: value }));
    if (newRowErrors[field]) {
      setNewRowErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFindWorkOrder = async () => {
    if (!newRowData.workOrderNumber?.trim()) {
      setNewRowErrors({ workOrderNumber: 'Please enter a work order number to find' });
      return;
    }

    try {
      const result = await getWorkOrderById(newRowData.workOrderNumber.trim()).unwrap();
      setNewRowData(prev => ({
        ...prev,
        customerName: result.data.customerName || '',
        customerPhone: result.data.customerPhone || '',
        area: result.data.area || '',
        areaCode: result.data.areaCode || '',
        supervisor: result.data.supervisor || '',
        technician: result.data.technician || '',
        // Keep other fields as they were (visitInstDate, workOrderType, etc.)
      }));
      setNewRowErrors({});
    } catch (error) {
      console.error('Failed to find work order:', error);
      setNewRowErrors({ general: 'not found' });
    }
  };

  const validateNewRow = () => {
    // No validation - allow all fields to be optional
    setNewRowErrors({});
    return true;
  };

  const handleSaveNewRow = async () => {
    if (!validateNewRow()) return;

    try {
      const submitData = { ...newRowData };
      
      // Filter out empty strings for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });
      
      // Handle hours specifically
      if (submitData.hours !== undefined) {
        submitData.hours = parseFloat(submitData.hours);
      }
      
      console.log('Submitting work order data:', submitData);
      await createWorkOrder(submitData).unwrap();
      setShowNewRow(false);
      setNewRowData({});
      setNewRowErrors({});
      refetch();
    } catch (error) {
      console.error('Failed to create work order:', error);
      console.error('Error details:', error?.data);
      console.error('Validation errors:', error?.data?.errors);
      setNewRowErrors({ general: error?.data?.message || 'Failed to create work order' });
    }
  };

  const handleCancelNewRow = () => {
    setShowNewRow(false);
    setNewRowData({});
    setNewRowErrors({});
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleExport = () => {
    // Export to CSV
    const headers = columns.map(c => c.label).join(',');
    const rows = localData.map(row => 
      columns.map(col => {
        const value = getCellValue(row, col);
        return `"${value}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Column mapping from spreadsheet headers to database fields
  const columnMapping = {
    // Application field names (primary)
    'WO Number': 'workOrderNumber',
    'Customer Name': 'customerName',
    'Phone': 'customerPhone',
    'Visit Date': 'visitInstDate',
    'WO Type': 'workOrderType',
    'Area': 'area',
    'Area Code': 'areaCode',
    'Supervisor': 'supervisor',
    'Technician': 'technician',
    'WO Status': 'workOrderStatus',
    'Job Status': 'jobStatus',
    'Hours': 'hours',
    'Distribution': 'distribution',
    'Description': 'description',
    'Reschedule Date': 'rescheduleReason',
    // Legacy field names (backwards compatibility)
    'Visit & Inst.Date': 'visitInstDate',
    'Types of Work Order': 'workOrderType',
    'Work Order #': 'workOrderNumber',
    'Cust. Phone #': 'customerPhone',
    'Spare Pump': 'sparePump',
    'Work Order Status': 'workOrderStatus',
    'Reschedule Reason & Remarks': 'rescheduleReason',
    'Job Status': 'jobStatus',
    'Distribution': 'distribution'
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    const str = String(dateStr).trim().toLowerCase();
    
    // Handle relative date keywords
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (str === 'today' || str === 'todays' || str === 'now') {
      return today.toISOString().split('T')[0];
    }
    
    if (str === 'tomorrow' || str === 'tomorrows' || str === 'tommorow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (str === 'yesterday' || str === 'yesterdays') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    // Try parsing Excel serial date
    if (typeof dateStr === 'number') {
      const date = new Date((dateStr - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Try parsing various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    dispatch(startImport({ total: 0, processed: 0, errors: [], warnings: [] }));
    importAbortController.current = new AbortController();

    try {
      let data = [];
      
      // Parse file based on type
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            if (importCancelled || importAbortController.current?.signal.aborted) {
              dispatch(completeImport());
              return;
            }
            data = results.data;
            await processImportData(data);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            alert('Failed to parse CSV file');
            dispatch(completeImport());
          }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (importCancelled || importAbortController.current?.signal.aborted) {
            dispatch(completeImport());
            return;
          }
          try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
            await processImportData(data);
          } catch (error) {
            console.error('Excel parsing error:', error);
            alert('Failed to parse Excel file');
            dispatch(completeImport());
          }
        };
        reader.readAsBinaryString(file);
      } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        dispatch(completeImport());
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import file');
      dispatch(completeImport());
    }

    // Reset file input
    event.target.value = '';
  };

  const handleCancelImport = () => {
    dispatch(cancelImportAction());
    importAbortController.current?.abort();
  };

  const processImportData = async (data) => {
    console.log('Starting bulk import process...');
    console.log('Raw data received:', data.length, 'rows');

    const errors = [];
    const warnings = [];
    const successCount = { value: 0 };
    const total = data.length;

    dispatch(updateProgress({ total, processed: 0, errors: [], warnings: [] }));

    // Preprocess all data first
    const preprocessedData = [];
    const skippedRows = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and arrays are 0-indexed

      try {
        // Map spreadsheet columns to database fields
        const workOrderData = {};
        const missingFields = [];
        const parseErrors = [];

        // Process all columns in the row
        Object.keys(row).forEach((excelCol) => {
          const value = row[excelCol];
          const dbField = columnMapping[excelCol];

          if (dbField) {
            // This column maps to a known database field
            if (value !== undefined && value !== null && value !== '') {
              // Handle date fields
              if (dbField === 'visitInstDate' || dbField === 'rescheduleReason') {
                const parsedDate = parseDate(value);
                if (parsedDate) {
                  workOrderData[dbField] = parsedDate;
                } else {
                  parseErrors.push(`${excelCol}: Invalid date format "${value}"`);
                  workOrderData[dbField] = null; // Set to null for invalid dates
                }
              }
              // Handle numeric fields
              else if (dbField === 'hours') {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                  workOrderData[dbField] = num;
                } else {
                  parseErrors.push(`${excelCol}: Invalid number "${value}"`);
                  workOrderData[dbField] = null; // Set to null for invalid numbers
                }
              }
              // Handle string fields
              else {
                workOrderData[dbField] = String(value).trim();
              }
            } else {
              // Empty value for known field
              workOrderData[dbField] = null;
            }
          } else {
            // This column doesn't map to any known field - skip it
            console.log(`Unknown column "${excelCol}" in row ${rowNumber}, skipping`);
          }
        });

        // Add warnings for parse errors
        if (parseErrors.length > 0) {
          warnings.push({
            row: rowNumber,
            type: 'parse_errors',
            errors: parseErrors,
            message: `Parse errors: ${parseErrors.join('; ')}`
          });
        }

        // Add agent name if not present
        if (!workOrderData.agentName) {
          workOrderData.agentName = currentUserName;
        }

        // Set defaults for required enum fields if missing
        if (!workOrderData.workOrderStatus) {
          workOrderData.workOrderStatus = 'Pending';
        }
        if (!workOrderData.jobStatus) {
          workOrderData.jobStatus = 'Not Attend';
        }

        // Only include if we have at least some data
        if (Object.keys(workOrderData).length > 2) {
          preprocessedData.push({
            ...workOrderData,
            _rowNumber: rowNumber,
            _originalData: row
          });
        } else {
          skippedRows.push({
            row: rowNumber,
            reason: 'Insufficient data to create work order',
            data: row
          });
        }
      } catch (error) {
        console.error(`Error preprocessing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          data: row,
          error: error.message || 'Preprocessing error',
          type: 'preprocessing_error'
        });
      }
    }

    console.log(`Preprocessed ${preprocessedData.length} valid rows, skipped ${skippedRows.length} rows`);

    // Add warnings for skipped rows
    skippedRows.forEach(skipped => {
      warnings.push({
        row: skipped.row,
        type: 'skipped',
        message: skipped.reason,
        data: skipped.data
      });
    });

    // Now perform bulk import
    if (preprocessedData.length > 0) {
      try {
        console.log('Starting bulk create operation...');

        // Create a bulk create endpoint call (assuming we have one)
        // For now, we'll do individual creates but in batches
        const batchSize = 10; // Process 10 at a time
        const batches = [];

        for (let i = 0; i < preprocessedData.length; i += batchSize) {
          batches.push(preprocessedData.slice(i, i + batchSize));
        }

        console.log(`Processing ${batches.length} batches of ${batchSize} records each`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];

          // Check if import was cancelled
          if (importCancelled || importAbortController.current?.signal.aborted) {
            console.log('Import cancelled during batch processing');
            break;
          }

          console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

          // Process each record in the batch
          for (const record of batch) {
            try {
              const { _rowNumber, _originalData, ...workOrderData } = record;
              console.log(`Creating work order for row ${_rowNumber}:`, workOrderData);

              await createWorkOrder(workOrderData).unwrap();
              successCount.value++;
              console.log(`✅ Row ${_rowNumber} imported successfully`);
            } catch (createError) {
              console.error(`❌ Row ${record._rowNumber} failed to create:`, createError);
              errors.push({
                row: record._rowNumber,
                data: record._originalData,
                error: createError?.data?.message || createError.message || 'Failed to create work order',
                type: 'creation_error'
              });
            }
          }

          // Update progress after each batch
          const processedSoFar = (batchIndex + 1) * batchSize;
          dispatch(updateProgress({
            total,
            processed: Math.min(processedSoFar, preprocessedData.length),
            errors,
            warnings
          }));
        }

      } catch (bulkError) {
        console.error('Bulk import error:', bulkError);
        errors.push({
          row: 'N/A',
          error: 'Bulk import operation failed',
          type: 'bulk_import_error'
        });
      }
    }

    // Final progress update
    dispatch(updateProgress({ total, processed: total, errors, warnings }));

    // Show detailed summary
    let message = importCancelled ? `Import cancelled!\\n\\n` : `Import complete!\\n\\n`;
    message += `✅ Successful: ${successCount.value}\\n`;
    message += `❌ Failed: ${errors.length}\\n`;
    message += `⚠️  Warnings: ${warnings.length}\\n`;
    message += `⏭️  Skipped: ${skippedRows.length}\\n`;

    if (importCancelled) {
      message += `⏹️  Cancelled during processing\\n`;
    } else {
      message += `📊 Total: ${total}\\n`;
    }

    message += `\\n`;

    if (warnings.length > 0) {
      message += `⚠️  Warnings Details:\\n`;
      warnings.slice(0, 10).forEach(warning => {
        message += `Row ${warning.row}: ${warning.message}\\n`;
      });
      if (warnings.length > 10) {
        message += `... and ${warnings.length - 10} more warnings\\n`;
      }
      message += `\\n`;
    }

    if (errors.length > 0) {
      message += `❌ Errors Details:\\n`;
      errors.slice(0, 5).forEach(error => {
        message += `Row ${error.row}: ${error.message}\\n`;
      });
      if (errors.length > 5) {
        message += `... and ${errors.length - 5} more errors\\n`;
      }
    }

    alert(message);

    // Log detailed information to console
    console.log('=== IMPORT SUMMARY ===');
    console.log(`Total rows processed: ${total}`);
    console.log(`Successfully imported: ${successCount.value}`);
    console.log(`Failed: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Skipped: ${skippedRows.length}`);

    if (warnings.length > 0) {
      console.log('Import warnings:', warnings);
    }
    if (errors.length > 0) {
      console.log('Import errors:', errors);
    }
    if (skippedRows.length > 0) {
      console.log('Skipped rows:', skippedRows);
    }

    dispatch(completeImport());
    importAbortController.current = null;
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Work Orders Spreadsheet</h1>
          <span className="text-sm text-gray-500">
            {localData.length} {localData.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleAddRow}
            disabled={showNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
          />
          
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? (importCancelled ? 'Cancelling...' : 'Importing...') : 'Import'}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 sticky left-0 z-20 w-12">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700"
                    style={{ minWidth: column.width, maxWidth: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
                <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-20">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {/* New Row - appears at top when adding */}
              {showNewRow && (
                <tr className="bg-green-50 border-2 border-green-500">
                  <td className="bg-green-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium sticky left-0 z-10">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={handleFindWorkOrder}
                        disabled={isFinding}
                        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-xs"
                        title="Find work order"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {columns.map((column, colIndex) => {
                    const value = newRowData[column.id] || '';
                    const hasError = newRowErrors[column.id];

                    return (
                      <td
                        key={column.id}
                        className={`border border-gray-300 px-0 py-0 text-sm ${hasError ? 'bg-red-50' : 'bg-white'}`}
                        style={{ minWidth: column.width, maxWidth: column.width }}
                      >
                        {column.id === 'workOrderNumber' ? (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleNewRowChange('workOrderNumber', e.target.value)}
                            placeholder="WO-001"
                            className={`w-full h-full px-2 py-1.5 text-sm border-none outline-none ${hasError ? 'bg-red-50' : ''}`}
                          />
                        ) : column.type === 'select' ? (
                          <select
                            value={value}
                            onChange={(e) => handleNewRowChange(column.id, e.target.value)}
                            className="w-full h-full px-2 py-1.5 text-sm border-none outline-none bg-white"
                          >
                            {column.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : column.type === 'date' ? (
                          <input
                            type="date"
                            value={value}
                            onChange={(e) => handleNewRowChange(column.id, e.target.value)}
                            className={`w-full h-full px-2 py-1.5 text-sm border-none outline-none ${hasError ? 'bg-red-50' : ''}`}
                          />
                        ) : column.type === 'number' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={value}
                            onChange={(e) => handleNewRowChange(column.id, e.target.value)}
                            className={`w-full h-full px-2 py-1.5 text-sm border-none outline-none ${hasError ? 'bg-red-50' : ''}`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleNewRowChange(column.id, e.target.value)}
                            placeholder={column.id === 'description' ? 'Enter description...' : ''}
                            className={`w-full h-full px-2 py-1.5 text-sm border-none outline-none ${hasError ? 'bg-red-50' : ''}`}
                          />
                        )}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={handleSaveNewRow}
                        disabled={isCreating}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelNewRow}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Regular data rows */}
              {filteredData.map((row, rowIndex) => (
                <tr key={row._id || rowIndex} className="hover:bg-blue-50">
                  {/* Row Number */}
                  <td className="bg-gray-50 border border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium sticky left-0 z-10">
                    {rowIndex + 1}
                  </td>

                  {/* Data Cells */}
                  {columns.map((column, colIndex) => {
                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
                    const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex;
                    const value = getCellValue(row, column);

                    return (
                      <td
                        key={column.id}
                        className={`border border-gray-300 px-0 py-0 text-sm relative ${
                          isEditing ? 'ring-2 ring-blue-500 ring-inset bg-white' :
                          isSelected ? 'ring-2 ring-blue-400 ring-inset' : ''
                        } ${column.editable ? 'cursor-text hover:bg-blue-50' : 'cursor-default bg-gray-50'}`}
                        style={{ minWidth: column.width, maxWidth: column.width }}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          column.type === 'select' ? (
                            <select
                              ref={cellInputRef}
                              value={editValue}
                              onChange={async (e) => {
                                setEditValue(e.target.value);
                                setHasChanges(true);
                                
                                // Auto-save dropdown changes immediately
                                const newValue = e.target.value;
                                const row = filteredData[rowIndex];
                                const originalIndex = localData.findIndex(item => item._id === row._id);
                                const updatedData = [...localData];
                                updatedData[originalIndex] = {
                                  ...updatedData[originalIndex],
                                  [column.id]: newValue
                                };
                                setLocalData(updatedData);

                                try {
                                  await updateWorkOrder({
                                    id: row._id,
                                    data: { [column.id]: newValue }
                                  }).unwrap();
                                  setEditingCell(null);
                                  setEditValue('');
                                  setHasChanges(false);
                                } catch (error) {
                                  console.error('Failed to save:', error);
                                  alert('Failed to save changes');
                                  setLocalData(workOrders);
                                }
                              }}
                              onBlur={async () => {
                                // Ensure save on blur for dropdowns
                                if (hasChanges) {
                                  await handleSaveCell();
                                }
                              }}
                              autoFocus
                              className="w-full h-full px-2 py-1 border-none outline-none bg-white focus:ring-2 focus:ring-blue-500"
                            >
                              {column.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              ref={cellInputRef}
                              type={column.type === 'date' ? 'date' : column.type === 'number' ? 'number' : 'text'}
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setHasChanges(true);
                              }}
                              onBlur={async () => {
                                if (hasChanges) {
                                  await handleSaveCell();
                                }
                              }}
                              autoFocus
                              className="w-full h-full px-2 py-1 border-none outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )
                        ) : (
                          <div className="px-2 py-1 truncate">
                            {column.id === 'workOrderStatus' ? (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                value === 'Completed' ? 'bg-green-100 text-green-800' :
                                value === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                value === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {value}
                              </span>
                            ) : (
                              value || '—'
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer - All records displayed */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-600">
          Showing all {workOrders.length} work order records
        </div>
      </div>

    </div>
  );
};

export default WorkOrdersSpreadsheet;
