import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Steps,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";

const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

type AccountInfo = {
  admin: { id: string; username: string };
  account: {
    username: string | null;
    telegram_user_id: string | null;
    telegram_phone_masked: string | null;
    personal_sending_enabled: boolean;
    last_error: string | null;
  } | null;
  status: string;
  statusLabel: string;
};

const api = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const msg = data.message || data.error || `HTTP ${response.status}`;
    throw new Error(String(msg));
  }
  return data;
};

const statusColor = (status: string): string => {
  if (status === "connected") return "success";
  if (status === "error" || status === "revoked") return "error";
  if (status === "disabled") return "warning";
  return "default";
};

export const TelegramPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [testTarget, setTestTarget] = useState("");
  const [testText, setTestText] = useState("");
  const [step, setStep] = useState(0);
  const [needPassword, setNeedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = (await api("/api/admin/telegram/status")) as AccountInfo;
        if (cancelled) return;
        setInfo(res);
        if (res.status === "connected") setStep(3);
        else setStep(0);
      } catch (err) {
        if (!cancelled && err instanceof Error) messageApi.error(err.message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, messageApi]);

  const startConnect = async () => {
    setLoading(true);
    try {
      await api("/api/admin/telegram/connect/start", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setStep(1);
      messageApi.success("کد ورود ارسال شد.");
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setLoading(true);
    try {
      const res = (await api("/api/admin/telegram/connect/code", {
        method: "POST",
        body: JSON.stringify({ code }),
      })) as { needPassword?: boolean };
      if (res.needPassword) {
        setNeedPassword(true);
      } else {
        messageApi.success("حساب با موفقیت متصل شد.");
        setRefreshKey((v) => v + 1);
      }
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    setLoading(true);
    try {
      await api("/api/admin/telegram/connect/password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setNeedPassword(false);
      setPassword("");
      messageApi.success("حساب با موفقیت متصل شد.");
      setRefreshKey((v) => v + 1);
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelConnect = async () => {
    try {
      await api("/api/admin/telegram/connect/cancel", { method: "POST" });
      setStep(0);
      setCode("");
      setPassword("");
      setNeedPassword(false);
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await api("/api/admin/telegram/disconnect", { method: "POST" });
      messageApi.success("اتصال قطع و نشست حذف شد.");
      setRefreshKey((v) => v + 1);
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSending = async (checked: boolean) => {
    try {
      await api("/api/admin/telegram/settings", {
        method: "PATCH",
        body: JSON.stringify({ personal_sending_enabled: checked }),
      });
      setRefreshKey((v) => v + 1);
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    }
  };

  const sendTest = async () => {
    if (!testTarget) return;
    setLoading(true);
    try {
      await api("/api/admin/telegram/test", {
        method: "POST",
        body: JSON.stringify({ target: testTarget, text: testText || "تست ارسال شخصی ✅" }),
      });
      messageApi.success("پیام تست ارسال شد.");
    } catch (err) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connected = info?.status === "connected";
  const currentStep = needPassword ? 2 : step === 3 ? 3 : step;

  return (
    <div style={{ maxWidth: 640 }}>
      {contextHolder}
      <Typography.Title level={3}>ارسال شخصی تلگرام</Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        description="حساب شخصی تلگرام خود را متصل کنید تا فاکتور، توضیحات صوتی و پیام‌های تأیید پرداخت از حساب شخصی شما برای خریداران ارسال شود. نشست به‌صورت رمزنگاری‌شده ذخیره می‌شود."
      />

      {info && (
        <Card title="وضعیت اتصال" style={{ marginBottom: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="ادمین">
              {info.admin.username} ({info.admin.id})
            </Descriptions.Item>
            <Descriptions.Item label="وضعیت">
              <Tag color={statusColor(info.status)}>{info.statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="حساب">
              {info.account?.username || info.account?.telegram_phone_masked || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="ارسال شخصی">
              <Switch
                checked={Boolean(info.account?.personal_sending_enabled)}
                disabled={!connected}
                onChange={(checked) => void toggleSending(checked)}
              />
            </Descriptions.Item>
          </Descriptions>
          {info.account?.last_error && (
            <Alert type="error" showIcon message={info.account.last_error} style={{ marginTop: 12 }} />
          )}
        </Card>
      )}

      <Card title={connected ? "اتصال برقرار است" : "اتصال حساب تلگرام"} loading={!info} style={{ marginBottom: 16 }}>
        {!connected && (
          <>
            <Steps
              size="small"
              current={currentStep}
              items={[{ title: "شماره" }, { title: "کد" }, { title: "رمز 2FA" }]}
              style={{ marginBottom: 16 }}
            />
            {step === 0 && (
              <Form layout="vertical" onFinish={() => void startConnect()}>
                <Form.Item label="شماره تلفن (با کد کشور)">
                  <Input
                    style={{ direction: "ltr", textAlign: "left" }}
                    placeholder="+98912..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  ارسال کد
                </Button>
              </Form>
            )}
            {step === 1 && !needPassword && (
              <Form layout="vertical" onFinish={() => void submitCode()}>
                <Form.Item label="کد ورود">
                  <Input
                    style={{ direction: "ltr", textAlign: "left" }}
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    تأیید کد
                  </Button>
                  <Button onClick={() => void cancelConnect()}>انصراف</Button>
                </Space>
              </Form>
            )}
            {needPassword && (
              <Form layout="vertical" onFinish={() => void submitPassword()}>
                <Form.Item label="رمز دومرحله‌ای (2FA)">
                  <Input.Password
                    style={{ direction: "ltr", textAlign: "left" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    ورود
                  </Button>
                  <Button onClick={() => void cancelConnect()}>انصراف</Button>
                </Space>
              </Form>
            )}
          </>
        )}
        {connected && (
          <Space direction="vertical">
            <Tag color="green">حساب شخصی متصل است</Tag>
            <Button danger onClick={() => void disconnect()} loading={loading}>
              قطع اتصال و حذف نشست
            </Button>
          </Space>
        )}
      </Card>

      {connected && (
        <Card title="پیام تست">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="@username یا شماره تلفن مقصد"
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value)}
            />
            <Input.TextArea
              rows={2}
              placeholder="متن پیام"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
            />
            <Button type="primary" onClick={() => void sendTest()} loading={loading}>
              ارسال تست
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default TelegramPage;