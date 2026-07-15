import React from "react";
import {
  Avatar,
  Dropdown,
  Skeleton,
  Typography,
} from "antd";
import {
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import {
  useGetIdentity,
  useLogout,
} from "@refinedev/core";

const { Text } = Typography;

export const UserProfile: React.FC = () => {
  const { data, isLoading } = useGetIdentity();
  const { mutate: logout } = useLogout();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <Skeleton.Avatar active size={40} />
        <Skeleton.Input active size="small" style={{ width: 100 }} />
      </div>
    );
  }

  const menuItems = [
    {
      key: "profile",
      label: "پروفایل",
      icon: <ProfileOutlined />,
    },
    {
      key: "settings",
      label: "تنظیمات حساب",
      icon: <SettingOutlined />,
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: "خروج",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => logout(),
    },
  ];

  const identity = data as { avatar?: string; name?: string; firstName?: string } | undefined;
  const avatarUrl = identity?.avatar;
  const userName = identity?.name || identity?.firstName || "کاربر";
  const userFallback = userName.charAt(0).toUpperCase();

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      placement="topRight"
      arrow
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 12,
          cursor: "pointer",
          background: "#FFFFFF",
          transition: "background 0.15s ease",
          userSelect: "none",
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #E5E7EB",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#FAFAFA";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#FFFFFF";
        }}
      >
        <Avatar
          src={avatarUrl}
          size={40}
          style={{
            backgroundColor: avatarUrl ? "transparent" : "#7c3aed",
            flexShrink: 0,
          }}
        >
          {!avatarUrl && userFallback}
        </Avatar>

        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {userName}
        </Text>

        <DownOutlined
          style={{
            fontSize: 12,
            color: "#8c8c8c",
            flexShrink: 0,
          }}
        />
      </div>
    </Dropdown>
  );
};
