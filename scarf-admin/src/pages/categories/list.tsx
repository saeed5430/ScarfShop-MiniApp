import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal";
import { PersianDate } from "../../components/PersianDate";
import { message, Tag, Typography } from "antd";

const { Text } = Typography;

export const CategoryList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.product_count > 0) {
      message.warning("این دسته‌بندی دارای محصول است و قابل حذف نیست");
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    remove(
      { resource: "categories", id: deleteTarget.id },
      {
        onSuccess: () => {
          message.success("دسته‌بندی با موفقیت حذف شد");
          setDeleteTarget(null);
          setDeleting(false);
        },
        onError: () => {
          message.error("خطا در حذف دسته‌بندی");
          setDeleting(false);
        },
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
      title: "نام",
      dataIndex: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      key: "slug",
      title: "اسلاگ",
      dataIndex: "slug",
      render: (slug: string) => (
        <Text code style={{ fontSize: 12 }}>
          {slug || "-"}
        </Text>
      ),
    },
    {
      key: "description",
      title: "توضیحات",
      dataIndex: "description",
      ellipsis: true,
      render: (desc: string) => (
        <Text type="secondary" ellipsis={{ tooltip: desc }}>
          {desc ? (desc.length > 30 ? desc.substring(0, 30) + "..." : desc) : "-"}
        </Text>
      ),
    },
    {
      key: "product_count",
      title: "تعداد محصولات",
      dataIndex: "product_count",
      width: 120,
      render: (count: number) => (
        <Tag color={count > 0 ? "green" : "default"}>
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

  const mobileCardTitle = (record: any) => {
    return record.name;
  };

  const mobileCardSubtitle = (record: any) => {
    return `اسلاگ: ${record.slug || "-"} | محصولات: ${record.product_count}`;
  };

  return (
    <div>
    <List headerProps={{ title: "دسته‌بندی‌ها", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        columns={columns}
        actions={{
          onEdit: (record) => navigate(`/categories/edit/${record.id}`),
          onDelete: (record) => setDeleteTarget(record),
        }}
      />
    </List>

    <ConfirmDeleteModal
      open={!!deleteTarget}
      title={`آیا از حذف دسته‌بندی «${deleteTarget?.name || ""}» مطمئن هستید؟`}
      onConfirm={handleDelete}
      onCancel={() => setDeleteTarget(null)}
      loading={deleting}
    />
    </div>
  );
};
