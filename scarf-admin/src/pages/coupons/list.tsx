import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

export const CouponList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();

  return (
    <List headerProps={{ title: "کدهای تخفیف", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={(record) => record.code}
        mobileCardSubtitle={(record) => record.type === "percentage" ? `${record.discount}%` : `${record.discount?.toLocaleString()} تومان`}
        columns={[
          { key: "id", title: "ID", dataIndex: "id", width: 60 },
          { key: "code", title: "کد", dataIndex: "code" },
          { key: "discount", title: "تخفیف", dataIndex: "discount", render: (v, record) => record.type === "percentage" ? `${v}%` : `${v?.toLocaleString()} تومان` },
          { key: "type", title: "نوع", dataIndex: "type", render: (v) => <Tag>{v === "percentage" ? "درصدی" : "ثابت"}</Tag> },
          { key: "is_active", title: "وضعیت", dataIndex: "is_active", render: (v) => <Tag color={v ? "green" : "red"}>{v ? "فعال" : "غیرفعال"}</Tag> },
          { key: "created_at", title: "تاریخ", dataIndex: "created_at", render: (v) => <PersianDate value={v} /> },
        ]}
        actions={{
          onEdit: (record) => navigate(`/coupons/edit/${record.id}`),
          onDelete: (record) => remove({ resource: "coupons", id: record.id! }),
        }}
      />
    </List>
  );
};
