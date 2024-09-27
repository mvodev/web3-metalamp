import { CSSProperties, FC, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import BeatLoader from 'react-spinners/BeatLoader';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { Address, erc20Abi, formatUnits, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';

import ArrowDown from '@assets/icons/arrow_down.svg';
import WarningIcon from '@assets/icons/warning_icon.svg';
import { IToken } from '@src/shared/constants';
import getTokenIcon from '@src/utils/getTokenIcon';
import isNumber from '@src/utils/isNumber';

import AddTokenInfo from '../add-token-info-popup/AddTokenInfo';
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
  decimals: number;
}

const NewOfferForm: FC = () => {
  const [showLeftTokenPopup, setShowLeftTokenPopup] = useState(false);
  const [showRightTokenPopup, setShowRightTokenPopup] = useState(false);
  const [showCustomTokenPopup, setShowCustomTokenPopup] = useState(false);
  const [tokenFrom, setTokenFrom] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const [tokenTo, setTokenTo] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const { isConnected, chainId, address: walletAddress } = useAccount();
  const { openConnectModal } = useConnectModal();
  if (!isConnected && openConnectModal) {
    openConnectModal();
  }

  const { data: contractData, isLoading: isLoadingBalance } = useReadContracts({
    query: {
      refetchInterval: 30 * 1000, //30 sec
    },
    allowFailure: false,
    contracts: walletAddress &&
      tokenFrom?.address &&
      tokenFrom && [
        {
          address: tokenFrom.address,
          functionName: 'balanceOf',
          abi: erc20Abi,
          args: [walletAddress],
        },
      ],
  });

  const { writeContract, isPending: isApprovalTokenPending, isSuccess: isTokenApprovalSuccess } = useWriteContract();

  const onSubmit: SubmitHandler<FormData> = () => {
    if (!errors.from && tokenFrom && walletAddress) {
      writeContract({
        abi: erc20Abi,
        address: tokenFrom.address,
        functionName: 'approve',
        args: [walletAddress, parseUnits(getValues('from').toString(), tokenFrom?.decimals)],
      });
    }
  };

  const handleTokenPopupOpen = (tokenToOpen: 'from' | 'to'|'customFrom'|'customTo') => {
    switch (tokenToOpen) {
      case 'from':
        setShowLeftTokenPopup(true);
        break;
      case 'to':
        setShowRightTokenPopup(true);
        break;
    }
  };

  const handleCustomTokenPopupOpen = ()=>{
    setShowCustomTokenPopup (true);
  }

  const handleDefaultTokenChoice = (token: IToken, tokenSelected: 'from' | 'to') => {
    switch (tokenSelected) {
      case 'from':
        setTokenFrom({
          address: chainId === sepolia.id ? token.sepoliaAddress : token.polygonAddress,
          decimals: token.decimals,
        });
        setShowLeftTokenPopup(false);
        break;
      case 'to':
        setTokenTo({
          address: chainId === sepolia.id ? token.sepoliaAddress : token.polygonAddress,
          decimals: token.decimals,
        });
        setShowRightTokenPopup(false);
        break;
    }
  };

  const handleTokenPopupClose = () => {
    setShowLeftTokenPopup(false);
    setShowRightTokenPopup(false);
  };

  const handleSetTokenMaxValue = () => {
    setValue('from', Number(contractData && tokenFrom && formatUnits(contractData?.[0], tokenFrom?.decimals)));
  };

  const rate =
    isNumber(watch('from')) && isNumber(watch('to')) && watch('from') !== 0 ? watch('from') / watch('to') : 0;
  setValue('rate', rate.toString());

  const showApproveButtonDisabled = watch('from') === undefined || tokenFrom === undefined;

  return (
    <section className={cn(styles.createOffer)}>
                     <div className={styles.customTokenContainer}>
                {showCustomTokenPopup && (
                  <AddTokenInfo colorScheme='yellow' onClosePopup={()=>setShowCustomTokenPopup(false)}/>
                )}
                </div>
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
          <div className={cn(styles.inputs, { [styles.inputsAfterTokenApproval]: isTokenApprovalSuccess })}>
            <div className={styles.inputsWraper}>
              <label className={styles.label}>
                From
                <input
                  className={styles.inputQuantity}
                  type="text"
                  placeholder="0"
                  {...register('from', { required: true, validate: (value) => isNumber(value) && value > 0 })}
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
                        tokenFrom &&
                        `Balance: ${contractData?.[0] && parseFloat(formatUnits(contractData?.[0], tokenFrom?.decimals))}`}
                    </span>
                    <button onPointerDown={handleSetTokenMaxValue} className={styles.tokenBalanceButton} type="button">
                      Max
                    </button>
                  </div>
                )}
                {showLeftTokenPopup && (
                  <TokenPopup
                    onCLose={handleTokenPopupClose}
                    onSelect={(data) => handleDefaultTokenChoice(data, 'from')}
                    colorScheme='light'
                  />
                )}
                <div onPointerDown={() => handleTokenPopupOpen('from')} className={styles.tokenPopup}>
                  <div className={styles.tokenIcon}>{tokenFrom?.address && getTokenIcon(tokenFrom?.address)}</div>
                  <div className={styles.tokenArrow}>
                    <ArrowDown />
                  </div>
                </div>
                <button onPointerDown={handleCustomTokenPopupOpen} className={styles.buttonAddCustomToken} type="button">
                  + Add a custom token
                </button>
              </label>
              <label className={styles.label}>
                To
                <input
                  className={styles.inputQuantity}
                  type="text"
                  placeholder="0"
                  {...register('to', { required: true, validate: (value) => isNumber(value) && value > 0 })}
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
                  <TokenPopup
                    onCLose={handleTokenPopupClose}
                    onSelect={(token) => handleDefaultTokenChoice(token, 'to')}
                    colorScheme='light'
                  />
                )}
                <div onPointerDown={() => handleTokenPopupOpen('to')} className={styles.tokenPopup}>
                  <div className={styles.tokenIcon}>{tokenTo?.address && getTokenIcon(tokenTo?.address)}</div>
                  <div className={styles.tokenArrow}>
                    <ArrowDown />
                  </div>
                </div>
                <button onPointerDown={handleCustomTokenPopupOpen} className={styles.buttonAddCustomToken} type="button">
                  + Add a custom token
                </button>
              </label>
            </div>
            <div className={styles.additionalInputsWrapper}>
              <label className={styles.labelRate}>
                <input className={styles.inputRate} type="text" readOnly={true} placeholder="0" {...register('rate')} />
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
              {!isTokenApprovalSuccess && (
                <FormButton
                  colorScheme="yellow"
                  type="submit"
                  buttonText="Approve Token"
                  disabled={showApproveButtonDisabled}
                />
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
