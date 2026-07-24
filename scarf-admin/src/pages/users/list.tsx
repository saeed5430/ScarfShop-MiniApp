import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { List } from "@refinedev/antd";
import { Button, Descriptions, Modal, Tag, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

const { Text } = Typography;

interface Customer {
  id: string;
  user_type: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  invite_code: string | null;
  is_premium: boolean;
  created_at: string;
  last_active: string;
}

const userTypeLabels: Record<string, string> = {
  new: "جدید",
  regular: "عادی",
  vip: "ویژه",
};

const userTypeColors: Record<string, string> = {
  new: "blue",
  regular: "green",
  vip: "gold",
};

export const UserList: React.FC = () => {
  const { tableProps } = useTable();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (record: Customer) => {
    setSelectedCustomer(record);
    setModalOpen(true);
  };

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
          {
            key: "actions",
            title: "عملیات",
            width: 80,
            render: (_: unknown, record: any) => (
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
                title="مشاهده جزئیات"
              />
            ),
          },
        ]}
      />

      <Modal
        title="جزئیات کاربر"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedCustomer && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="شناسه تلگرام">
              <Text copyable>{selectedCustomer.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="نام">
              {selectedCustomer.first_name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="نام خانوادگی">
              {selectedCustomer.last_name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="یوزرنیم">
              {selectedCustomer.username ? (
                <Tag>@{selectedCustomer.username}</Tag>
              ) : (
                <Text type="secondary">ندارد</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="نوع کاربر">
              <Tag color={userTypeColors[selectedCustomer.user_type]}>
                {userTypeLabels[selectedCustomer.user_type] || selectedCustomer.user_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="زبان">
              <Tag>{selectedCustomer.language_code || "-"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="پریمیوم">
              <Tag color={selectedCustomer.is_premium ? "gold" : "default"}>
                {selectedCustomer.is_premium ? "بله" : "خیر"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="آواتار">
              {selectedCustomer.avatar_url ? (
                <img src={selectedCustomer.avatar_url} alt="avatar" style={{ width: 48, height: 48, borderRadius: "50%" }} />
              ) : (
                <Text type="secondary">ندارد</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="تلفن">
              {selectedCustomer.phone || <Text type="secondary">وارد نشده</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="آدرس">
              {selectedCustomer.address || <Text type="secondary">وارد نشده</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="کد پستی">
              {selectedCustomer.postal_code || <Text type="secondary">وارد نشده</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="کد دعوت">
              {selectedCustomer.invite_code || <Text type="secondary">ندارد</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="تاریخ عضویت">
              <PersianDate value={selectedCustomer.created_at} />
            </Descriptions.Item>
            <Descriptions.Item label="آخرین فعالیت">
              <PersianDate value={selectedCustomer.last_active} />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </List>
  );
};
