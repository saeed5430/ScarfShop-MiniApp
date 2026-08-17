import React from "react";
import { Table, Card, Space, Button, Typography, Empty, Spin } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, HolderOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  // Drag & drop reordering (optional). When enabled, the table switches to a
  // sortable layout and pagination is disabled so the FULL list can be reordered.
  sortable?: boolean;
  onReorder?: (newDataSource: T[]) => void;
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
  sortable = false,
  onReorder,
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items = React.useMemo(
    () => (dataSource || []).map((record) => String(record[rowKey] || "")),
    [dataSource, rowKey]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = dataSource.findIndex(
      (r) => String(r[rowKey]) === active.id
    );
    const newIndex = dataSource.findIndex(
      (r) => String(r[rowKey]) === over.id
    );
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove([...dataSource], oldIndex, newIndex));
  };

  // ----- Sortable mode (drag & drop) -----
  if (sortable) {
    if (loading && !dataSource?.length) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spin />
        </div>
      );
    }
    if (!dataSource?.length) {
      return <Empty description={emptyText} />;
    }

    if (isMobile) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dataSource.map((record, index) => (
                <SortableCard
                  key={record[rowKey] || index}
                  id={String(record[rowKey] || "")}
                  record={record}
                  index={index}
                  columns={columns}
                  actions={actions}
                  mobileCardTitle={mobileCardTitle}
                  mobileCardSubtitle={mobileCardSubtitle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #E5E7EB",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FAFAFA",
                borderBottom: "1px solid #E5E7EB",
                fontWeight: 600,
              }}
            >
              <div style={{ width: 40 }} />
              {columns.map((col) => (
                <div
                  key={col.key}
                  style={{
                    flex: col.width ? `0 0 ${col.width}px` : 1,
                    minWidth: 0,
                    padding: "12px 8px",
                  }}
                >
                  {col.title}
                </div>
              ))}
              <div style={{ width: 180, padding: "12px 8px", textAlign: "end" }}>
                عملیات
              </div>
            </div>

            {dataSource.map((record, index) => (
              <SortableRow
                key={record[rowKey] || index}
                id={String(record[rowKey] || "")}
                record={record}
                index={index}
                columns={columns}
                actions={actions}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // ----- Mobile: Card layout -----
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

  // ----- Desktop: Table layout -----
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin />
      </div>
    );
  }

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

// ---------- Sortable row (desktop) ----------

interface SortableRowProps<T extends Record<string, any>> {
  id: string;
  record: T;
  index: number;
  columns: ResponsiveColumn<T>[];
  actions?: ActionConfig<T>;
}

function SortableRow<T extends Record<string, any>>({
  id,
  record,
  index,
  columns,
  actions,
}: SortableRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #F3F4F6",
    background: "#fff",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{ width: 40, textAlign: "center", cursor: "grab", color: "#999" }}
      >
        <HolderOutlined />
      </div>
      {columns.map((col) => {
        const value = col.dataIndex ? record[col.dataIndex] : undefined;
        const content = col.render ? col.render(value, record, index) : value;
        return (
          <div
            key={col.key}
            style={{
              flex: col.width ? `0 0 ${col.width}px` : 1,
              minWidth: 0,
              padding: "12px 8px",
              overflow: "hidden",
            }}
          >
            {content}
          </div>
        );
      })}
      <div
        style={{
          width: 180,
          padding: "12px 8px",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        {actions?.onEdit && (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => actions.onEdit?.(record)}
            style={{ color: "#7C3AED" }}
          />
        )}
        {actions?.onDelete && (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => actions.onDelete?.(record)}
          />
        )}
        {actions?.extra && actions.extra(record)}
      </div>
    </div>
  );
}

// ---------- Sortable card (mobile) ----------

interface SortableCardProps<T extends Record<string, any>> {
  id: string;
  record: T;
  index: number;
  columns: ResponsiveColumn<T>[];
  actions?: ActionConfig<T>;
  mobileCardTitle?: (record: T) => string;
  mobileCardSubtitle?: (record: T) => string;
}

function SortableCard<T extends Record<string, any>>({
  id,
  record,
  index,
  columns,
  actions,
  mobileCardTitle,
  mobileCardSubtitle,
}: SortableCardProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: 16 } }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", color: "#999", paddingTop: 2 }}
          >
            <HolderOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
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
                {actions.onEdit && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => actions.onEdit?.(record)}
                    style={{ color: "#7C3AED" }}
                  >
                    ویرایش
                  </Button>
                )}
                {actions.onDelete && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => actions.onDelete?.(record)}
                  >
                    حذف
                  </Button>
                )}
                {actions.extra && actions.extra(record)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
