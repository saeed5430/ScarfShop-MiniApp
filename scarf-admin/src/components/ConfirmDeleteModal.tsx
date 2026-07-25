import React from "react";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ConfirmDeleteModalProps {
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  title = "آیا از حذف این مورد مطمئن هستید؟",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: "#faad14", fontSize: 22 }} />
          {title}
        </span>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText="بله، حذف شود"
      cancelText="خیر، لغو شود"
      okButtonProps={{ danger: true, loading }}
      confirmLoading={loading}
    >
      <p style={{ margin: 0, color: "#666" }}>
        این عملیات قابل بازگشت نیست. آیا مطمئنید که می‌خواهید ادامه دهید؟
      </p>
    </Modal>
  );
};
