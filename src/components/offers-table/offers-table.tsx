import { ChangeEvent, FC, useState } from 'react';

import CancelOffer from '@components/cancel-offer-popup/CancelOffer';

import { rows } from './Offers-table.mock';
import OffersTableBox from './Offers-table-box';
import { Offer } from './Offers-tables.types';
import styles from './Offers-table.module.css';

export const OffersTable: FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [activeButton, setActiveButton] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [offerToCancel, setOfferToCancel] = useState<Offer | null>(null);
  const openOffersCount = rows.filter((row) => row.status === 'Open').length;
  const forMeOffersCount = rows.filter((row) => row.status === 'For me').length;

  const handleCheckboxChange = (rowId: number) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(rowId) ? prevSelectedRows.filter((id) => id !== rowId) : [...prevSelectedRows, rowId],
    );
  };

  const handleCancelOffer = () => {
    if (selectedRows.length > 0) {
      const selectedOffer = rows.find((row) => row.id === selectedRows[0]);
      setOfferToCancel(selectedOffer || null);
      setIsCancelPopupOpen(true);
    }
  };

  const handleStatusButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
  };

  const handleChangeOfferSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClearOfferSearchInput = () => {
    setSearchText('');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRows = rows.filter((row) => {
    if (activeButton === 'All') {
      return true;
    }
    return row.status === activeButton;
  });

  const searchedRows = filteredRows.filter((row) => {
    if (searchText === '') {
      return true;
    }
    return (
      row.id.toString().includes(searchText) ||
      row.fromTokenName.toLowerCase().includes(searchText.toLowerCase()) ||
      row.toTokenName.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const visibleRows = searchedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCloseCancelOfferPopup = () => {
    setIsCancelPopupOpen(false);
  };

  const tableConfig = {
    title: 'My offers',
    statusButtons: [
      { name: 'All', count: rows.length },
      { name: 'Open', count: openOffersCount },
      { name: 'For me', count: forMeOffersCount },
    ],
    mainButton: 'Cancel offer',
  };

  return (
    <>
      <OffersTableBox
        title={tableConfig.title}
        statusButtons={tableConfig.statusButtons}
        activeButton={activeButton}
        mainButton={tableConfig.mainButton}
        rows={rows}
        visibleRows={visibleRows}
        filteredRows={filteredRows}
        searchText={searchText}
        selectedRows={selectedRows}
        rowsPerPage={rowsPerPage}
        page={page}
        onStatusButtonClick={handleStatusButtonClick}
        onMainButtonClick={handleCancelOffer}
        onSearchInputChange={handleChangeOfferSearchInput}
        onClearSearchInput={handleClearOfferSearchInput}
        onCheckboxChange={handleCheckboxChange}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
      {isCancelPopupOpen && offerToCancel && (
        <div className={styles.overlay}>
          <CancelOffer
            tradeId={BigInt(offerToCancel.id)}
            tokenFromName={offerToCancel.fromTokenName}
            tokenToName={offerToCancel.toTokenName}
            amountFrom={offerToCancel.amount1}
            amountTo={offerToCancel.amount2}
            onClose={handleCloseCancelOfferPopup}
          />
        </div>
      )}
    </>
  );
};