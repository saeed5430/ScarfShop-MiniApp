import React, { useState, useEffect } from "react";
import { useTable } from "@refinedev/antd";
import { useDelete, useUpdate, useInvalidate } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal";
import { message, Tag, Typography, Image, Button, Switch, Card, Space } from "antd";
import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";

const { Text } = Typography;

const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

export const ProductList: React.FC = () => {
  const { tableProps } = useTable({ pagination: { pageSize: 1000 } });
  const { mutate: remove } = useDelete();
  const { mutate: update } = useUpdate();
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const allProducts = (tableProps.dataSource || []) as any[];
  const activeProducts = allProducts.filter((p) => p.is_active);
  const deletedProducts = allProducts.filter((p) => !p.is_active);

  // Local order for drag & drop (only active products). No API is called on drag.
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => {
    const ids = activeProducts.map((p) => p.id);
    // Only reset when the underlying set of products changed (avoid clobbering a pending drag).
    setDisplayProducts((prev) => {
      const prevIds = prev.map((p) => p.id);
      const sameSet =
        ids.length === prevIds.length && ids.every((id) => prevIds.includes(id));
      return sameSet ? prev : activeProducts;
    });
    setSavedIds(ids);
  }, [tableProps.dataSource]);

  const currentIds = displayProducts.map((p) => p.id);
  const hasOrderChanges =
    JSON.stringify(currentIds) !== JSON.stringify(savedIds);

  const handleReorder = (newList: any[]) => {
    setDisplayProducts(newList);
  };

  const handleSaveOrder = async () => {
    if (!hasOrderChanges) return;
    setSavingOrder(true);
    try {
      const items = displayProducts.map((p, index) => ({
        id: p.id,
        sort_order: index,
      }));

      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/api/products/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error("failed");

      setSavedIds(displayProducts.map((p) => p.id));
      message.success("ترتیب محصولات با موفقیت ذخیره شد");
      invalidate({ resource: "products", invalidates: ["list"] });
    } catch {
      message.error("خطا در ذخیره ترتیب محصولات");
    } finally {
      setSavingOrder(false);
    }
  };

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
      render: (is_active: boolean, record: any) => (
        <Switch
          checked={is_active}
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
      <List
        headerProps={{
          title: "محصولات",
          extra: (
            <Space>
              <Button
                type="primary"
                disabled={!hasOrderChanges}
                loading={savingOrder}
                onClick={handleSaveOrder}
              >
                ذخیره ترتیب
              </Button>
              <CreateButton />
            </Space>
          ),
        }}
      >
        <ResponsiveTable
          dataSource={displayProducts}
          loading={!!tableProps.loading}
          rowKey="id"
          sortable
          onReorder={handleReorder}
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
