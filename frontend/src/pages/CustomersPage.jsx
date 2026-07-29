import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/features/customers/customersSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

function CustomerModal({ open, initial, onClose, onSave }){
  const [form, setForm] = useState(() => initial || { name: '', contact: '' });
  function submit(){ if(!form.name) return toast.error('Name required'); onSave(form); }
  if(!open) return null;
  return (
    <div key={initial?.id || 'new'} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-card p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">{initial ? 'Edit' : 'New'} Customer</h3>
        <label className="block mb-2"><span className="text-sm">Name</span><input name="name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full input mt-1"/></label>
        <label className="block mb-2"><span className="text-sm">Contact</span><input name="contact" value={form.contact} onChange={e=>setForm({...form, contact: e.target.value})} className="w-full input mt-1"/></label>
        <div className="flex gap-2 justify-end mt-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? 'Save' : 'Create'}</Button></div>
      </div>
    </div>
  );
}

export default function CustomersPage(){
  const dispatch = useDispatch();
  const customers = useSelector(s => s.customers.items || []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(()=>{ dispatch(fetchCustomers()); }, [dispatch]);

  async function onCreate(data){
    try{ await dispatch(createCustomer(data)).unwrap(); setOpen(false); toast.success('Customer created'); } catch(err){ toast.error(err?.toString()||'Failed'); }
  }
  async function onUpdate(data){
    try{ await dispatch(updateCustomer({ id: editing.id, customer: data })).unwrap(); setOpen(false); setEditing(null); toast.success('Updated'); } catch(err){ toast.error(err?.toString()||'Failed'); }
  }
  async function onDelete(id){ if(!confirm('Delete?')) return; try{ await dispatch(deleteCustomer(id)).unwrap(); toast.success('Deleted'); } catch(err){ toast.error(err?.toString()||'Failed'); } }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button onClick={()=>{ setEditing(null); setOpen(true); }}>New Customer</Button>
      </div>

      <table className="w-full">
        <thead className="text-sm text-muted-foreground text-left"><tr><th>Name</th><th>Contact</th><th></th></tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} className="border-t">
              <td>{c.name || c.FullName || '—'}</td>
              <td>{c.contact || c.phone || c.Email || '—'}</td>
              <td className="text-right">
                <Button variant="ghost" onClick={()=>{ setEditing(c); setOpen(true); }}>Edit</Button>
                <Button variant="destructive" onClick={()=>onDelete(c.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CustomerModal open={open} initial={editing} onClose={()=>setOpen(false)} onSave={editing ? onUpdate : onCreate} />
    </div>
  );
}

