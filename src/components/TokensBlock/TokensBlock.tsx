import { FC } from 'react';
import { polygonAmoy, sepolia } from 'viem/chains';
import { useChainId, useConnections } from 'wagmi';

import { TokenRow } from '../TokenRow/TokenRow';
import { getTokens } from './TokensBlock.utils';
import classes from './TokensBlock.module.css';

export const TokensBlock: FC = () => {
  const connections = useConnections();
  const chainId = useChainId();
  const isExistChain = chainId === sepolia.id || chainId === polygonAmoy.id;
  const tokens = isExistChain ? getTokens(chainId) : null;

  return (
    <div className={classes.tokenContainer}>
      {connections.length > 0 ? (
        tokens?.map((token) => (
          <TokenRow
            icon={token.icon}
            address={token.address}
            key={token.address}
            symbol={token.symbol}
            decimals={token.decimals}
          />
        ))
      ) : (
        <div className={classes.offerToConnectChain}>Connect to Sepolia or PolygonAmoy</div>
      )}
    </div>
  );
};
