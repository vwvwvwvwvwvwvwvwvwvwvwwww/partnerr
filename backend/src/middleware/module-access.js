import { roleHasModule } from '../config/module-access.js';

export function requireModuleAccess(moduleKey) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    if (!roleHasModule(req.user.role, moduleKey)) {
      return res.status(403).json({ error: 'Доступ к разделу запрещён для вашей роли' });
    }

    return next();
  };
}
