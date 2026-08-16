import React, { useState } from "react";
import { useTable } from "@refinedev/antd";
import { List } from "@refinedev/antd";
import { Button, Descriptions, Modal, Tag, Typography, Space } from "antd";
import { EyeOutlined, MessageOutlined } from "@ant-design/icons";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { PersianDate } from "../../components/PersianDate";

const { Text } = Typography;

interface BaleChatCustomer {
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

interface BaleChatMessage {
  id: number;
  customer_id: string;
  message: string;
  sender_type: "user" | "assistant";
  ai_connected: boolean;
  timestamp: number;
}

export const BaleChatsList: React.FC = () => {
  const { tableProps } = useTable();
  const [selectedCustomer, setSelectedCustomer] = useState<BaleChatCustomer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [messages, setMessages] = useState<BaleChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const handleViewChats = async (record: BaleChatCustomer) => {
    setSelectedCustomer(record);
    setLoadingMessages(true);
    try {
      const response = await fetch(
        `https://scarf-mini-app.abdollahi003.workers.dev/api/admin/bale/chats/${record.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoadingMessages(false);
      setModalOpen(true);
    }
  };

  return (
    <List headerProps={{ title: "مکالمات بله" }}>
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
          { key: "created_at", title: "تاریخ عضویت", dataIndex: "created_at", render: (v: string) => <PersianDate value={v} /> },
          { key: "last_active", title: "آخرین فعالیت", dataIndex: "last_active", render: (v: string) => <PersianDate value={v} /> },
          {
            key: "actions",
            title: "عملیات",
            width: 100,
            render: (_: unknown, record: any) => (
              <Space>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewChats(record)}
                  title="مشاهده جزئیات"
                />
                <Button
                  type="link"
                  icon={<MessageOutlined />}
                  onClick={() => handleViewChats(record)}
                  title="مکالمات"
                />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={selectedCustomer ? `مکالمات با ${selectedCustomer.first_name} ${selectedCustomer.last_name}` : "مکالمات"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setSelectedCustomer(null); setMessages([]); }}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <div style={{ maxHeight: 500, overflow: "auto" }}>
            {loadingMessages ? (
              <div style={{ textAlign: "center", padding: 32 }}>
                <Typography.Text type="secondary">در حال بارگذاری مکالمات...</Typography.Text>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32 }}>
                <Typography.Text type="secondary">مکالمه‌ای یافت نشد</Typography.Text>
              </div>
            ) : (
              <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="شناسه بله">
                  <Text copyable>{selectedCustomer.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="نام">
                  {selectedCustomer.first_name || "-"} {selectedCustomer.last_name || ""}
                </Descriptions.Item>
                <Descriptions.Item label="یوزرنیم">
                  {selectedCustomer.username ? <Tag>@{selectedCustomer.username}</Tag> : <Text type="secondary">ندارد</Text>}
                </Descriptions.Item>
              </Descriptions>
            )}
            <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 16, paddingTop: 16 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 12, padding: 12, background: msg.sender_type === "user" ? "#f6ffed" : "#f0f5ff", borderRadius: 8, borderLeft: `4px solid ${msg.sender_type === "user" ? "#52c41a" : "#1890ff"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Typography.Text strong>{msg.sender_type === "user" ? "👤 کاربر" : "🤖 دستیار"}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(msg.timestamp * 1000).toLocaleString("fa-IR")}
                    </Typography.Text>
                  </div>
                  <Typography.Text>{msg.message}</Typography.Text>
                  {msg.ai_connected && <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>🔗 متصل به هوش مصنوعی</Typography.Text>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </List>
  );
};