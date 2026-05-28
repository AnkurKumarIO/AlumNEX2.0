/**
 * Exports an array of objects to a CSV file.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Desired filename (without .csv)
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);

  // Create CSV rows
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape commas and wrap in quotes if it's a string
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
