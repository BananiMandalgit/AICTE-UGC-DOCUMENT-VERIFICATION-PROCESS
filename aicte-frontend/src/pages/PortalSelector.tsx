import { useNavigate } from 'react-router-dom';
import { usePortal } from '@/contexts/PortalContext';

export default function PortalSelector() {
  const navigate = useNavigate();
  const { setSelectedPortal } = usePortal();

  const handlePortalSelect = (portal: 'AICTE' | 'UGC') => {
    setSelectedPortal(portal);
    if (portal === 'AICTE') {
      navigate('/aicte');
    } else {
      navigate('/ugc');
    }
  };

  const handleAishe = () => {
    setSelectedPortal(null);
    navigate('/aishe');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-white px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-green-200/40 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
            Approval Engine X
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Select a portal to proceed with document verification
          </p>
        </div>

        {/* Portal Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AICTE Button */}
          <button
            onClick={() => handlePortalSelect('AICTE')}
            className="group relative px-8 py-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="text-5xl font-bold text-white mb-2">AICTE</div>
              <p className="text-emerald-100 font-medium">All India Council for Technical Education</p>
            </div>
          </button>

          {/* UGC Button */}
          <button
            onClick={() => handlePortalSelect('UGC')}
            className="group relative px-8 py-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="text-5xl font-bold text-white mb-2">UGC</div>
              <p className="text-blue-100 font-medium">University Grants Commission</p>
            </div>
          </button>

          {/* AISHE Button */}
          <button
            onClick={handleAishe}
            className="group relative px-8 py-12 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-5xl font-bold text-white mb-2">AISHE</div>
              <p className="text-violet-100 font-medium">All India Survey on Higher Education</p>
            </div>
          </button>
        </div>

        {/* Footer text */}
        <div className="mt-12 text-slate-500 text-sm">
          <p>Choose your organization to access the document verification portal</p>
        </div>
      </div>
    </div>
  );
}
