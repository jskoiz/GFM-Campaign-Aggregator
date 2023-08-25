import ExcelJS from 'exceljs';

export async function writeResultsToFile(results) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scraped Data');
    worksheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Raised Amount', key: 'raisedAmount' },
        { header: 'Target Amount', key: 'targetAmount' },
        { header: 'Image URL', key: 'imageUrl' },
        { header: 'Error', key: 'error' }  // New column for errors
    ];
    
    results.forEach(item => {
        if (item.error) {
            worksheet.addRow({ title: 'N/A', raisedAmount: 'N/A', targetAmount: 'N/A', imageUrl: 'N/A', error: item.error });
        } else {
            worksheet.addRow({ ...item.data, error: null });
        }
    });

    await workbook.xlsx.writeFile('gfm-campaign-details.xlsx');
    console.log('Data written to gfm-campaign-details.xlsx successfully.');
}
