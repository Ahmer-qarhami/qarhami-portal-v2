import { json } from "react-router-dom";
import * as XLSX from "xlsx";

const ExcelToJson = (file, callback) => {
  try {
    const reader = new FileReader();
    let jsonData;

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, {
        type: "binary",
        raw: true,
        cellText: true,
      });

      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      jsonData = XLSX.utils.sheet_to_json(sheet);
      callback(jsonData);
    };

    reader.readAsBinaryString(file);
  } catch (error) {
    console.log("EXCEL-READER-ERR: ", error);
  }
};

export { ExcelToJson };
