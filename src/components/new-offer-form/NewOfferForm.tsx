import { CSSProperties, FC, useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import BeatLoader from 'react-spinners/BeatLoader';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import cn from 'classnames';
import { Address, erc20Abi, formatUnits, maxUint256, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { tradeContractAddress } from '@src/shared/constants/contract';
import { Token, TokenData } from '@src/shared/constants/tokens';
import { tradeContractAbi } from '@src/shared/constants/tradeContractAbi';

import AddTokenInfo from '../add-token-info-popup/AddTokenInfo';
import FormButton from '../form-button/FormButton';
import { StepPagination } from '../StepPagination/StepPagination';
import { StepStatus } from '../StepPagination/StepPagination.interface';
import { NewOfferFormStages } from './NewOfferFormStages';
import { NewOfferInputs } from './NewOfferInputs';
import NewOfferTradeCreated from './NewOfferTradeCreated';
import styles from './NewOfferForm.module.css';

const override: CSSProperties = {
  display: 'block',
  margin: '100px auto',
};

export interface TokenDataNewOfferForm {
  decimals: number;
  name: string;
  address: Address;
}

interface FormData {
  from: number;
  to: number;
  infiniteApprove: boolean;
  tokenFrom: Address;
  tokenTo: Address;
  optionalTaker: Address;
}

type FormStages = 'approveToken' | 'createTrade' | 'tradeCreated';
type TokenSelect = 'from' | 'to' | 'customFrom' | 'customTo';

const THIRTY_MINUTES = 60 * 10 * 1000;

const NewOfferForm: FC = () => {
  const [showDefaultTokenPopupFrom, setShowDefaultTokenPopupFrom] = useState(false);
  const [showDefaultTokenPopupTo, setShowDefaultTokenPopupTo] = useState(false);
  const [showCustomTokenPopupFrom, setShowCustomTokenPopupFrom] = useState(false);
  const [showCustomTokenPopupTo, setShowCustomTokenPopupTo] = useState(false);
  const [formStage, setFormStage] = useState<FormStages>('approveToken');
  const [tokenFrom, setTokenFrom] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const [tokenTo, setTokenTo] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const [tokenApproved, setTokenApproved] = useState<TokenDataNewOfferForm | undefined>(undefined);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onChange',
  });

  const { isConnected, chainId, address: walletAddress } = useAccount();
  const { openConnectModal } = useConnectModal();
  if (!isConnected && openConnectModal) {
    openConnectModal();
  }

  useEffect(() => {
    reset();
    setTokenFrom(undefined);
    setTokenTo(undefined);
  }, [chainId, reset]);

  const {
    data: contractsData,
    isLoading: isLoadingContractData,
    refetch,
  } = useReadContracts({
    allowFailure: false,
    query: {
      refetchInterval: THIRTY_MINUTES,
    },
    contracts: [
      {
        address: tradeContractAddress[`${chainId}`],
        functionName: 'feeBasisPoints',
        abi: tradeContractAbi,
      },
      {
        address: tokenFrom?.address,
        functionName: 'allowance',
        abi: erc20Abi,
        args: walletAddress && [walletAddress, tradeContractAddress[`${chainId}`]],
      },
      {
        address: tokenFrom && tokenFrom.address,
        functionName: 'balanceOf',
        abi: erc20Abi,
        args: walletAddress && [walletAddress],
      },
    ],
  });

  useEffect(() => {
    if (
      formStage === 'createTrade' &&
      tokenFrom &&
      contractsData &&
      getValues('from') > Number(formatUnits(contractsData[1], tokenFrom?.decimals))
    ) {
      setValue('from', Number(formatUnits(contractsData[1], tokenFrom?.decimals)));
    }
  }, [contractsData, formStage, getValues, setValue, tokenFrom]);

  const fee = contractsData !== undefined && contractsData[0] !== undefined ? formatUnits(contractsData[0], 2) : '';
  const tokenAmountIsTaken = fee && getValues('from') && getValues('from') * Number(fee);
  const tokenAmountOfReceiver = tokenAmountIsTaken && getValues('from') && getValues('from') - tokenAmountIsTaken;
  const serviceFee =
    fee &&
    `Service fee ${fee}% ${fee && tokenFrom && tokenAmountIsTaken ? `(${tokenAmountIsTaken} ${tokenFrom.name}).` : ''}${tokenFrom && getValues('from') ? ` Receiver will get ${tokenAmountOfReceiver} ${tokenFrom.name}.` : ''}`;

  const handleStageSelect = (stage: number) => {
    if (stage === 1) {
      reset();
      setFormStage('approveToken');
    }
  };

  const {
    writeContract,
    isPending: isWriteApprovePending,
    isSuccess: isWriteContractSuccess,
    data: transactionHash,
    error: writeContractError,
    variables: contractVariables,
  } = useWriteContract();

  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  useEffect(() => {
    if (
      formStage === 'approveToken' &&
      isWriteContractSuccess &&
      isTransactionSuccess &&
      getValues('from') &&
      getValues('from') > 0
    ) {
      setFormStage('createTrade');
      refetch();
    }
    if (
      formStage === 'createTrade' &&
      isWriteContractSuccess &&
      contractVariables.functionName === 'initiateTrade' &&
      isTransactionSuccess
    ) {
      setFormStage('tradeCreated');
    }
    if (tokenFrom?.address !== tokenApproved?.address && formStage === 'createTrade') {
      setFormStage('approveToken');
      setTokenApproved(tokenFrom);
      refetch();
    }
    if (writeContractError) {
      toast.error(`Error: ${writeContractError.name}`);
    }
  }, [
    formStage,
    setFormStage,
    isWriteContractSuccess,
    contractVariables,
    writeContractError,
    isTransactionSuccess,
    refetch,
    tokenFrom,
    tokenApproved,
    contractsData,
    getValues,
    setValue,
  ]);

  const onSubmit: SubmitHandler<FormData> = () => {
    if (!errors.from && tokenFrom && walletAddress && formStage === 'approveToken') {
      const tokensToSpend = getValues('infiniteApprove')
        ? maxUint256
        : parseUnits(getValues('from').toString(), tokenFrom.decimals);

      const tokensAllowedToSpend = contractsData && contractsData[1];
      if (tokensAllowedToSpend !== undefined && tokensToSpend > tokensAllowedToSpend) {
        writeContract({
          abi: erc20Abi,
          address: tokenFrom.address,
          functionName: 'approve',
          args: [tradeContractAddress[`${chainId}`], tokensToSpend],
        });
      } else setFormStage('createTrade');
    } else if (formStage === 'createTrade' && tokenFrom && tokenTo && !errors.from && !errors.to && walletAddress) {
      writeContract({
        abi: tradeContractAbi,
        address: tradeContractAddress[`${chainId}`],
        functionName: 'initiateTrade',
        args: [
          tokenFrom.address,
          tokenTo.address,
          parseUnits(getValues('from').toString(), tokenFrom.decimals),
          parseUnits(getValues('to').toString(), tokenTo.decimals),
          getValues('optionalTaker'),
        ],
      });
    }
  };

  const handleTokenPopupOpen = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>, tokenToOpen: TokenSelect) => {
    e.stopPropagation();
    switch (tokenToOpen) {
      case 'from':
        setShowDefaultTokenPopupFrom(true);
        break;
      case 'to':
        setShowDefaultTokenPopupTo(true);
        break;
      case 'customFrom':
        setShowCustomTokenPopupFrom(true);
        break;
      case 'customTo':
        setShowCustomTokenPopupTo(true);
        break;
    }
  };

  const handleDefaultTokenChoice = (token: Token, tokenSelected: 'from' | 'to') => {
    switch (tokenSelected) {
      case 'from':
        setTokenFrom({
          address: chainId === sepolia.id ? token.sepoliaAddress : token.polygonAddress,
          decimals: token.decimals,
          name: token.name,
        });
        if (formStage === 'approveToken') {
          setTokenApproved({
            address: chainId === sepolia.id ? token.sepoliaAddress : token.polygonAddress,
            decimals: token.decimals,
            name: token.name,
          });
        }
        setShowDefaultTokenPopupFrom(false);
        break;
      case 'to':
        setTokenTo({
          address: chainId === sepolia.id ? token.sepoliaAddress : token.polygonAddress,
          decimals: token.decimals,
          name: token.name,
        });
        setShowDefaultTokenPopupTo(false);
        break;
    }
  };

  const handleTokenPopupClose = () => {
    setShowDefaultTokenPopupFrom(false);
    setShowDefaultTokenPopupTo(false);
  };

  const handleCustomTokenPopupChoice = (token: TokenData, tokenSelected: 'from' | 'to') => {
    if (token.requestWasSuccessful && token.tokenAddress && token.tokenDecimals && token.tokenName) {
      switch (tokenSelected) {
        case 'from':
          setTokenFrom({
            address: token.tokenAddress,
            decimals: token.tokenDecimals,
            name: token.tokenName,
          });
          break;
        case 'to':
          setTokenTo({
            address: token.tokenAddress,
            decimals: token.tokenDecimals,
            name: token.tokenName,
          });
          break;
      }
    }
    setShowCustomTokenPopupTo(false);
    setShowCustomTokenPopupFrom(false);
  };

  const handleSetTokenMaxValue = () => {
    setValue('from', Number(contractsData && tokenFrom && formatUnits(contractsData[2], tokenFrom?.decimals)));
  };

  const rate = watch('from') > 0 ? watch('to') / watch('from') : 0;
  const balanceOfTokenFrom =
    tokenFrom && contractsData && parseFloat(formatUnits(contractsData[2], tokenFrom?.decimals));

  const showApproveButtonDisabled = tokenFrom === undefined;
  const isDataFromNetworkLoading = isWriteApprovePending || isLoadingContractData || isTransactionLoading;

  return (
    <section className={cn(styles.createOffer)}>
      <Toaster position="top-center" />
      {showCustomTokenPopupTo && (
        <div className={styles.customTokenContainer}>
          <AddTokenInfo colorScheme="yellow" onClose={(data) => handleCustomTokenPopupChoice(data, 'to')} />
        </div>
      )}
      {showCustomTokenPopupFrom && (
        <div className={styles.customTokenContainer}>
          <AddTokenInfo colorScheme="yellow" onClose={(data) => handleCustomTokenPopupChoice(data, 'from')} />
        </div>
      )}
      {isDataFromNetworkLoading && (
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
        <h2 className={styles.header}>{formStage !== 'tradeCreated' ? 'New offer' : 'New offer has been created!'}</h2>
        {formStage !== 'tradeCreated' && (
          <NewOfferFormStages
            description={formStage === 'createTrade' ? 'Create' : 'Approve'}
            activeStage={formStage === 'createTrade' ? 2 : 1}
            onSelect={handleStageSelect}
          />
        )}
      </div>
      {formStage !== 'tradeCreated' && (
        <div className={cn(styles.formWrapper)}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <NewOfferInputs
              showDefaultTokenPopupTo={showDefaultTokenPopupTo}
              errors={errors}
              tokenTo={tokenTo}
              register={register}
              serviceFee={serviceFee}
              contractsData={contractsData}
              showDefaultTokenPopupFrom={showDefaultTokenPopupFrom}
              tokenFrom={tokenFrom}
              rate={rate}
              formStage={formStage}
              balanceOfTokenFrom={balanceOfTokenFrom}
              handleSetTokenMaxValue={handleSetTokenMaxValue}
              handleDefaultTokenChoice={handleDefaultTokenChoice}
              handleTokenPopupClose={handleTokenPopupClose}
              handleTokenPopupOpen={handleTokenPopupOpen}
            />
            <div className={cn(styles.buttons, { [styles.buttonsAfterTokenApproval]: formStage === 'createTrade' })}>
              <span className={styles.helpText}>
                {formStage === 'approveToken'
                  ? 'To create an offer, you will have to sign two transactions: Approve and Create'
                  : 'You approved token allowance. Now you’re one click away from Create Trade'}
              </span>
              <div className={styles.buttonsWrapper}>
                {formStage === 'approveToken' && (
                  <FormButton
                    colorScheme="yellow"
                    type="submit"
                    buttonText="Approve Token"
                    disabled={showApproveButtonDisabled}
                  />
                )}
                <FormButton
                  colorScheme="yellow"
                  type="submit"
                  buttonText="Create Trade"
                  disabled={formStage !== 'createTrade' || tokenFrom === undefined || tokenTo === undefined}
                />
              </div>
              <StepPagination
                steps={
                  showApproveButtonDisabled
                    ? [
                        { value: 1, status: StepStatus.DISABLED },
                        { value: 2, status: StepStatus.DISABLED },
                      ]
                    : [
                        { value: 1, status: StepStatus.COMPLETED },
                        { value: 2, status: StepStatus.DISABLED },
                      ]
                }
              />
            </div>
          </form>
        </div>
      )}
      {formStage === 'tradeCreated' && <NewOfferTradeCreated transactionHash={transactionHash} />}
    </section>
  );
};

export default NewOfferForm;