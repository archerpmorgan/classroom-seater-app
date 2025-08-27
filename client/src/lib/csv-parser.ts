export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
}

export function parseCSV<T>(
  csvContent: string,
  headerMapping: Record<string, keyof T>,
  validator: (row: any) => T
): CSVParseResult<T> {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const data: T[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push("CSV must contain header and at least one data row");
    return { data, errors };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const rowData: any = {};
    headers.forEach((header, index) => {
      const mappedField = headerMapping[header.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()];
      if (mappedField) {
        rowData[mappedField] = values[index];
      }
    });

    try {
      const validatedRow = validator(rowData);
      data.push(validatedRow);
    } catch (error) {
      errors.push(`Row ${i + 1}: Validation failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { data, errors };
}

export function downloadCSV(data: any[], filename: string, headers: string[]) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
