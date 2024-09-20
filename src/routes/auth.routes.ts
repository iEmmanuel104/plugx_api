import express, { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';
// import { rateLimiter } from '../middlewares/rateLimiter';
// import passport from 'passport';

const router: Router = express.Router();

router
    .post('/signup', AuthController.signup)
    .post('/verifyemail', AuthController.verifyEmail)
    .get('/resendverifyemail', AuthController.resendVerificationEmail)
    .post('/forgotpassword', AuthController.forgotPassword)
    .post('/login', AuthController.login)
    .post('/resetpassword', AuthController.resetPassword)

    // transaction pin management
    .post('/pin/set', basicAuth('access'), AuthenticatedController(AuthController.setTransactionPin))
    .post('/pin/change', basicAuth('access'), AuthenticatedController(AuthController.changeTransactionPin))
    .post('/pin/validate', basicAuth('access'), AuthenticatedController(AuthController.verifyTransactionPin))
    
    .post('/changepassword', basicAuth('access'), AuthenticatedController(AuthController.changePassword))
    .get('/logout', basicAuth('access'), AuthenticatedController(AuthController.logout))
    .get('/loggeduser', basicAuth('access'), AuthenticatedController(AuthController.getLoggedUserData))
    .get('/authtoken', basicAuth('refresh'));

export default router;

