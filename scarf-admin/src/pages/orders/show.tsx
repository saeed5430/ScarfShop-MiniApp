import { useShow } from "@refinedev/core";
import { Show, DateField, NumberField, TextField } from "@refinedev/antd";
import { Descriptions, Tag, Typography } from "antd";

const { Title } = Typography;

const paymentColors: Record<string, string> = { pending: "orange", paid: "green" };
const fulfillmentColors: Record<string, string> = { processing: "blue", shipped: "cyan", delivered: "green" };
const paymentLabels: Record<string, string> = { pending: "پرداخت نشده", paid: "پرداخت شده" };
const fulfillmentLabels: Record<string, string> = { processing: "در حال پردازش", shipped: "ارسال شده", delivered: "تحویل شده" };

export const OrderShow: React.FC = () => {
  const { query } = useShow();
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label={<Title level={5}>شناسه</Title>}>
          <TextField value={String(record?.id ?? "")} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>مشتری</Title>}>
          <TextField value={String(record?.customer_id ?? "")} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>مبلغ کل</Title>}>
          <NumberField value={record?.total ?? 0} options={{ style: "currency", currency: "IRR" }} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>وضعیت پرداخت</Title>}>
          <Tag color={paymentColors[record?.payment_status]}>{paymentLabels[record?.payment_status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>وضعیت ارسال</Title>}>
          <Tag color={fulfillmentColors[record?.fulfillment_status]}>{fulfillmentLabels[record?.fulfillment_status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>یادداشت</Title>}>
          <TextField value={record?.notes} />
        </Descriptions.Item>
        <Descriptions.Item label={<Title level={5}>تاریخ ایجاد</Title>}>
          <DateField value={record?.created_at} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
