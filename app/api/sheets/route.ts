import { getGoogleSheets, appendToSheet, updateRow, deleteRow } from "@/lib/googleSheets";

export async function GET() {
    try {
        const sheets = await getGoogleSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: "Sheet1!A1:200",
        });

        return Response.json({
            success: true,
            data: response.data.values,
        });
    } catch (error) {
        console.error(error);

        return Response.json({
            success: false,
            error: "Failed to fetch sheet data",
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { values } = body;

        if (!values || !Array.isArray(values)) {
            return Response.json({
                success: false,
                error: "Invalid input: values must be an array",
            }, { status: 400 });
        }

        const result = await appendToSheet(values);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            success: false,
            error: "Failed to add row",
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { rowIndex, values } = body;

        if (typeof rowIndex !== 'number' || !values || !Array.isArray(values)) {
            return Response.json({
                success: false,
                error: "Invalid input: rowIndex and values are required",
            }, { status: 400 });
        }

        const result = await updateRow(rowIndex, values);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            success: false,
            error: "Failed to update row",
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rowIndex = parseInt(searchParams.get("rowIndex") || "");

        if (isNaN(rowIndex)) {
            return Response.json({
                success: false,
                error: "Invalid input: rowIndex is required",
            }, { status: 400 });
        }

        const result = await deleteRow(rowIndex);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);
        return Response.json({
            success: false,
            error: "Failed to delete row",
        }, { status: 500 });
    }
}