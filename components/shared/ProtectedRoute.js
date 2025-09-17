import ClientPOSWrapper from '../blocks/ClientPosWrapper';
import ClientRoute from '../ClientRoute';

export default function ProtectedRoute({ children, requiredPermission }) {
  return (
    <ClientPOSWrapper>
      <ClientRoute requiredPermission={requiredPermission}>
        {children}
      </ClientRoute>
    </ClientPOSWrapper>
  );
}
