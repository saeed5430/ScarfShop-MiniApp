import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { message } from "antd";
import { PersianDate } from "../../components/PersianDate";

export const AdminList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();

  const handleDelete = (record: any) => {
    remove(
      { resource: "admins", id: record.id },
      {
        onSuccess: () => message.success("ادمین با موفقیت حذف شد"),
        onError: () => message.error("خطا در حذف ادمین"),
      }
    );
  };

  return (
    <List headerProps={{ title: "ادمین‌ها", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={(record) => `${record.first_name || ""} ${record.last_name || ""}`}
        mobileCardSubtitle={(record) => record.email || record.username}
        columns={[
          { key: "id", title: "ID", dataIndex: "id", width: 80 },
          {
            key: "name",
            title: "نام",
            render: (_: unknown, record: any) => `${record.first_name || ""} ${record.last_name || ""}`,
          },
          { key: "username", title: "یوزرنیم", dataIndex: "username" },
          { key: "email", title: "ایمیل", dataIndex: "email" },
          { key: "created_at", title: "تاریخ ایجاد", dataIndex: "created_at", render: (v: string) => <PersianDate value={v} /> },
        ]}
        actions={{
          onEdit: (record) => navigate(`/admins/edit/${record.id}`),
          onDelete: (record) => handleDelete(record),
        }}
      />
    </List>
  );
};
