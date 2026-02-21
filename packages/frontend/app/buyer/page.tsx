"use client";

import Link from "next/link";
import {
  BarChart3,
  Package,
  DollarSign,
  Sun,
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

function SubscriptionRow({ orderId }: { orderId: bigint }) {
  const { data: order } = useOrder(orderId);
  const { data: devices } = useOrderDevices(orderId);

  if (!order) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-3 text-zeus-stone-400 text-sm">
          Loading subscription #{orderId.toString()}...
        </td>
      </tr>
    );
  }

  const durationDays = Math.round(order.duration / 86400);

  return (
    <tr className="hover:bg-zeus-stone-50 transition-colors">
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm font-medium text-zeus-stone-800">
        #{orderId.toString()}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {order.deviceTypeName}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {order.region || "--"}
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {(order.minUptimeBps / 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        {durationDays}d
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        <span className="font-mono">{order.pricePerBatchFormatted}</span>{" "}
        <span className="text-zeus-stone-400">ADI</span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-700">
        <span className="font-mono">{order.remainingEscrowFormatted}</span>
        <span className="text-zeus-stone-400"> / {order.totalEscrowFormatted} ADI</span>
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm">
        <StatusBadge status={order.statusName} />
      </td>
      <td className="px-4 py-3 border-b border-zeus-stone-100 text-sm text-zeus-stone-500">
        {devices ? devices.length : 0} asset{devices?.length !== 1 ? "s" : ""}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="zeus-heading text-2xl text-zeus-stone-900">
              Data Subscriptions
            </h1>
            <p className="text-sm text-zeus-stone-500 mt-1">
              Manage generation data subscriptions and explore verified assets
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/buyer/explore" className="zeus-btn-secondary">
              <Search className="w-4 h-4" />
              Explore Assets
            </Link>
            <Link href="/buyer/create-order" className="zeus-btn-primary">
              <Plus className="w-4 h-4" />
              Create Subscription
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Active Subscriptions"
            value={orderCount}
            icon={BarChart3}
          />
          <StatCard
            label="Total Spend"
            value="--"
            icon={DollarSign}
            trend="Calculated at settlement"
          />
          <StatCard
            label="Assets Available"
            value={deviceCount}
            icon={Sun}
          />
        </div>

        <div className="zeus-card">
          <div className="px-6 py-4 border-b border-zeus-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-zeus-stone-400" />
              <h2 className="zeus-heading text-sm text-zeus-stone-800">
                My Subscriptions
              </h2>
            </div>
            <span className="zeus-label">
              {orderCount} total
            </span>
          </div>

          {orderCount === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-10 h-10 text-zeus-stone-300 mx-auto mb-3" />
              <p className="text-zeus-stone-400 text-sm">No subscriptions yet</p>
              <Link
                href="/buyer/create-order"
                className="inline-flex items-center gap-1 text-zeus-gold hover:text-zeus-gold-dark text-sm mt-2"
              >
                Create your first subscription
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm zeus-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asset Type</th>
                    <th>Region</th>
                    <th>Min Capacity Factor</th>
                    <th>Duration</th>
                    <th>Price/Attestation</th>
                    <th>Escrow</th>
                    <th>Status</th>
                    <th>Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {orderIds.map((id) => (
                    <SubscriptionRow key={id.toString()} orderId={id} />
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
