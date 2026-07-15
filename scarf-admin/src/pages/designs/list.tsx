import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";
import { message, Typography } from "antd";

const { Text } = Typography;

export const DesignList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();

  const handleDelete = (record: any) => {
    remove(
      { resource: "designs", id: record.id },
      {
        onSuccess: () => message.success("طرح با موفقیت حذف شد"),
        onError: () => message.error("خطا در حذف طرح"),
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
      key: "name",
      title: "نام طرح",
      dataIndex: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      key: "name_en",
      title: "نام انگلیسی",
      dataIndex: "name_en",
      render: (name_en: string) => <Text type="secondary">{name_en || "-"}</Text>,
    },
    {
      key: "created_at",
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      render: (v: string) => <PersianDate value={v} />,
    },
  ];

  const mobileCardTitle = (record: any) => record.name;
  const mobileCardSubtitle = (record: any) => `انگلیسی: ${record.name_en || "-"}`;

  return (
    <List headerProps={{ title: "طرح‌ها", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        columns={columns}
        actions={{
          onEdit: (record) => navigate(`/designs/edit/${record.id}`),
          onDelete: (record) => handleDelete(record),
        }}
      />
    </List>
  );
};
