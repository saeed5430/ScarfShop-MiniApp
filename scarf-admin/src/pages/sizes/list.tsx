import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";
import { message, Tag, Typography } from "antd";

const { Text } = Typography;

export const SizeList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();

  const handleDelete = (record: any) => {
    if (record.product_count > 0) {
      message.warning("این سایز در محصولات استفاده شده و قابل حذف نیست");
      return;
    }
    remove(
      { resource: "sizes", id: record.id },
      {
        onSuccess: () => message.success("سایز با موفقیت حذف شد"),
        onError: () => message.error("خطا در حذف سایز"),
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
      key: "dimensions",
      title: "ابعاد",
      dataIndex: "dimensions",
      render: (dimensions: string) => (
        <Text strong>{dimensions} سانتی‌متر</Text>
      ),
    },
    {
      key: "product_count",
      title: "تعداد محصولات",
      dataIndex: "product_count",
      width: 120,
      render: (count: number) => (
        <Tag color={count > 0 ? "blue" : "default"}>
          {count} محصول
        </Tag>
      ),
    },
    {
      key: "created_at",
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      render: (v: string) => <PersianDate value={v} />,
    },
  ];

  const mobileCardTitle = (record: any) => `${record.dimensions} سانتی‌متر`;
  const mobileCardSubtitle = (record: any) => `محصول: ${record.product_count}`;

  return (
    <List headerProps={{ title: "سایزها", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        columns={columns}
        actions={{
          onEdit: (record) => navigate(`/sizes/edit/${record.id}`),
          onDelete: (record) => handleDelete(record),
        }}
      />
    </List>
  );
};
