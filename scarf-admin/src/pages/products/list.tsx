import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { useDelete, useUpdate } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal";
import { message, Tag, Typography, Image, Button, Switch, Card } from "antd";
import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const ProductList: React.FC = () => {
  const { tableProps } = useTable({ pagination: { pageSize: 50 } });
  const { mutate: remove } = useDelete();
  const { mutate: update } = useUpdate();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const allProducts = (tableProps.dataSource || []) as any[];
  const activeProducts = allProducts.filter((p) => p.is_active);
  const deletedProducts = allProducts.filter((p) => !p.is_active);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    remove(
      { resource: "products", id: deleteTarget.id },
      {
        onSuccess: () => {
          message.success("محصول با موفقیت حذف شد");
          setDeleteTarget(null);
          setDeleting(false);
        },
        onError: () => {
          message.error("خطا در حذف محصول");
          setDeleting(false);
        },
      }
    );
  };

  const handleToggleActive = (record: any, checked: boolean) => {
    update(
      { resource: "products", id: record.id, values: { is_active: checked ? 1 : 0 } },
      {
        onSuccess: () => message.success(checked ? "محصول فعال شد" : "محصول غیرفعال شد"),
        onError: () => message.error("خطا در تغییر وضعیت"),
      }
    );
  };

  const handleRestore = (record: any) => {
    update(
      { resource: "products", id: record.id, values: { is_active: 1 } },
      {
        onSuccess: () => message.success("محصول با موفقیت بازگردانده شد"),
        onError: () => message.error("خطا در بازگردانی محصول"),
      }
    );
  };

  const parseImages = (images: unknown): string[] => {
    const arr = typeof images === "string" ? (() => { try { return JSON.parse(images); } catch { return []; } })() : images;
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const item of arr) {
      if (typeof item === "string") {
        if (item && item !== "[object Object]") out.push(item);
      } else if (item && typeof item === "object" && typeof (item as { url?: unknown }).url === "string") {
        out.push((item as { url: string }).url);
      }
    }
    return out;
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
      render: (images: unknown) => {
        const list = parseImages(images);
        if (list.length === 0) {
          return (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              📷
            </div>
          );
        }
        return (
          <Image src={list[0]} width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} preview={false} />
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
      key: "price",
      title: "قیمت",
      dataIndex: "price",
      width: 110,
      render: (price: number) => <span>{Number(price || 0).toLocaleString("fa-IR")}</span>,
    },
    {
      key: "is_stock",
      title: "موجودی",
      dataIndex: "is_stock",
      width: 100,
      render: (is_stock: number) => (
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
        <Tag color={Number(count) > 0 ? "blue" : "default"}>{count ?? 0}</Tag>
      ),
    },
    {
      key: "sizes",
      title: "سایزها",
      dataIndex: "size_count",
      width: 80,
      render: (count: number) => (
        <Tag color={Number(count) > 0 ? "purple" : "default"}>{count ?? 0}</Tag>
      ),
    },
    {
      key: "is_active",
      title: "وضعیت",
      dataIndex: "is_active",
      width: 100,
      render: (is_active: number, record: any) => (
        <Switch
          checked={Boolean(is_active)}
          checkedChildren="فعال"
          unCheckedChildren="غیرفعال"
          onChange={(checked) => handleToggleActive(record, checked)}
          size="small"
        />
      ),
    },
  ];

  const mobileCardTitle = (record: any) => record.name;
  const mobileCardSubtitle = (record: any) => record.category_name || "-";

  return (
    <div>
      <List headerProps={{ title: "محصولات", extra: <CreateButton /> }}>
        <ResponsiveTable
          dataSource={activeProducts}
          loading={!!tableProps.loading}
          rowKey="id"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          columns={columns}
          actions={{
            onEdit: (record) => navigate(`/products/edit/${record.id}`),
            onDelete: (record) => setDeleteTarget(record),
          }}
        />
      </List>

      {deletedProducts.length > 0 && (
        <Card
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DeleteOutlined style={{ color: "#999" }} />
              سطل زباله ({deletedProducts.length} محصول)
            </span>
          }
          style={{ marginTop: 16, border: "1px solid #f0f0f0" }}
          size="small"
        >
          <ResponsiveTable
            dataSource={deletedProducts}
            loading={!!tableProps.loading}
            rowKey="id"
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            columns={columns.filter((c) => c.key !== "is_active")}
            emptyText="سطل زباله خالی است"
            actions={{
              extra: (record) => (
                <Button
                  type="link"
                  icon={<UndoOutlined />}
                  size="small"
                  style={{ color: "#52c41a" }}
                  onClick={() => handleRestore(record)}
                >
                  بازگردانی
                </Button>
              ),
            }}
          />
        </Card>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title={`آیا از حذف محصول «${deleteTarget?.name || ""}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};
