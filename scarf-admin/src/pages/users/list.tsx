import React from "react";
import { useTable } from "@refinedev/antd";
import { List } from "@refinedev/antd";
import { Tag, Typography } from "antd";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

const { Text } = Typography;

export const UserList: React.FC = () => {
  const { tableProps } = useTable();

  return (
    <List headerProps={{ title: "کاربران" }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={(record) => `${record.first_name || ""} ${record.last_name || ""}`}
        mobileCardSubtitle={(record) => record.username ? `@${record.username}` : record.id}
        columns={[
          { key: "id", title: "ID", dataIndex: "id", width: 80 },
          {
            key: "name",
            title: "نام",
            render: (_: unknown, record: any) => (
              <Text strong>{`${record.first_name || ""} ${record.last_name || ""}`}</Text>
            ),
          },
          {
            key: "username",
            title: "یوزرنیم",
            render: (_: unknown, record: any) => (
              record.username ? <Tag>@{record.username}</Tag> : <Text type="secondary">-</Text>
            ),
          },
          {
            key: "language",
            title: "زبان",
            dataIndex: "language_code",
            render: (v: string) => <Tag>{v || "-"}</Tag>,
          },
          {
            key: "is_premium",
            title: "پریمیوم",
            dataIndex: "is_premium",
            render: (v: boolean) => (
              <Tag color={v ? "gold" : "default"}>
                {v ? "پریمیوم" : "عادی"}
              </Tag>
            ),
          },
          { key: "created_at", title: "تاریخ عضویت", dataIndex: "created_at", render: (v: string) => <PersianDate value={v} /> },
          { key: "last_active", title: "آخرین فعالیت", dataIndex: "last_active", render: (v: string) => <PersianDate value={v} /> },
        ]}
      />
    </List>
  );
};
