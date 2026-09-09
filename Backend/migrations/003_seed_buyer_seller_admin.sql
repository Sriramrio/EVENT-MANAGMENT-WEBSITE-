-- =============================================================================
-- Migration / Seed Script: Buyer Admin & Seller Admin Credentials and Roles
-- Description: Creates BuyerAdmin and SellerAdmin roles, assigns permissions,
--              and sets up clean user accounts with default credentials.
--
-- Login Credentials Created:
-- 1. Buyer Admin:
--    Email:    buyeradmin@lubmsmehosur.org
--    Password: ChangeMe@12345
-- 2. Seller Admin:
--    Email:    selleradmin@lubmsmehosur.org
--    Password: ChangeMe@12345
-- =============================================================================

DO $$
DECLARE
    v_tenant_id uuid;
    v_event_id uuid;
    v_buyer_role_id uuid;
    v_seller_role_id uuid;
    v_perm_id uuid;
    v_perm_code text;
    v_buyer_user_id uuid := 'e0000000-0000-4000-8000-000000000005'::uuid;
    v_seller_user_id uuid := 'e0000000-0000-4000-8000-000000000006'::uuid;
BEGIN
    -- 1. Get current tenant & event
    SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
    SELECT id INTO v_event_id FROM public.events LIMIT 1;

    IF v_tenant_id IS NULL OR v_event_id IS NULL THEN
        RAISE EXCEPTION 'Tenant or Event record not found in public.tenants / public.events';
    END IF;

    -- =========================================================================
    -- 2. BUYER ADMIN: Role, Permissions, User Creation
    -- =========================================================================
    
    -- Find or create BuyerAdmin Role
    SELECT id INTO v_buyer_role_id FROM public.roles WHERE role_code = 'BuyerAdmin' LIMIT 1;
    IF v_buyer_role_id IS NULL THEN
        v_buyer_role_id := gen_random_uuid();
        INSERT INTO public.roles (id, tenant_id, event_id, role_code, role_name, description, is_system_role, is_active, created_at, is_deleted)
        VALUES (v_buyer_role_id, v_tenant_id, v_event_id, 'BuyerAdmin', 'Buyer Admin', 'Buyer organization management and credentials access', false, true, NOW(), false);
    END IF;

    -- Assign Permissions to BuyerAdmin
    FOREACH v_perm_code IN ARRAY ARRAY['admin.users.manage', 'dashboard.view', 'buyer.dashboard.view', 'buyer.admin.manage']
    LOOP
        SELECT id INTO v_perm_id FROM public.permissions WHERE permission_code = v_perm_code LIMIT 1;
        IF v_perm_id IS NULL THEN
            v_perm_id := gen_random_uuid();
            INSERT INTO public.permissions (id, tenant_id, event_id, permission_code, permission_name, module_name, action_name, description, is_active, created_at, is_deleted)
            VALUES (v_perm_id, v_tenant_id, v_event_id, v_perm_code, v_perm_code, 'Administration', 'Manage', 'Allows ' || v_perm_code, true, NOW(), false);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_id = v_buyer_role_id AND permission_id = v_perm_id) THEN
            INSERT INTO public.role_permissions (id, tenant_id, event_id, role_id, permission_id, created_at, is_deleted)
            VALUES (gen_random_uuid(), v_tenant_id, v_event_id, v_buyer_role_id, v_perm_id, NOW(), false);
        END IF;
    END LOOP;

    -- Clean up & Recreate User 'buyeradmin@lubmsmehosur.org'
    DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM public.users WHERE LOWER(email) = 'buyeradmin@lubmsmehosur.org');
    DELETE FROM public.users WHERE LOWER(email) = 'buyeradmin@lubmsmehosur.org';

    INSERT INTO public.users (id, tenant_id, event_id, full_name, email, mobile, password_hash, is_active, failed_login_count, created_at, is_deleted)
    VALUES (v_buyer_user_id, v_tenant_id, v_event_id, 'Buyer Administrator', 'buyeradmin@lubmsmehosur.org', '9876543211', 'DEV_ONLY_CHANGE_ME_12345', true, 0, NOW(), false);

    -- Link User to BuyerAdmin Role
    INSERT INTO public.user_roles (id, tenant_id, event_id, user_id, role_id, valid_from, is_active, created_at, is_deleted)
    VALUES (gen_random_uuid(), v_tenant_id, v_event_id, v_buyer_user_id, v_buyer_role_id, CURRENT_DATE, true, NOW(), false);

    RAISE NOTICE 'BuyerAdmin created: Email = buyeradmin@lubmsmehosur.org, Password = ChangeMe@12345';

    -- =========================================================================
    -- 3. SELLER ADMIN: Role, Permissions, User Creation
    -- =========================================================================

    -- Find or create SellerAdmin Role
    SELECT id INTO v_seller_role_id FROM public.roles WHERE role_code = 'SellerAdmin' LIMIT 1;
    IF v_seller_role_id IS NULL THEN
        v_seller_role_id := gen_random_uuid();
        INSERT INTO public.roles (id, tenant_id, event_id, role_code, role_name, description, is_system_role, is_active, created_at, is_deleted)
        VALUES (v_seller_role_id, v_tenant_id, v_event_id, 'SellerAdmin', 'Seller Admin', 'Seller organization management and credentials access', false, true, NOW(), false);
    END IF;

    -- Assign Permissions to SellerAdmin
    FOREACH v_perm_code IN ARRAY ARRAY['admin.users.manage', 'dashboard.view', 'seller.dashboard.view', 'seller.admin.manage']
    LOOP
        SELECT id INTO v_perm_id FROM public.permissions WHERE permission_code = v_perm_code LIMIT 1;
        IF v_perm_id IS NULL THEN
            v_perm_id := gen_random_uuid();
            INSERT INTO public.permissions (id, tenant_id, event_id, permission_code, permission_name, module_name, action_name, description, is_active, created_at, is_deleted)
            VALUES (v_perm_id, v_tenant_id, v_event_id, v_perm_code, v_perm_code, 'Administration', 'Manage', 'Allows ' || v_perm_code, true, NOW(), false);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.role_permissions WHERE role_id = v_seller_role_id AND permission_id = v_perm_id) THEN
            INSERT INTO public.role_permissions (id, tenant_id, event_id, role_id, permission_id, created_at, is_deleted)
            VALUES (gen_random_uuid(), v_tenant_id, v_event_id, v_seller_role_id, v_perm_id, NOW(), false);
        END IF;
    END LOOP;

    -- Clean up & Recreate User 'selleradmin@lubmsmehosur.org'
    DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM public.users WHERE LOWER(email) = 'selleradmin@lubmsmehosur.org');
    DELETE FROM public.users WHERE LOWER(email) = 'selleradmin@lubmsmehosur.org';

    INSERT INTO public.users (id, tenant_id, event_id, full_name, email, mobile, password_hash, is_active, failed_login_count, created_at, is_deleted)
    VALUES (v_seller_user_id, v_tenant_id, v_event_id, 'Seller Administrator', 'selleradmin@lubmsmehosur.org', '9876543212', 'DEV_ONLY_CHANGE_ME_12345', true, 0, NOW(), false);

    -- Link User to SellerAdmin Role
    INSERT INTO public.user_roles (id, tenant_id, event_id, user_id, role_id, valid_from, is_active, created_at, is_deleted)
    VALUES (gen_random_uuid(), v_tenant_id, v_event_id, v_seller_user_id, v_seller_role_id, CURRENT_DATE, true, NOW(), false);

    RAISE NOTICE 'SellerAdmin created: Email = selleradmin@lubmsmehosur.org, Password = ChangeMe@12345';
END $$;
