import { FC } from 'react';

import { OffersTableHistory } from '@components/offers-table/offers-table-history';

export const History: FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
      <OffersTableHistory />
    </div>
  );
};
