import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal";
import { message, Button, Modal, Table, Tag } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { PersianDate } from "../../components/PersianDate";

const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

export const AdminList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

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

  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem("admin_token");
      const resp = await fetch(`${API_URL}/api/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setCustomers(data.customers || []);
    } catch {
      message.error("خطا در دریافت لیست مشتری‌ها");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAddFromCustomers = async () => {
    if (selectedCustomerIds.length === 0) {
      message.warning("حداقل یک مشتری انتخاب کنید");
      return;
    }
    setAdding(true);
    try {
      const token = localStorage.getItem("admin_token");
      const resp = await fetch(`${API_URL}/api/admin/admins/from-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_ids: selectedCustomerIds }),
      });
      const data = await resp.json();
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failCount = data.results?.filter((r: any) => !r.success).length || 0;
      if (successCount > 0) message.success(`${successCount} ادمین با موفقیت اضافه شد`);
      if (failCount > 0) message.warning(`${failCount} مورد اضافه نشد (تکراری یا یافت نشد)`);
      setAddModalOpen(false);
      setSelectedCustomerIds([]);
    } catch {
      message.error("خطا در اضافه کردن ادمین");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <List
        headerProps={{
          title: "ادمین‌ها",
          extra: (
            <div style={{ display: "flex", gap: 8 }}>
              <Button icon={<UserAddOutlined />} onClick={handleOpenAddModal}>
                اضافه از مشتری‌ها
              </Button>
              <CreateButton />
            </div>
          ),
        }}
      >
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
            {
              key: "customer_id",
              title: "مشتری",
              dataIndex: "customer_id",
              render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <Tag>-</Tag>,
            },
            { key: "created_at", title: "تاریخ ایجاد", dataIndex: "created_at", render: (v: string) => <PersianDate value={v} /> },
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

      <Modal
        title="اضافه کردن ادمین از مشتری‌ها"
        open={addModalOpen}
        onOk={handleAddFromCustomers}
        onCancel={() => { setAddModalOpen(false); setSelectedCustomerIds([]); }}
        okText={`اضافه کردن (${selectedCustomerIds.length})`}
        cancelText="لغو"
        okButtonProps={{ loading: adding, disabled: selectedCustomerIds.length === 0 }}
        width={600}
      >
        <Table
          dataSource={customers}
          loading={loadingCustomers}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          rowSelection={{
            selectedRowKeys: selectedCustomerIds,
            onChange: (keys) => setSelectedCustomerIds(keys as string[]),
          }}
          columns={[
            { title: "نام", render: (_: unknown, r: any) => `${r.first_name || ""} ${r.last_name || ""}` },
            { title: "یوزرنیم", dataIndex: "username" },
            { title: "آیدی", dataIndex: "id" },
          ]}
        />
      </Modal>
    </div>
  );
};
