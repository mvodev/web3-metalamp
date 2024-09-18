import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, polygonAmoy, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Scrum Team 17 web3 kEthers fans',
  projectId: import.meta.env.VITE_WAGMI_PROJECT_ID,
  chains: [mainnet, polygon, sepolia, polygonAmoy],
});