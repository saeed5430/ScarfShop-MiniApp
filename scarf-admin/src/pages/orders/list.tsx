import React from "react";
import { useTable } from "@refinedev/antd";
import { List } from "@refinedev/antd";
import { Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

const paymentColors: Record<string, string> = { pending: "orange", paid: "green" };
const paymentLabels: Record<string, string> = { pending: "پرداخت نشده", paid: "پرداخت شده" };

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
        mobileCardSubtitle={(record) => `${record.item_count ?? 0} ردیف — ${record.payment_status === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}`}
        columns={[
          { key: "id", title: "ID", dataIndex: "id", width: 60 },
          { key: "user_id", title: "مشتری", dataIndex: "user_id" },
          { key: "item_count", title: "اقلام", dataIndex: "item_count", width: 80, render: (v: number) => <span style={{ fontWeight: 600, color: "#7C3AED" }}>{v ?? 0}</span> },
          { key: "payment_status", title: "پرداخت", dataIndex: "payment_status", render: (v) => <Tag color={paymentColors[v]}>{paymentLabels[v]}</Tag> },
          { key: "created_at", title: "تاریخ", dataIndex: "created_at", render: (v) => <PersianDate value={v} /> },
        ]}
        actions={{
          onView: (record) => navigate(`/orders/show/${record.id}`),
        }}
      />
    </List>
  );
};
