import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const AdminEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="نام" name="first_name" rules={[{ required: true, message: "نام را وارد کنید" }]}>
          <Input placeholder="نام ادمین" />
        </Form.Item>
        <Form.Item label="نام خانوادگی" name="last_name">
          <Input placeholder="نام خانوادگی" />
        </Form.Item>
        <Form.Item label="یوزرنیم" name="username" rules={[{ required: true, message: "یوزرنیم را وارد کنید" }]}>
          <Input placeholder="یوزرنیم" />
        </Form.Item>
        <Form.Item label="ایمیل" name="email" rules={[{ required: true, type: "email", message: "ایمیل معتبر وارد کنید" }]}>
          <Input placeholder="admin@example.com" />
        </Form.Item>
        <Form.Item label="رمز عبور جدید" name="password_hash" extra="اگر نمیخواید رمز تغییر کند، خالی بگذارید">
          <Input.Password placeholder="رمز عبور جدید" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
