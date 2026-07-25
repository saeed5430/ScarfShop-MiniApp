import React from "react";
import { Table, Card, Space, Button, Typography, Empty } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ResponsiveColumn<T> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  responsive?: ["md"] | ["lg"];
  width?: number;
  ellipsis?: boolean;
}

interface ActionConfig<T> {
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  extra?: (record: T) => React.ReactNode;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
}

interface ResponsiveTableProps<T extends Record<string, any>> {
  dataSource: readonly T[];
  columns: ResponsiveColumn<T>[];
  loading?: boolean;
  rowKey?: string;
  actions?: ActionConfig<T>;
  mobileCardTitle?: (record: T) => string;
  mobileCardSubtitle?: (record: T) => string;
  emptyText?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  dataSource,
  columns,
  loading = false,
  rowKey = "id",
  actions,
  mobileCardTitle,
  mobileCardSubtitle,
  emptyText = "داده‌ای یافت نشد",
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile: Card layout
  if (isMobile) {
    if (!dataSource?.length) {
      return <Empty description={emptyText} />;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dataSource.map((record, index) => (
          <Card
            key={record[rowKey] || index}
            size="small"
            style={{
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
            styles={{ body: { padding: 16 } }}
          >
            {mobileCardTitle && (
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 16, fontWeight: 600 }}>
                  {mobileCardTitle(record)}
                </Text>
                {mobileCardSubtitle && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {mobileCardSubtitle(record)}
                    </Text>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {columns.map((col) => {
                const value = col.dataIndex ? record[col.dataIndex] : undefined;
                const displayValue = col.render
                  ? col.render(value, record, index)
                  : value;

                if (displayValue === null || displayValue === undefined) return null;

                return (
                  <div
                    key={col.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 13, minWidth: 80 }}>
                      {col.title}
                    </Text>
                    <div style={{ textAlign: "end", fontSize: 14, fontWeight: 500 }}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>

            {actions && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #E5E7EB",
                  justifyContent: "flex-end",
                }}
              >
                {actions.onView && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => actions.onView!(record)}
                  >
                    {actions.viewLabel || "مشاهده"}
                  </Button>
                )}
                {actions.onEdit && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => actions.onEdit!(record)}
                    style={{ color: "#7C3AED" }}
                  >
                    {actions.editLabel || "ویرایش"}
                  </Button>
                )}
                {actions.onDelete && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => actions.onDelete!(record)}
                  >
                    {actions.deleteLabel || "حذف"}
                  </Button>
                )}
                {actions.extra && actions.extra(record)}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <Table
      dataSource={[...dataSource]}
      rowKey={rowKey}
      loading={!!loading}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      style={{ borderRadius: 16, overflow: "hidden" }}
      scroll={{ x: 600 }}
    >
      {columns.map((col) => (
        <Table.Column
          key={col.key}
          title={col.title}
          dataIndex={col.dataIndex}
          render={col.render}
          width={col.width}
          ellipsis={col.ellipsis}
          responsive={col.responsive}
        />
      ))}
      {actions && (
        <Table.Column
          title="عملیات"
          key="actions"
          width={180}
          render={(_, record) => (
            <Space size="small">
              {actions.onView && (
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => actions.onView?.(record)}
                />
              )}
              {actions.onEdit && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => actions.onEdit?.(record)}
                  style={{ color: "#7C3AED" }}
                />
              )}
              {actions.onDelete && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => actions.onDelete?.(record)}
                />
              )}
              {actions.extra && actions.extra(record)}
            </Space>
          )}
        />
      )}
    </Table>
  );
}
