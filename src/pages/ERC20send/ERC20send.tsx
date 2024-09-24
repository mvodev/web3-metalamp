import { FC } from 'react';

import AddTokenInfo from '../../components/add-token-info-popup/AddTokenInfo';
import Header from '../../components/header/Header';

export const ERC20send: FC = () => {
  return (
    <div style={{ background: '#FFEDBE' }}>
      <Header colorScheme="lightBackground" />
      <AddTokenInfo colorScheme="yellow" onClosePopup={(data) => console.log(data)} />
    </div>
  );
};