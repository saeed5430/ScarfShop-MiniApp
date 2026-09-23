import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Switch } from "antd";
import { useEffect } from "react";

export const VariantEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const { selectProps: productSelectProps } = useSelect({ resource: "products", optionLabel: "name", optionValue: "id" });
  const { selectProps: designSelectProps } = useSelect({ resource: "designs", optionLabel: "name", optionValue: "id" });
  const { selectProps: colorSelectProps } = useSelect({ resource: "colors", optionLabel: "name", optionValue: "id" });
  const { selectProps: sizeSelectProps } = useSelect({ resource: "sizes", optionLabel: "dimensions", optionValue: "id" });

  const variantData = queryResult?.data?.data;

  useEffect(() => {
    if (variantData) {
      formProps.form?.setFieldsValue({
        product_id: variantData.product_id,
        design_id: variantData.design_id,
        slug: variantData.slug,
        is_stock: Boolean(variantData.is_stock),
        color_ids: variantData.color_ids || [],
        size_ids: variantData.size_ids || [],
      });
    }
  }, [variantData, formProps.form]);

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
        <Form.Item label="موجودی" name="is_stock" valuePropName="checked">
          <Switch checkedChildren="موجود" unCheckedChildren="ناموجود" />
        </Form.Item>
        <Form.Item label="رنگ‌ها" name="color_ids">
          <Select {...colorSelectProps} mode="multiple" placeholder="انتخاب رنگ‌ها" />
        </Form.Item>
        <Form.Item label="سایزها" name="size_ids">
          <Select {...sizeSelectProps} mode="multiple" placeholder="انتخاب سایزها" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
