import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const AdminCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
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
        <Form.Item label="رمز عبور" name="password_hash" rules={[{ required: true, message: "رمز عبور را وارد کنید" }]}>
          <Input.Password placeholder="رمز عبور" />
        </Form.Item>
      </Form>
    </Create>
  );
};
