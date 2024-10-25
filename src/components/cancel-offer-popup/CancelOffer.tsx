import { FC, FormEventHandler, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import CloseIcon from '@assets/icons/clear_close_icon.svg';
import FormButton from '@components/form-button/FormButton';
import { Loader } from '@components/loader/Loader';
import { tradeContractAbi, tradeContractAddress } from '@shared/constants';

import styles from './CancelOffer.module.css';

interface Props {
  tradeId: bigint;
  tokenFromName: string;
  tokenToName: string;
  amountFrom: number;
  amountTo: number;
  onClose: (successfullyDeleted: boolean) => void;
}

const CancelOffer: FC<Props> = ({ tradeId, tokenFromName, tokenToName, amountFrom, amountTo, onClose }) => {
  const queryClient = useQueryClient();
  const chainId = useChainId();
  const {
    writeContract,
    isPending: isWriteApprovePending,
    error: writeContractError,
    data: transactionHash,
  } = useWriteContract();

  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    writeContract({
      abi: tradeContractAbi,
      address: tradeContractAddress[`${chainId}`],
      functionName: 'cancelTrade',
      args: [tradeId],
    });
  };

  useEffect(() => {
    if (writeContractError) {
      toast.error(writeContractError.name);
    }
  }, [writeContractError]);

  const handleClose = () => {
    onClose(isTransactionSuccess);
    queryClient.invalidateQueries();
  };

  const isDataFromNetworkLoading = isWriteApprovePending || isTransactionLoading;

  return (
    <form className={styles.cancelOffer} onSubmit={handleSubmit}>
      {isDataFromNetworkLoading && <Loader />}
      <div className={styles.headerWrapper}>
        <h5 className={styles.header}>Cancel Offer</h5>
        <div onPointerDown={handleClose} className={styles.closeForm}>
          <CloseIcon />
        </div>
      </div>
      {isTransactionSuccess ? (
        <h6 className={styles.resultHeader}>Successfully deleted</h6>
      ) : (
        <>
          <div className={styles.body}>
            <span
              className={styles.info}
            >{`You are about to cancel the following offer: ${amountFrom} ${tokenFromName} to ${amountTo} ${tokenToName}.`}</span>
            <span
              className={styles.info}
            >{`After cancelling, ${tokenFromName} tokens will be send back to your wallet.`}</span>
          </div>
          <div className={styles.footer}>
            <FormButton buttonText="Cancel offer" colorScheme="yellow" type="submit" />
          </div>
          <Toaster />
        </>
      )}
    </form>
  );
};

export default CancelOffer;
