'use client';

import React from 'react';
import AiChatWidget from '../ai-chat-widget';

interface BuyerChatProps {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

export default function BuyerChat({ isOpenExternal, onCloseExternal }: BuyerChatProps) {
  return (
    <AiChatWidget
      isOpenExternal={isOpenExternal}
      onCloseExternal={onCloseExternal}
    />
  );
}

