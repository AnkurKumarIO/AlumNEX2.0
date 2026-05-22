import { Navigate } from 'react-router-dom';
export default function TNPLogin() {
  return <Navigate to="/login?role=TNP" replace />;
}
