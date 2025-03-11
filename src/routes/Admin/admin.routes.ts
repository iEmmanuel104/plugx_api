import express, { Router } from 'express';
import AdminController from '../../controllers/Admin/admin.controller';
import ProviderWalletController from '../../controllers/Admin/providerWallet.controller';
import { AdminAuthenticatedController, adminAuth } from '../../middlewares/authMiddleware';

const router: Router = express.Router();

// Authentication routes
router.post('/login', AdminController.loginSuperAdmin);
router.post('/verify', AdminController.verifySuperAdminLogin);

// Admin management routes
router.post('/create', adminAuth('admin'), AdminAuthenticatedController(AdminController.createAdmin));
router.get('/admins', adminAuth('admin'), AdminAuthenticatedController(AdminController.getAllAdmins));
router.delete('/delete', adminAuth('admin'), AdminAuthenticatedController(AdminController.deleteAdmin));

// User management routes
router.post('/block-user', adminAuth('admin'), AdminAuthenticatedController(AdminController.blockUser));
router.post('/deactivate-user', adminAuth('admin'), AdminAuthenticatedController(AdminController.deactivateUser));

// Provider wallet balance routes
router.get('/provider-balances', adminAuth('admin'), AdminAuthenticatedController(ProviderWalletController.getAllProviderBalances));
router.get('/provider-balance/:provider', adminAuth('admin'), AdminAuthenticatedController(ProviderWalletController.getProviderBalance));

export default router;
