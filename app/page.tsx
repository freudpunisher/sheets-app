import { getGoogleSheets } from "@/lib/googleSheets";
import Dashboard from "@/app/components/Dashboard";

async function getData() {
  try {
    const sheets = await getGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1:200", // Increased range for better dashboard
    });

    return {
      success: true,
      data: response.data.values,
    };
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return {
      success: false,
      error: "Failed to fetch sheet data",
    };
  }
}

export default async function Home() {
  const result = await getData();
  console.log(result);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connection Failed</h2>
          <p className="text-slate-500 font-medium mb-8">
            {result.error}. Please check your Google Sheets API credentials and Sheet ID.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard initialData={result.data} />;
}
