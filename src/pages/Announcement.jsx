import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Row,
  Col,
  Switch,
  Skeleton,
} from "antd";
import { Megaphone, Save } from "lucide-react";
import { getAnnouncement, updateAnnouncement } from "../api/Announcement";

const { TextArea } = Input;

const Announcement = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoadingAnnouncement(true);
        const data = await getAnnouncement();
        if (data) {
          form.setFieldsValue({
            content: data.content || "",
            isActive: data.isActive || false,
          });
          setIsActive(data.isActive || false);
        }
      } catch (error) {
        console.error("Failed to fetch announcement:", error);
        message.error("Failed to load announcement");
      } finally {
        setLoadingAnnouncement(false);
      }
    };

    fetchAnnouncement();
  }, [form]);

  const handleUpdate = async (values) => {
    try {
      setIsLoading(true);
      await updateAnnouncement({
        content: values.content,
        isActive: values.isActive,
      });
      message.success("Announcement updated successfully!");
    } catch (error) {
      message.error("Failed to update announcement. Please try again.");
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 m-6 w-full max-w-4xl h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center mb-6">
          <Megaphone className="w-8 h-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Announcement Management
          </h2>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-2 text-indigo-600" />
                  Update Announcement
                </div>
              }
              className="shadow-sm"
            >
              {loadingAnnouncement ? (
                <Skeleton active />
              ) : (
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                  <Form.Item
                    label="Announcement Content"
                    name="content"
                    rules={[
                      {
                        required: true,
                        message: "Please enter announcement content",
                      },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Enter your announcement..."
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Active Status"
                    name="isActive"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                      checked={isActive}
                      onChange={(checked) => setIsActive(checked)}
                      style={{
                        backgroundColor: isActive ? "#4f46e5" : "#d1d5db",
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      className="w-full"
                      style={{
                        backgroundColor: "#4f46e5",
                        borderColor: "#4f46e5",
                      }}
                      size="large"
                    >
                      {isLoading ? "Updating..." : "Update Announcement"}
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Announcement;
