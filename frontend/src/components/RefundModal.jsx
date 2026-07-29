import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { createRefund } from '@/features/refunds/refundsSlice';
import { toast } from 'react-toastify';

// order prop expects an OrderDTO with id, totalAmount, items
export default function RefundModal({ open, onClose, order, onCreated }){
  const [amount, setAmount] = useState(order?.totalAmount || 0);
  const [reason, setReason] = useState('');
  const dispatch = useDispatch();
  if (!open) return null;

  async function submit(){
    if (!order || !order.id) return toast.error('Invalid order');
    if (amount <= 0) return toast.error('Amount must be positive');
    const refundDTO = {
      orderId: order.id,
      amount: Number(amount),
      reason,
      branchId: order.branchId || null,
      paymentType: order.paymentType || null,
      shiftReportId: null,
      refundItems: Number(amount) === Number(order.totalAmount)
        ? (order.items || []).map((item) => ({ productId: item.productId, quantity: item.quantity }))
        : undefined,
    };
    try{
      const res = await dispatch(createRefund(refundDTO)).unwrap();
      toast.success('Refund created');
      if (onCreated) onCreated(res);
      onClose();
    } catch (err){
      toast.error(err?.toString() || 'Failed to create refund');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-card p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Create Refund for Order #{order?.id}</h3>
        <label className="block mb-2"><span className="text-sm">Amount</span><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full input mt-1"/></label>
        <label className="block mb-2"><span className="text-sm">Reason</span><input value={reason} onChange={e=>setReason(e.target.value)} className="w-full input mt-1"/></label>
        <div className="flex gap-2 justify-end mt-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create Refund</Button></div>
      </div>
    </div>
  );
}

