'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectButton() {
  return (
    <RainbowConnectButton
      chainStatus="icon"
      accountStatus="address"
      showBalance={false}
    />
  );
}