import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { registerInputSchema, loginInputSchema } from './auth.schema.js';
import {
      registerController,
      loginController,
      logoutController,
      getMeController,
} from './auth.controller.js';      

const authRouter = Router();

authRouter.post('/register', validate({ body: registerInputSchema }), registerController);
authRouter.post('/login', validate({ body: loginInputSchema }), loginController);
authRouter.post('/logout', authenticate, logoutController);
authRouter.get('/me', authenticate, getMeController);

export default authRouter;