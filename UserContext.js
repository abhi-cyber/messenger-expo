import { createContext, useState, useContext } from "react";

const UserType = createContext();

const useUserId = () => {
  return useContext(UserType);
};

const UserContext = ({ children }) => {
  const [userId, setUserId] = useState("");
  return (
    <UserType.Provider value={{ userId, setUserId }}>
      {children}
    </UserType.Provider>
  );
};

export { useUserId, UserContext, UserType };
