import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Show, TextField } from "@refinedev/antd";
import { Button, Descriptions, Divider, Table, Tag, Typography, Space, message } from "antd";
import { PersianDate } from "../../components/PersianDate";

const { Title } = Typography;

const paymentColors: Record<string, string> = { pending: "orange", paid: "green" };
const paymentLabels: Record<string, string> = { pending: "پرداخت نشده", paid: "پرداخت شده" };
const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

interface OrderItemDetail {
  id: number;
  order_id: number;
  product_id: number;
  color_id: number | null;
  size_id: number | null;
  quantity: number;
  product_name: string | null;
  product_material: string | null;
  category_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  size_dimensions: string | null;
}

interface OrderDetail {
  id: number;
  user_id: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  invoice_uploaded_at: number | null;
  voice_uploaded_at: number | null;
}

export const OrderShow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("admin_token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchOrder = () => {
    if (!id) return Promise.resolve();
    return fetch(`${API_URL}/api/admin/orders/${id}`, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setItems(data.items || []);
      });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOrder()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const togglePayment = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ payment_status: order.payment_status === "paid" ? "pending" : "paid" }),
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setOrder(data.order);
      message.success(data.order.payment_status === "paid" ? "پرداخت تایید شد" : "تایید پرداخت لغو شد");
    } catch {
      message.error("خطا در تغییر وضعیت پرداخت");
    } finally {
      setSaving(false);
    }
  };

  const openReceipt = async (type: "invoice" | "voice") => {
    if (!order) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/receipt?type=${type}`, { headers: getHeaders() });
      if (!response.ok) throw new Error("Request failed");
      const url = URL.createObjectURL(await response.blob());
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      message.error("فایل قابل دریافت نیست");
    }
  };

  if (!order && !loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={4}>سفارش یافت نشد</Title>
        <Button type="primary" onClick={() => navigate("/orders")}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const columns = [
    {
      title: "محصول",
      dataIndex: "product_name",
      key: "product_name",
      render: (_: unknown, record: OrderItemDetail) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 600 }}>
            {[record.category_name, record.product_name].filter(Boolean).join(" ")}
          </span>
          {record.product_material && (
            <Tag color="purple" style={{ fontSize: 11 }}>
              {record.product_material}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "رنگ",
      dataIndex: "color_name",
      key: "color_name",
      width: 120,
      render: (_: unknown, record: OrderItemDetail) => (
        <Space size={6}>
          {record.color_hex && (
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: record.color_hex,
                border: "1px solid #d9d9d9",
              }}
            />
          )}
          <span>{record.color_name}</span>
        </Space>
      ),
    },
    {
      title: "سایز",
      dataIndex: "size_dimensions",
      key: "size_dimensions",
      width: 100,
      render: (v: string | null) => v || "-",
    },
    {
      title: "تعداد",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: "#7C3AED" }}>
          {v}
        </span>
      ),
    },
  ];

  return (
    <Show
      isLoading={loading}
      headerProps={{
        title: `سفارش #${order?.id ?? ""}`,
        extra: (
          <Button onClick={() => navigate("/orders")}>
            بازگشت به لیست
          </Button>
        ),
      }}
    >
      <Descriptions bordered column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>شناسه</Title>}>
          <TextField value={String(order?.id ?? "")} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>مشتری</Title>}>
          <TextField value={String(order?.user_id ?? "")} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>وضعیت پرداخت</Title>}>
          <Space>
            <Tag color={paymentColors[order?.payment_status ?? "pending"]}>
              {paymentLabels[order?.payment_status ?? "pending"] ?? order?.payment_status}
            </Tag>
            <Button size="small" loading={saving} danger={order?.payment_status === "paid"} onClick={togglePayment}>
              {order?.payment_status === "paid" ? "لغو تایید پرداخت" : "تایید پرداخت"}
            </Button>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>تعداد اقلام</Title>}>
          <span style={{ fontWeight: 600, color: "#7C3AED" }}>{items.length} ردیف</span>
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>یادداشت</Title>} span={2}>
          <TextField value={order?.notes || "—"} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>تاریخ ایجاد</Title>} span={2}>
          <PersianDate value={order?.created_at} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>تصویر فاکتور</Title>}>
          {order?.invoice_uploaded_at
            ? <Button size="small" onClick={() => void openReceipt("invoice")}>مشاهده فاکتور</Button>
            : <Tag>ثبت نشده</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5} style={{ margin: 0 }}>توضیح صوتی</Title>}>
          {order?.voice_uploaded_at
            ? <Button size="small" onClick={() => void openReceipt("voice")}>پخش صوت</Button>
            : <Tag>ثبت نشده</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="right" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
        اقلام سفارش
      </Divider>

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="middle"
        locale={{ emptyText: "آیتمی ثبت نشده" }}
        style={{ fontFamily: "Vazirmatn, sans-serif" }}
      />
    </Show>
  );
};
