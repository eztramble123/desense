"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Cpu,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import { RoleGuard } from "../components/RoleGuard";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  useTotalOrders,
  useTotalDevices,
  useOrder,
  useOrderDevices,
} from "../hooks/useContracts";

function OrderRow({ orderId }: { orderId: bigint }) {
  const { data: order } = useOrder(orderId);
  const { data: devices } = useOrderDevices(orderId);

  if (!order) {
    return (
      <tr className="border-b border-slate-100">
        <td colSpan={8} className="px-4 py-3 text-slate-400 text-sm">
          Loading order #{orderId.toString()}...
        </td>
      </tr>
    );
  }


  const durationDays = Math.round(order.duration / 86400);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        #{orderId.toString()}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {order.deviceTypeName}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {order.region || "--"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {(order.minUptimeBps / 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {durationDays}d
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        <span className="font-mono">{order.pricePerBatchFormatted}</span>{" "}
        <span className="text-slate-400">ADI</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        <span className="font-mono">{order.remainingEscrowFormatted}</span>
        <span className="text-slate-400"> / {order.totalEscrowFormatted} ADI</span>
      </td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={order.statusName} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {devices ? devices.length : 0} device{devices?.length !== 1 ? "s" : ""}
      </td>
    </tr>
  );
}

export default function BuyerPage() {
  const { data: totalOrders } = useTotalOrders();
  const { data: totalDevices } = useTotalDevices();

  const orderCount = totalOrders !== undefined ? Number(totalOrders) : 0;
  const deviceCount = totalDevices !== undefined ? Number(totalDevices) : 0;

  const orderIds = Array.from({ length: orderCount }, (_, i) => BigInt(i));

  return (
    <RoleGuard role="buyer">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Buyer Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage data orders and explore available devices
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/buyer/explore"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Explore Devices
            </Link>
            <Link
              href="/buyer/create-order"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Order
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Active Orders"
            value={orderCount}
            icon={ShoppingCart}
          />
          <StatCard
            label="Total Spend"
            value="--"
            icon={DollarSign}
            trend="Calculated at settlement"
          />
          <StatCard
            label="Devices Available"
            value={deviceCount}
            icon={Cpu}
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">
                My Orders
              </h2>
            </div>
            <span className="text-sm text-slate-400">
              {orderCount} total
            </span>
          </div>

          {orderCount === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No orders yet</p>
              <Link
                href="/buyer/create-order"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
              >
                Create your first order
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      ID
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Device Type
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Region
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Min Uptime
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Duration
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Price/Batch
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Escrow
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">
                      Devices
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderIds.map((id) => (
                    <OrderRow key={id.toString()} orderId={id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
