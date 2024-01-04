import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminPrivate = ({ children }) => {
  const { adminToken } = useSelector((state) => state.authReducer);
  return adminToken ? children : <Navigate to="/login" />;
};
export default AdminPrivate;