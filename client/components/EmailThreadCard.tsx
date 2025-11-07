import { Minus, X, ThumbsUp, ThumbsDown, MessageSquare, User } from "lucide-react";

interface EmailThreadCardProps {
  title?: string;
  subtitle?: string;
  summary?: string[];
  senderName?: string;
  senderEmail?: string;
  date?: string;
  subject?: string;
  attachments?: string[];
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onLeaveFeedback?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export default function EmailThreadCard({
  title = "April Engine Thread - CAT Fault and Servicing Log",
  subtitle = "Fuel pressure sensor fault detected on starboard main engine.",
  summary = [
    "New Injectors needed (on two engines).",
    "New 32MM Flexible hose ordered (Arriving March 2026)",
    "Replacement Fridge for ECR (Arriving in Shipyard)"
  ],
  senderName = "John Smith",
  senderEmail = "john.smith@cat_engines.com",
  date = "April 24th 2023",
  subject = "CAT-321 Main Engine Overview",
  attachments = [
    "Manual_Version_3.2.pdf",
    "Engine_221.png",
    "Screenshot_23.05.2023.15:07:23.heic",
    "Engineer_notes.docx"
  ],
  onHelpful,
  onNotHelpful,
  onLeaveFeedback,
  onMinimize,
  onClose
}: EmailThreadCardProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative bg-[#FEFEFF] border-2 border-[#E5E5E5] rounded-[26px] shadow-[0_4px_15px_4px_rgba(0,0,0,0.08)] p-10">
        {/* Header Controls */}
        <div className="absolute top-9 right-12 flex gap-4">
          <button 
            className="text-[#848991] hover:text-gray-600 transition-colors"
            onClick={onMinimize}
          >
            <Minus size={26} strokeWidth={2} />
          </button>
          <button 
            className="text-[#848991] hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X size={28} strokeWidth={2} />
          </button>
        </div>

        {/* Main Title */}
        <h1 className="text-[48px] leading-[58px] font-medium text-black font-roboto mb-8 max-w-[676px]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-[26px] leading-[26px] text-[#5F6974] font-eloquia mb-12 tracking-[0.25px]">
          {subtitle}
        </p>

        {/* Summary Section */}
        {summary.length > 0 && (
          <div className="bg-[#F7F8F9] rounded-[13px] p-8 mb-8">
            <h2 className="text-[26px] leading-[26px] text-[#46A450] font-eloquia mb-6">
              Summary of Parts Needed:
            </h2>
            
            <div className="space-y-3 text-[26px] leading-[26.5px] text-black font-eloquia-display tracking-[1px]">
              {summary.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          </div>
        )}

        {/* Email Sender Details */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="bg-[#CDCDCD] rounded-full p-3 flex-shrink-0">
              <User size={48} className="text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[32px] leading-[32.5px] text-black font-eloquia-display font-medium tracking-[0.75px]">
                    {senderName}
                  </h3>
                  <p className="text-[24px] leading-[32.5px] text-[#5F6974] font-eloquia-display tracking-[0.75px]">
                    {senderEmail}
                  </p>
                </div>
                <span className="text-[20px] leading-[32.5px] text-[#5F6974] font-eloquia-display tracking-[0.75px]">
                  {date}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-[26px] leading-[32.5px] text-black font-eloquia-display font-medium tracking-[0.75px]">
              Subject:
            </span>
            <span className="text-[26px] leading-[32.5px] text-[#616874] font-eloquia-display tracking-[0.75px]">
              {subject}
            </span>
          </div>
        </div>

        {/* Documents Section */}
        {attachments.length > 0 && (
          <div className="mb-8 bg-white rounded-lg p-4 border border-gray-100">
            <div className="space-y-2 text-[26px] leading-[32.5px] text-[#616874] font-eloquia-display tracking-[0.75px]">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>⌕</span>
                  <span>{attachment}</span>
                </div>
              ))}
            </div>
            
            {/* Scroll indicator */}
            <div className="flex justify-end mt-4">
              <div className="w-4 h-32 border-2 border-[#D0D1D5] rounded-lg bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.04)] p-1">
                <div className="w-full h-8 bg-[rgba(63,67,80,0.24)] rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Buttons */}
        <div className="flex flex-wrap gap-6 md:gap-14">
          <button 
            className="flex items-center gap-3 px-4 py-3 border border-[#21DA79] bg-[#FEFFFF] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.06)] hover:bg-green-50 transition-colors"
            onClick={onHelpful}
          >
            <ThumbsUp size={36} className="text-black" />
            <span className="text-[28px] leading-[36.4px] text-black font-eloquia-display tracking-[0.7px]">
              Helpful
            </span>
          </button>

          <button 
            className="flex items-center gap-3 px-4 py-3 border border-[#FF6569] bg-white rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.06)] hover:bg-red-50 transition-colors"
            onClick={onNotHelpful}
          >
            <ThumbsDown size={36} className="text-black" />
            <span className="text-[28px] leading-[36.4px] text-black font-eloquia-display tracking-[0.7px]">
              Not Helpful
            </span>
          </button>

          <button 
            className="flex items-center gap-3 px-5 py-3 border border-[#E5E5E5] bg-[#FFFEFF] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-colors"
            onClick={onLeaveFeedback}
          >
            <MessageSquare size={32} className="text-black" />
            <span className="text-[28px] leading-[36.4px] text-black font-eloquia-display tracking-[0.7px]">
              Leave Feedback
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}