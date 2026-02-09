import React, { createContext, useContext, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

type NetworkContextType = {
  isConnected: boolean;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
});

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isInternetReachable);
    });

    return () => unsub();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
