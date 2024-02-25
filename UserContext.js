import { createContext, useState, useContext } from "react";

const UserType = createContext();

const useUserId = () => {
  return useContext(UserType);
};

const UserContext = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  return (
    <UserType.Provider value={{ userId, setUserId, isAdmin, setIsAdmin }}>
      {children}
    </UserType.Provider>
  );
};

export { useUserId, UserContext, UserType };
