import React, { useEffect, useState } from "react";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  Table,
  message,
  Modal,
  Select,
} from "antd";
const { Search } = Input;
const { Option } = Select;
import { ExcelToJson } from "../utils/ExcelReader";
import "../App.css";
import {
  uploadData,
  getAllDevices,
  assignEmailToDevices,
} from "../api/Devices";

const Home = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [expandPanel, setExpandPanel] = useState([]);
  const [duplicateData, setDuplicateData] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.createRef();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [assignEmail, setAssignEmail] = useState("");

  //table columns
  const columns = [
    {
      title: "Serial",
      dataIndex: "deviceSerial",
      key: "deviceSerial",
      clickable: true,
      className: "link-column text-xs md:text-md",

      render: (text, record) => {
        return (
          <a
            onClick={() => {
              //setting form data
              const _formData = data.find((d) => d.deviceSerial == text);
              setFormData(_formData);
              formRef?.current?.setFieldsValue(_formData);

              //expand panel
              onExpandPanel(text);
            }}
          >
            {text}
          </a>
        );
      },
    },
    {
      title: "IMEI",
      dataIndex: "imei",
      key: "imei",
      clickable: true,
      className: "text-xs md:text-md",
    },
    {
      title: "ICCID",
      dataIndex: "iccid",
      key: "iccid",
      className: "text-xs md:text-md",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      className: "text-xs md:text-md",
    },
  ];

  const uploadSuccessful = () => {
    message.success("Data Uploaded Successfully");
  };

  const onExpandPanel = (key) => {
    if (expandPanel.length == 1) {
      //setExpandPanel([]);
    } else {
      setExpandPanel([1]);
    }
  };

  const onFilterData = (text) => {
    text = text.toLowerCase();
    if (text == "") {
      setFilteredData(data);
    } else {
      const newData = data?.filter((d) => {
        return (
          d?.deviceSerial?.toLowerCase().includes(text) ||
          d?.imei?.toLowerCase().includes(text) ||
          d?.iccid?.toLowerCase().includes(text) ||
          d?.status?.toLowerCase().includes(text) ||
          d?.email?.toLowerCase().includes(text) ||
          d?.fullName?.toLowerCase().includes(text) ||
          d?.vin?.toLowerCase().includes(text) ||
          d?.carName?.toLowerCase().includes(text)
        );
      });

      setFilteredData(newData);
    }
  };

  const onFinish = (values) => {};

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedDevices([]);
    setAssignEmail("");
  };

  const handleAssignDevices = () => {
    if (!assignEmail || selectedDevices.length === 0) {
      message.error("Please select devices and enter an email address");
      return;
    }

    assignEmailToDevices({
      email: assignEmail,
      devices: selectedDevices,
      status: "INSTALLATION_PENDING",
    }).then((res) => {
      let _data = data.filter((d) => {
        return !selectedDevices.includes(d.deviceSerial);
      });

      let _selectedDevices = selectedDevices.map((d) => {
        let _device = data.find((i) => i.deviceSerial == d);
        return {
          ..._device,
          email: assignEmail,
          status: "INSTALLATION_PENDING",
        };
      });

      _data = [..._selectedDevices, ..._data];

      setData(_data);
      setFilteredData(_data);

      console.log(res);
    });

    // For now, just show a success message
    message.success(
      `Assigned ${selectedDevices.length} devices to ${assignEmail}`
    );
    handleCancel();
  };

  const handleFileUpload = async (e) => {
    try {
      setIsLoading(true);

      const result = ExcelToJson(e.target.files[0], async (excelData) => {
        const body = excelData.map((item) => {
          if (item.SERIAL != null && item.SERIAL != "SERIAL") {
            return {
              createdBy: "ADMIN",
              createdAt: Date.now(),
              updatedBy: "ADMIN",
              updatedAt: Date.now(),
              deviceSerial: item?.SERIAL,
              imei: String(item?.IMEI),
              iccid: String(item?.ICCID),
              email: item?.EMAIL,
              fullName: item?.FULLNAME,
              vin: item?.VIN,
              carName: item?.CARNAME,
              year: item?.YEAR,
              make: item?.MAKE,
              model: item?.MODEL,
              manufacturer: "Geometris",
              status: item?.EMAIL ? "INSTALLATION_PENDING" : "INVENTORY",
            };
          }
        });

        uploadData(body).then((res) => {
          const newData = res?.map((d) => {
            return {
              ...d,
              key: d.deviceSerial,
            };
          });

          let _item = body[0];
          _item = {
            ..._item,
            key: _item.deviceSerial,
          };

          let _newData = data.filter(
            (i) => i.deviceSerial != _item.deviceSerial
          );

          _newData = [_item, ..._newData];

          uploadSuccessful();
          setData(_newData);
          setFilteredData(_newData);

          // getAllDevices().then((allData) => {

          //   uploadSuccessful();
          //   setData(allData);
          //   setFilteredData(allData);
          // });
          // setDuplicateData(newDuplicateData);
        });
        setIsLoading(false);
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  //useEffect for page load
  useEffect(() => {
    getAllDevices().then((res) => {
      const newData = res?.map((d) => {
        return {
          ...d,
          key: d.deviceSerial,
        };
      });
      setData(newData);
      setFilteredData(newData);
      setFormData({
        deviceSerial: "",
        imei: "",
        iccid: "",
        status: "",
      });
    });
  }, []);

  return (
    <div>
      {isLoading && (
        <img
          className="loader-container"
          src="./img/purple-spinner.gif"
          alt="Loading..."
        />
      )}
      {!isLoading && (
        <div className=" bg-gray-100 flex flex-col items-center justify-center ">
          <div className="bg-white rounded-lg shadow-lg p-8 m-4 w-full max-w-[calc(100vw-32px)] h-[calc(100vh-100px)] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Device Table</h2>
            <Collapse
              className="bg-indigo-50 mb-3 sm:min-h-[30px] overflow-auto"
              size="small"
              activeKey={expandPanel}
              onChange={() => {
                if (expandPanel.length == 1) {
                  setExpandPanel([]);
                } else {
                  setExpandPanel([1]);
                }
              }}
              collapsible="icon"
              items={[
                {
                  key: "1",
                  label: "Device Details",
                  children: (
                    <>
                      <Form
                        row
                        size="medium"
                        ref={formRef}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={formData}
                        className="text-xs md:text-sm"
                      >
                        <Row gutter={[16, 4]}>
                          {[
                            { label: "Serial", name: "deviceSerial" },
                            { label: "IMEI", name: "imei" },
                            { label: "ICCID", name: "iccid" },
                            { label: "Status", name: "status" },
                            { label: "Email", name: "email" },
                            // { label: "Full Name", name: "fullName" },
                            { label: "Car Name", name: "carName" },
                            { label: "VIN", name: "vin" },
                          ].map((field) => (
                            <Col key={field.name} xs={24} sm={12} md={8} lg={6}>
                              <Form.Item label={field.label} name={field.name}>
                                <Input
                                  placeholder={`Enter ${field.label}`}
                                  style={{ marginBottom: 2 }}
                                  readOnly
                                />
                              </Form.Item>
                            </Col>
                          ))}
                        </Row>
                      </Form>

                      {/* Add the Assign Devices button */}
                      <Button
                        type="primary"
                        onClick={showModal}
                        className="mr-3 bg-indigo-600 hover:bg-indigo-700"
                      >
                        Assign Devices to Email
                      </Button>
                      <label htmlFor="uploadFile">Upload Excel File</label>
                      <input
                        className="ml-3"
                        id="uploadFile"
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        title="Upload Excel File"
                      />
                    </>
                  ),
                },
              ]}
            />
            {/* Duplicate Devices */}
            {duplicateData.length > 0 && (
              <Collapse
                className="ant-collapse ant-collapse-icon-position-start ant-collapse-small bg-indigo-50 mb-3 min-h-[40px] overflow-hidden"
                size="small"
                collapsible="icon"
                items={[
                  {
                    key: "1",
                    label: `Duplicate Devices (${duplicateData.length})`,
                    children: (
                      <>
                        <Table
                          size="small"
                          dataSource={duplicateData}
                          columns={columns}
                          pagination={false}
                          scroll={{ y: 180 }}
                        />
                      </>
                    ),
                  },
                ]}
              ></Collapse>
            )}

            {/* Table Container - Ensure it grows and doesn't overflow */}
            <div className="flex-grow min-h-0 overflow-auto">
              <hr className="border-indigo-200" />
              <Search
                className="mt-3"
                placeholder="input search text"
                onSearch={(value) => onFilterData(value)}
              />
              <Table
                size="small"
                dataSource={filteredData}
                columns={columns}
                pagination={false}
                scroll={{ y: 350 }}
              />

              {/* <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Serial #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      IMEI
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ICCID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.deviceSerial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.imei}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.iccid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table> */}
            </div>

            {/* Modal for device assignment */}
            <Modal
              title="Assign Devices to Email"
              open={isModalVisible}
              onCancel={handleCancel}
              footer={[
                <Button key="cancel" onClick={handleCancel}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleAssignDevices}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Assign
                </Button>,
              ]}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Devices
                </label>
                <Select
                  mode="multiple"
                  placeholder="Select devices to assign"
                  value={selectedDevices}
                  onChange={setSelectedDevices}
                  style={{ width: "100%" }}
                  optionFilterProp="children"
                >
                  {data.map((device) => (
                    <Option
                      key={device.deviceSerial}
                      value={device.deviceSerial}
                    >
                      {device.deviceSerial}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  placeholder="Enter email address"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                />
              </div>
            </Modal>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
