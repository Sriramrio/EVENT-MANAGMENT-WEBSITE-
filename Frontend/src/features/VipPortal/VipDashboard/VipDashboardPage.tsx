// import React, { useState, useEffect, useCallback } from 'react';
// import {  VipDashboard } from './VipDashboard'; // The UI component from previous step
// import { AlertCircle, RefreshCw } from 'lucide-react';
// import { apiClient } from '../../../data/api/apiClient';

// interface VipDashboardPageProps {
//   initialTenantId?: string;
//   initialEventId?: string;
// }

// export const VipDashboardPage: React.FC<VipDashboardPageProps> = ({
//   initialTenantId = '11111111-1111-1111-1111-111111111111',
//   initialEventId = '22222222-2222-2222-2222-222222222222'
// }) => {
//   const [tenantId, setTenantId] = useState<string>(initialTenantId);
//   const [eventId, setEventId] = useState<string>(initialEventId);
  
//   const [data, setData] = useState<VipDashboardSummaryDto | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch function connecting to your ASP.NET Core API
//   const fetchDashboardData = useCallback(async () => {
//     if (!tenantId || !eventId) {
//       setError('Please provide both Tenant ID and Event ID to load dashboard metrics.');
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       // Endpoint matching your Controller: GET /api/v1/vips/dashboard?tenantId=...&eventId=...
//       const response = await apiClient.get(
//         `/vips/dashboard?tenantId=${encodeURIComponent(tenantId)}&eventId=${encodeURIComponent(eventId)}`,
        
//       );

//       if (!response) {
//         const errorData = await response
//         // throw new Error(errorData.message || `Server returned status ${response.status}`);
//       }

     
//       setData(response as VipDashboardSummaryDto);
//     } catch (err: any) {
//       setError(err.message || 'Failed to connect to the server.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [tenantId, eventId]);

//   // Initial load when tenantId and eventId are valid
//   useEffect(() => {
//     if (tenantId && eventId) {
//       fetchDashboardData();
//     }
//   }, [fetchDashboardData, tenantId, eventId]);

//   return (
//     <div className="space-y-4">
//       {/* Parameters Header Bar */}
//       <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-end justify-between">
//         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
//           <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1">
//               Tenant ID
//             </label>
//             <input
//               type="text"
//               value={tenantId}
//               onChange={(e) => setTenantId(e.target.value)}
//               placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
//               className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-72"
//             />
//           </div>
//           <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1">
//               Event ID
//             </label>
//             <input
//               type="text"
//               value={eventId}
//               onChange={(e) => setEventId(e.target.value)}
//               placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
//               className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-72"
//             />
//           </div>
//         </div>

//         <button
//           onClick={fetchDashboardData}
//           disabled={isLoading || !tenantId || !eventId}
//           className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer w-full md:w-auto justify-center"
//         >
//           <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
//           Load Metrics
//         </button>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
//           <AlertCircle className="w-4 h-4 shrink-0" />
//           <span>{error}</span>
//         </div>
//       )}

//       {/* Main Dashboard Render */}
//       {data ? (
//         <VipDashboard data={data} onRefresh={fetchDashboardData} isLoading={isLoading} />
//       ) : (
//         !isLoading && (
//           <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
//             Enter valid <span className="font-mono">tenantId</span> and <span className="font-mono">eventId</span> query parameters to load dashboard data.
//           </div>
//         )
//       )}
//     </div>
//   );
// };