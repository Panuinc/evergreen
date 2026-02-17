"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function FulfillmentChart({ data }) {
  if (!data) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  const barData = [
    { name: "จัดส่งแล้ว", value: data.totalQtyShipped, fill: "#10b981" },
    { name: "คงค้าง", value: data.totalOutstanding, fill: "#f59e0b" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={[{ shipped: data.totalQtyShipped, outstanding: data.totalOutstanding }]} layout="vertical">
          <XAxis type="number" hide />
          <Tooltip formatter={(v, name) => [`${v.toLocaleString()} ชิ้น`, name === "shipped" ? "จัดส่งแล้ว" : "คงค้าง"]} />
          <Bar dataKey="shipped" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
          <Bar dataKey="outstanding" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-success">{data.fulfillmentRate}%</p>
          <p className="text-xs text-default-400">Fulfillment Rate</p>
        </div>
        <div>
          <p className="text-lg font-bold">{data.totalQtyOrdered.toLocaleString()}</p>
          <p className="text-xs text-default-400">สั่งทั้งหมด (ชิ้น)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-success">{data.totalQtyShipped.toLocaleString()}</p>
          <p className="text-xs text-default-400">ส่งแล้ว (ชิ้น)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-warning">{data.ordersWithOutstanding}</p>
          <p className="text-xs text-default-400">ออเดอร์มีค้าง</p>
        </div>
      </div>
    </div>
  );
}
