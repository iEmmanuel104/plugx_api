import express, { Router } from 'express';
import CardController from '../controllers/card.controller';
import { basicAuth, AuthenticatedController } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router
    .post('/', basicAuth('access'), AuthenticatedController(CardController.addCard))
    .get('/', basicAuth('access'), AuthenticatedController(CardController.getCards))
    .delete('/:id', basicAuth('access'), AuthenticatedController(CardController.deleteCard));

export default router;