import React from "react";
import { useTable } from "@refinedev/antd";
import { List } from "@refinedev/antd";
import { Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

const paymentColors: Record<string, string> = { pending: "orange", paid: "green" };
const fulfillmentColors: Record<string, string> = { processing: "blue", shipped: "cyan", delivered: "green" };
const paymentLabels: Record<string, string> = { pending: "پرداخت نشده", paid: "پرداخت شده" };
const fulfillmentLabels: Record<string, string> = { processing: "در حال پردازش", shipped: "ارسال شده", delivered: "تحویل شده" };

export const OrderList: React.FC = () => {
  const { tableProps } = useTable();
  const navigate = useNavigate();

  return (
    <List headerProps={{ title: "سفارشات" }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={(record) => `سفارش #${record.id}`}
        mobileCardSubtitle={(record) => `${record.total?.toLocaleString()} تومان`}
        columns={[
          { key: "id", title: "ID", dataIndex: "id", width: 60 },
          { key: "user_id", title: "کاربر", dataIndex: "user_id" },
          { key: "total", title: "مبلغ", dataIndex: "total", render: (v) => `${v?.toLocaleString()} تومان` },
          { key: "payment_status", title: "پرداخت", dataIndex: "payment_status", render: (v) => <Tag color={paymentColors[v]}>{paymentLabels[v]}</Tag> },
          { key: "fulfillment_status", title: "ارسال", dataIndex: "fulfillment_status", render: (v) => <Tag color={fulfillmentColors[v]}>{fulfillmentLabels[v]}</Tag> },
          { key: "created_at", title: "تاریخ", dataIndex: "created_at", render: (v) => <PersianDate value={v} /> },
        ]}
        actions={{
          onView: (record) => navigate(`/orders/show/${record.id}`),
        }}
      />
    </List>
  );
};
