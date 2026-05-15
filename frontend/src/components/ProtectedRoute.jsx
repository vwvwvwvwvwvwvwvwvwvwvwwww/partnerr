import { Navigate } from 'react-router-dom';
import { roleHasModule } from '../config/module-access';

export default function ProtectedRoute({ user, module, children }) {
  if (!roleHasModule(user.role, module)) {
    return <Navigate replace to="/" />;
  }

  return children;
}
