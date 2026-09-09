import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PackagePlus,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  AlertCircle,
  Check,
  Building2,
  Store,
  Tag,
  Boxes,
  Layers,
  Coins,
  Filter,
  Sparkles,
  Image as ImageIcon,
  Upload,
  ZoomIn,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient, ApiError } from '../../../data/api/apiClient';
import { PageHeader } from '../../../shared/components/PageHeader';
import { ImagePreviewModal } from '../../../shared/components/ImagePreviewModal';
import { RefreshListButton } from '../../../shared/components/RefreshListButton';

interface RequirementLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

interface RequirementRequest {
  id: string;
  exhibitorId: string;
  companyName: string;
  legalName?: string | null;
  tradeName?: string | null;
  contactPersonName: string | null;
  mobile: string | null;
  email: string | null;
  city?: string | null;
  state?: string | null;
  gstin?: string | null;
  pan?: string | null;
  bookingId: string;
  bookingRegistrationNumber: string;
  stallNumber: string | null;
  stallSize?: string | null;
  status: 'Pending' | 'Confirmed' | 'Rejected';
  totalBaseAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  createdAt: string;
  confirmedAt: string | null;
  confirmedByUserId: string | null;
  callNotes: string | null;
  notes?: string | null;
  lines: RequirementLine[];
}

interface CatalogItem {
  id: string;
  code: string;
  name: string;
  baseAmount: number;
  gstPercentage: number;
  unitGstAmount: number;
  unitTotalAmount: number;
  imageUrl?: string | null;
  isActive: boolean;
}

type TabType = 'requests' | 'catalog';

const EXHIBITOR_REQUIREMENTS_KEY = ['admin', 'exhibitor-requirements'] as const;
const REQUIREMENT_CATALOG_KEY = ['admin', 'additional-requirement-items'] as const;
const REQUIREMENT_FEATURE_STATUS_KEY = ['admin', 'exhibitor-requirements', 'feature-status'] as const;

