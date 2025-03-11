import express, { Router } from 'express';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';
import AirtimeController from '../controllers/utility/airtime.controller';
import DataController from '../controllers/utility/data.controller';
import ElectricityController from '../controllers/utility/electricity.controller';
import TVController from '../controllers/utility/tv.controller';
import EducationController from '../controllers/utility/education.controller';

const router: Router = express.Router();

// Airtime routes
router
    .post('/airtime/purchase', basicAuth('access'), AuthenticatedController(AirtimeController.purchaseAirtime))
    .get('/airtime/networks', AirtimeController.getSupportedNetworks)
    .get('/airtime/transaction/:reference', basicAuth('access'), AuthenticatedController(AirtimeController.checkTransactionStatus));

// Data routes
router
    .post('/data/purchase', basicAuth('access'), AuthenticatedController(DataController.purchaseData))
    .get('/data/bundles/:network', DataController.getDataBundles)
    .get('/data/transaction/:reference', basicAuth('access'), AuthenticatedController(DataController.checkTransactionStatus));

// Electricity routes
router
    .post('/electricity/purchase', basicAuth('access'), AuthenticatedController(ElectricityController.purchaseElectricity))
    .post('/electricity/validate', ElectricityController.validateMeter)
    .get('/electricity/discos', ElectricityController.getSupportedDiscos)
    .get('/electricity/transaction/:reference', basicAuth('access'), AuthenticatedController(ElectricityController.checkTransactionStatus));

// TV routes
router
    .post('/tv/purchase', basicAuth('access'), AuthenticatedController(TVController.purchaseTV))
    .post('/tv/validate', TVController.validateSmartCard)
    .get('/tv/providers', TVController.getSupportedProviders)
    .get('/tv/packages/:provider', TVController.getTVPackages)
    .get('/tv/transaction/:reference', basicAuth('access'), AuthenticatedController(TVController.checkTransactionStatus));

// Education routes
router
    .post('/education/purchase', basicAuth('access'), AuthenticatedController(EducationController.purchaseEducation))
    .post('/education/validate/jamb', EducationController.validateJambProfile)
    .get('/education/products', EducationController.getSupportedProducts)
    .get('/education/transaction/:reference', basicAuth('access'), AuthenticatedController(EducationController.checkTransactionStatus));

export default router;