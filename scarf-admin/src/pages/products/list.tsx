import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { message, Tag, Typography, Image } from "antd";

const { Text } = Typography;

export const ProductList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();

  const handleDelete = (record: any) => {
    remove(
      { resource: "products", id: record.id },
      {
        onSuccess: () => message.success("محصول با موفقیت حذف شد"),
        onError: () => message.error("خطا در حذف محصول"),
      }
    );
  };

  const columns = [
    {
      key: "index",
      title: "ردیف",
      dataIndex: "index",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      key: "image",
      title: "تصویر",
      dataIndex: "images",
      width: 60,
      render: (images: string[]) => {
        if (!images || images.length === 0) {
          return (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              📷
            </div>
          );
        }
        return (
          <Image src={images[0]} width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} preview={false} />
        );
      },
    },
    {
      key: "name",
      title: "نام محصول",
      dataIndex: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      key: "category_name",
      title: "دسته‌بندی",
      dataIndex: "category_name",
      render: (name: string) => <Tag>{name || "-"}</Tag>,
    },
    {
      key: "is_stock",
      title: "موجودی",
      dataIndex: "is_stock",
      width: 100,
      render: (is_stock: boolean) => (
        <Tag color={is_stock ? "green" : "red"}>
          {is_stock ? "موجود" : "ناموجود"}
        </Tag>
      ),
    },
    {
      key: "colors",
      title: "رنگ‌ها",
      dataIndex: "color_count",
      width: 80,
      render: (count: number) => (
        <Tag color={count > 0 ? "blue" : "default"}>{count}</Tag>
      ),
    },
    {
      key: "sizes",
      title: "سایزها",
      dataIndex: "size_count",
      width: 80,
      render: (count: number) => (
        <Tag color={count > 0 ? "purple" : "default"}>{count}</Tag>
      ),
    },
    {
      key: "is_active",
      title: "وضعیت",
      dataIndex: "is_active",
      width: 100,
      render: (is_active: boolean) => (
        <Tag color={is_active ? "green" : "red"}>
          {is_active ? "فعال" : "غیرفعال"}
        </Tag>
      ),
    },
  ];

  const mobileCardTitle = (record: any) => record.name;
  const mobileCardSubtitle = (record: any) => record.category_name || "-";

  return (
    <List headerProps={{ title: "محصولات", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        columns={columns}
        actions={{
          onEdit: (record) => navigate(`/products/edit/${record.id}`),
          onDelete: (record) => handleDelete(record),
        }}
      />
    </List>
  );
};
