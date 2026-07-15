import React from "react";
import { useTable } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { CreateButton, List } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/ResponsiveTable";
import { message, Tag, Space, Typography, Button } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const ColorList: React.FC = () => {
  const { tableProps } = useTable();
  const { mutate: remove } = useDelete();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const handleCopyHex = async (hex: string, id: number) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedId(id);
      message.success("کد رنگ کپی شد");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      message.error("خطا در کپی");
    }
  };

  const handleDelete = (record: any) => {
    if (record.product_count > 0) {
      message.warning("این رنگ در محصولات استفاده شده و قابل حذف نیست");
      return;
    }
    remove(
      { resource: "colors", id: record.id },
      {
        onSuccess: () => message.success("رنگ با موفقیت حذف شد"),
        onError: () => message.error("خطا در حذف رنگ"),
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
      key: "preview",
      title: "پیش‌نمایش",
      dataIndex: "hex",
      width: 80,
      render: (hex: string) => (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: hex, border: "2px solid #E5E7EB", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
      ),
    },
    {
      key: "name",
      title: "نام فارسی",
      dataIndex: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      key: "name_en",
      title: "نام انگلیسی",
      dataIndex: "name_en",
      render: (name_en: string) => <Text type="secondary">{name_en}</Text>,
    },
    {
      key: "hex",
      title: "کد رنگ",
      dataIndex: "hex",
      render: (hex: string, record: any) => (
        <Space>
          <Tag style={{ fontFamily: "monospace", cursor: "pointer", padding: "2px 8px", borderRadius: 4 }} onClick={() => handleCopyHex(hex, record.id)}>
            {hex}
          </Tag>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyHex(hex, record.id)} style={{ color: copiedId === record.id ? "#52c41a" : undefined }} />
        </Space>
      ),
    },
    {
      key: "product_count",
      title: "تعداد محصولات",
      dataIndex: "product_count",
      width: 120,
      render: (count: number) => (
        <Tag color={count > 0 ? "blue" : "default"}>
          {count} محصول
        </Tag>
      ),
    },
  ];

  const mobileCardTitle = (record: any) => `${record.name} (${record.name_en})`;
  const mobileCardSubtitle = (record: any) => `رنگ: ${record.hex} | محصول: ${record.product_count}`;

  return (
    <List headerProps={{ title: "رنگ‌ها", extra: <CreateButton /> }}>
      <ResponsiveTable
        dataSource={tableProps.dataSource || []}
        loading={!!tableProps.loading}
        rowKey="id"
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        columns={columns}
        actions={{
          onEdit: (record) => navigate(`/colors/edit/${record.id}`),
          onDelete: (record) => handleDelete(record),
        }}
      />
    </List>
  );
};
