import { FC, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import cn from 'classnames';

import { logo, logoLightScheme } from '@assets/images';

import styles from './Header.module.css';

interface Props {
  colorScheme?: 'darkBackground' | 'lightBackground';
}

const Header: FC<Props> = ({ colorScheme }) => {
  const [burgerIsOpen, setBurgerIsOpen] = useState(false);
  const handleBurgerClick = () => {
    setBurgerIsOpen((prev) => !prev);
  };
  return (
    <header className={styles.header}>
      <div className={styles.burgerWrapper}>
        <button
          type="button"
          className={cn(styles.burger, { [styles.burgerIsOpen]: burgerIsOpen })}
          onClick={handleBurgerClick}
        >
          <div
            className={cn(styles.burgerImage, { [styles.burgerImageYellowScheme]: colorScheme === 'lightBackground' })}
          />
        </button>
      </div>
      <Link to="/">
        <img
          className={cn(styles.img, { [styles.imgBurgerIsOpen]: burgerIsOpen })}
          src={colorScheme === 'lightBackground' ? logoLightScheme.default : logo.default}
          alt="Project logo"
        />
      </Link>
      <div className={cn(styles.body, { [styles.bodyBurgerIsOpen]: burgerIsOpen })}>
        <nav className={cn(styles.nav, { [styles.navBurgerIsOpen]: burgerIsOpen })}>
          <NavLink
            className={cn(styles.navLink, { [styles.navLinkYellowScheme]: colorScheme === 'lightBackground' })}
            to="/send-ERC20-tokens"
          >
            Send ERC-20
          </NavLink>
          <NavLink
            className={cn(styles.navLink, { [styles.navLinkYellowScheme]: colorScheme === 'lightBackground' })}
            to="/"
          >
            Trade ERC-20
          </NavLink>
          <NavLink
            className={cn(styles.navLink, { [styles.navLinkYellowScheme]: colorScheme === 'lightBackground' })}
            to="/"
          >
            NFT Collection
          </NavLink>
        </nav>
        <div
          className={cn(styles.connectButtonWrapper, {
            [styles.connectButtonWrapperYellowScheme]: colorScheme === 'lightBackground',
          })}
        >
          <ConnectButton label="Connect wallet" showBalance={false} accountStatus="address" />
        </div>
      </div>
    </header>
  );
};

export default Header;
