import React, { useCallback, useEffect, useState } from 'react'
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, UserInfo } from "@web3auth/base";
import { Web3Auth } from '@web3auth/web3auth';
import { LOGIN_MODAL_EVENTS } from "@web3auth/ui"

const WEB3AUTH_CLIENT_ID="__" // get your clientId from https://developer.web3auth.io

const solanaChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  rpcTarget: "https://api.testnet.solana.com",
  blockExplorer: "https://explorer.solana.com?cluster=testnet",
  chainId: "0x2",
  displayName: "testnet",
  ticker: "SOL",
  tickerName: "solana",
};


export interface AuthProviderData {
  web3auth: Web3Auth,
  provider: CONNECTED_EVENT_DATA,
  user: Partial<UserInfo>,
  onSuccessfulLogin: (data: CONNECTED_EVENT_DATA, user: any) => void,
  login: () => void,
  logout: () => void,
}

export const AuthProviderContext = React.createContext<AuthProviderData>({
  web3auth: null,
  provider: null,
  user: null,
  onSuccessfulLogin: (data: any) => {},
  login: () => {},
  logout: () => {},
})

const web3auth = new Web3Auth({
  chainConfig: solanaChainConfig,
  clientId: WEB3AUTH_CLIENT_ID // get your clientId from https://developer.web3auth.io
});

export const AuthProvider: React.FC = ({
  children,
}) => {
  const [provider, setProvider] = useState<CONNECTED_EVENT_DATA>(null)
  const [user, setUser] = useState<Partial<UserInfo>>(null)

  const onSuccessfulLogin = useCallback((data: CONNECTED_EVENT_DATA, user: Partial<UserInfo>) => {
    console.log('onSuccessfulLogin', data, user)
    setProvider(data)
    setUser(user)
  }, [])

  const login = useCallback(() => {
    web3auth.connect().then(data => {
      console.log(data)
    }).catch(err => {
      console.log(err)
    })
  }, [])

  const logout = useCallback(() => {
    web3auth.logout().then(() => {
      // login on logout
    }).catch(err => {
      console.log('logout', err)
    })
  }, [])

  const subscribeAuthEvents = useCallback((web3auth: Web3Auth) => {
    web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      console.log("Yeah!, you are successfully logged in", data);
      web3auth.getUserInfo().then((user) => {
        onSuccessfulLogin(data, user)
      })
    });

    web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
      console.log("connecting");
    });

    web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
      console.log("disconnected");
      setUser(null)
      setProvider(null)
    });

    web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
      console.log("some error or user have cancelled login request", error);
    });

    web3auth.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible) => {
      console.log("modal visibility", isVisible);
    });
  }, [onSuccessfulLogin])

  useEffect(() => {
    subscribeAuthEvents(web3auth)

    web3auth.initModal()
      .catch(err => {
        alert('error' + err)
      })
  }, [])

  const ctx: AuthProviderData = {
    web3auth,
    provider,
    user,
    onSuccessfulLogin,
    login,
    logout,
  }
  return (
    <AuthProviderContext.Provider value={ctx}>
      {children}
    </AuthProviderContext.Provider>
  )
}

export const AuthConsumer = AuthProviderContext.Consumer