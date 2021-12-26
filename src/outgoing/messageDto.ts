import { PurchaseDto } from './purchaseDto';

export type MessageDto = {
  id: number;
  date_created: Date;
  date_updated: Date;

  content: string;
  edited: boolean;

  replyto_id?: number;
  forwardfrom_id?: number;

  persons_sent: number[];
  persons_read: number[];

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
