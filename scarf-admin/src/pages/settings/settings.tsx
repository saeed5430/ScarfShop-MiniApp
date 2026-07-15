import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Spin } from "antd";
import { SaveOutlined } from "@ant-design/icons";

const API_URL = "http://localhost:8787";

export const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();

      const formValues: Record<string, string> = {};
      for (const setting of data.settings || []) {
        formValues[setting.key] = setting.value || "";
      }
      form.setFieldsValue(formValues);
    } catch {
      message.error("خطا در دریافت تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const items = Object.entries(values).map(([key, value]) => ({
        key,
        value: String(value || ""),
      }));

      const response = await fetch(`${API_URL}/api/settings/bulk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        message.success("تنظیمات با موفقیت ذخیره شد");
      } else {
        message.error("خطا در ذخیره تنظیمات");
      }
    } catch {
      message.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>تنظیمات</h2>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          ذخیره تنظیمات
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Card title="اطلاعات فروشگاه" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="نام فروشگاه" name="shop_name">
            <Input placeholder="نام فروشگاه" />
          </Form.Item>
          <Form.Item label="لوگوی فروشگاه" name="logo_url" extra="آدرس تصویر لوگو">
            <Input placeholder="https://example.com/logo.png" />
          </Form.Item>
          <Form.Item label="متن خوش‌آمدگویی" name="welcome_text">
            <Input.TextArea rows={2} placeholder="متن خوش‌آمدگویی" />
          </Form.Item>
        </Card>

        <Card title="اطلاعات تماس" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="تلفن" name="phone">
            <Input placeholder="09121234567" />
          </Form.Item>
          <Form.Item label="ایمیل" name="email">
            <Input placeholder="info@shop.com" />
          </Form.Item>
          <Form.Item label="آدرس" name="address">
            <Input.TextArea rows={2} placeholder="آدرس فروشگاه" />
          </Form.Item>
          <Form.Item label="کد پستی" name="postal_code">
            <Input placeholder="1234567890" />
          </Form.Item>
        </Card>

        <Card title="شبکه‌های اجتماعی" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="آیدی تلگرام" name="telegram_link" extra="آیدی کانال یا گروه تلگرام">
            <Input placeholder="@channel_name" />
          </Form.Item>
          <Form.Item label="آیدی روبیکا" name="rubika_link" extra="آیدی روبیکا">
            <Input placeholder="@rubika_id" />
          </Form.Item>
          <Form.Item label="آیدی بله" name="bale_link" extra="آیدی پیام‌رسان بله">
            <Input placeholder="@bale_id" />
          </Form.Item>
          <Form.Item label="آیدی ایتا" name="eitaa_link" extra="آیدی پیام‌رسان ایتا">
            <Input placeholder="@eitaa_id" />
          </Form.Item>
        </Card>

        <Card title="درباره ما" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="متن درباره ما" name="about_us">
            <Input.TextArea rows={4} placeholder="درباره فروشگاه..." />
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};
