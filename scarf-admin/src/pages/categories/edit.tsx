import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Card, Typography, Alert } from "antd";
import { useState, useEffect } from "react";

const { Text } = Typography;

// Simple Persian to English slug converter
const persianToSlug = (text: string): string => {
  const persianMap: Record<string, string> = {
    "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j",
    "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r",
    "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s", "ض": "z",
    "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "gh",
    "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "و": "v",
    "ه": "h", "ی": "y", "آ": "a", "أ": "a", "إ": "e", "ؤ": "o",
    "ئ": "y", "ء": "'", "۰": "0", "۱": "1", "۲": "2", "۳": "3",
    "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    " ": "-", "/": "-", "\\": "-", ".": "-",
  };

  return text
    .split("")
    .map((char) => persianMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const CategoryEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [previewSlug, setPreviewSlug] = useState<string>("");

  const categoryData = queryResult?.data?.data;

  useEffect(() => {
    if (categoryData?.slug) {
      setPreviewSlug(categoryData.slug);
    }
  }, [categoryData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = persianToSlug(name);
    setPreviewSlug(slug);
    formProps.form?.setFieldsValue({ slug });
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="نام"
          name="name"
          rules={[{ required: true, message: "نام دسته‌بندی را وارد کنید" }]}
        >
          <Input placeholder="مثلاً: روسری" onChange={handleNameChange} />
        </Form.Item>

        <Form.Item
          label="اسلاگ"
          name="slug"
          extra="اسلاگ به صورت خودکار از نام تولید می‌شود"
        >
          <Input placeholder="rosari" style={{ fontFamily: "monospace" }} />
        </Form.Item>

        {previewSlug && (
          <Card
            size="small"
            style={{
              background: "#F9FAFB",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              marginBottom: 16,
            }}
            styles={{ body: { padding: 12 } }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              اسلاگ تولید شده:
            </Text>
            <br />
            <Text code style={{ fontSize: 14 }}>
              {previewSlug}
            </Text>
          </Card>
        )}

        <Form.Item label="توضیحات" name="description">
          <Input.TextArea rows={3} placeholder="توضیحات دسته‌بندی (اختیاری)" />
        </Form.Item>

        {categoryData?.product_count && categoryData.product_count > 0 && (
          <Alert
            message={`این دسته‌بندی دارای ${categoryData.product_count} محصول است`}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Edit>
  );
};
