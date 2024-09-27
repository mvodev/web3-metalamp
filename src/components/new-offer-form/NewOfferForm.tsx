import { CSSProperties, FC, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import BeatLoader from 'react-spinners/BeatLoader';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { Address, erc20Abi, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';

import ArrowDown from '@assets/icons/arrow_down.svg';
import NotFoundTokenLogo from '@assets/icons/not_found_token_logo.svg';
import WarningIcon from '@assets/icons/warning_icon.svg';
import { IToken, tokens } from '@src/shared/constants';

import FormButton from '../form-button/FormButton';
import { StepPagination } from '../StepPagination/StepPagination';
import { StepStatus } from '../StepPagination/StepPagination.interface';
import { TokenPopup } from '../TokenPopup/TokenPopup';
import { NewOfferFormStages } from './NewOfferFormStages';
import styles from './NewOfferForm.module.css';

interface FormData {
  from: number;
  to: number;
  tokenFrom: Address;
  tokenTo: Address;
  rate: string;
  receiver: string;
  approve: boolean;
}

const override: CSSProperties = {
  display: 'block',
  margin: '100px auto',
};
interface TokenDataNewOfferForm {
  address: Address;
}

const getTokenIcon = (address: Address) => {
  const tokenInSupportedTokens = tokens.find(
    (token) => token.polygonAddress === address || token.sepoliaAddress === address,
  );
  if (tokenInSupportedTokens) return tokenInSupportedTokens.icon;
  return <NotFoundTokenLogo />;
};

const NewOfferForm: FC = () => {
  const [showLeftTokenPopup, setShowLeftTokenPopup] = useState(false);
  const [showRightTokenPopup, setShowRightTokenPopup] = useState(false);
  const [tokenFrom, setTokenFrom] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const [tokenTo, setTokenTo] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const { isConnected, chainId, address: walletAddress } = useAccount();
  const { openConnectModal } = useConnectModal();
  if (!isConnected && openConnectModal) {
    openConnectModal();
  }
  const { data: contractData, isLoading: isLoadingBalance } = useReadContracts({
    allowFailure: false,
    contracts: walletAddress &&
      tokenFrom?.address &&
      tokenFrom && [
        {
          address: tokenFrom.address,
          functionName: 'decimals',
          abi: erc20Abi,
        },
        {
          address: tokenFrom.address,
          functionName: 'balanceOf',
          abi: erc20Abi,
          args: [walletAddress],
        },
      ],
  });
  const {
    writeContract,
    isPending: isApprovalTokenPending,
    isSuccess: isTokenApprovalSuccess,
  } = useWriteContract();
  console.log('isPending' + isApprovalTokenPending);
  console.log('isSuccess' + isTokenApprovalSuccess);
  const onSubmit: SubmitHandler<FormData> = () => {
    if (!errors.from) {
      writeContract({
        abi: erc20Abi,
        address: '0x34cd8b477eb916c1c4224b2FFA80DE015cCC671b',
        functionName: 'approve',
        args: [walletAddress as Address, BigInt(1)],
      });
    }
  };
  const handleLeftTokenPopupOpen = () => {
    setShowLeftTokenPopup(true);
  };
  const handleRightTokenPopupOpen = () => {
    setShowRightTokenPopup(true);
  };
  const handleLeftTokenChoice = (data: IToken) => {
    setTokenFrom({
      address: chainId === sepolia.id ? data.sepoliaAddress : data.polygonAddress,
    });
    setShowLeftTokenPopup(false);
  };
  const handleRightTokenChoice = (data: IToken) => {
    setTokenTo({
      address: chainId === sepolia.id ? data.sepoliaAddress : data.polygonAddress,
    });
    setShowRightTokenPopup(false);
  };
  const handleTokenPopupClose = () => {
    setShowLeftTokenPopup(false);
    setShowRightTokenPopup(false);
  };
  const handleSetTokenMaxValue = () => {
    setValue('from', Number(contractData && formatUnits(contractData?.[1], contractData?.[0])));
  };

  return (
    <section className={cn(styles.createOffer)}>
      {(isLoadingBalance || isApprovalTokenPending) && (
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
        <h2 className={styles.header}>New offer</h2>
        <NewOfferFormStages activeStage={2} />
      </div>
      <div className={cn(styles.formWrapper)}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputs}>
            <div className={styles.inputsWraper}>
              <label className={styles.label}>
                From
                <input
                  className={styles.inputQuantity}
                  type="text"
                  placeholder="0"
                  {...register('from', { required: true, validate: (value) => !Number.isFinite(value) && value > 0 })}
                />
                {errors.from?.type === 'required' && (
                  <div className={styles.error}>
                    {
                      <div className={styles.warningIcon}>
                        <WarningIcon />
                      </div>
                    }
                    {' Required field'}
                  </div>
                )}
                {errors.from?.type === 'validate' && (
                  <div className={styles.error}>
                    {
                      <div className={styles.warningIcon}>
                        <WarningIcon />
                      </div>
                    }
                    {' Unsufficient balance'}
                  </div>
                )}
                {!errors.from && contractData && (
                  <div className={styles.tokenBalanceWrapper}>
                    <span className={styles.tokenBalance}>
                      {contractData &&
                        `Balance: ${contractData?.[1] && contractData?.[0] && parseFloat(formatUnits(contractData?.[1], contractData?.[0])).toFixed(2)}`}
                    </span>
                    <button onPointerDown={handleSetTokenMaxValue} className={styles.tokenBalanceButton} type="button">
                      Max
                    </button>
                  </div>
                )}
                {showLeftTokenPopup && <TokenPopup onCLose={handleTokenPopupClose} onSelect={handleLeftTokenChoice} />}
                <div onPointerDown={handleLeftTokenPopupOpen} className={styles.tokenPopup}>
                  <div className={styles.tokenIcon}>{tokenFrom?.address && getTokenIcon(tokenFrom?.address)}</div>
                  <div className={styles.tokenArrow}>
                    <ArrowDown />
                  </div>
                </div>
                <button className={styles.buttonAddCustomToken} type="button">
                  + Add a custom token
                </button>
              </label>
              <label className={styles.label}>
                To
                <input
                  className={styles.inputQuantity}
                  type="text"
                  placeholder="0"
                  {...register('to', { required: true, validate: (value) => !Number.isFinite(value) && value > 0 })}
                />
                {errors.to?.type === 'required' && (
                  <div className={styles.error}>
                    {
                      <div className={styles.warningIcon}>
                        <WarningIcon />
                      </div>
                    }
                    {' Required field'}
                  </div>
                )}
                {errors.to?.type === 'validate' && (
                  <div className={styles.error}>
                    {
                      <div className={styles.warningIcon}>
                        <WarningIcon />
                      </div>
                    }
                    {' Unsufficient balance'}
                  </div>
                )}
                {showRightTokenPopup && (
                  <TokenPopup onCLose={handleTokenPopupClose} onSelect={handleRightTokenChoice} />
                )}
                <div onPointerDown={handleRightTokenPopupOpen} className={styles.tokenPopup}>
                  <div className={styles.tokenIcon}>{tokenTo?.address && getTokenIcon(tokenTo?.address)}</div>
                  <div className={styles.tokenArrow}>
                    <ArrowDown />
                  </div>
                </div>
                <button className={styles.buttonAddCustomToken} type="button">
                  + Add a custom token
                </button>
              </label>
            </div>
            <div className={styles.additionalInputsWrapper}>
              <label className={styles.labelRate}>
                <input
                  className={styles.inputRate}
                  type="text"
                  placeholder="0"
                  {...register('rate', { required: true })}
                />
                <span className={styles.labelText}>Rate</span>
              </label>
              <label className={styles.labelReceiver}>
                <input
                  className={styles.inputReceiver}
                  type="text"
                  placeholder="0x0000000000000000000000000000000000000000"
                  {...register('receiver')}
                />
                <span className={styles.labelText}>Receiver</span>
              </label>
            </div>
            <div className={styles.approveWrraper}>
              <input type="checkbox" id="infiniteapprove" {...register('approve')} />
              <label htmlFor="infiniteapprove" className={styles.approve}>
                Infinite approve
              </label>
            </div>
          </div>
          <div className={styles.buttons}>
            <div className={styles.buttonsWrapper}>
              {!isTokenApprovalSuccess && watch('from') && watch('from').toString().length > 0 && (
                <FormButton colorScheme="yellow" type="submit" buttonText="Approve Token" />
              )}
              {!isTokenApprovalSuccess && !watch('from') && (
                <FormButton type="submit" buttonText="Approve Token" disabled />
              )}
              <FormButton
                colorScheme="yellow"
                type="button"
                buttonText="Create Trade"
                disabled={!isTokenApprovalSuccess}
              />
            </div>
            <StepPagination
              steps={[
                { value: 1, status: StepStatus.DISABLED },
                { value: 2, status: StepStatus.DISABLED },
              ]}
            />
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewOfferForm;
