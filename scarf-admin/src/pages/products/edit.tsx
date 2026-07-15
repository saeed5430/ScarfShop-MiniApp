import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Switch, Card, Button, Space, Modal, ColorPicker, message, Tag, Upload as AntUpload } from "antd";
import { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";

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

export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const { selectProps: categorySelectProps } = useSelect({ resource: "categories", optionLabel: "name", optionValue: "id" });
  const { selectProps: colorSelectProps, query: colorQuery } = useSelect({ resource: "colors", optionLabel: "name", optionValue: "id" });
  const { selectProps: sizeSelectProps, query: sizeQuery } = useSelect({ resource: "sizes", optionLabel: "dimensions", optionValue: "id" });

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", name_en: "", hex: "#000000" });
  const [newSize, setNewSize] = useState({ dimensions: "" });
  const [creatingColor, setCreatingColor] = useState(false);
  const [creatingSize, setCreatingSize] = useState(false);
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  const productData = queryResult?.data?.data;

  useEffect(() => {
    if (productData) {
      formProps.form?.setFieldsValue({
        name: productData.name,
        slug: productData.slug,
        category_id: productData.category_id,
        description: productData.description,
        short_description: productData.short_description,
        material: productData.material,
        is_stock: productData.is_stock,
        sku: productData.sku,
        is_active: productData.is_active,
        color_ids: productData.color_ids || [],
        size_ids: productData.size_ids || [],
      });
      const existingImages = (productData.images || []).map((url: string, i: number) => ({
        uid: `-${i}`,
        name: `image-${i}`,
        status: "done" as const,
        url,
      }));
      setImageList(existingImages);
    }
  }, [productData, formProps.form]);

  const handleImageChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setImageList(fileList);
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("فقط فایل‌های تصویری مجاز هستند");
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageList((prev) => [...prev, { uid: `-${Date.now()}`, name: file.name, status: "done", url }]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = persianToSlug(name);
    formProps.form?.setFieldsValue({ slug });
  };

  const handleCreateColor = async () => {
    if (!newColor.name || !newColor.hex) {
      message.error("نام و کد رنگ را وارد کنید");
      return;
    }
    setCreatingColor(true);
    try {
      const response = await fetch("http://localhost:8787/api/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newColor),
      });
      if (response.ok) {
        message.success("رنگ با موفقیت ایجاد شد");
        setColorModalOpen(false);
        setNewColor({ name: "", name_en: "", hex: "#000000" });
        colorQuery.refetch();
      } else {
        message.error("خطا در ایجاد رنگ");
      }
    } catch {
      message.error("خطا در ایجاد رنگ");
    } finally {
      setCreatingColor(false);
    }
  };

  const handleCreateSize = async () => {
    if (!newSize.dimensions) {
      message.error("ابعاد را وارد کنید");
      return;
    }
    setCreatingSize(true);
    try {
      const response = await fetch("http://localhost:8787/api/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSize),
      });
      if (response.ok) {
        message.success("سایز با موفقیت ایجاد شد");
        setSizeModalOpen(false);
        setNewSize({ dimensions: "" });
        sizeQuery.refetch();
      } else {
        message.error("خطا در ایجاد سایز");
      }
    } catch {
      message.error("خطا در ایجاد سایز");
    } finally {
      setCreatingSize(false);
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        onFinish={async (values) => {
          const imageUrls = imageList.filter(f => f.url).map(f => f.url!);
          await formProps.onFinish?.({
            ...values,
            images: imageUrls,
          });
        }}
        layout="vertical"
      >
        <Card title="اطلاعات پایه" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="نام محصول" name="name" rules={[{ required: true, message: "نام محصول را وارد کنید" }]}>
            <Input placeholder="مثلاً: روسری درختی" onChange={handleNameChange} />
          </Form.Item>

          <Form.Item label="اسلاگ" name="slug" extra="اسلاگ به صورت خودکار از نام تولید می‌شود">
            <Input placeholder="rosari-darakhti" style={{ fontFamily: "monospace" }} />
          </Form.Item>

          <Form.Item label="دسته‌بندی" name="category_id" rules={[{ required: true, message: "دسته‌بندی را انتخاب کنید" }]}>
            <Select {...categorySelectProps} placeholder="انتخاب دسته‌بندی" />
          </Form.Item>

          <Form.Item label="جنس" name="material">
            <Input placeholder="مثلاً: کریشه، پشم، نخ" />
          </Form.Item>
        </Card>

        <Card title="توضیحات" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="توضیحات کامل" name="description">
            <Input.TextArea rows={4} placeholder="توضیحات کامل محصول" />
          </Form.Item>

          <Form.Item label="توضیح کوتاه" name="short_description">
            <Input.TextArea rows={2} placeholder="توضیح کوتاه برای نمایش در لیست" />
          </Form.Item>
        </Card>

        <Card title="موجودی و SKU" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="موجود" name="is_stock" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="کد کالا (SKU)" name="sku">
            <Input placeholder="کد یکتا محصول" style={{ fontFamily: "monospace" }} />
          </Form.Item>
        </Card>

        <Card
          title="رنگ‌ها"
          size="small"
          style={{ marginBottom: 16 }}
          extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setColorModalOpen(true)}>رنگ جدید</Button>}
        >
          <Form.Item name="color_ids" label="انتخاب رنگ‌ها">
            <Select
              {...colorSelectProps}
              mode="multiple"
              placeholder="انتخاب رنگ‌ها"
              optionFilterProp="label"
              tagRender={(props) => {
                const { label, value, closable, onClose } = props;
                const color = colorSelectProps.options?.find((c: any) => c.value === value);
                return (
                  <Tag closable={closable} onClose={onClose} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {color && (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: (color as any).color, border: "1px solid #E5E7EB" }} />
                    )}
                    {label}
                  </Tag>
                );
              }}
            />
          </Form.Item>
        </Card>

        <Card
          title="سایزها"
          size="small"
          style={{ marginBottom: 16 }}
          extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setSizeModalOpen(true)}>سایز جدید</Button>}
        >
          <Form.Item name="size_ids" label="انتخاب سایزها">
            <Select {...sizeSelectProps} mode="multiple" placeholder="انتخاب سایزها" optionFilterProp="label" />
          </Form.Item>
        </Card>

        <Card title="تصاویر" size="small" style={{ marginBottom: 16 }}>
          <AntUpload
            listType="picture-card"
            fileList={imageList}
            onChange={handleImageChange}
            beforeUpload={beforeUpload}
            multiple
          >
            {imageList.length >= 8 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>افزودن تصویر</div>
              </div>
            )}
          </AntUpload>
          <div style={{ color: "#999", fontSize: 12 }}>حداکثر ۸ تصویر - فرمت‌های JPG, PNG, WebP</div>
        </Card>

        <Card title="وضعیت" size="small">
          <Form.Item label="فعال" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>
      </Form>

      <Modal title="افزودن رنگ جدید" open={colorModalOpen} onCancel={() => setColorModalOpen(false)} onOk={handleCreateColor} confirmLoading={creatingColor}>
        <Form layout="vertical">
          <Form.Item label="نام فارسی" required>
            <Input value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} placeholder="مثلاً: مشکی" />
          </Form.Item>
          <Form.Item label="نام انگلیسی" required>
            <Input value={newColor.name_en} onChange={(e) => setNewColor({ ...newColor, name_en: e.target.value })} placeholder="مثلاً: Black" />
          </Form.Item>
          <Form.Item label="کد رنگ" required>
            <Space>
              <ColorPicker value={newColor.hex} onChange={(color: any) => setNewColor({ ...newColor, hex: color.toHexString() })} />
              <Input value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} placeholder="#000000" style={{ fontFamily: "monospace", width: 120 }} />
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="افزودن سایز جدید" open={sizeModalOpen} onCancel={() => setSizeModalOpen(false)} onOk={handleCreateSize} confirmLoading={creatingSize}>
        <Form layout="vertical">
          <Form.Item label="ابعاد (سانتی‌متر)" required extra="اگر عدد 70 را وارد کنید، یعنی ابعاد 70*70">
            <Input value={newSize.dimensions} onChange={(e) => setNewSize({ ...newSize, dimensions: e.target.value })} placeholder="مثلاً: 70" addonAfter="سانتی‌متر" />
          </Form.Item>
        </Form>
      </Modal>
    </Edit>
  );
};
