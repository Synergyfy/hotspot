import React, { useState, useEffect } from 'react';
import { Lead, Campaign } from '../types';
import { Download, Search, Mail, Calendar, Tag, Trash2, ArrowLeft, X, User, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { leadsApi } from '../api/services';
import { campaignsApi } from '../api/campaigns';

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, campaignsRes] = await Promise.all([
          leadsApi.findAll(),
          campaignsApi.findAll()
        ]);
        setLeads(leadsRes.data);
        setCampaigns(campaignsRes.data);
      } catch (err) {
        console.error('Failed to fetch leads data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampaign = selectedCampaignId === 'all' || lead.campaignId === selectedCampaignId;
    return matchesSearch && matchesCampaign;
  });

  const getCampaignName = (id: string | number) => {
    return campaigns.find(c => String(c.id) === String(id))?.name || 'Unknown Campaign';
  };

  const exportLeads = () => {
    const headers = ['Name', 'Email', 'Campaign', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.name || 'Anonymous'}"`,
        `"${lead.email}"`,
        `"${getCampaignName(lead.campaignId)}"`,
        `"${new Date(lead.createdAt || (lead as any).timestamp).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteLead = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.remove(id);
      setLeads(leads.filter(l => l.id !== id));
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lead Management</h1>
        </div>
        
        <button 
          onClick={exportLeads}
          disabled={filteredLeads.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-sm"
            />
          </div>
          <select 
            value={selectedCampaignId}
            onChange={e => setSelectedCampaignId(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold shadow-sm"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Information</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Campaign</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capture Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{lead.name || 'Anonymous'}</p>
                          <p className="text-sm text-slate-400 font-medium">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg w-fit">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-600">{getCampaignName(lead.campaignId)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.createdAt || (lead as any).timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLeads.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No leads found</h3>
              <p className="text-slate-400 max-w-xs mx-auto">Try adjusting your search filters or campaigns.</p>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLead(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">Lead Details</h2>
                    <p className="text-sm text-slate-500 font-medium">Captured from {getCampaignName(selectedLead.campaignId)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLead.email}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capture Date</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(selectedLead.createdAt || (selectedLead as any).timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Form Submissions</h3>
                  </div>

                  <div className="grid gap-3">
                    {Object.entries(selectedLead.data || {}).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1 p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                        <span className="text-sm font-bold text-slate-900">{value}</span>
                      </div>
                    ))}
                    {!selectedLead.data && (
                      <div className="text-center py-6">
                        <p className="text-slate-400 text-sm font-medium">No additional form data captured.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
