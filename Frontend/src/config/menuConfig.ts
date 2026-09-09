import { VisitorShell } from '../app/layout/VisitorShell';
import { QrPortalMainifest, routeManifest, VipPortakMainifest, VisitorPortakMainifest } from './routeManifest';

export function getMenuItems(hasPermission: (permission: string) => boolean, roleCode?: string) {
  const items = routeManifest.filter(item => item.menu && (!item.permission || hasPermission(item.permission)));

  if (roleCode === 'BuyerAdmin') {
    return items.filter(item => item.path === '/app/admin/buyers' || item.path === '/app/admin/buyer-requirements');
  }
  if (roleCode === 'SellerAdmin') {
    return items.filter(item => item.path === '/app/admin/sellers' || item.path === '/app/admin/seller-requirements');
  }

  return items;
}


export function getMenuForQrPortal(hasPermission: (permission: string) => boolean) {
  return QrPortalMainifest.filter(item => item.menu && (!item.permission || hasPermission(item.permission)));
}


export function getMenuForVisitorPortal(hasPermission: (permission: string) => boolean) {
  return VisitorPortakMainifest.filter(item => item.menu && (!item.permission || hasPermission(item.permission)));
}

export function getMenuForVipPortal(hasPermission: (permission: string) => boolean) {
  return VipPortakMainifest.filter(item => item.menu && (!item.permission || hasPermission(item.permission)));
}







