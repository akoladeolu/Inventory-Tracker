export interface CSVHeader {
  label: string;
  key: string;
}

export function exportToCSV(data: any[], filename: string, headers: CSVHeader[]) {
  try {
    const csvContent = [
      headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const keys = h.key.split(".");
            let val: any = row;
            for (const k of keys) {
              val = val ? val[k] : "";
            }
            const strVal = val === null || val === undefined ? "" : String(val);
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export CSV:", error);
  }
}
