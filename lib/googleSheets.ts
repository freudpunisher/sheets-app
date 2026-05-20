import { google } from "googleapis";

export async function getGoogleSheets() {
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({
        version: "v4",
        auth,
    });

    return sheets;
}

export async function appendToSheet(values: any[]) {
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [values],
        },
    });
    return response.data;
}

export async function updateRow(rowIndex: number, values: any[]) {
    const sheets = await getGoogleSheets();
    // rowIndex is 0-indexed from the data array, so we adjust to 1-indexed for A1 notation
    // If headers are row 1, first data row is row 2. We use 1-indexed row number.
    const range = `Sheet1!A${rowIndex + 1}`;
    const response = await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [values],
        },
    });
    return response.data;
}

export async function deleteRow(rowIndex: number) {
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: 0,
                            dimension: "ROWS",
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        },
                    },
                },
            ],
        },
    });
    return response.data;
}