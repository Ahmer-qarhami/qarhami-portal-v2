import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Row,
  Col,
  Select,
  Skeleton,
} from "antd";
import { Send, Users, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import {
  broadcastSmsViaTwilio,
  getTwilioUsers,
  sendBulkSmsToSpecificRecipients,
} from "../api/Devices";

const { TextArea } = Input;

const MessageBroadcasting = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        debugger;
        setLoadingUsers(true);
        let userData = (await getTwilioUsers()) || [];

        if (userData && userData.data) {
          userData = userData.data;
        }
        // Ensure userData is an array, handle different response formats
        const usersArray = Array.isArray(userData)
          ? userData
          : userData?.users || [];
        setUsers(usersArray);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        message.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleBroadcast = async (values) => {
    try {
      setIsLoading(true);

      if (values.recipients && values.recipients.length > 0) {
        // Send to specific recipients
        await sendBulkSmsToSpecificRecipients(
          values.recipients,
          values.content
        );
        message.success(
          `SMS sent successfully to ${values.recipients.length} recipients!`
        );
      } else {
        // Broadcast to all
        await broadcastSmsViaTwilio(values.content);
        message.success("SMS broadcast completed successfully!");
      }

      form.resetFields();
    } catch (error) {
      message.error("Failed to send SMS. Please try again.");
      console.error("Broadcast error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 m-6 w-full max-w-6xl h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center mb-6">
          <MessageSquare className="w-8 h-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Message Broadcasting
          </h2>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center">
                  <Send className="w-5 h-5 mr-2 text-indigo-600" />
                  Compose Message
                </div>
              }
              className="shadow-sm"
            >
              {loadingUsers ? (
                <Skeleton active />
              ) : (
                <Form form={form} layout="vertical" onFinish={handleBroadcast}>
                  <Form.Item
                    label={
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-indigo-600" />
                        Select Recipients (Optional - leave empty for broadcast
                        to all)
                      </div>
                    }
                    name="recipients"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select specific users to send SMS to"
                      loading={loadingUsers}
                      allowClear
                      style={{ width: "100%" }}
                      optionFilterProp="children"
                    >
                      {Array.isArray(users) &&
                        users.map((user) => (
                          <Select.Option
                            key={user.userId || user.phoneNumber}
                            value={user.phoneNumber}
                          >
                            {user.name} ({user.phoneNumber})
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Message Content"
                    name="content"
                    rules={[
                      {
                        required: true,
                        message: "Please enter message content",
                      },
                    ]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Enter your broadcast message..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 w-full"
                      size="large"
                    >
                      {isLoading ? "Broadcasting..." : "Send Broadcast"}
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

export default MessageBroadcasting;
