import { PurchaseDto } from './purchaseDto';

export type GetMessagesDto = {
  room: number;
  fromMessageId: number;
  deviceTimezoneOffsetMinutes: number;
};

export type MessageDto = {
  id: number;
  date_created: Date;
  date_updated: Date;

  content: string;
  room: number;
  user: number;
  user_name: string;

  purchaseId?: number;
  purchase?: PurchaseDto;
};

export type MessagesDto = {
  room: number;
  messages: MessageDto[];
  lastMessageId: number;
};
