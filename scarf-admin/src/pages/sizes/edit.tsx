import { Edit, useForm } from "@refinedev/antd";
import { Form, InputNumber, Card, Typography } from "antd";
import { useState, useEffect } from "react";

const { Text } = Typography;

export const SizeEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [preview, setPreview] = useState<string>("");

  const sizeData = queryResult?.data?.data;

  useEffect(() => {
    if (sizeData?.dimensions) {
      const num = parseInt(sizeData.dimensions);
      if (!isNaN(num)) {
        setPreview(`${num}*${num} سانتی‌متر`);
      }
    }
  }, [sizeData]);

  const handleDimensionChange = (value: number | null) => {
    if (value) {
      setPreview(`${value}*${value} سانتی‌متر`);
      formProps.form?.setFieldsValue({ dimensions: String(value) });
    } else {
      setPreview("");
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="ابعاد"
          name="dimensions"
          rules={[{ required: true, message: "ابعاد را وارد کنید" }]}
          extra="اگر عدد 70 را وارد کنید، یعنی ابعاد 70*70 سانتی‌متر"
        >
          <InputNumber
            min={10}
            max={300}
            placeholder="مثلاً: 70"
            style={{ width: "100%" }}
            addonAfter="سانتی‌متر"
            onChange={handleDimensionChange}
          />
        </Form.Item>

        {preview && (
          <Card
            size="small"
            style={{
              background: "#F3F4F6",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
            }}
            styles={{ body: { padding: 16, textAlign: "center" } }}
          >
            <Text strong style={{ fontSize: 18 }}>
              {preview}
            </Text>
          </Card>
        )}
      </Form>
    </Edit>
  );
};
