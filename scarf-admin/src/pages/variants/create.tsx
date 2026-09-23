import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Switch } from "antd";

export const VariantCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();
  const { selectProps: productSelectProps } = useSelect({ resource: "products", optionLabel: "name", optionValue: "id" });
  const { selectProps: designSelectProps } = useSelect({ resource: "designs", optionLabel: "name", optionValue: "id" });
  const { selectProps: colorSelectProps } = useSelect({ resource: "colors", optionLabel: "name", optionValue: "id" });
  const { selectProps: sizeSelectProps } = useSelect({ resource: "sizes", optionLabel: "dimensions", optionValue: "id" });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="محصول" name="product_id" rules={[{ required: true, message: "محصول را انتخاب کنید" }]}>
          <Select {...productSelectProps} placeholder="انتخاب محصول" />
        </Form.Item>
        <Form.Item label="طرح" name="design_id">
          <Select {...designSelectProps} placeholder="انتخاب طرح (اختیاری)" allowClear />
        </Form.Item>
        <Form.Item label="اسلاگ" name="slug">
          <Input placeholder="اختیاری" style={{ fontFamily: "monospace" }} dir="ltr" />
        </Form.Item>
        <Form.Item label="موجودی" name="is_stock" valuePropName="checked" initialValue={true}>
          <Switch checkedChildren="موجود" unCheckedChildren="ناموجود" />
        </Form.Item>
        <Form.Item label="رنگ‌ها" name="color_ids">
          <Select {...colorSelectProps} mode="multiple" placeholder="انتخاب رنگ‌ها" />
        </Form.Item>
        <Form.Item label="سایزها" name="size_ids">
          <Select {...sizeSelectProps} mode="multiple" placeholder="انتخاب سایزها" />
        </Form.Item>
      </Form>
    </Create>
  );
};
