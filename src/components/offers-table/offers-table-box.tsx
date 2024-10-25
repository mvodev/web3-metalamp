import React, { ChangeEvent, FC, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import {
  Box,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import cn from 'classnames';

import { ShareIcon } from '@assets/icons';
import Close from '@assets/icons/close.svg';
import CopyIcon from '@assets/icons/copy_icon.svg';
import Search from '@assets/icons/search.svg';
import SquareArrowIcon from '@assets/icons/square_arrow.svg';
import Snackbar from '@components/snackbar/Snackbar';
import { ROUTES } from '@shared/constants';
import { getShortHash } from '@shared/utils/getShortHash';
import getTokenIcon from '@shared/utils/getTokenIcon';

import { Offer } from './offers-tables.types';
import styles from './offers-table.module.css';

interface Props {
  title: string;
  statusButtons: Array<{ name: string; count: number }>;
  activeButton: string;
  mainButton: string;
  visibleRows: Offer[];
  filteredRows: Offer[];
  searchText: string;
  selectedRows: number[];
  rowsPerPage: number;
  page: number;
  onStatusButtonClick: (buttonName: string) => void;
  onMainButtonClick: () => void;
  onSearchInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearSearchInput: () => void;
  onCheckboxChange: (rowId: number) => void;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const OffersTableBox: FC<Props> = ({
  title,
  statusButtons,
  activeButton,
  mainButton,
  visibleRows,
  filteredRows,
  searchText,
  selectedRows,
  rowsPerPage,
  page,
  onStatusButtonClick,
  onMainButtonClick,
  onSearchInputChange,
  onClearSearchInput,
  onCheckboxChange,
  onChangePage,
  onChangeRowsPerPage,
}) => {
  const [showCopyOfClipboard, setShowCopyOfClipboard] = useState(false);
  const handleSnackbarClose = () => {
    setShowCopyOfClipboard(false);
  };

  return (
    <>
      <Box className={styles.box}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.statusButtons}>
            {statusButtons.map((button) => (
              <button
                key={button.name}
                className={cn(styles.statusButton, {
                  [styles.statusButtonActive]: activeButton === button.name,
                })}
                onClick={() => onStatusButtonClick(button.name)}
              >
                {button.name} <span className={styles.offersCount}>{button.count}</span>
              </button>
            ))}
          </div>
          <div className={styles.buttonsAndPagination}>
            <div className={styles.cancelAndSearchButtons}>
              <button className={styles.cancelOfferButton} onClick={onMainButtonClick}>
                {mainButton}
              </button>
              <div className={styles.searchRow}>
                <div className={styles.searchIcon}>
                  <Search />
                </div>
                <input
                  value={searchText}
                  className={styles.input}
                  placeholder="Offer ID or Asset"
                  onChange={onSearchInputChange}
                />
                <div className={styles.inputCLoseIcon} onClick={onClearSearchInput}>
                  <Close />
                </div>
              </div>
            </div>
            <div className={styles.pagination}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 15]}
                component="div"
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onChangePage}
                onRowsPerPageChange={onChangeRowsPerPage}
              />
            </div>
          </div>
        </div>

        <Paper className={styles.paper}>
          <TableContainer className={styles.container}>
            <Table className={styles.table} aria-label="table of offers">
              <TableHead>
                <TableRow className={styles.tableRow}>
                  <TableCell></TableCell>
                  <TableCell>Offer ID</TableCell>
                  <TableCell align="left">From Asset 1</TableCell>
                  <TableCell align="left">To Asset 2</TableCell>
                  <TableCell align="right">Amount 1</TableCell>
                  <TableCell align="right">Amount 2</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="left">Status</TableCell>
                  <TableCell align="left">Receiver</TableCell>
                  <TableCell align="left">Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id} className={styles.tableBodyRow}>
                    <TableCell padding="none">
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onChange={() => onCheckboxChange(row.id)}
                        sx={{
                          '& .MuiSvgIcon-root': { fontSize: 15 },
                          '&.Mui-checked': {
                            color: 'black',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {row.id}
                    </TableCell>
                    <TableCell align="left">
                      <div className={styles.token}>
                        <div className={styles.tokenLogo}>{getTokenIcon(row.fromTokenAddress)}</div>
                        {row.fromTokenName}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <div className={styles.token}>
                        <div className={styles.tokenLogo}>{getTokenIcon(row.toTokenAddress)}</div>
                        {row.toTokenName}
                      </div>
                    </TableCell>
                    <TableCell align="right">{row.amount1}</TableCell>
                    <TableCell align="right">{row.amount2}</TableCell>
                    <TableCell align="right">{row.rate}</TableCell>
                    <TableCell align="left">
                      <div className={styles.status}>
                        {row.status}
                        <Link to={`${ROUTES.ERC20_TRADE}/${row.id}`}>
                          {row.status === 'For me' && <SquareArrowIcon />}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <div className={styles.receiver}>
                        {getShortHash(row.receiver)}
                        {row.receiver !== 'Any' && (
                          <CopyToClipboard onCopy={() => setShowCopyOfClipboard(true)} text={row.receiver}>
                            <div className={styles.copyIcon}>
                              <CopyIcon />
                            </div>
                          </CopyToClipboard>
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <div className={styles.share}>
                        <CopyToClipboard
                          onCopy={() => setShowCopyOfClipboard(true)}
                          text={`${window.location.origin}${ROUTES.ERC20_TRADE}/${row.id}`}
                        >
                          <div className={styles.copyIcon}>
                            <ShareIcon />
                          </div>
                        </CopyToClipboard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
      {showCopyOfClipboard && (
        <div className={styles.overlay}>
          <Snackbar type="success" onClose={handleSnackbarClose} description="Link copied successfully" />
        </div>
      )}
    </>
  );
};

export default OffersTableBox;
