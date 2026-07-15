import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const DesignEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="نام طرح"
          name="name"
          rules={[{ required: true, message: "نام طرح را وارد کنید" }]}
        >
          <Input placeholder="مثلاً: طرح گل‌دار" />
        </Form.Item>

        <Form.Item
          label="نام انگلیسی طرح"
          name="name_en"
          rules={[{ required: true, message: "نام انگلیسی طرح را وارد کنید" }]}
        >
          <Input placeholder="مثلاً: Floral Pattern" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
