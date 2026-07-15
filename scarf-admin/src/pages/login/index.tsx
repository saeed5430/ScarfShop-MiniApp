import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { mutate: login, isLoading } = useLogin();
  const [form] = Form.useForm();

  const onFinish = (values: { email: string; password: string }) => {
    login(values, {
      onSuccess: () => {
        message.success("ورود موفقیت‌آمیز بود");
      },
      onError: (error) => {
        message.error(error?.message || "خطا در ورود");
      },
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        direction: "rtl",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <LockOutlined style={{ fontSize: 28, color: "white" }} />
          </div>
          <Title level={3} style={{ margin: 0 }}>
            ورود به پنل ادمین
          </Title>
          <Text type="secondary">فقط ادمین‌ها اجازه دسترسی دارند</Text>
        </div>

        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "ایمیل را وارد کنید" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="ایمیل"
              size="large"
              dir="ltr"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "رمز عبور را وارد کنید" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="رمز عبور"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
              style={{ height: 48 }}
            >
              ورود
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            برای تست: admin@armana.ir / adminadmin
          </Text>
        </div>
      </Card>
    </div>
  );
};
