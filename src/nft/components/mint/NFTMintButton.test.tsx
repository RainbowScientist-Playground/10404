import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  http,
  WagmiProvider,
  createConfig,
  useAccount,
  useChainId,
} from 'wagmi';
import { mock } from 'wagmi/connectors';
import { useOnchainKit } from '../../../useOnchainKit';
import { useNFTLifecycleContext } from '../NFTLifecycleProvider';
import { useNFTContext } from '../NFTProvider';
import { NFTMintButton } from './NFTMintButton';

vi.mock('../NFTProvider');
vi.mock('../NFTLifecycleProvider');
vi.mock('../../../useOnchainKit');
vi.mock('wagmi', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('wagmi')>()),
    useAccount: vi.fn(),
    useChainId: vi.fn(),
  };
});
vi.mock('../../../internal/components/Spinner', () => ({
  Spinner: () => <div>Spinner</div>,
}));
vi.mock('../../../transaction', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('../../../transaction')>()),
    TransactionLifecycleStatus: vi.fn(),
    TransactionButton: ({ text, disabled }) => (
      <button type="button" disabled={disabled} data-testid="transactionButton">
        {text}
      </button>
    ),
    Transaction: ({ onStatus, children, calls, capabilities }) => (
      <>
        <div>
          <button type="button" onClick={calls}>
            Calls
          </button>
          <button
            type="button"
            onClick={() => onStatus({ statusName: 'transactionPending' })}
          >
            TransactionPending
          </button>
          <button
            type="button"
            onClick={() =>
              onStatus({ statusName: 'transactionLegacyExecuted' })
            }
          >
            TransactionLegacyExecuted
          </button>
          <button
            type="button"
            onClick={() => onStatus({ statusName: 'success' })}
          >
            Success
          </button>
          <button
            type="button"
            onClick={() => onStatus({ statusName: 'error' })}
          >
            Error
          </button>
          <div>{capabilities?.paymasterService?.url}</div>
        </div>
        {children}
      </>
    ),
    TransactionSponsor: vi.fn(),
    TransactionStatus: vi.fn(),
    TransactionStatusAction: vi.fn(),
    TransactionStatusLabel: vi.fn(),
  };
});
vi.mock('../../../wallet', () => ({
  ConnectWallet: () => <div>ConnectWallet</div>,
}));

const queryClient = new QueryClient();

const accountConfig = createConfig({
  chains: [base],
  connectors: [
    mock({
      accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const TestProviders = ({ children }) => {
  return (
    <WagmiProvider config={accountConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

describe('NFTMintButton', () => {
  let mockUpdateLifecycleStatus: Mock;
  beforeEach(() => {
    (useNFTContext as Mock).mockReturnValue({
      contractAddress: '0x123',
      tokenId: '1',
      quantity: 1,
      isEligibleToMint: true,
      buildMintTransaction: vi
        .fn()
        .mockResolvedValue({ to: '0x123', data: '0x123', value: BigInt(2) }),
    });
    mockUpdateLifecycleStatus = vi.fn();
    (useNFTLifecycleContext as Mock).mockReturnValue({
      updateLifecycleStatus: mockUpdateLifecycleStatus,
    });
    (useAccount as Mock).mockReturnValue({ address: '0xabc' });
    (useChainId as Mock).mockReturnValue(1);
    (useOnchainKit as Mock).mockReturnValue({
      config: undefined,
    });
  });

  it('should render the mint button with default label', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );
    expect(getByText('Mint')).toBeInTheDocument();
  });

  it('should render the mint button with custom label', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton label="Custom Mint" />
      </TestProviders>,
    );
    expect(getByText('Custom Mint')).toBeInTheDocument();
  });

  it('should call updateLifecycleStatus with transactionPending status when transactionStatus is transactionPending', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );

    getByText('TransactionPending').click();

    expect(mockUpdateLifecycleStatus).toHaveBeenCalledWith({
      statusName: 'transactionPending',
    });
  });

  it('should call updateLifecycleStatus with transaction status when transactionStatus is transactionLegacyExecuted', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );

    getByText('TransactionLegacyExecuted').click();

    expect(mockUpdateLifecycleStatus).toHaveBeenCalledWith({
      statusName: 'transactionLegacyExecuted',
    });
  });

  it('should call updateLifecycleStatus with transaction status when transactionStatus is success', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );

    getByText('Success').click();

    expect(mockUpdateLifecycleStatus).toHaveBeenCalledWith({
      statusName: 'success',
    });
  });

  it('should call updateLifecycleStatus with transaction status when transactionStatus is error', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );

    getByText('Error').click();

    expect(mockUpdateLifecycleStatus).toHaveBeenCalledWith({
      statusName: 'error',
    });
  });

  it('should render ConnectWallet when address is not available', () => {
    (useAccount as Mock).mockReturnValue({ address: null });
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );
    expect(getByText('ConnectWallet')).toBeInTheDocument();
  });

  it('should not render when buildMintTransaction is undefined', () => {
    (useNFTContext as Mock).mockReturnValue({
      contractAddress: '0x123',
      tokenId: '1',
      quantity: 1,
      isEligibleToMint: true,
    });
    const { container } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should disble button if disabled props is true', () => {
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton disabled={true} />
      </TestProviders>,
    );
    expect(getByText('Mint')).toBeDisabled();
  });

  it('should show minting not available when isEligibleToMint is false', () => {
    (useNFTContext as Mock).mockReturnValueOnce({
      contractAddress: '0x123',
      tokenId: '1',
      quantity: 1,
      isEligibleToMint: false,
      buildMintTransaction: vi
        .fn()
        .mockResolvedValue({ to: '0x123', data: '0x123', value: BigInt(2) }),
    });
    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );
    expect(getByText('Minting not available')).toBeInTheDocument();
  });

  it('calls buildMintTransaction when button is clicked', async () => {
    const buildMintTransactionMock = vi.fn().mockResolvedValue([]);
    (useNFTContext as Mock).mockReturnValueOnce({
      contractAddress: '0x123',
      tokenId: '1',
      isEligibleToMint: true,
      buildMintTransaction: buildMintTransactionMock,
      quantity: 1,
    });

    const { getByText } = render(
      <TestProviders>
        <NFTMintButton />
      </TestProviders>,
    );
    fireEvent.click(getByText('Calls'));

    expect(buildMintTransactionMock).toHaveBeenCalledWith({
      contractAddress: '0x123',
      tokenId: '1',
      takerAddress: '0xabc',
      quantity: 1,
    });
  });
});