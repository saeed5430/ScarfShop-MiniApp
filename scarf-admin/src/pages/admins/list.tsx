import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal";
import { message } from "antd";
import { PersianDate } from "../../components/PersianDate";

export const AdminList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    remove(
      { resource: "admins", id: deleteTarget.id },
      {
        onSuccess: () => {
          message.success("ادمین با موفقیت حذف شد");
          setDeleteTarget(null);
          setDeleting(false);
        },
        onError: () => {
          message.error("خطا در حذف ادمین");
          setDeleting(false);
        },
      }
    );
  };

  return (
    <div>
      <List headerProps={{ title: "ادمین‌ها", extra: <CreateButton /> }}>
        <ResponsiveTable
          dataSource={tableProps.dataSource || []}
          loading={!!tableProps.loading}
          rowKey="id"
          mobileCardTitle={(record) => `${record.first_name || ""} ${record.last_name || ""}`}
          mobileCardSubtitle={(record) => record.email || record.username}
          columns={[
            {
              key: "name",
              title: "نام",
              render: (_: unknown, record: any) => `${record.first_name || ""} ${record.last_name || ""}`,
            },
            { key: "username", title: "یوزرنیم", dataIndex: "username" },
            { key: "email", title: "ایمیل", dataIndex: "email" },
            { key: "created_at", title: "تاریخ ایجاد", dataIndex: "created_at", render: (v: number) => <PersianDate value={v} /> },
          ]}
          actions={{
            onEdit: (record) => navigate(`/admins/edit/${record.id}`),
            onDelete: (record) => setDeleteTarget(record),
          }}
        />
      </List>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={`آیا از حذف ادمین «${deleteTarget?.first_name || ""} ${deleteTarget?.last_name || ""}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};
