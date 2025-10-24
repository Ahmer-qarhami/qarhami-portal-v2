import { ExcelToJson } from "../utils/ExcelReader";

const uploadData = async (e, setData) => {
  try {
    console.log(e);
    //setIsLoading(true);

    let result = ExcelToJson(e, async (excelData) => {
      let body = excelData.map((item) => {
        return {
          createdBy: "ADMIN",
          createdAt: Date.now(),
          updatedBy: "ADMIN",
          updatedAt: Date.now(),
          deviceSerial: item.SERIAL,
          imei: item.IMEI,
          iccid: item.ICCID,
          email: "",
          fullName: "",
          vin: "",
          carName: "",
          year: "",
          make: "",
          model: "",
          manufacturer: "Geometris",
          status: "INVENTORY",
        };
      });

      //setData(body);

      await axios
        .post("http://localhost:3200/device-master/uploadData", body)
        .then((res) => {
          setData([...data, ...res.data.uploadedData]);
          //setDuplicateData(res.data.duplicateData);
          //setIsLoading(false);
        });
    });
  } catch (error) {
    console.log(error.message);
  }
};

export { uploadData };
