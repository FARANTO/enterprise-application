import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export default function DiscountModal({ open, onClose, onApply, cartItems = [], cartTotals = {} }) {
  const [tab, setTab] = useState('order');
  const [mode, setMode] = useState('percentage');
  const [value, setValue] = useState('');
  const [itemDiscounts, setItemDiscounts] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTab('order');
      setMode('percentage');
      setValue('');
      setItemDiscounts({});
      setError('');
    }
  }, [open]);

  const subtotal = cartTotals.subtotal || 0;

  const orderDiscountAmount = useMemo(() => {
    const numeric = Number(value || 0);
    if (!numeric || numeric <= 0) return 0;
    return mode === 'percentage' ? (subtotal * numeric) / 100 : numeric;
  }, [mode, value, subtotal]);

  const itemPreview = useMemo(() => {
    return cartItems.map((item) => {
      const discountConfig = itemDiscounts[item.productId] || {};
      const itemTotal = item.price * item.quantity;
      const numeric = Number(discountConfig.value || 0);
      let calculated = 0;
      if (numeric > 0) {
        calculated = discountConfig.mode === 'percentage' ? (itemTotal * numeric) / 100 : numeric;
      }
      return {
        ...item,
        discountMode: discountConfig.mode || 'percentage',
        discountValue: discountConfig.value || '',
        discountAmount: Math.min(calculated, itemTotal),
        itemTotal,
      };
    });
  }, [cartItems, itemDiscounts]);

  const totalItemDiscount = useMemo(() => itemPreview.reduce((sum, item) => sum + (item.discountAmount || 0), 0), [itemPreview]);

  function handleApply() {
    setError('');
    if (tab === 'order') {
      const numeric = Number(value);
      if (!numeric || numeric <= 0) {
        setError('Enter a discount value greater than zero.');
        return;
      }
      if (mode === 'percentage' && (numeric < 0 || numeric > 100)) {
        setError('Percentage discount must be between 0 and 100.');
        return;
      }
      if (mode === 'flat' && numeric >= subtotal) {
        setError('Flat discount must be less than the order total.');
        return;
      }
      if (orderDiscountAmount >= subtotal) {
        setError('Discount cannot equal or exceed the order total.');
        return;
      }
      onApply({ type: 'order', mode, value: numeric });
      return;
    }

    const entries = itemPreview
      .filter((item) => item.discountAmount > 0)
      .map((item) => ({
        type: 'item',
        productId: item.productId,
        mode: item.discountMode,
        value: Number(item.discountValue),
      }));

    if (!entries.length) {
      setError('Apply a discount to at least one item.');
      return;
    }

    for (const item of itemPreview) {
      if (item.discountAmount > 0 && item.discountAmount >= item.itemTotal) {
        setError(`Discount for ${item.product.name} cannot exceed item total.`);
        return;
      }
    }

    onApply(entries);
  }

  function updateItemDiscount(productId, field, fieldValue) {
    setItemDiscounts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: fieldValue,
      },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>Apply an order-level or item-level discount before checkout.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab('order')} className={`rounded-lg px-3 py-2 ${tab === 'order' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              Order discount
            </button>
            <button type="button" onClick={() => setTab('item')} className={`rounded-lg px-3 py-2 ${tab === 'item' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              Item discount
            </button>
          </div>

          {tab === 'order' ? (
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="mode">Discount mode</Label>
                  <select id="mode" value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Discount value</Label>
                  <Input id="value" type="number" min="0" value={value} onChange={(event) => setValue(event.target.value)} placeholder={mode === 'percentage' ? 'e.g. 10' : 'e.g. 100'} />
                </div>
              </div>
              <div className="rounded-xl border bg-muted p-4 text-sm">
                <div className="mb-2">Original total: {formatCurrency(subtotal)}</div>
                <div className="mb-2">Discount: -{formatCurrency(orderDiscountAmount)}</div>
                <div className="font-semibold">Final total: {formatCurrency(Math.max(subtotal - orderDiscountAmount, 0))}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted p-4 text-sm">
                <div className="mb-2">Original total: {formatCurrency(subtotal)}</div>
                <div className="mb-2">Item discount total: -{formatCurrency(totalItemDiscount)}</div>
                <div className="font-semibold">Final total: {formatCurrency(Math.max(subtotal - totalItemDiscount, 0))}</div>
              </div>
              <div className="space-y-3 max-h-72 overflow-auto">
                {itemPreview.map((item) => (
                  <div key={item.productId} className="rounded-xl border p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity} • Total: {formatCurrency(item.itemTotal)}</div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 md:w-2/3">
                        <div className="grid gap-2">
                          <Label htmlFor={`mode-${item.productId}`}>Mode</Label>
                          <select id={`mode-${item.productId}`} value={item.discountMode} onChange={(event) => updateItemDiscount(item.productId, 'mode', event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                            <option value="percentage">Percentage</option>
                            <option value="flat">Flat</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`value-${item.productId}`}>Value</Label>
                          <Input id={`value-${item.productId}`} type="number" min="0" value={item.discountValue} onChange={(event) => updateItemDiscount(item.productId, 'value', event.target.value)} placeholder={item.discountMode === 'percentage' ? '0-100' : 'amount'} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Discount amount: {formatCurrency(item.discountAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply Discount</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
