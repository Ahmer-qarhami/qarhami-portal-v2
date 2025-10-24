import { json } from "react-router-dom";
import * as XLSX from "xlsx";

const ExcelToJson = (file, callback) => {
  try {
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;

      // Read workbook with raw values
      const workbook = XLSX.read(binaryStr, {
        type: "binary",
        cellText: true,
        cellDates: true,
        cellNF: true,
        rawNumbers: true,
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get the range of cells
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      // Get headers first
      const headers = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
        const cell = worksheet[cellAddress];
        headers.push(cell ? cell.w || cell.v : "");
      }

      // Process data rows
      const jsonData = [];
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const row = {};
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];

          // Always get the raw string value
          let value = "";
          if (cell) {
            // Prefer the formatted text value (w) if available, otherwise use raw value (v)
            value = cell.w
              ? cell.w
              : typeof cell.v === "number"
              ? cell.v.toString()
              : cell.v || "";
          }

          row[headers[C]] = value;
        }
        jsonData.push(row);
      }

      callback(jsonData);
    };

    reader.readAsBinaryString(file);
  } catch (error) {
    console.log("EXCEL-READER-ERR: ", error);
    callback([]);
  }
};

export { ExcelToJson };
