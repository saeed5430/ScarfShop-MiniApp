import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, ColorPicker, Card, Space, Typography } from "antd";
import { useState, useEffect } from "react";

const { Text } = Typography;

export const ColorEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [previewColor, setPreviewColor] = useState("#000000");

  const colorData = queryResult?.data?.data;

  useEffect(() => {
    if (colorData?.hex) {
      setPreviewColor(colorData.hex);
    }
  }, [colorData]);

  const handleColorChange = (color: any) => {
    const hex = typeof color === "string" ? color : color.toHexString();
    setPreviewColor(hex);
    formProps.form?.setFieldsValue({ hex });
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onValuesChange={(changed) => {
        if (changed.hex) setPreviewColor(changed.hex);
      }}>
        <Form.Item
          label="نام فارسی"
          name="name"
          rules={[{ required: true, message: "نام فارسی را وارد کنید" }]}
        >
          <Input placeholder="مثلاً: مشکی" />
        </Form.Item>

        <Form.Item
          label="نام انگلیسی"
          name="name_en"
          rules={[{ required: true, message: "نام انگلیسی را وارد کنید" }]}
        >
          <Input placeholder="مثلاً: Black" />
        </Form.Item>

        <Form.Item
          label="کد رنگ"
          name="hex"
          rules={[
            { required: true, message: "کد رنگ را وارد کنید" },
            {
              pattern: /^#([0-9A-Fa-f]{3}){1,2}$/,
              message: "فرمت هگز معتبر نیست (مثال: #000000)",
            },
          ]}
        >
          <Input placeholder="#000000" style={{ fontFamily: "monospace" }} />
        </Form.Item>

        <Form.Item label="انتخاب رنگ">
          <ColorPicker
            value={previewColor}
            onChange={handleColorChange}
            showText
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Card
          size="small"
          style={{
            background: previewColor,
            borderRadius: 12,
            border: "2px solid #E5E7EB",
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
        >
          <Space direction="vertical" align="center">
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: previewColor,
                border: "3px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            />
            <Text
              style={{
                color: isLightColor(previewColor) ? "#1F2937" : "#FFFFFF",
                fontWeight: 600,
                fontFamily: "monospace",
              }}
            >
              {previewColor}
            </Text>
          </Space>
        </Card>
      </Form>
    </Edit>
  );
};

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