export function ExhibitorRequirementsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  // Requests query with 5-minute caching
  const {
    data: requests = [],
    isLoading: loadingRequests,
    isFetching: isFetchingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: EXHIBITOR_REQUIREMENTS_KEY,
    queryFn: () => apiClient.get<RequirementRequest[]>('/admin/exhibitor-requirements'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Search & Filter UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Confirmed' | 'Rejected'>('ALL');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('ALL');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Status Action Modal (Confirm / Reject with Call Notes)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: 'confirm' | 'reject';
    requestId: string;
    companyName: string;
    callNotes: string;
    submitting: boolean;
  }>({
    isOpen: false,
    action: 'confirm',
    requestId: '',
    companyName: '',
    callNotes: '',
    submitting: false
  });

  // Catalog items query with 5-minute caching
  const {
    data: catalogItems = [],
    isLoading: loadingCatalog,
    isFetching: isFetchingCatalog,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: REQUIREMENT_CATALOG_KEY,
    queryFn: () => apiClient.get<CatalogItem[]>('/admin/additional-requirement-items'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSortKey, setCatalogSortKey] = useState<
    'sno' | 'code' | 'name' | 'baseAmount' | 'gstPercentage' | 'unitGstAmount' | 'unitTotalAmount' | 'isActive'
  >('name');
  const [catalogSortDirection, setCatalogSortDirection] = useState<'asc' | 'desc'>('asc');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);

  // Catalog Item Modal (Add / Edit)
  const [itemModal, setItemModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    itemId?: string;
    code: string;
    name: string;
    baseAmount: string;
    gstPercentage: string;
    unit: string;
    stallSize: string;
    imageUrl: string | null;
    submitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    mode: 'add',
    code: '',
    name: '',
    baseAmount: '',
    gstPercentage: '18',
    unit: 'Nos',
    stallSize: 'All Sizes',
    imageUrl: null,
    submitting: false,
    error: null
  });

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title?: string;
    subtitle?: string;
  }>({
    isOpen: false,
    imageUrl: null,
    title: '',
    subtitle: ''
  });

  // General state
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Requirements Flow Feature Toggle State (Enable / Disable)
  const {
    data: featureStatusData,
    refetch: refetchFeatureStatus,
  } = useQuery({
    queryKey: REQUIREMENT_FEATURE_STATUS_KEY,
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ enabled: boolean }>('/admin/exhibitor-requirements/feature-status');
        return res ?? { enabled: true };
      } catch {
        return { enabled: true };
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const featureEnabled = featureStatusData?.enabled ?? true;
  const [togglingFeature, setTogglingFeature] = useState(false);
  const [confirmToggleModal, setConfirmToggleModal] = useState(false);

  // Handle Feature Toggle
  const handleToggleFeature = async () => {
    setTogglingFeature(true);
    try {
      const res = await apiClient.post<{ enabled: boolean; message: string }>(
        '/admin/exhibitor-requirements/feature-status',
        { enabled: !featureEnabled }
      );
      queryClient.setQueryData(REQUIREMENT_FEATURE_STATUS_KEY, { enabled: res.enabled });
      await queryClient.invalidateQueries({ queryKey: REQUIREMENT_FEATURE_STATUS_KEY });
      setGlobalSuccess(res.message || `Requirements flow is now ${res.enabled ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      setGlobalError(err instanceof ApiError ? err.message : 'Failed to update feature status.');
    } finally {
      setTogglingFeature(false);
      setConfirmToggleModal(false);
    }
  };

  // Selected Catalog Item reference
  const selectedCatalogItem = useMemo(() => {
    if (selectedCatalogItemId === 'ALL') return null;
    return (
      catalogItems.find(
        (it) => it.id === selectedCatalogItemId || it.code.toUpperCase() === selectedCatalogItemId.toUpperCase()
      ) || null
    );
  }, [catalogItems, selectedCatalogItemId]);

  // Item Analytics Calculations
  const itemAnalytics = useMemo(() => {
    if (selectedCatalogItemId === 'ALL' || !selectedCatalogItem) {
      const totalUnits = requests.reduce(
        (acc, r) => acc + r.lines.reduce((lAcc, l) => lAcc + l.quantity, 0),
        0
      );
      const totalValue = requests.reduce((acc, r) => acc + r.grandTotal, 0);
      const totalBase = requests.reduce((acc, r) => acc + r.totalBaseAmount, 0);
      const totalGst = requests.reduce((acc, r) => acc + r.totalGstAmount, 0);
      const confirmedValue = requests
        .filter((r) => r.status === 'Confirmed')
        .reduce((acc, r) => acc + r.grandTotal, 0);
      const pendingUnits = requests
        .filter((r) => r.status === 'Pending')
        .reduce((acc, r) => acc + r.lines.reduce((lAcc, l) => lAcc + l.quantity, 0), 0);
      const confirmedUnits = requests
        .filter((r) => r.status === 'Confirmed')
        .reduce((acc, r) => acc + r.lines.reduce((lAcc, l) => lAcc + l.quantity, 0), 0);
      const rejectedUnits = requests
        .filter((r) => r.status === 'Rejected')
        .reduce((acc, r) => acc + r.lines.reduce((lAcc, l) => lAcc + l.quantity, 0), 0);

      return {
        isAll: true,
        selectedItem: null,
        totalRequests: requests.length,
        totalUnits,
        pendingUnits,
        confirmedUnits,
        rejectedUnits,
        totalBase,
        totalGst,
        totalValue,
        confirmedValue
      };
    }

    // Specific selected item calculations
    let totalUnits = 0;
    let pendingUnits = 0;
    let confirmedUnits = 0;
    let rejectedUnits = 0;
    let totalBase = 0;
    let totalGst = 0;
    let totalValue = 0;
    let matchedRequestsCount = 0;

    for (const req of requests) {
      const matchingLines = req.lines.filter(
        (l) =>
          l.itemId === selectedCatalogItem.id ||
          l.itemCode.toUpperCase() === selectedCatalogItem.code.toUpperCase()
      );

      if (matchingLines.length > 0) {
        matchedRequestsCount++;
        for (const line of matchingLines) {
          totalUnits += line.quantity;
          totalBase += line.baseAmount * line.quantity;
          totalGst += line.gstAmount;
          totalValue += line.totalAmount;

          if (req.status === 'Pending') pendingUnits += line.quantity;
          else if (req.status === 'Confirmed') confirmedUnits += line.quantity;
          else if (req.status === 'Rejected') rejectedUnits += line.quantity;
        }
      }
    }

    return {
      isAll: false,
      selectedItem: selectedCatalogItem,
      totalRequests: matchedRequestsCount,
      totalUnits,
      pendingUnits,
      confirmedUnits,
      rejectedUnits,
      totalBase,
      totalGst,
      totalValue,
      confirmedValue: 0
    };
  }, [requests, selectedCatalogItemId, selectedCatalogItem]);

  // Request filters (Status + Search + Item Dropdown)
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // Item dropdown filter
      if (selectedCatalogItemId !== 'ALL' && selectedCatalogItem) {
        const hasItem = r.lines.some(
          (l) =>
            l.itemId === selectedCatalogItem.id ||
            l.itemCode.toUpperCase() === selectedCatalogItem.code.toUpperCase()
        );
        if (!hasItem) return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        r.companyName.toLowerCase().includes(q) ||
        (r.contactPersonName && r.contactPersonName.toLowerCase().includes(q)) ||
        (r.mobile && r.mobile.includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        r.bookingRegistrationNumber.toLowerCase().includes(q) ||
        (r.stallNumber && r.stallNumber.toLowerCase().includes(q))
      );
    });
  }, [requests, statusFilter, searchQuery, selectedCatalogItemId, selectedCatalogItem]);

  // Request counts
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'Pending').length,
      confirmed: requests.filter((r) => r.status === 'Confirmed').length,
      rejected: requests.filter((r) => r.status === 'Rejected').length
    };
  }, [requests]);

  // Open Action Modal (Confirm / Reject)
  const openActionModal = (req: RequirementRequest, action: 'confirm' | 'reject') => {
    setActionModal({
      isOpen: true,
      action,
      requestId: req.id,
      companyName: req.companyName,
      callNotes: req.callNotes || '',
      submitting: false
    });
  };

  // Submit Action Modal
  const handleStatusActionSubmit = async () => {
    setActionModal((prev) => ({ ...prev, submitting: true }));
    setGlobalError(null);
    setGlobalSuccess(null);

    try {
      const endpoint = `/admin/exhibitor-requirements/${actionModal.requestId}/${actionModal.action}`;
      await apiClient.post(endpoint, { callNotes: actionModal.callNotes });

      setGlobalSuccess(
        `Requirement request for "${actionModal.companyName}" marked as ${actionModal.action === 'confirm' ? 'Confirmed' : 'Rejected'
        } successfully.`
      );
      setActionModal((prev) => ({ ...prev, isOpen: false }));
      await queryClient.invalidateQueries({ queryKey: EXHIBITOR_REQUIREMENTS_KEY });
    } catch (err: any) {
      setGlobalError(err instanceof ApiError ? err.message : `Failed to ${actionModal.action} requirement request.`);
    } finally {
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Helper to trigger UTF-8 BOM CSV download for full Excel / spreadsheet compatibility
  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to escape CSV string values
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Format Date for CSV
  const formatCsvDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Detailed Itemized CSV Export (1 Row per Booked Line Item)
  const handleExportDetailedCsv = () => {
    if (filteredRequests.length === 0) {
      setGlobalError('No requirement requests match current filters to export.');
      return;
    }

    const headers = [
      'S.No.',
      'Exhibitor / Company Name',
      'Legal Name',
      'Contact Person',
      'Mobile',
      'Email',
      'City',
      'State',
      'GSTIN',
      'PAN',
      'Booking Reg No',
      'Stall Number',
      'Stall Size',
      'Requirement Status',
      'Item Code',
      'Item Description',
      'Quantity',
      'Unit Base Price (INR)',
      'GST Rate (%)',
      'GST Amount (INR)',
      'Line Total (INR)',
      'Request Grand Total (INR)',
      'Requested Date',
      'Confirmed Date',
      'Call / Operations Notes',
      'Exhibitor Remarks'
    ];

    const rows: string[][] = [];
    let rowIndex = 1;

    for (const req of filteredRequests) {
      // If a specific catalog item is filtered in dropdown, include only matching lines
      const matchingLines =
        selectedCatalogItemId !== 'ALL' && selectedCatalogItem
          ? req.lines.filter(
              (l) =>
                l.itemId === selectedCatalogItem.id ||
                l.itemCode.toUpperCase() === selectedCatalogItem.code.toUpperCase()
            )
          : req.lines;

      for (const line of matchingLines) {
        rows.push([
          String(rowIndex++),
          escapeCsv(req.companyName || req.tradeName || req.legalName || ''),
          escapeCsv(req.legalName || ''),
          escapeCsv(req.contactPersonName || ''),
          escapeCsv(req.mobile || ''),
          escapeCsv(req.email || ''),
          escapeCsv(req.city || ''),
          escapeCsv(req.state || ''),
          escapeCsv(req.gstin || ''),
          escapeCsv(req.pan || ''),
          escapeCsv(req.bookingRegistrationNumber || ''),
          escapeCsv(req.stallNumber || ''),
          escapeCsv(req.stallSize || ''),
          escapeCsv(req.status || ''),
          escapeCsv(line.itemCode || ''),
          escapeCsv(line.itemName || ''),
          String(line.quantity || 0),
          String(line.baseAmount || 0),
          `${line.gstPercentage || 0}%`,
          String(line.gstAmount || 0),
          String(line.totalAmount || 0),
          String(req.grandTotal || 0),
          escapeCsv(formatCsvDate(req.createdAt)),
          escapeCsv(formatCsvDate(req.confirmedAt)),
          escapeCsv(req.callNotes || ''),
          escapeCsv(req.notes || '')
        ]);
      }
    }

    if (rows.length === 0) {
      setGlobalError('No line item rows found matching the selected filter.');
      return;
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const itemSlug = selectedCatalogItem ? `_${selectedCatalogItem.code}` : '';
    const statusSlug = statusFilter !== 'ALL' ? `_${statusFilter}` : '';
    const filename = `Exhibitor_Requirements_Detailed${statusSlug}${itemSlug}_${new Date().toISOString().slice(0, 10)}.csv`;

    triggerCsvDownload(csvContent, filename);
    setShowExportMenu(false);
    setGlobalSuccess(`Exported ${rows.length} requirement line items to CSV.`);
  };

  // Exhibitor Summary CSV Export (1 Row per Exhibitor)
  const handleExportSummaryCsv = () => {
    if (filteredRequests.length === 0) {
      setGlobalError('No requirement requests match current filters to export.');
      return;
    }

    const headers = [
      'S.No.',
      'Exhibitor / Company Name',
      'Legal Name',
      'Contact Person',
      'Mobile',
      'Email',
      'City',
      'State',
      'GSTIN',
      'PAN',
      'Booking Reg No',
      'Stall Number',
      'Stall Size',
      'Requirement Status',
      'Total Items Count',
      'Booked Additional Items Summary',
      'Total Base Amount (INR)',
      'Total GST Amount (INR)',
      'Grand Total (INR)',
      'Requested Date',
      'Confirmed Date',
      'Call / Operations Notes',
      'Exhibitor Remarks'
    ];

    const rows = filteredRequests.map((req, idx) => {
      const itemsSummary = req.lines.map((l) => `${l.itemName} (x${l.quantity})`).join('; ');
      const totalUnits = req.lines.reduce((s, l) => s + l.quantity, 0);

      return [
        String(idx + 1),
        escapeCsv(req.companyName || req.tradeName || req.legalName || ''),
        escapeCsv(req.legalName || ''),
        escapeCsv(req.contactPersonName || ''),
        escapeCsv(req.mobile || ''),
        escapeCsv(req.email || ''),
        escapeCsv(req.city || ''),
        escapeCsv(req.state || ''),
        escapeCsv(req.gstin || ''),
        escapeCsv(req.pan || ''),
        escapeCsv(req.bookingRegistrationNumber || ''),
        escapeCsv(req.stallNumber || ''),
        escapeCsv(req.stallSize || ''),
        escapeCsv(req.status || ''),
        String(totalUnits),
        escapeCsv(itemsSummary),
        String(req.totalBaseAmount || 0),
        String(req.totalGstAmount || 0),
        String(req.grandTotal || 0),
        escapeCsv(formatCsvDate(req.createdAt)),
        escapeCsv(formatCsvDate(req.confirmedAt)),
        escapeCsv(req.callNotes || ''),
        escapeCsv(req.notes || '')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const itemSlug = selectedCatalogItem ? `_${selectedCatalogItem.code}` : '';
    const statusSlug = statusFilter !== 'ALL' ? `_${statusFilter}` : '';
    const filename = `Exhibitor_Requirements_Summary${statusSlug}${itemSlug}_${new Date().toISOString().slice(0, 10)}.csv`;

    triggerCsvDownload(csvContent, filename);
    setShowExportMenu(false);
    setGlobalSuccess(`Exported ${rows.length} exhibitor summaries to CSV.`);
  };

  // Common Catalog Presets for quick creation
  const CATALOG_PRESETS = [
    { category: '⚡ Power & Electrical', name: '5KW 3-Phase Power Socket', code: 'PWR-5KW', baseAmount: '3500', gstPercentage: '18', unit: 'Per Connection', stallSize: 'All Sizes' },
    { category: '⚡ Power & Electrical', name: '15A Single-Phase Power Point', code: 'PWR-15A', baseAmount: '800', gstPercentage: '18', unit: 'Per Point', stallSize: 'All Sizes' },
    { category: '💡 Lighting', name: '50W LED Spotlight', code: 'LGT-50W', baseAmount: '600', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '💡 Lighting', name: '100W Halogen Floodlight', code: 'LGT-FLD', baseAmount: '1200', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🪑 Furniture', name: 'VIP Executive Chair (Cushioned)', code: 'CHR-VIP', baseAmount: '500', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🪑 Furniture', name: 'Standard Visitor Chair', code: 'CHR-STD', baseAmount: '250', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🪑 Furniture', name: 'Glass Top Discussion Table (3ft)', code: 'TBL-GLS', baseAmount: '1000', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🏢 Display & Structure', name: 'Lockable Display Counter / Podium', code: 'CTR-LCK', baseAmount: '2200', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🏢 Display & Structure', name: 'Octanorm Wall Flat Shelf (1m)', code: 'SHF-OCT', baseAmount: '450', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
    { category: '🧹 Utilities', name: 'Waste Paper Bin', code: 'MISC-BIN', baseAmount: '150', gstPercentage: '18', unit: 'Per Unit', stallSize: 'All Sizes' },
  ];

  // Open Item Modal (Add)
  const openAddItemModal = () => {
    setItemModal({
      isOpen: true,
      mode: 'add',
      code: '',
      name: '',
      baseAmount: '',
      gstPercentage: '18',
      unit: 'Nos',
      stallSize: 'All Sizes',
      imageUrl: null,
      submitting: false,
      error: null
    });
  };

  // Open Item Modal (Edit)
  const openEditItemModal = (item: CatalogItem) => {
    setItemModal({
      isOpen: true,
      mode: 'edit',
      itemId: item.id,
      code: item.code,
      name: item.name,
      baseAmount: item.baseAmount.toString(),
      gstPercentage: item.gstPercentage.toString(),
      unit: 'Nos',
      stallSize: 'All Sizes',
      imageUrl: item.imageUrl || null,
      submitting: false,
      error: null
    });
  };

  const handleApplyPreset = (preset: typeof CATALOG_PRESETS[0]) => {
    setItemModal((prev) => ({
      ...prev,
      code: preset.code,
      name: preset.name,
      baseAmount: preset.baseAmount,
      gstPercentage: preset.gstPercentage,
      unit: preset.unit,
      stallSize: preset.stallSize,
      error: null
    }));
  };

  // Catalog filtering by Search Query
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchQuery.trim()) return catalogItems;
    const q = catalogSearchQuery.toLowerCase().trim();
    return catalogItems.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.baseAmount.toString().includes(q) ||
        item.unitTotalAmount.toString().includes(q) ||
        item.gstPercentage.toString().includes(q) ||
        (item.isActive ? 'active' : 'inactive').includes(q)
    );
  }, [catalogItems, catalogSearchQuery]);

  // Catalog Sorting
  const sortedCatalogItems = useMemo(() => {
    const items = [...filteredCatalogItems];
    items.sort((a, b) => {
      let valA: any = a[catalogSortKey as keyof CatalogItem] ?? '';
      let valB: any = b[catalogSortKey as keyof CatalogItem] ?? '';

      if (catalogSortKey === 'sno') {
        valA = a.code;
        valB = b.code;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return catalogSortDirection === 'asc'
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return catalogSortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (valA < valB) return catalogSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return catalogSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredCatalogItems, catalogSortKey, catalogSortDirection]);

  // Catalog Pagination
  const totalCatalogPages = Math.max(1, Math.ceil(sortedCatalogItems.length / catalogPageSize));
  const safeCatalogPage = Math.min(Math.max(1, catalogPage), totalCatalogPages);
  const catalogRangeStart = sortedCatalogItems.length === 0 ? 0 : (safeCatalogPage - 1) * catalogPageSize + 1;
  const catalogRangeEnd = Math.min(safeCatalogPage * catalogPageSize, sortedCatalogItems.length);
  const paginatedCatalogItems = sortedCatalogItems.slice(
    (safeCatalogPage - 1) * catalogPageSize,
    safeCatalogPage * catalogPageSize
  );

  const catalogPageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCatalogPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalCatalogPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safeCatalogPage, totalCatalogPages]);

  const handleCatalogSort = (
    key: 'sno' | 'code' | 'name' | 'baseAmount' | 'gstPercentage' | 'unitGstAmount' | 'unitTotalAmount' | 'isActive'
  ) => {
    if (catalogSortKey === key) {
      setCatalogSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCatalogSortKey(key);
      setCatalogSortDirection('asc');
    }
    setCatalogPage(1);
  };

  /**
   * Compresses and downscales an image using an offscreen HTML5 Canvas.
   * Keeps aspect ratio up to maxDimension (default 400px), converting to 0.8 quality JPEG.
   * Reduces 1MB-10MB images to ~15KB-30KB base64 strings.
   */
  const compressImageFile = (file: File, maxDimension = 400, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Please select a valid image file (PNG, JPG, JPEG, WEBP).'));
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to create canvas context for image compression.'));
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = objectUrl;
    });
  };

  // Image Upload Handler (Auto-compress & Downscale to ~20KB Base64)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setItemModal((prev) => ({ ...prev, error: 'Please select a valid image file (PNG, JPG, JPEG, WEBP).' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setItemModal((prev) => ({ ...prev, error: 'Image size must be less than 10MB.' }));
      return;
    }

    try {
      setItemModal((prev) => ({ ...prev, error: null }));
      const compressed = await compressImageFile(file, 400, 0.8);
      setItemModal((prev) => ({ ...prev, imageUrl: compressed, error: null }));
    } catch (err: any) {
      setItemModal((prev) => ({
        ...prev,
        error: err?.message || 'Failed to process and compress image file.'
      }));
    }
  };

  // Save Item (Create or Update)
  const handleItemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(itemModal.baseAmount);
    const gst = parseFloat(itemModal.gstPercentage);

    if (itemModal.mode === 'add' && !itemModal.code.trim()) {
      setItemModal((prev) => ({ ...prev, error: 'Item code is required.' }));
      return;
    }
    if (!itemModal.name.trim()) {
      setItemModal((prev) => ({ ...prev, error: 'Item name is required.' }));
      return;
    }
    if (isNaN(base) || base <= 0) {
      setItemModal((prev) => ({ ...prev, error: 'Base amount must be greater than zero.' }));
      return;
    }
    if (isNaN(gst) || gst < 0) {
      setItemModal((prev) => ({ ...prev, error: 'GST percentage cannot be negative.' }));
      return;
    }
    if (itemModal.mode === 'add' && !itemModal.imageUrl) {
      setItemModal((prev) => ({ ...prev, error: 'Item image is required. Please upload an image.' }));
      return;
    }

    setItemModal((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      if (itemModal.mode === 'add') {
        await apiClient.post('/admin/additional-requirement-items', {
          code: itemModal.code.trim().toUpperCase(),
          name: itemModal.name.trim(),
          baseAmount: base,
          gstPercentage: gst,
          imageUrl: itemModal.imageUrl
        });
        setGlobalSuccess(`Catalog item "${itemModal.name}" added successfully.`);
      } else {
        await apiClient.put(`/admin/additional-requirement-items/${itemModal.itemId}`, {
          name: itemModal.name.trim(),
          baseAmount: base,
          gstPercentage: gst,
          imageUrl: itemModal.imageUrl
        });
        setGlobalSuccess(`Catalog item "${itemModal.name}" updated successfully.`);
      }

      setItemModal((prev) => ({ ...prev, isOpen: false }));
      await queryClient.invalidateQueries({ queryKey: REQUIREMENT_CATALOG_KEY });
    } catch (err: any) {
      setItemModal((prev) => ({
        ...prev,
        error: err instanceof ApiError ? err.message : 'Failed to save catalog item.'
      }));
    } finally {
      setItemModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Toggle Item Active / Deactivate
  const handleToggleActive = async (item: CatalogItem) => {
    try {
      const action = item.isActive ? 'deactivate' : 'activate';
      await apiClient.patch(`/admin/additional-requirement-items/${item.id}/${action}`);
      await queryClient.invalidateQueries({ queryKey: REQUIREMENT_CATALOG_KEY });
      setGlobalSuccess(
        `Item "${item.name}" ${item.isActive ? 'deactivated' : 'activated'} successfully.`
      );
    } catch (err: any) {
      setGlobalError(err instanceof ApiError ? err.message : 'Failed to update item status.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock size={13} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Flow Control Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900">Admin Exhibitor Management</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${featureEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${featureEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
              />
              Flow: {featureEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and confirm utilities requested by exhibitors, and toggle exhibitor requirements availability.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <RefreshListButton
            onRefresh={async () => {
              await Promise.allSettled([
                refetchRequests(),
                refetchCatalog(),
                refetchFeatureStatus(),
              ]);
            }}
            loading={isFetchingRequests || isFetchingCatalog}
            label="Refresh"
            title="Fetch latest requests and catalog from database"
          />

          <button
            type="button"
            onClick={() => setConfirmToggleModal(true)}
            disabled={togglingFeature}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer ${featureEnabled
                ? 'bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 hover:border-rose-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
          >
            <SlidersHorizontal size={14} />
            {featureEnabled ? 'Disable Requirements Flow' : 'Enable Requirements Flow'}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {globalError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button onClick={() => setGlobalError(null)} className="text-rose-500 hover:text-rose-700">
            <X size={16} />
          </button>
        </div>
      )}

      {globalSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{globalSuccess}</span>
          </div>
          <button onClick={() => setGlobalSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition ${activeTab === 'requests'
              ? 'border-msme-blue text-msme-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
        >
          <PackagePlus size={18} />
          Exhibitor Requests
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-bold ml-1">
            {counts.all}
          </span>
          {counts.pending > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white font-bold animate-pulse">
              {counts.pending} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition ${activeTab === 'catalog'
              ? 'border-msme-blue text-msme-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
        >
          <SlidersHorizontal size={18} />
          Manage Catalog Items
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-bold ml-1">
            {catalogItems.length}
          </span>
        </button>
      </div>

      {/* TAB 1: REQUESTS VIEW */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Top Metric Cards - Dynamically computed for All or Selected Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Quantity / Units Demanded */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedCatalogItem ? 'Units Requested' : 'Total Items Demanded'}
                </span>
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                  <Boxes size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {itemAnalytics.totalUnits.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-slate-500">units</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                  {itemAnalytics.confirmedUnits} Confirmed
                </span>
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                  {itemAnalytics.pendingUnits} Pending
                </span>
                {itemAnalytics.rejectedUnits > 0 && (
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-bold text-rose-700">
                    {itemAnalytics.rejectedUnits} Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Exhibitor Requests Count */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedCatalogItem ? 'Exhibitors Demanding' : 'Total Requests'}
                </span>
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-sm">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {itemAnalytics.totalRequests.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-slate-500">exhibitors</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 truncate">
                {selectedCatalogItem
                  ? `Exhibitors requesting ${selectedCatalogItem.name}`
                  : 'Total active request submissions'}
              </p>
            </div>

            {/* Card 3: Total Revenue / Value */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedCatalogItem ? 'Total Item Value' : 'Total Order Value'}
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                  <Coins size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-700">
                  ₹{itemAnalytics.totalValue.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 truncate">
                Base: ₹{itemAnalytics.totalBase.toLocaleString('en-IN')} + GST: ₹{itemAnalytics.totalGst.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Card 4: Catalog Unit Price / Confirmed Value */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedCatalogItem ? 'Catalog Unit Price' : 'Confirmed Revenue'}
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-sm">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0B3B75]">
                  {selectedCatalogItem
                    ? `₹${selectedCatalogItem.unitTotalAmount.toLocaleString('en-IN')}`
                    : `₹${itemAnalytics.confirmedValue.toLocaleString('en-IN')}`}
                </span>
                {selectedCatalogItem && <span className="text-xs font-semibold text-slate-500">/ unit</span>}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                {selectedCatalogItem ? (
                  <>
                    <span>₹{selectedCatalogItem.baseAmount.toLocaleString('en-IN')} + {selectedCatalogItem.gstPercentage}% GST</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold ${selectedCatalogItem.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {selectedCatalogItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </>
                ) : (
                  <span>Sum of all confirmed requests</span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Search, Status Filters & Dynamic Catalog Item Dropdown */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'Pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-800 hover:bg-amber-100/50'
                  }`}
              >
                Pending ({counts.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Confirmed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'Confirmed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100/50'
                  }`}
              >
                Confirmed ({counts.confirmed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'Rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-800 hover:bg-rose-100/50'
                  }`}
              >
                Rejected ({counts.rejected})
              </button>
            </div>

            {/* Right Controls: Dynamic Catalog Items Dropdown + Search + Refresh */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Catalog Item Dropdown Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                  <select
                    value={selectedCatalogItemId}
                    onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-indigo-200 bg-indigo-50/40 py-2 pl-8 pr-8 text-xs font-bold text-indigo-950 shadow-sm outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="ALL">✨ All Catalog Items ({catalogItems.length})</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name} (₹{item.baseAmount.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={15} />
                </div>

                {selectedCatalogItemId !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogItemId('ALL')}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shadow-sm text-xs font-bold flex items-center gap-1"
                    title="Clear item filter"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, mobile, reg#..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-sm outline-none focus:border-msme-blue focus:bg-white transition"
                />
              </div>

              {/* Export CSV Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  disabled={loadingRequests || filteredRequests.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
                  title="Export filtered data to CSV spreadsheet"
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                  <span className="rounded-full bg-emerald-800/60 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-100">
                    {filteredRequests.length}
                  </span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-800">Download CSV Options</p>
                        <p className="text-[10px] text-slate-400">
                          {selectedCatalogItem
                            ? `Filtered by "${selectedCatalogItem.name}"`
                            : 'All current filter matches'} ({filteredRequests.length} records)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportDetailedCsv}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition group cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                          <FileSpreadsheet size={15} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 block">
                            Detailed (Itemized Rows)
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block">
                            Each booked item as a separate line with stall, exhibitor & pricing (ideal for logistics)
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportSummaryCsv}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-blue-50 text-left transition group mt-1 cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition">
                          <FileText size={15} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 block">
                            Exhibitor Summary (1 Row / Exhibitor)
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block">
                            One row per exhibitor with all booked items combined (ideal for finance & audit)
                          </span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <RefreshListButton
                onRefresh={async () => {
                  await Promise.allSettled([
                    refetchRequests(),
                    refetchCatalog(),
                    refetchFeatureStatus(),
                  ]);
                }}
                loading={isFetchingRequests || isFetchingCatalog}
                label="Refresh"
                title="Refresh Requests and Catalog"
              />
            </div>
          </div>

          {/* Requests Table / Cards */}
          {loadingRequests ? (
            <div className="card p-12 text-center text-slate-500">
              <RefreshCw size={28} className="mx-auto animate-spin text-msme-blue" />
              <p className="mt-3 text-sm font-medium">Loading requirement requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="card p-12 text-center">
              <PackagePlus size={44} className="mx-auto text-slate-300" />
              <p className="mt-3 text-base font-bold text-slate-800">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No matching requirement requests'
                  : 'No requirement requests submitted yet'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                When exhibitors request additional items from their portal, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isExpanded = expandedRequestId === req.id;
                const itemsCount = req.lines.reduce((acc, l) => acc + l.quantity, 0);
                const dateStr = new Date(req.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                });

                return (
                  <div
                    key={req.id}
                    className="card overflow-hidden transition duration-150 hover:border-slate-300"
                  >
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Company & Booking Info */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Building2 size={16} className="text-slate-400 shrink-0" />
                            {req.companyName}
                          </h3>
                          {getStatusBadge(req.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {req.contactPersonName && <span>Contact: {req.contactPersonName}</span>}
                          {req.bookingRegistrationNumber && (
                            <span className="font-mono font-bold text-slate-700">
                              Reg: {req.bookingRegistrationNumber}
                            </span>
                          )}
                          {req.stallNumber && (
                            <span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                              Stall {req.stallNumber}
                            </span>
                          )}
                          <span>Submitted: {dateStr}</span>
                        </div>

                        {/* Direct Contact Links */}
                        <div className="flex items-center gap-3 pt-1">
                          {req.mobile && (
                            <a
                              href={`tel:${req.mobile}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
                            >
                              <Phone size={12} /> Call {req.mobile}
                            </a>
                          )}
                          {req.email && (
                            <a
                              href={`mailto:${req.email}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                            >
                              <Mail size={12} /> {req.email}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Summary & Actions */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t border-slate-100 lg:border-t-0 pt-3 lg:pt-0">
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-slate-500">{itemsCount} items selected</p>
                          <p className="text-lg font-black text-msme-blue">
                            ₹{req.grandTotal.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Base: ₹{req.totalBaseAmount.toLocaleString('en-IN')} + GST: ₹
                            {req.totalGstAmount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionModal(req, 'confirm')}
                                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionModal(req, 'reject')}
                                className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
                            title="Toggle Line Details"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Line Items Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                        {req.notes && (
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-950 flex items-start gap-2 shadow-sm">
                            <FileText size={15} className="shrink-0 text-indigo-600 mt-0.5" />
                            <div>
                              <span className="font-bold">Exhibitor Custom Notes / Remarks:</span>
                              <p className="mt-0.5 text-indigo-900 whitespace-pre-wrap">{req.notes}</p>
                            </div>
                          </div>
                        )}

                        {req.callNotes && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 flex items-start gap-2">
                            <FileText size={15} className="shrink-0 text-blue-600 mt-0.5" />
                            <div>
                              <span className="font-bold">Call / Operations Notes:</span>
                              <p className="mt-0.5 text-blue-800">{req.callNotes}</p>
                            </div>
                          </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Item Code</th>
                                <th className="p-3">Item Description</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Unit Base Price</th>
                                <th className="p-3 text-right">GST Rate</th>
                                <th className="p-3 text-right">GST Amount</th>
                                <th className="p-3 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {req.lines.map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 font-mono font-bold text-slate-700">{l.itemCode}</td>
                                  <td className="p-3 font-semibold text-slate-900">{l.itemName}</td>
                                  <td className="p-3 text-center font-bold text-slate-800">{l.quantity}</td>
                                  <td className="p-3 text-right">₹{l.baseAmount.toLocaleString('en-IN')}</td>
                                  <td className="p-3 text-right">{l.gstPercentage}%</td>
                                  <td className="p-3 text-right text-slate-600">
                                    ₹{l.gstAmount.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900">
                                    ₹{l.totalAmount.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                              <tr>
                                <td colSpan={5} className="p-3 text-right">Totals:</td>
                                <td className="p-3 text-right text-slate-700">₹{req.totalGstAmount.toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right text-msme-blue text-sm font-black">
                                  ₹{req.grandTotal.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG MANAGEMENT VIEW */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Additional Requirement Catalog</h2>
              <p className="text-xs text-slate-500">
                Manage all catalog items, base pricing, and editable GST rates. Catalog items are shown to exhibitors.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <RefreshListButton
                onRefresh={() => refetchCatalog()}
                loading={isFetchingCatalog}
                label="Refresh Catalog"
                title="Fetch latest catalog from database"
              />

              <button
                type="button"
                onClick={openAddItemModal}
                className="inline-flex items-center gap-2 rounded-xl bg-msme-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-900 transition active:scale-95 cursor-pointer"
              >
                <Plus size={16} /> Add Catalog Item
              </button>
            </div>
          </div>

          {/* Search Bar & Result Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={catalogSearchQuery}
                onChange={(e) => {
                  setCatalogSearchQuery(e.target.value);
                  setCatalogPage(1);
                }}
                placeholder="Search catalog items by code, name, price..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-msme-blue focus:bg-white focus:ring-2 focus:ring-msme-blue/10"
              />
              {catalogSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearchQuery('');
                    setCatalogPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>
                Total Items: <strong className="text-slate-900 font-bold">{catalogItems.length}</strong>
              </span>
              {catalogSearchQuery && (
                <span className="rounded-full bg-blue-50 text-msme-blue px-2.5 py-0.5 font-bold border border-blue-100">
                  {filteredCatalogItems.length} matching search
                </span>
              )}
            </div>
          </div>

          {loadingCatalog ? (
            <div className="card p-12 text-center text-slate-500">
              <RefreshCw size={28} className="mx-auto animate-spin text-msme-blue" />
              <p className="mt-3 text-sm font-medium">Loading catalog items...</p>
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="card p-12 text-center">
              <PackagePlus size={44} className="mx-auto text-slate-300" />
              <p className="mt-3 text-base font-bold text-slate-800">No catalog items created yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                The catalog is currently empty. Click "Add Catalog Item" above to add items such as power sockets, tables, or extra lights.
              </p>
              <button
                type="button"
                onClick={openAddItemModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-msme-blue px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-900 transition"
              >
                <Plus size={15} /> Add First Item
              </button>
            </div>
          ) : filteredCatalogItems.length === 0 ? (
            <div className="card p-12 text-center">
              <Search size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-base font-bold text-slate-800">No matching catalog items</p>
              <p className="mt-1 text-xs text-slate-500">
                No items matched your search query "{catalogSearchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setCatalogSearchQuery('');
                  setCatalogPage(1);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 select-none">
                    <tr>
                      <th
                        onClick={() => handleCatalogSort('sno')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'sno' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            S.NO.
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'sno' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'sno' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th className="p-3.5 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        IMAGE
                      </th>
                      <th
                        onClick={() => handleCatalogSort('code')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'code' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            CODE
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'code' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'code' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('name')}
                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'name' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            ITEM NAME
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'name' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'name' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('baseAmount')}
                        className="p-3.5 cursor-pointer text-right hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'baseAmount' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            BASE AMOUNT
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'baseAmount' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'baseAmount' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('gstPercentage')}
                        className="p-3.5 cursor-pointer text-right hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'gstPercentage' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            GST RATE
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'gstPercentage' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'gstPercentage' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('unitGstAmount')}
                        className="p-3.5 cursor-pointer text-right hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'unitGstAmount' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            GST AMOUNT
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'unitGstAmount' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'unitGstAmount' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('unitTotalAmount')}
                        className="p-3.5 cursor-pointer text-right hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'unitTotalAmount' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            UNIT TOTAL
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'unitTotalAmount' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'unitTotalAmount' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleCatalogSort('isActive')}
                        className="p-3.5 cursor-pointer text-center hover:bg-slate-100/80 transition"
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          <span className={`font-semibold uppercase tracking-wider text-[11px] ${catalogSortKey === 'isActive' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                            STATUS
                          </span>
                          <span className={`text-[11px] ${catalogSortKey === 'isActive' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                            {catalogSortKey === 'isActive' ? (catalogSortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                          </span>
                        </div>
                      </th>
                      <th className="p-3.5 text-center text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCatalogItems.map((item, index) => {
                      const itemIndex = (safeCatalogPage - 1) * catalogPageSize + index + 1;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 text-slate-500 font-medium">
                            {itemIndex}
                          </td>
                          <td className="p-3.5">
                            {item.imageUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    isOpen: true,
                                    imageUrl: item.imageUrl || null,
                                    title: item.name,
                                    subtitle: item.code
                                  })
                                }
                                className="group/img relative cursor-pointer block rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Click to view full image"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-11 w-11 object-cover transition-all duration-200 group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn size={14} className="drop-shadow" />
                                </div>
                              </button>
                            ) : (
                              <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                <ImageIcon size={18} />
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-700 uppercase">
                            {item.code}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-right font-semibold text-slate-800">
                            ₹{item.baseAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-right font-medium text-slate-600">
                            {item.gstPercentage}%
                          </td>
                          <td className="p-3.5 text-right text-slate-500">
                            ₹{item.unitGstAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-right font-black text-msme-blue">
                            ₹{item.unitTotalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${item.isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                }`}
                              title="Click to toggle active status"
                            >
                              {item.isActive ? <Check size={12} /> : <X size={12} />}
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(item)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-msme-blue transition"
                              title="Edit Item"
                              aria-label="Edit Item"
                            >
                              <Edit2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls footer matching screenshot */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
                <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                  <span>
                    Showing <span className="font-bold text-slate-900">{catalogRangeStart}–{catalogRangeEnd}</span> of <span className="font-bold text-slate-900">{sortedCatalogItems.length}</span>
                  </span>

                  <label htmlFor="catalog-page-size" className="flex items-center gap-1.5 ml-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      ROWS
                    </span>
                    <select
                      id="catalog-page-size"
                      value={catalogPageSize}
                      onChange={(e) => {
                        setCatalogPageSize(Number(e.target.value));
                        setCatalogPage(1);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
                    >
                      {[10, 25, 50, 100].map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCatalogPage(1)}
                    disabled={safeCatalogPage === 1}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="First page"
                  >
                    «
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                    disabled={safeCatalogPage === 1}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  {catalogPageNumbers[0] > 1 && (
                    <span className="px-1.5 text-xs text-slate-400">…</span>
                  )}

                  {catalogPageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCatalogPage(p)}
                      className={`rounded-lg px-3 py-1 text-xs sm:text-sm font-semibold transition ${p === safeCatalogPage
                          ? 'bg-msme-blue text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-msme-blue hover:text-msme-blue'
                        }`}
                    >
                      {p}
                    </button>
                  ))}

                  {catalogPageNumbers[catalogPageNumbers.length - 1] < totalCatalogPages && (
                    <span className="px-1.5 text-xs text-slate-400">…</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setCatalogPage((p) => Math.min(totalCatalogPages, p + 1))}
                    disabled={safeCatalogPage === totalCatalogPages}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    ›
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogPage(totalCatalogPages)}
                    disabled={safeCatalogPage === totalCatalogPages}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Confirm / Reject with Call Notes */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {actionModal.action === 'confirm' ? 'Confirm Requirement Request' : 'Reject Requirement Request'}
              </h3>
              <button
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to mark the requirement request for{' '}
              <strong className="text-slate-900">{actionModal.companyName}</strong> as{' '}
              <span className={`font-bold ${actionModal.action === 'confirm' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {actionModal.action === 'confirm' ? 'Confirmed' : 'Rejected'}
              </span>
              .
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Call Notes / Operation Remarks
              </label>
              <textarea
                rows={4}
                value={actionModal.callNotes}
                onChange={(e) => setActionModal((prev) => ({ ...prev, callNotes: e.target.value }))}
                placeholder="e.g. Spoke with the exhibitor representative on 02-Sep. Confirmed 2 power sockets and 4 extra chairs."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-msme-blue focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusActionSubmit}
                disabled={actionModal.submitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition ${actionModal.action === 'confirm'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                {actionModal.submitting ? 'Saving...' : actionModal.action === 'confirm' ? 'Confirm Request' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Catalog Item - Enlarged with Rich Presets & Sizing Options */}
      {itemModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleItemSave}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-msme-blue flex items-center justify-center font-bold">
                  {itemModal.mode === 'add' ? <PackagePlus size={20} /> : <Edit2 size={18} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {itemModal.mode === 'add' ? 'Add New Catalog Item' : 'Edit Catalog Item'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {itemModal.mode === 'add'
                      ? 'Configure item details, base price, and tax rate for exhibitor booking'
                      : `Update specifications for item ${itemModal.code}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemModal((prev) => ({ ...prev, isOpen: false }))}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {itemModal.error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{itemModal.error}</span>
              </div>
            )}

            {/* Quick Presets (Only in Add mode) */}
            {itemModal.mode === 'add' && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-msme-blue" />
                    Quick Item Presets (Click to autofill):
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Saves time typing</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {CATALOG_PRESETS.map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-msme-blue hover:text-msme-blue hover:bg-blue-50/50 transition shadow-2xs"
                    >
                      {preset.name} (₹{preset.baseAmount})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Image Upload & Sizing Applicability */}
              <div className="space-y-4">
                {/* Image Upload Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Item Image{' '}
                      {itemModal.mode === 'add' ? (
                        <span className="text-rose-500">* (Required)</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(Optional change)</span>
                      )}
                    </span>
                  </label>

                  {itemModal.imageUrl ? (
                    <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            isOpen: true,
                            imageUrl: itemModal.imageUrl,
                            title: itemModal.name || 'Uploaded Item Image',
                            subtitle: itemModal.code || undefined
                          })
                        }
                        className="group/thumb relative cursor-pointer rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                        title="Click to view full image"
                      >
                        <img
                          src={itemModal.imageUrl}
                          alt="Preview"
                          className="h-20 w-20 object-cover transition-transform group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn size={18} />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">Image Uploaded</p>
                        <p className="text-[11px] text-slate-500">Ready to save with item</p>
                        <label className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-msme-blue cursor-pointer hover:underline">
                          <Upload size={13} /> Change Image
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemModal((prev) => ({ ...prev, imageUrl: null }))}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 transition"
                        title="Remove Image"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 hover:border-msme-blue/50 transition cursor-pointer text-center group">
                      <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-msme-blue transition">
                        <Upload size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-msme-blue">
                          Click to upload item image
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WEBP (Max 1MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Sizing & Unit Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stall Size Suitability
                    </label>
                    <select
                      value={itemModal.stallSize}
                      onChange={(e) => setItemModal((prev) => ({ ...prev, stallSize: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-msme-blue focus:outline-none"
                    >
                      <option value="All Sizes">All Sizes (2x2, 3x2, 3x3, etc.)</option>
                      <option value="2x2">2x2 Stalls</option>
                      <option value="3x2">3x2 Stalls</option>
                      <option value="3x3">3x3 Stalls</option>
                      <option value="4x2">4x2 Stalls</option>
                      <option value="Custom">Custom / Premium Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={itemModal.unit}
                      onChange={(e) => setItemModal((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-msme-blue focus:outline-none"
                    >
                      <option value="Nos">Per Unit / Nos</option>
                      <option value="Per Connection">Per Connection</option>
                      <option value="Per Point">Per Point</option>
                      <option value="Per Day">Per Day</option>
                      <option value="Per Event">Per Event (All 3 Days)</option>
                      <option value="Per Meter">Per Meter</option>
                      <option value="Per KW">Per KW</option>
                      <option value="Per Sq.m">Per Sq. Meter</option>
                      <option value="Per Set">Per Set</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Code, Name, Base Amount, GST & Live Price Breakdown */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={itemModal.mode === 'edit'}
                    value={itemModal.code}
                    onChange={(e) => setItemModal((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. PWR-5KW, CHAIR-VIP"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 uppercase font-mono font-bold disabled:bg-slate-100 focus:border-msme-blue focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Name / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemModal.name}
                    onChange={(e) => setItemModal((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. 5KW 3-Phase Power Socket"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-msme-blue focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Base Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={itemModal.baseAmount}
                      onChange={(e) => setItemModal((prev) => ({ ...prev, baseAmount: e.target.value }))}
                      placeholder="2500"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-bold focus:border-msme-blue focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GST % (Editable) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemModal.gstPercentage}
                      onChange={(e) => setItemModal((prev) => ({ ...prev, gstPercentage: e.target.value }))}
                      placeholder="18"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-bold focus:border-msme-blue focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quick GST Preset Pills */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">GST Presets:</span>
                  {['0', '5', '12', '18', '28'].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setItemModal((prev) => ({ ...prev, gstPercentage: rate }))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${itemModal.gstPercentage === rate
                          ? 'bg-msme-blue text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>

                {/* Live Calculation Preview Card */}
                {(() => {
                  const b = parseFloat(itemModal.baseAmount) || 0;
                  const g = parseFloat(itemModal.gstPercentage) || 0;
                  const tax = Math.round(b * (g / 100) * 100) / 100;
                  const tot = b + tax;

                  return (
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-3.5 border border-blue-100 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Base Price ({itemModal.unit || 'Unit'}):</span>
                        <span className="font-semibold text-slate-800">₹{b.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>GST ({g}%):</span>
                        <span className="font-semibold text-slate-800">₹{tax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-msme-blue border-t border-blue-200/80 pt-1.5">
                        <span className="text-xs uppercase tracking-wide">Total Per Unit:</span>
                        <span className="text-sm font-black">₹{tot.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-secondary text-xs px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={itemModal.submitting}
                className="btn-primary text-xs px-5 py-2.5 shadow-sm"
              >
                {itemModal.submitting
                  ? 'Saving...'
                  : itemModal.mode === 'add'
                    ? 'Create Catalog Item'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Toggling Feature Flow */}
      {confirmToggleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${featureEnabled ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                  }`}
              >
                <SlidersHorizontal size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {featureEnabled ? 'Disable Requirements Flow?' : 'Enable Requirements Flow?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Action affects all logged-in exhibitors
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              {featureEnabled
                ? 'When disabled, exhibitors will see the requirements portal blurred with a disabled notice overlay and will not be able to browse the catalog or submit new requests.'
                : 'When enabled, exhibitors will be able to browse additional items, select quantities, and submit requirement requests normally.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmToggleModal(false)}
                disabled={togglingFeature}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleFeature}
                disabled={togglingFeature}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition ${featureEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
              >
                {togglingFeature
                  ? 'Updating...'
                  : featureEnabled
                    ? 'Confirm Disable'
                    : 'Confirm Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Full-Size Preview Modal */}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        imageUrl={previewImage.imageUrl}
        title={previewImage.title}
        subtitle={previewImage.subtitle}
        onClose={() => setPreviewImage((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default ExhibitorRequirementsPage;
