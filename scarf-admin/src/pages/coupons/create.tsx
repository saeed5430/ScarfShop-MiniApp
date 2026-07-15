import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select, Switch } from "antd";

export const CouponCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="کد تخفیف" name="code" rules={[{ required: true }]}>
          <Input placeholder="مثال: TABAISTAN10" />
        </Form.Item>
        <Form.Item label="مقدار تخفیف" name="discount" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item label="نوع" name="type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "percentage", label: "درصدی" },
              { value: "fixed", label: "ثابت (تومان)" },
            ]}
          />
        </Form.Item>
        <Form.Item label="فعال" name="is_active" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
      </Form>
    </Create>
  );
};
