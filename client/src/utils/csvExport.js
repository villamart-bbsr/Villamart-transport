import Papa from 'papaparse';

export const exportToCSV = (data, filename) => {
  // Transform data for CSV export
  const csvData = data.map(entry => ({
    'User Name': entry.userName,
    'Distributor': entry.distributor,
    'Status': entry.inOut,
    'Location': entry.location,
    'Barcode': entry.barcode,
    'Timestamp': new Date(entry.timestamp).toLocaleString()
  }));

  // Convert to CSV
  const csv = Papa.unparse(csvData);
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
