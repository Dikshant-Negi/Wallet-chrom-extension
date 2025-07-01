import {create} from 'zustand'

interface state{
    mnemonic : string | null
    setMnemonic: (mnemonic: string) => void;
    password:string | null;
    setPassword:(password:string)=>void;
}

export const useVault  = create<state>((set)=>({
    mnemonic : null,
    setMnemonic : (mnemonic: string) => set({mnemonic}),
    password:null,
    setPassword:(password:string)=>set({password})
}))