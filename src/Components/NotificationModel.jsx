// src/Components/NotificationModel.jsx
import { useState } from "react";

export default function NotificationModal({ record, onClose }) {
  const [channel, setChannel] = useState("whatsapp");
  const [sentStatus, setSentStatus] = useState(false);

  const defaultMsg = `Dear ${record?.user || "Member"}, your payment of ${record?.amount || "₹1,000"} towards ${record?.category || "Share Capital"} has been successfully recorded. Ref: ${record?.transactionId || "UPI/2026/839"}. - Private Members Savings & Loan Group`;
  
  const [message, setMessage] = useState(defaultMsg);

  const handleSend = () => {
    setSentStatus(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        
        <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-4">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Instant Dispatch</span>
            <h3 className="text-lg font-black text-[#102a43] mt-1 m-0">Send Member Notification</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {sentStatus ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 font-bold text-xs space-y-2">
            <span className="text-3xl block">✅</span>
            Message successfully dispatched via {channel.toUpperCase()}!
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Dispatch Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`p-2.5 rounded-xl font-bold border transition ${
                    channel === "whatsapp" ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  🟢 WhatsApp Message
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={`p-2.5 rounded-xl font-bold border transition ${
                    channel === "sms" ? "bg-blue-50 border-blue-500 text-blue-800 shadow-sm" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  📱 SMS Gateway
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Mobile</label>
              <input
                type="text"
                value="+91 98765 43210"
                readOnly
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Preview</label>
              <textarea
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed outline-none focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition shadow-sm cursor-pointer"
              >
                Dispatch Now 🚀
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}