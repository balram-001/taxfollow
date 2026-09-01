import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import API from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { 
  Shield, Plus, Search, ExternalLink, X, LogOut, 
  MessageCircle, Copy, Check, Loader2, Upload, FileText, SlidersHorizontal,
  ArrowLeft, Eye, Download, Trash2, AlertTriangle, CheckCheck
} from 'lucide-react';

const AVAILABLE_SERVICES = [
  { id: 'ITR Filing', label: 'ITR Filing', hint: 'Form 16, Bank Statement, AIS/TIS' },
  { id: 'GST Return', label: 'GST Return', hint: 'Sales/Purchase invoices, GSTR Reports' },
  { id: 'TDS Compliance', label: 'TDS Compliance', hint: 'TDS Challan 281, Deduction sheets' },
  { id: 'Accounting & Audit', label: 'Accounting & Audit', hint: 'Trial balance, ledgers, stock sheet' }
];

function Dashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Custom Requirements State for Add Client
  const [customReqs, setCustomReqs] = useState<{ name: string; hint: string }[]>([]);
  const [newReqName, setNewReqName] = useState('');
  const [newReqHint, setNewReqHint] = useState('');

  // Workflow Modal States
  const [activeClient, setActiveClient] = useState<any>(null);
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [ackFile, setAckFile] = useState<File | null>(null);
  const [uploadingAck, setUploadingAck] = useState(false);
  const [isReplacingAck, setIsReplacingAck] = useState(false);

  // Side Drawer Preview State
  const [drawerClient, setDrawerClient] = useState<any>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  // In-App Document Viewer for CA Dashboard
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>('');

  // Delete Confirmation State
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    panNumber: '',
    email: '',
    phone: '',
    services: ['ITR Filing'] as string[]
  });
  const [savingClient, setSavingClient] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await API.get('/clients');
      setClients(res.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchClients();
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const toggleService = (serviceId: string) => {
    setFormData((prev) => {
      const exists = prev.services.includes(serviceId);
      const updated = exists
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId];

      return {
        ...prev,
        services: updated // Ab zero/empty services bhi allow hongi
      };
    });
  };

  const addCustomReq = () => {
    if (!newReqName.trim()) return;
    setCustomReqs([...customReqs, { name: newReqName.trim(), hint: newReqHint.trim() }]);
    setNewReqName('');
    setNewReqHint('');
  };

  const removeCustomReq = (index: number) => {
    setCustomReqs(customReqs.filter((_, i) => i !== index));
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingClient) return;

    setSavingClient(true);
    try {
      await API.post('/clients', {
        name: formData.name,
        panNumber: formData.panNumber,
        email: formData.email,
        phone: formData.phone,
        serviceType: formData.services.join(', '),
        customRequirements: customReqs
      });
      setIsModalOpen(false);
      setFormData({ name: '', panNumber: '', email: '', phone: '', services: [] });
      setCustomReqs([]);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await API.delete(`/clients/${clientToDelete._id}`);
      setClients((prev) => prev.filter((c) => c._id !== clientToDelete._id));
      setClientToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const openWorkflowModal = async (client: any) => {
    setActiveClient(client);
    setLoadingTasks(true);
    setIsReplacingAck(false);
    setAckFile(null);
    try {
      const res = await API.get(`/tasks/public/${client.trackingToken}`);
      setClientTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const openDrawerPreview = async (client: any) => {
    setDrawerClient(client);
    setLoadingDrawer(true);
    try {
      const res = await API.get(`/tasks/public/${client.trackingToken}`);
      setDrawerData(res.data);
    } catch (err) {
      console.error('Error loading client drawer:', err);
    } finally {
      setLoadingDrawer(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      setClientTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      if (drawerData) {
        setDrawerData((prev: any) => ({
          ...prev,
          tasks: prev.tasks.map((t: any) => (t._id === taskId ? { ...t, status: newStatus } : t)),
        }));
      }
    } catch (err) {
      alert('Failed to update stage status');
    }
  };

  const handleUploadAck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackFile || !activeClient) return;

    const data = new FormData();
    data.append('file', ackFile);

    setUploadingAck(true);
    try {
      await API.post(`/tasks/ca-upload-ack/${activeClient._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Final ITR-V Acknowledgement uploaded successfully!');
      setAckFile(null);
      setIsReplacingAck(false);
      const res = await API.get(`/tasks/public/${activeClient.trackingToken}`);
      setClientTasks(res.data.tasks || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload ITR-V');
    } finally {
      setUploadingAck(false);
    }
  };

  const sendWhatsAppMessage = (client: any) => {
    const trackingUrl = `${window.location.origin}/track/${client.trackingToken}`;
    const rawPhone = client.phone || client.whatsappNumber || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Standard + Custom dono requirements list banayein
    const standardServices = client.serviceType ? client.serviceType.split(', ').filter(Boolean) : [];
    const customList = Array.isArray(client.customRequirements) ? client.customRequirements.map((r: any) => r.name) : [];
    const allRequired = [...standardServices, ...customList];

    let message = `Namaste ${client.name},\n\n`;

    if (allRequired.length > 0) {
      message += `Aapke compliance work ke liye neeche diye gaye documents pending hain:\n`;
      allRequired.forEach((req) => {
        message += `• ${req}\n`;
      });
      message += `\nKripya is link par click karke documents upload karein:\n${trackingUrl}\n\n- TaxFollow CA Office`;
    } else {
      message += `Aapka filing tracking portal ready hai.\n\nKripya is link par click karke status track karein:\n${trackingUrl}\n\n- TaxFollow CA Office`;
    }

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendDeliveryWhatsApp = (client: any) => {
    const trackingUrl = `${window.location.origin}/track/${client.trackingToken}`;
    const rawPhone = client.phone || client.whatsappNumber || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const service = (client.serviceType || '').toLowerCase();
    const docName = service.includes('gst')
      ? 'GSTR Filing Acknowledgement'
      : service.includes('tds')
      ? 'TDS Filing Receipt'
      : service.includes('itr') || service.includes('income tax')
      ? 'ITR-V Acknowledgement Receipt'
      : 'Final Compliance Receipt';

    const message = `Namaste ${client.name},\n\nAapka compliance work successfully complete ho gaya hai! 🎉\n\nAapki official *${docName}* portal par download ke liye uplabdh hai.\n\n🔗 *Download Receipt & View Completed Dashboard:*\n${trackingUrl}\n\n- TaxFollow CA Office`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.panNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const ackTask = clientTasks.find(
    (t) => t.title === 'Acknowledgement Generated' || t.documentType === 'ITR Acknowledgement'
  );
  const ackFileItem = ackTask?.files?.[0];

  if (pageLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
          <Shield size={22} className="text-emerald-600 absolute" />
        </div>
        <p className="text-slate-700 font-semibold text-sm">Setting Up Workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">CA Practice Dashboard</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Manage multi-service clients, custom requirements & final deliveries</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition text-sm"
        >
          <Plus size={18} /> Add New Client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by client name or PAN number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm text-sm"
        />
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Client Name & Contact</th>
              <th className="p-4">PAN Number</th>
              <th className="p-4">Services & Requirements</th>
              <th className="p-4">Portal View</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-500">
                  No clients found. Click <strong>Add New Client</strong> to get started!
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-medium text-slate-900">
                    <div>{client.name}</div>
                    <div className="text-xs text-slate-500 font-normal">{client.phone || client.whatsappNumber || client.email || 'No contact'}</div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-emerald-700">{client.panNumber}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(client.serviceType ? client.serviceType.split(', ').filter(Boolean) : []).map((srv: string, idx: number) => (
  <span key={idx} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 whitespace-nowrap">
    {srv}
  </span>
))}
                      {client.customRequirements?.map((cr: any, idx: number) => (
                        <span key={`cr-${idx}`} className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200 whitespace-nowrap">
                          + {cr.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openDrawerPreview(client)}
                        className="text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        <Eye size={13} /> Quick View
                      </button>
                      <Link
                        to={`/track/${client.trackingToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-700 p-1.5 hover:bg-slate-100 rounded-md border border-slate-200 transition"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openWorkflowModal(client)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <SlidersHorizontal size={14} /> Workflow
                      </button>
                      <button
                        onClick={() => copyToClipboard(client.trackingToken)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      >
                        {copiedToken === client.trackingToken ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      </button>
                      <button
                        onClick={() => sendWhatsAppMessage(client)}
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-emerald-700 hover:text-emerald-800 transition inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <MessageCircle size={15} className="text-emerald-600" /> WhatsApp
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Client Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{clientToDelete.name}</strong> ({clientToDelete.panNumber})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClient}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {deleting ? <Loader2 className="animate-spin" size={14} /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Modal */}
      {activeClient && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeClient.name} — Filing Workflow</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  PAN: <span className="font-mono text-emerald-700 font-semibold">{activeClient.panNumber}</span>
                </p>
              </div>
              <button onClick={() => setActiveClient(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Deliver Final Box with WhatsApp Button */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                  <CheckCheck className="text-emerald-600" size={18} /> Deliver Final Acknowledgement
                </div>
                {ackFileItem?.fileUrl && !isReplacingAck && (
                  <button
                    onClick={() => setIsReplacingAck(true)}
                    className="text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-md hover:bg-emerald-100 transition cursor-pointer"
                  >
                    ✏️ Replace File
                  </button>
                )}
              </div>

              {ackFileItem?.fileUrl && !isReplacingAck ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={20} className="text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">{ackFileItem.originalFileName || 'Final_Deliverable.pdf'}</p>
                        <p className="text-[10px] text-slate-400">Available on client portal for download</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPreviewDocUrl(`https://taxfollow-backend.onrender.com${ackFileItem.fileUrl}`);
                        setPreviewDocName(ackFileItem.originalFileName || 'Deliverable');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      View
                    </button>
                  </div>

                  {/* Direct WhatsApp Share Button */}
                  <button
                    type="button"
                    onClick={() => sendDeliveryWhatsApp(activeClient)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <MessageCircle size={15} /> Send WhatsApp Delivery Notice to Client
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUploadAck} className="space-y-2.5">
                  <p className="text-slate-600 text-[11px]">
                    {isReplacingAck 
                      ? 'Upload the corrected PDF deliverable. The old file will be replaced.'
                      : 'Upload the final acknowledgement/receipt PDF. This will mark all workflow stages as complete.'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setAckFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-emerald-200 rounded-lg p-1 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={uploadingAck || !ackFile}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs whitespace-nowrap cursor-pointer transition shadow-xs flex items-center gap-1.5"
                    >
                      {uploadingAck ? <Loader2 className="animate-spin" size={14} /> : isReplacingAck ? 'Overwrite' : 'Upload & Finish'}
                    </button>
                  </div>
                  {isReplacingAck && (
                    <button
                      type="button"
                      onClick={() => setIsReplacingAck(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      Cancel Replace
                    </button>
                  )}
                </form>
              )}
            </div>

            {/* Stages */}
            {loadingTasks ? (
              <div className="py-8 flex justify-center items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="animate-spin text-emerald-600" size={20} /> Loading stages...
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Individual Stage Controls</p>
                {clientTasks.map((task) => (
                  <div key={task._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-slate-900 text-xs sm:text-sm font-semibold">{task.title}</p>
                      {task.remarks && <p className="text-slate-500 text-[11px] mt-0.5">{task.remarks}</p>}
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                      className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveClient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Drawer */}
      {drawerClient && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-end md:items-stretch justify-end">
          <div className="w-full md:max-w-lg bg-white max-h-[85vh] md:max-h-full h-full rounded-t-2xl md:rounded-none shadow-2xl border-t md:border-t-0 md:border-l border-slate-200 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl md:rounded-none">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{drawerClient.name}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-mono">PAN: <span className="text-emerald-700 font-semibold">{drawerClient.panNumber}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/track/${drawerClient.trackingToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 rounded text-xs inline-flex items-center gap-1 font-medium"
                >
                  Full Tab <ExternalLink size={12} />
                </Link>
                <button
                  onClick={() => setDrawerClient(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {loadingDrawer ? (
                <div className="py-20 flex justify-center items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="animate-spin text-emerald-600" size={20} /> Loading client portal...
                </div>
              ) : drawerData ? (
                <>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Documents</h4>
                    {drawerData.tasks?.filter((t: any) => t.files && t.files.length > 0).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No files uploaded yet.</p>
                    ) : (
                      drawerData.tasks
                        ?.filter((t: any) => t.files && t.files.length > 0)
                        .map((task: any) =>
                          task.files.map((fileObj: any, fIdx: number) => (
                            <div key={`${task._id}-${fIdx}`} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 truncate">
                                <FileText size={16} className="text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{fileObj.originalFileName || 'Document'}</p>
                                  <span className="text-[10px] text-slate-400">{task.serviceCategory || task.title}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setPreviewDocUrl(`https://taxfollow-backend.onrender.com${fileObj.fileUrl}`);
                                  setPreviewDocName(fileObj.originalFileName || 'Document');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                              >
                                View
                              </button>
                            </div>
                          ))
                        )
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Filing Timeline</h4>
                    {drawerData.tasks?.map((task: any, idx: number) => (
                      <div key={task._id || idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                          <p className="text-[10px] text-slate-500">{task.remarks || 'No notes'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* CA In-App Document Viewer */}
      {previewDocUrl && (() => {
        const rawName = previewDocName || previewDocUrl;
        const ext = rawName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
        const isPdf = ext === 'pdf';
        const isTextOrCode = ['sql', 'txt', 'csv', 'json', 'log', 'xml'].includes(ext);

        return (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-slate-200">
              <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center truncate max-w-xs px-2">
                  <p className="text-xs font-semibold text-slate-800 truncate">{previewDocName}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{ext || 'file'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDocUrl}
                    download={previewDocName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setPreviewDocUrl(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
                {isImage ? (
                  <img src={previewDocUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : isPdf || isTextOrCode ? (
                  <iframe src={previewDocUrl} className="w-full h-full rounded border-0 bg-white shadow-inner" title="Preview" />
                ) : (
                  <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-md w-full space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                      <FileText size={30} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{previewDocName}</p>
                      <p className="text-slate-500 text-xs mt-1">Direct preview not supported for .{ext} files.</p>
                    </div>
                    <a
                      href={previewDocUrl}
                      download={previewDocName}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <Download size={14} /> Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Client Modal with Custom Document Inputs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  required
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 uppercase font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="client@mail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp / Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {/* Multi-Select Service Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Applicable Standard Services
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isSelected = formData.services.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{srv.label}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Document Requirements Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  + Add Custom Document Requirements (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Agar client se koi alag specific file mangwani ho (jaise Rent Agreement, Sale Deed, etc.):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Document Name (e.g. Rent Agreement)"
                    value={newReqName}
                    onChange={(e) => setNewReqName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Instructions / Hint (e.g. 11 Months PDF)"
                    value={newReqHint}
                    onChange={(e) => setNewReqHint(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustomReq}
                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  + Add Document Requirement Slot
                </button>

                {customReqs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {customReqs.map((req, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{req.name}</span>
                          {req.hint && <span className="text-slate-500 text-[11px] block">{req.hint}</span>}
                        </div>
                        <button type="button" onClick={() => removeCustomReq(i)} className="text-rose-600 hover:text-rose-800 font-bold px-1 cursor-pointer">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg text-sm shadow-sm cursor-pointer transition flex items-center gap-1.5"
                >
                  {savingClient ? <Loader2 className="animate-spin" size={14} /> : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientTracker() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingStatus, setUploadingStatus] = useState<{ category: string; count: number } | null>(null);

  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [previewTargetDoc, setPreviewTargetDoc] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await API.get(`/tasks/public/${token}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const finalAckTask = data?.tasks?.find(
    (t: any) => (t.title === 'Acknowledgement Generated' || t.documentType === 'ITR Acknowledgement') && t.files?.length > 0
  );
  const ackFileItem = finalAckTask?.files?.[0];

  const handleMultipleUpload = async (category: string, filesList: FileList) => {
    if (!filesList || filesList.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < filesList.length; i++) {
      formData.append('files', filesList[i]);
    }
    formData.append('serviceCategory', category);

    setUploadingStatus({ category, count: filesList.length });
    try {
      await API.post(`/tasks/upload/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingStatus(null);
    }
  };

  const handleDeleteFile = async (taskId: string, fileIndex: number) => {
    try {
      await API.delete(`/tasks/upload/${token}/file/${taskId}/${fileIndex}`);
      await fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={30} />
        <p className="text-slate-500 text-xs">Loading Status...</p>
      </div>
    );
  }

  if (!data || !data.client) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm">
          <p className="text-rose-600 font-semibold text-sm mb-4">Invalid or Expired Link</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </div>
    );
  }


  
  // Combine standard services + custom requirement slots
  const selectedServices = data.client.serviceType 
  ? data.client.serviceType.split(', ').filter(Boolean) 
  : [];

// Combine standard services + custom requirement slots
const allRequirementSlots = [
  ...selectedServices.map((name: string) => ({
    name,
    hint: AVAILABLE_SERVICES.find((s) => s.id === name)?.hint || '',
    isCustom: false,
  })),
  ...(data.client.customRequirements || []).map((cr: any) => ({
    name: cr.name,
    hint: cr.hint || '',
    isCustom: true,
  })),
];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-5">
      {/* Client Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{data.client.name}</h1>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedServices.map((srv: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {srv}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">PAN</p>
          <p className="font-mono text-xs sm:text-sm font-bold text-slate-800">{data.client.panNumber}</p>
        </div>
      </div>

     {/* FINAL DELIVERABLE BANNER */}
{ackFileItem && (() => {
  const service = (data.client.serviceType || '').toLowerCase();
  const isGST = service.includes('gst');
  const isTDS = service.includes('tds');
  const isITR = service.includes('itr') || service.includes('income tax');

  const bannerTitle = isGST 
    ? 'GST Return Filed Successfully!' 
    : isTDS 
    ? 'TDS Compliance Completed!' 
    : isITR 
    ? 'Tax Return Filed Successfully!' 
    : 'Work Completed Successfully!';

  const bannerDesc = isGST
    ? 'Aapka GST Return successfully file ho chuka hai. Official GSTR Acknowledgement neeche se download karein:'
    : isTDS
    ? 'Aapka TDS compliance pura ho chuka hai. Official TDS Receipt neeche se download karein:'
    : isITR
    ? 'Aapka ITR successfully file ho chuka hai. Original ITR-V Acknowledgement Receipt neeche se download karein:'
    : 'Aapka compliance work pura ho chuka hai. Verified final document neeche se download karein:';

  const btnLabel = isGST 
    ? 'Download GST Receipt' 
    : isTDS 
    ? 'Download TDS Receipt' 
    : isITR 
    ? 'Download ITR-V Receipt' 
    : 'Download Final Document';

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md space-y-3">
      <div className="flex items-center gap-2">
        <CheckCheck className="text-emerald-200" size={24} />
        <h2 className="text-base sm:text-lg font-bold">{bannerTitle}</h2>
      </div>
      <p className="text-xs text-emerald-100">{bannerDesc}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={`https://taxfollow-backend.onrender.com${ackFileItem.fileUrl}`}
          download={ackFileItem.originalFileName || 'Final_Document.pdf'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition cursor-pointer"
        >
          <Download size={15} /> {btnLabel}
        </a>
        <button
          onClick={() => {
            setPreviewTargetDoc(ackFileItem);
            setViewDocOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          <Eye size={14} /> Quick View
        </button>
      </div>
    </div>
  );
})()}
      {/* Multi-File Upload Slots (Standard + Custom) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Upload size={16} className="text-emerald-600" /> Document Submissions
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Neeche maange gaye sabhi documents select karke upload karein:
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {allRequirementSlots.map((slot: any, idx: number) => {
            const matchedTask = data.tasks?.find(
              (t: any) => t.documentType === 'Client Document' && t.serviceCategory === slot.name
            );

            const uploadedFilesList = matchedTask?.files || [];
            const isUploadingThis = uploadingStatus?.category === slot.name;
            const inputId = `file-input-${idx}`;

            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${slot.isCustom ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                      {slot.name}
                      {slot.isCustom && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">Custom</span>}
                    </span>
                    {slot.hint && <p className="text-[11px] text-slate-500 mt-0.5">{slot.hint}</p>}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                    {uploadedFilesList.length} Files Uploaded
                  </span>
                </div>

                {uploadedFilesList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {uploadedFilesList.map((fileObj: any, fIdx: number) => (
                      <div key={fIdx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={16} className="text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-slate-800 truncate">{fileObj.originalFileName}</p>
                            <p className="text-[9px] text-slate-400">
                              {fileObj.uploadedAt ? new Date(fileObj.uploadedAt).toLocaleDateString() : 'Received'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setPreviewTargetDoc(fileObj);
                              setViewDocOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteFile(matchedTask._id, fIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <input
                    id={inputId}
                    type="file"
                    multiple
                    disabled={isUploadingThis}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMultipleUpload(slot.name, e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor={inputId}
                    className={`w-full py-2.5 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition ${
                      isUploadingThis
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <Loader2 className="animate-spin text-emerald-600" size={15} />
                        <span>Uploading {uploadingStatus?.count} file(s)...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-emerald-600" />
                        <span>{uploadedFilesList.length > 0 ? '+ Add More Files' : `Upload ${slot.name}`}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-5">Filing Status Timeline</h2>

        <div className="space-y-5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
          {(data.tasks && data.tasks.length > 0
            ? data.tasks.filter((t: any) => t.documentType !== 'Client Document' || t.title === 'Documents Uploaded')
            : []
          ).map((task: any, index: number) => {
            const isCompleted = task.status === 'Completed' || task.status === 'Uploaded';
            const isInProgress = task.status === 'In Progress';

            return (
              <div key={task._id || index} className="relative flex items-start gap-3 pl-8">
                <div
                  className={`absolute left-1 top-1 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isInProgress
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">{task.title}</h3>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  {task.remarks && <p className="text-slate-500 text-[11px]">{task.remarks}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Document Viewer Modal */}
      {viewDocOpen && previewTargetDoc?.fileUrl && (() => {
        const fileUrl = `https://taxfollow-backend.onrender.com${previewTargetDoc.fileUrl}`;
        const rawName = previewTargetDoc.originalFileName || previewTargetDoc.fileUrl;
        const ext = rawName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
        const isPdf = ext === 'pdf';
        const isTextOrCode = ['sql', 'txt', 'csv', 'json', 'log', 'xml'].includes(ext);

        return (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-slate-200">
              <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setViewDocOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center truncate max-w-xs px-2">
                  <p className="text-xs font-semibold text-slate-800 truncate">{previewTargetDoc.originalFileName || 'Uploaded Document'}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{ext || 'file'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    download={previewTargetDoc.originalFileName || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Download File"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setViewDocOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
                {isImage ? (
                  <img src={fileUrl} alt="Submitted Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : isPdf || isTextOrCode ? (
                  <iframe src={fileUrl} className="w-full h-full rounded border-0 bg-white shadow-inner" title="Preview" />
                ) : (
                  <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-md w-full space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                      <FileText size={30} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{previewTargetDoc.originalFileName || 'Document File'}</p>
                      <p className="text-slate-500 text-xs mt-1">Direct preview not supported for .{ext} files.</p>
                    </div>
                    <a
                      href={fileUrl}
                      download={previewTargetDoc.originalFileName || 'downloaded_file'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <Download size={14} /> Download & View File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function NavigationBar({ isAuthenticated, onLogoutRequest }: { isAuthenticated: boolean; onLogoutRequest: () => void }) {
  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-emerald-700">
        <Shield size={20} className="text-emerald-600" /> TaxFollow
      </Link>
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <button
            onClick={onLogoutRequest}
            className="text-xs flex items-center gap-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-medium cursor-pointer transition"
          >
            <LogOut size={13} /> Logout
          </button>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="text-xs px-2.5 py-1.5 text-slate-700 hover:text-slate-900 font-medium">
              Login
            </Link>
            <Link to="/register" className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <NavigationBar 
          isAuthenticated={isAuthenticated} 
          onLogoutRequest={() => setShowLogoutConfirm(true)} 
        />

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                <LogOut size={22} className="text-slate-600" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Confirm Logout</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to log out of your CA practice account?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="py-2 sm:py-4">
          <Routes>
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/register" element={<Register onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/forgot-password" element={<ForgotPassword onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/track/:token" element={<ClientTracker />} />
            <Route
              path="/"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}