import { CSSProperties, FC, FormEventHandler, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';
import { useChainId, useWriteContract } from 'wagmi';

import ClearIcon from '@assets/icons/clear_close_icon.svg';
import FormButton from '@components/form-button/FormButton';
import { tradeContractAbi, tradeContractAddress } from '@src/shared/constants';

import styles from './CancelOffer.module.css';

const override: CSSProperties = {
  display: 'block',
  margin: '0 auto',
};

interface Props {
  tradeId: bigint;
  tokenFromName:string;
  tokenToName:string;
  amountFrom:number;
  amountTo:number;
}

const CancelOffer: FC<Props> = ({ tradeId,tokenFromName,tokenToName,amountFrom,amountTo }) => {
  const chainId = useChainId();
  const {
    writeContract,
    isPending: isWriteApprovePending,
    isSuccess: isWriteContractSuccess,
    error: writeContractError,
  } = useWriteContract();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    console.log('submit');
    writeContract({
      abi:tradeContractAbi,
      address: tradeContractAddress[`${chainId}`],
      functionName:'cancelTrade',
      args:[tradeId]
    })
  };

  useEffect(() => {
    if (writeContractError) {
      toast.error(writeContractError.name);
    }
  }, [writeContractError]);

  const successfullyDeleted = () => {
    return (
      <div>ok</div>
    )
  }

  return (
    <form className={styles.cancelOffer} onSubmit={handleSubmit}>
      {isWriteApprovePending && (
        <div className={styles.loader}>
          <BeatLoader
            color={'red'}
            loading={true}
            cssOverride={override}
            size={100}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
      <div className={styles.headerWrapper}>
        <h5 className={styles.header}>Cancel Offer</h5>
        <div className={styles.closeForm}>
          <ClearIcon />
        </div>
      </div>
      <div className={styles.body}>
        <span className={styles.info}>{`You are about to cancel the following offer: ${amountFrom} ${tokenFromName} to ${amountTo} ${tokenToName}.`}</span>
        <span className={styles.info}>{`After cancelling, ${tokenFromName} tokens will be send back to your wallet.`}</span>
      </div>
      <div className={styles.footer}>
        <FormButton buttonText="Cancel offer" colorScheme="yellow" type="submit" />
      </div>
      <Toaster />
    </form>
    
  );
};

export default CancelOffer;
