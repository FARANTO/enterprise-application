import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import axiosClient from '@/api/axiosClient';
import { createRefund } from '@/features/refunds/refundsSlice';

export default function RefundOrderModal({ open, onClose, onCreated }) {
  const dispatch = useDispatch();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [reason, setReason] = useState('');
  const [refundQuantities, setRefundQuantities] = useState({});
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  function reset() {
    setOrderId('');
    setOrder(null);
    setReason('');
    setRefundQuantities({});
    setLoadingOrder(false);
    setBusy(false);
  }

  async function loadOrder() {
    if (!orderId) return toast.error('Enter an order ID to refund');
    setLoadingOrder(true);
    try {
      const res = await axiosClient.get(`/api/orders/${orderId}`);
      const orderData = res.data;
      setOrder(orderData);
      const initialQuantities = {};
      (orderData.items || []).forEach((item) => {
        initialQuantities[item.productId] = item.quantity || 0;
      });
      setRefundQuantities(initialQuantities);
      setReason('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load order');
      setOrder(null);
      setRefundQuantities({});
    } finally {
      setLoadingOrder(false);
    }
  }

  const refundItems = useMemo(() => {
    if (!order) return [];
    return (order.items || [])
      .filter((item) => refundQuantities[item.productId] > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(refundQuantities[item.productId] || 0),
      }));
  }, [order, refundQuantities]);

  const refundAmount = useMemo(() => {
    if (!order) return 0;
    return (order.items || []).reduce((sum, item) => {
      const qty = Number(refundQuantities[item.productId] || 0);
      return sum + (item.price || 0) * Math.min(qty, item.quantity || 0);
    }, 0);
  }, [order, refundQuantities]);

  async function submitRefund() {
    if (!order || !order.id) return toast.error('Load a valid order first');
    if (!refundItems.length) return toast.error('Select at least one item to refund');
    if (refundAmount <= 0) return toast.error('Refund amount must be greater than zero');

    setBusy(true);
    try {
      const refundDTO = {
        orderId: order.id,
        amount: refundAmount,
        reason,
        branchId: order.branchId || null,
        paymentType: order.paymentType || null,
        refundItems,
      };
      const res = await dispatch(createRefund(refundDTO)).unwrap();
      toast.success('Refund created successfully');
      if (onCreated) onCreated(res);
      reset();
      onClose();
    } catch (err) {
      toast.error(err?.toString() || 'Failed to create refund');
    } finally {
      setBusy(false);
    }
  }

  function updateQuantity(productId, value) {
    const numeric = Number(value);
    setRefundQuantities((prev) => ({
      ...prev,
      [productId]: numeric >= 0 ? numeric : 0,
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-card p-5 rounded-lg shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Refund Order</h3>
            <p className="text-sm text-muted-foreground">Search an order and choose items to refund.</p>
          </div>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Close</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="refundOrderId">Order ID</Label>
            <Input id="refundOrderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order ID" />
          </div>
          <div className="flex items-end">
            <Button onClick={loadOrder} disabled={loadingOrder}>Load Order</Button>
          </div>
        </div>

        {loadingOrder && <div className="mb-4">Loading order details…</div>}

        {order && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/10 p-4">
              <div className="font-medium">Order #{order.id}</div>
              <div className="text-sm text-muted-foreground">Branch: {order.branchId || '—'} • Payment: {order.paymentType || '—'}</div>
              <div className="text-sm text-muted-foreground">Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Refund Qty</th>
                    <th className="px-4 py-3">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => {
                    const available = item.quantity || 0;
                    const refundQty = Number(refundQuantities[item.productId] || 0);
                    return (
                      <tr key={item.productId} className="border-t">
                        <td className="px-4 py-3">{item.product?.name || `Product ${item.productId}`}</td>
                        <td className="px-4 py-3">{available}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            max={available}
                            value={refundQty}
                            onChange={(e) => updateQuantity(item.productId, Math.min(Math.max(Number(e.target.value || 0), 0), available))}
                            className="w-24"
                          />
                        </td>
                        <td className="px-4 py-3">₹{((item.price || 0) * Math.min(refundQty, available)).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refundReason">Reason</Label>
              <Input id="refundReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for refund" />
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="text-sm text-muted-foreground">Refund amount: ₹{refundAmount.toFixed(2)}</div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
                <Button onClick={submitRefund} disabled={busy || refundAmount <= 0}>Create Refund</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
